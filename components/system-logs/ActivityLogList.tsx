"use client";

import type { SystemActivityLog } from "@/lib/types/log";
import type { LogSeverity } from "@/lib/types/log";

interface ActivityLogListProps {
  logs: SystemActivityLog[];
  serviceId?: string;
}

const SEVERITY_STYLES: Record<LogSeverity, { label: string; textClass: string; responseClass: string }> = {
  info: { label: "INFO", textClass: "text-success", responseClass: "text-text-secondary" },
  warn: { label: "WARN", textClass: "text-warning", responseClass: "text-warning" },
  error: { label: "ERROR", textClass: "text-danger", responseClass: "text-danger" },
};

function isSlowOrError(severity: LogSeverity, responseTime: string): boolean {
  if (severity === "error") return true;
  const ms = parseInt(responseTime.replace(/\D/g, ""), 10);
  return responseTime.endsWith("ms") && ms >= 500;
}

export function ActivityLogList({ logs, serviceId }: ActivityLogListProps) {
  return (
    <div className="rounded-lg border border-border bg-surface font-mono text-sm">
      <div className="border-b border-border px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-wider text-text-secondary">
          {serviceId ?? ""}
        </span>
      </div>
      <div className="max-h-[480px] overflow-y-auto">
        {logs.map((log) => {
          const style = SEVERITY_STYLES[log.severity];
          const highlightResponse = isSlowOrError(log.severity, log.responseTime);
          return (
            <div
              key={log.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-border/60 px-4 py-2 hover:bg-background/50 last:border-0"
            >
              <span className="shrink-0 text-xs text-text-secondary">{log.timestamp}</span>
              <span className={`shrink-0 font-semibold ${style.textClass}`}>{style.label}</span>
              <span className="shrink-0 text-text-secondary">[{log.module}]</span>
              <span className="min-w-0 flex-1 text-text-primary">{log.message}</span>
              <span
                className={`shrink-0 text-xs ${highlightResponse ? style.responseClass : "text-text-secondary"}`}
              >
                {log.responseTime}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
