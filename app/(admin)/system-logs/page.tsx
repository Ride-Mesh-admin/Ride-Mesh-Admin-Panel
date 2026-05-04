"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Info, AlertTriangle, CircleAlert } from "lucide-react";
import { LogMetricsCards } from "@/components/system-logs/LogMetricsCards";
import { ActivityLogList } from "@/components/system-logs/ActivityLogList";
import { SystemStatusFooter } from "@/components/system-logs/SystemStatusFooter";
import {
  systemLogsMetrics,
  systemStatusBar,
  mockSystemLogs,
  SERVICE_ID,
} from "@/lib/mock/system-logs";
import type { LogSeverity, SystemActivityLog, SystemLogsMetrics, SystemStatusBar } from "@/lib/types/log";

type SeverityFilter = "all" | LogSeverity;
const TIME_RANGES = ["Last 15 minutes", "Last 1 hour", "Last 6 hours", "Last 24 hours"];

export default function SystemLogsPage() {
  const [metrics, setMetrics] = useState<SystemLogsMetrics>(systemLogsMetrics);
  const [logs, setLogs] = useState<SystemActivityLog[]>(mockSystemLogs);
  const [status, setStatus] = useState<SystemStatusBar>(systemStatusBar);
  const [serviceId, setServiceId] = useState<string>(SERVICE_ID);
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");
  const [timeRange, setTimeRange] = useState(TIME_RANGES[0]);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadMetrics() {
      try {
        const response = await fetch("/api/system-logs/metrics", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as SystemLogsMetrics;
        if (isMounted) setMetrics(payload);
      } catch {
        // Keep existing values as fallback when backend is not available.
      }
    }
    void loadMetrics();
    const timer = window.setInterval(loadMetrics, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    async function loadStream() {
      try {
        const response = await fetch("/api/system-logs/stream", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          logs: SystemActivityLog[];
          status: SystemStatusBar;
          serviceId: string;
        };
        if (isMounted) {
          setLogs(payload.logs);
          setStatus(payload.status);
          setServiceId(payload.serviceId);
        }
      } catch {
        // Keep fallback stream.
      }
    }
    void loadStream();
    const timer = window.setInterval(loadStream, 20000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredLogs = useMemo(() => {
    let list = logs;
    if (severityFilter !== "all") list = list.filter((l) => l.severity === severityFilter);
    return list;
  }, [logs, severityFilter]);

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-text-primary">System Activity Logs</h1>
          <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <span className="h-2 w-2 rounded-full bg-success" />
            LIVE STREAM
          </span>
        </div>
      </div>

      {/* Metrics */}
      <div className="mb-6">
        <LogMetricsCards metrics={metrics} />
      </div>

      {/* Filters and controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setSeverityFilter("all")}
          className={`focus-ring flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium ${
            severityFilter === "all"
              ? "border-brand bg-brand text-brand-contrast"
              : "border-border bg-surface text-text-primary hover:bg-border/50"
          }`}
        >
          All Severities
          <ChevronDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "info" ? "all" : "info")}
          className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            severityFilter === "info" ? "border-success bg-success/20 text-success" : "border-border bg-surface text-text-secondary hover:text-text-primary"
          }`}
        >
          <Info className="h-4 w-4" />
          Info
        </button>
        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "warn" ? "all" : "warn")}
          className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            severityFilter === "warn" ? "border-warning bg-warning/20 text-warning" : "border-border bg-surface text-text-secondary hover:text-text-primary"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Warning
        </button>
        <button
          type="button"
          onClick={() => setSeverityFilter(severityFilter === "error" ? "all" : "error")}
          className={`focus-ring flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
            severityFilter === "error" ? "border-danger bg-danger/20 text-danger" : "border-border bg-surface text-text-secondary hover:text-text-primary"
          }`}
        >
          <CircleAlert className="h-4 w-4" />
          Error
        </button>
        <div className="ml-auto flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="focus-ring rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-brand"
          >
            {TIME_RANGES.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-text-secondary">
            <span>Auto-scroll</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoScroll}
              onClick={() => setAutoScroll(!autoScroll)}
              className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${
                autoScroll ? "bg-brand" : "bg-surface border border-border"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  autoScroll ? "translate-x-6" : "translate-x-0.5"
                }`}
                style={{ marginTop: 2 }}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Log list */}
      <div className="mb-4 flex-1">
        <ActivityLogList logs={filteredLogs} serviceId={serviceId} />
      </div>

      {/* Footer status bar */}
      <SystemStatusFooter status={status} />
    </div>
  );
}
