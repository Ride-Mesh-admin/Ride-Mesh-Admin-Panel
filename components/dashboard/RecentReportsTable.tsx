"use client";

import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
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
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export function RecentReportsTable({ reports }: RecentReportsTableProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-white">RECENT RIDE REPORTS</h3>
        <Link
          href="/safety-alerts"
          className="focus-ring rounded text-sm text-text-secondary hover:text-brand"
        >
          View All Reports
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
              <th className="pb-3 pr-4">REPORT ID</th>
              <th className="pb-3 pr-4">USER / DRIVER</th>
              <th className="pb-3 pr-4">SEVERITY</th>
              <th className="pb-3 pr-4">STATUS</th>
              <th className="pb-3 pl-4 text-right">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.id}
                className="border-b border-border/80 last:border-0"
              >
                <td className="py-3 pr-4 font-medium text-white">#{report.id}</td>
                <td className="py-3 pr-4">
                  <div>
                    <p className="font-medium text-white">{report.userName}</p>
                    <p className="text-xs text-text-secondary">
                      Driver: {report.driverName}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <SeverityCell severity={report.severity} />
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={report.status} />
                </td>
                <td className="py-3 pl-4 text-right">
                  <button
                    type="button"
                    className="focus-ring rounded p-1 text-text-secondary hover:bg-border hover:text-white"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
