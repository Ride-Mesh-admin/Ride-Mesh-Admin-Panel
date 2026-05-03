import type { LogEntry } from "@/lib/types/log";

interface LiveSystemLogsProps {
  logs: LogEntry[];
}

export function LiveSystemLogs({ logs }: LiveSystemLogsProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="font-bold text-white">LIVE SYSTEM LOGS</h3>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
        </span>
      </div>
      <ul className="space-y-2">
        {logs.map((log, i) => (
          <li
            key={`${log.time}-${i}`}
            className="flex gap-3 font-mono text-xs text-text-secondary"
          >
            <span className="shrink-0 text-text-secondary">{log.time}</span>
            <span className="min-w-0 break-all">
              <span className="font-semibold text-brand">{log.eventType}</span>{" "}
              {log.message}
            </span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        className="focus-ring mt-4 w-full rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-white hover:bg-surface"
      >
        OPEN TERMINAL CONSOLE
      </button>
    </div>
  );
}
