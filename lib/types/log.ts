export interface LogEntry {
  time: string;
  eventType: string;
  message: string;
}

export type LogSeverity = "info" | "warn" | "error";

export interface SystemActivityLog {
  id: string;
  timestamp: string;
  severity: LogSeverity;
  module: string;
  message: string;
  responseTime: string;
}

export interface SystemLogsMetrics {
  totalErrors1h: number;
  totalErrorsDelta: string;
  totalErrorsDeltaUp: boolean;
  avgLatency: string;
  avgLatencyDelta: string;
  avgLatencyDeltaUp: boolean;
  requestsPerSec: number;
  requestsStatus: string;
  activeDrivers: number;
  activeDriversStatus: string;
}

export interface SystemStatusBar {
  apiSync: { status: string; ok: boolean };
  dbLoad: string;
  uptime: string;
  memory: string;
}
