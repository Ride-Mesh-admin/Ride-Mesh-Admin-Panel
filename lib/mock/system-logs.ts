import type { SystemActivityLog } from "@/lib/types/log";
import type { SystemLogsMetrics, SystemStatusBar } from "@/lib/types/log";

export const systemLogsMetrics: SystemLogsMetrics = {
  totalErrors1h: 24,
  totalErrorsDelta: "+12%",
  totalErrorsDeltaUp: true,
  avgLatency: "142ms",
  avgLatencyDelta: "-5%",
  avgLatencyDeltaUp: false,
  requestsPerSec: 1248,
  requestsStatus: "Normal",
  activeDrivers: 842,
  activeDriversStatus: "Live Now",
};

export const systemStatusBar: SystemStatusBar = {
  apiSync: { status: "API SYNC OK", ok: true },
  dbLoad: "DB LOAD: 12%",
  uptime: "UPTIME: 99.99%",
  memory: "4.2GB / 16GB",
};

export const mockSystemLogs: SystemActivityLog[] = [
  {
    id: "1",
    timestamp: "14:02:45.122",
    severity: "info",
    module: "AUTH_GATEWAY",
    message: "User login successful: UID_88291 from IP 192.168.1.45",
    responseTime: "22ms",
  },
  {
    id: "2",
    timestamp: "14:02:44.891",
    severity: "warn",
    module: "DB_PRIMARY",
    message: "Slow query detected: UPDATE drivers_location SET lat=40.7128, lng=-74.0060 WHERE driver_id='DR_99'",
    responseTime: "542ms",
  },
  {
    id: "3",
    timestamp: "14:02:43.102",
    severity: "error",
    module: "API_GATEWAY",
    message: "Unhandled Rejection: Connection timeout at node_modules/db-pool/connection.js:145:18",
    responseTime: "5000ms",
  },
  {
    id: "4",
    timestamp: "14:02:42.554",
    severity: "info",
    module: "DISPATCH",
    message: "Driver DR_182 assigned to ride RID_80x94A. ETA: 4 minutes.",
    responseTime: "45ms",
  },
  {
    id: "5",
    timestamp: "14:02:41.221",
    severity: "info",
    module: "RIDE_ENGINE",
    message: "Ride RID_80x94A created. Route calculated.",
    responseTime: "0ns",
  },
  {
    id: "6",
    timestamp: "14:02:40.018",
    severity: "info",
    module: "NOTIFICATION",
    message: "Push sent to 3 subscribers for zone SF-01.",
    responseTime: "3ns",
  },
  {
    id: "7",
    timestamp: "14:02:38.776",
    severity: "error",
    module: "MAPS_SVC",
    message: "External API Quota Exceeded: Google Maps Directions API. Switching to fallback (MapBox).",
    responseTime: "1204ms",
  },
  {
    id: "8",
    timestamp: "14:02:37.102",
    severity: "warn",
    module: "WEB_SOCKET",
    message: "Client reconnect: session WS_8821 expired, new session WS_8822.",
    responseTime: "12ms",
  },
  {
    id: "9",
    timestamp: "14:02:35.889",
    severity: "info",
    module: "GEO_FENCE",
    message: "Driver DR_99 entered zone ZONE_Downtown.",
    responseTime: "8ms",
  },
  {
    id: "10",
    timestamp: "14:02:34.445",
    severity: "info",
    module: "PAYMENT",
    message: "Pre-auth captured for ride RID_80x93F. Amount: $24.50.",
    responseTime: "156ms",
  },
];

export const SERVICE_ID = "RIDE-MESH-CORE-PROD-01";
