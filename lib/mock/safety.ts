import type { SafetyAlert } from "@/lib/types/safety";
import type { IncidentDetails } from "@/lib/types/safety";

export const mockSafetyAlerts: SafetyAlert[] = [
  {
    id: "1",
    type: "sos_critical",
    activeDuration: "02:14",
    userName: "Marcus Henderson",
    tripId: "RMM-95001",
    vehicle: "Tesla Model 3",
    alertMessage: "HIGH IMPACT DETECTED",
    alertIcon: "impact",
    primaryButtonLabel: "Deploy Response",
    primaryButtonIcon: "deploy",
    hasLiveIndicator: true,
    avatarColor: "orange",
  },
  {
    id: "2",
    type: "help_signal",
    activeDuration: "12:45",
    userName: "Sarah Jenkins",
    tripId: "RMM-00412",
    vehicle: "Toyota Camry",
    alertMessage: "OFF-ROUTE WARNING",
    alertIcon: "warning",
    primaryButtonLabel: "Contact Driver",
    primaryButtonIcon: "phone",
    avatarColor: "grey",
  },
  {
    id: "3",
    type: "manual_sos",
    activeDuration: "15:29",
    userName: "David Chen",
    tripId: "RMM-90215",
    vehicle: "Honda Civic",
    alertMessage: "AUDIO STREAM ACTIVE",
    alertIcon: "audio",
    primaryButtonLabel: "Listen Live",
    primaryButtonIcon: "headphone",
    avatarColor: "blue",
  },
];

export const mockIncidentDetails: Record<string, IncidentDetails> = {
  "1": {
    alertId: "1",
    vehicleTelemetry: {
      currentSpeed: "0 km/h (Stopped)",
      gForceSpike: "4.2g",
    },
    emergencyContacts: [
      { name: "Linda Henderson", relation: "Mother", phone: "+1 (555) 123-3456" },
    ],
  },
  "2": {
    alertId: "2",
    vehicleTelemetry: { currentSpeed: "45 km/h" },
    emergencyContacts: [
      { name: "John Jenkins", relation: "Spouse", phone: "+1 (555) 234-5678" },
    ],
  },
  "3": {
    alertId: "3",
    vehicleTelemetry: { currentSpeed: "0 km/h (Stopped)" },
    emergencyContacts: [
      { name: "Emily Chen", relation: "Sister", phone: "+1 (555) 345-6789" },
    ],
  },
};

export const ACTIVE_RESPONDERS_COUNT = 2;
