"use client";

import type { SystemLogsMetrics } from "@/lib/types/log";

interface LogMetricsCardsProps {
  metrics: SystemLogsMetrics;
}

export function LogMetricsCards({ metrics }: LogMetricsCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          TOTAL ERRORS (1H)
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-white">{metrics.totalErrors1h}</span>
          <span className={metrics.totalErrorsDeltaUp ? "text-danger text-sm" : "text-success text-sm"}>
            {metrics.totalErrorsDelta}
          </span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          AVG LATENCY
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-white">{metrics.avgLatency}</span>
          <span className={metrics.avgLatencyDeltaUp ? "text-danger text-sm" : "text-success text-sm"}>
            {metrics.avgLatencyDelta}
          </span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          REQUESTS/SEC
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-white">{metrics.requestsPerSec.toLocaleString()}</span>
          <span className="flex items-center gap-1.5 text-sm text-warning">
            <span className="h-2 w-2 rounded-full bg-warning" />
            {metrics.requestsStatus}
          </span>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-surface p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          ACTIVE DRIVERS
        </p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-white">{metrics.activeDrivers}</span>
          <span className="flex items-center gap-1.5 text-sm text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            {metrics.activeDriversStatus}
          </span>
        </div>
      </div>
    </div>
  );
}
