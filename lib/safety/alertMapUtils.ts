import type { SafetyAlert } from "@/lib/types/safety";

const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

function hashToOffset(id: string): { dLat: number; dLng: number } {
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) % 10000;
  }
  const dLat = ((h % 200) - 100) * 0.00025;
  const dLng = (((h / 200) | 0) % 200 - 100) * 0.00025;
  return { dLat, dLng };
}

export type MapLatLng = { lat: number; lng: number };

export function alertMapPosition(alert: SafetyAlert): MapLatLng {
  if (typeof alert.latitude === "number" && typeof alert.longitude === "number") {
    return { lat: alert.latitude, lng: alert.longitude };
  }
  const { dLat, dLng } = hashToOffset(alert.id);
  return { lat: SF_CENTER.lat + dLat, lng: SF_CENTER.lng + dLng };
}

export function alertMarkerColor(type: SafetyAlert["type"]): string {
  if (type === "help_signal") return "#FF7918";
  return "#EE3B33";
}

export function alertMarkerLabel(alert: SafetyAlert): string {
  if (alert.type === "sos_critical" || alert.type === "manual_sos") {
    return `${alert.userName} [SOS]`;
  }
  return alert.userName;
}
