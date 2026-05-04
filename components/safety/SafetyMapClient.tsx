"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { SafetyAlert } from "@/lib/types/safety";

const SF_CENTER: L.LatLngExpression = [37.7749, -122.4194];

function hashToOffset(id: string): [number, number] {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 10000;
  }
  const dLat = ((h % 200) - 100) * 0.00025;
  const dLng = (((h / 200) | 0) % 200 - 100) * 0.00025;
  return [dLat, dLng];
}

function alertPosition(alert: SafetyAlert): L.LatLngExpression {
  if (typeof alert.latitude === "number" && typeof alert.longitude === "number") {
    return [alert.latitude, alert.longitude];
  }
  const [dLat, dLng] = hashToOffset(alert.id);
  return [37.7749 + dLat, -122.4194 + dLng];
}

function MapFocus({ selectedId, positions }: { selectedId: string | null; positions: Map<string, L.LatLngExpression> }) {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const pos = positions.get(selectedId);
    if (!pos) return;
    const ll = Array.isArray(pos) ? L.latLng(pos[0], pos[1]) : pos;
    map.flyTo(ll, 14, { duration: 0.45 });
  }, [selectedId, map, positions]);
  return null;
}

function fixLeafletDefaultIcons() {
  if (typeof window === "undefined") return;
  const icon = L.Icon.Default.prototype as unknown as { _getIconUrl?: () => string };
  delete icon._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });
}

export default function SafetyMapClient({
  alerts,
  selectedAlertId,
}: {
  alerts: SafetyAlert[];
  selectedAlertId: string | null;
}) {
  useEffect(() => {
    fixLeafletDefaultIcons();
  }, []);

  const positions = useMemo(() => {
    const m = new Map<string, L.LatLngExpression>();
    for (const a of alerts) {
      m.set(a.id, alertPosition(a));
    }
    return m;
  }, [alerts]);

  if (alerts.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] w-full max-h-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-secondary">
        No alerts to show on the map.
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full max-h-full overflow-hidden rounded-lg border border-border">
      <MapContainer
        center={selectedAlertId && positions.get(selectedAlertId) ? positions.get(selectedAlertId)! : SF_CENTER}
        zoom={12}
        className="h-full min-h-0 w-full max-h-full [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:bg-surface/90"
        scrollWheelZoom
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="topright" />
        <MapFocus selectedId={selectedAlertId} positions={positions} />
        {alerts.map((alert) => {
          const position = positions.get(alert.id);
          if (!position) return null;
          const label =
            alert.type === "sos_critical" || alert.type === "manual_sos"
              ? `${alert.userName} [SOS]`
              : alert.userName;
          return (
            <Marker key={alert.id} position={position}>
              <Popup>
                <span className="text-sm font-medium text-neutral-900">{label}</span>
                <br />
                <span className="text-xs text-neutral-600">{alert.tripId}</span>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
