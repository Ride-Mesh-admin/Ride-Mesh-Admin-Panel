"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { GoogleMap, InfoWindowF, MarkerF, useGoogleMap, useJsApiLoader } from "@react-google-maps/api";
import type { SafetyAlert } from "@/lib/types/safety";
import { alertMapPosition, alertMarkerColor, alertMarkerLabel } from "@/lib/safety/alertMapUtils";

const mapContainerStyle = { width: "100%", height: "100%" };

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  gestureHandling: "greedy",
  styles: [
    { featureType: "poi", stylers: [{ visibility: "off" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
  ],
};

function markerIcon(fillColor: string, selected: boolean): google.maps.Symbol {
  return {
    path: "M0,0 m-9,0 a9,9 0 1,0 18,0 a9,9 0 1,0 -18,0",
    fillColor,
    fillOpacity: 1,
    strokeColor: selected ? "#1A1A1A" : "#FFFFFF",
    strokeWeight: selected ? 3 : 2.5,
    scale: selected ? 1.25 : 1,
  };
}

function MapViewportSync({
  alerts,
  selectedAlertId,
  positions,
}: {
  alerts: SafetyAlert[];
  selectedAlertId: string | null;
  positions: Map<string, { lat: number; lng: number }>;
}) {
  const map = useGoogleMap();

  useEffect(() => {
    if (!map || typeof window === "undefined" || !window.google) return;

    if (selectedAlertId) {
      const pos = positions.get(selectedAlertId);
      if (pos) {
        map.panTo(pos);
        const z = map.getZoom();
        if (z == null || z < 13) map.setZoom(14);
        return;
      }
    }

    if (alerts.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    for (const alert of alerts) {
      const pos = positions.get(alert.id);
      if (pos) bounds.extend(pos);
    }
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, 56);
    }
  }, [alerts, map, positions, selectedAlertId]);

  return null;
}

export default function SafetyMapClient({
  alerts,
  selectedAlertId,
}: {
  alerts: SafetyAlert[];
  selectedAlertId: string | null;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const { isLoaded, loadError } = useJsApiLoader({
    id: "ridemesh-admin-safety-maps",
    googleMapsApiKey: apiKey,
  });

  const [infoWindowAlertId, setInfoWindowAlertId] = useState<string | null>(null);

  useEffect(() => {
    setInfoWindowAlertId(selectedAlertId);
  }, [selectedAlertId]);

  const positions = useMemo(() => {
    const m = new Map<string, { lat: number; lng: number }>();
    for (const a of alerts) {
      m.set(a.id, alertMapPosition(a));
    }
    return m;
  }, [alerts]);

  const initialCenter = useMemo(() => {
    if (selectedAlertId && positions.get(selectedAlertId)) {
      return positions.get(selectedAlertId)!;
    }
    const first = alerts[0];
    return first ? alertMapPosition(first) : DEFAULT_CENTER;
  }, [alerts, positions, selectedAlertId]);

  const onMarkerClick = useCallback((alertId: string) => {
    setInfoWindowAlertId(alertId);
  }, []);

  const infoAlert = useMemo(
    () => (infoWindowAlertId ? alerts.find((a) => a.id === infoWindowAlertId) ?? null : null),
    [alerts, infoWindowAlertId],
  );
  const infoPosition = infoAlert ? positions.get(infoAlert.id) : undefined;

  if (alerts.length === 0) {
    return (
      <div className="flex h-full min-h-[200px] w-full max-h-full items-center justify-center rounded-lg border border-border bg-surface text-sm text-text-secondary">
        No alerts to show on the map.
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="flex h-full min-h-[200px] w-full max-h-full items-center justify-center rounded-lg border border-border bg-surface px-6 text-center text-sm text-text-secondary">
        Add{" "}
        <code className="mx-1 rounded bg-background px-1.5 py-0.5 text-text-primary">
          NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        </code>{" "}
        to <code className="mx-1 rounded bg-background px-1.5 py-0.5">.env.local</code> to load Google Maps.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex h-full min-h-[200px] w-full max-h-full items-center justify-center rounded-lg border border-border bg-surface px-6 text-center text-sm text-text-secondary">
        Could not load Google Maps. Enable the Maps JavaScript API and allow{" "}
        <span className="text-text-primary">localhost</span> in your API key HTTP referrers.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="h-full min-h-[200px] w-full max-h-full animate-pulse rounded-lg border border-border bg-surface"
        aria-hidden
      />
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full max-h-full overflow-hidden rounded-lg border border-border">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={initialCenter}
        zoom={12}
        options={mapOptions}
      >
        <MapViewportSync alerts={alerts} selectedAlertId={selectedAlertId} positions={positions} />
        {alerts.map((alert) => {
          const position = positions.get(alert.id);
          if (!position) return null;
          const selected = selectedAlertId === alert.id;
          const color = alertMarkerColor(alert.type);

          return (
            <MarkerF
              key={alert.id}
              position={position}
              title={alertMarkerLabel(alert)}
              icon={markerIcon(color, selected)}
              onClick={() => onMarkerClick(alert.id)}
              zIndex={selected ? 2 : 1}
            />
          );
        })}
        {infoAlert && infoPosition ? (
          <InfoWindowF
            position={infoPosition}
            onCloseClick={() => setInfoWindowAlertId(null)}
            options={{ pixelOffset: new google.maps.Size(0, -12) }}
          >
            <div className="min-w-[140px] pr-1 text-neutral-900">
              <p className="text-sm font-semibold">{alertMarkerLabel(infoAlert)}</p>
              <p className="mt-0.5 text-xs text-neutral-600">{infoAlert.tripId}</p>
              <p className="mt-1 text-xs text-neutral-500">{infoAlert.alertMessage}</p>
            </div>
          </InfoWindowF>
        ) : null}
      </GoogleMap>
    </div>
  );
}
