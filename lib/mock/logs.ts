import type { LogEntry } from "@/lib/types/log";

export const liveLogs: LogEntry[] = [
  { time: "14:22:01", eventType: "BLOCK_USER", message: "ID:8829 - Policy Violation: Dangerous Driving." },
  { time: "14:21:45", eventType: "LOGIN_SUCCESS", message: "Admin:Marcus_Vane [IP: 192.168.1.1]" },
  { time: "14:21:30", eventType: "SOS_TRIGGER", message: "RideID:4490 - User initiated alert." },
  { time: "14:20:12", eventType: "RIDE_COMPLETE", message: "ID:9012 - Transaction processed." },
  { time: "14:19:05", eventType: "GEO_FENCE_EXIT", message: "DriverID:2201 - Area: Downtown." },
];
