"use client";

import Link from "next/link";
import type { RideReport } from "@/lib/types/report";
import { SEVERITY_CONFIG, STATUS_CONFIG } from "@/lib/constants";
import type { Severity, ReportStatus } from "@/lib/types/report";

interface RecentReportsTableProps {
  reports: RideReport[];
}

function SeverityCell({ severity }: { severity: Severity }) {
  const config = SEVERITY_CONFIG[severity];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
      <span className={config.color}>{config.label}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: ReportStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function RecentReportsTable({ reports }: RecentReportsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-bold text-text-primary">Recent safety reports</h3>
        <Link
          href="/safety-alerts"
          className="focus-ring shrink-0 rounded text-sm font-medium text-brand hover:text-brand-dark"
        >
          View all alerts
        </Link>
      </div>
      <div className="overflow-x-auto">
        {reports.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-secondary">No active SOS or help signals.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
                <th className="pb-3 pr-4">Report ID</th>
                <th className="pb-3 pr-4">User / host</th>
                <th className="pb-3 pr-4">Severity</th>
                <th className="pb-3 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-border/80 last:border-0 hover:bg-background/40">
                  <td className="py-3 pr-4 font-medium text-text-primary">
                    <Link href={report.href || "/safety-alerts"} className="focus-ring rounded hover:text-brand">
                      #{report.id}
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <Link href={report.href || "/safety-alerts"} className="block focus-ring rounded">
                      <p className="font-medium text-text-primary">{report.userName}</p>
                      <p className="text-xs text-text-secondary">Host: {report.driverName}</p>
                    </Link>
                  </td>
                  <td className="py-3 pr-4">
                    <SeverityCell severity={report.severity} />
                  </td>
                  <td className="py-3 pr-4">
                    <StatusBadge status={report.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
