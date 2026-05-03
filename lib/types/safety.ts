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
  primaryButtonLabel: string;
  primaryButtonIcon?: "deploy" | "phone" | "headphone";
  hasLiveIndicator?: boolean;
  avatarColor?: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
}

export interface IncidentDetails {
  alertId: string;
  vehicleTelemetry: {
    currentSpeed: string;
    gForceSpike?: string;
  };
  emergencyContacts: EmergencyContact[];
}
