export type SafetyAlertType = "sos_critical" | "help_signal" | "manual_sos";

export interface SafetyAlert {
  id: string;
  type: SafetyAlertType;
  activeDuration: string;
  userName: string;
  tripId: string;
  vehicle: string;
  alertMessage: string;
  alertIcon: "impact" | "warning" | "audio";
  hasLiveIndicator?: boolean;
  avatarColor?: string;
  photoURL?: string;
  /** Firestore ride document id */
  rideId?: string;
  hostId?: string;
  /** WGS84 — when set, the safety map pins this alert at exact coordinates */
  latitude?: number;
  longitude?: number;
  /** Firestore event time (ms) for ordering — most recent SOS first */
  createdAtMs?: number;
}
