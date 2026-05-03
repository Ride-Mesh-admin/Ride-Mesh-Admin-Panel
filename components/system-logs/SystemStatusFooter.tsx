"use client";

import type { SystemStatusBar } from "@/lib/types/log";

interface SystemStatusFooterProps {
  status: SystemStatusBar;
}

export function SystemStatusFooter({ status }: SystemStatusFooterProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-border bg-surface px-4 py-2 text-xs text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full ${status.apiSync.ok ? "bg-success" : "bg-danger"}`} />
        {status.apiSync.status}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-warning" />
        {status.dbLoad}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
        {status.uptime}
      </span>
      <span>Memory: {status.memory}</span>
    </div>
  );
}
