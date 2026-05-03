"use client";

import { useEffect, useState } from "react";
import { CriticalSafetyBanner } from "@/components/dashboard/CriticalSafetyBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { LiveSystemLogs } from "@/components/dashboard/LiveSystemLogs";
import { criticalAlert as fallbackCriticalAlert } from "@/lib/mock/alert";
import { dashboardMetrics as fallbackMetrics } from "@/lib/mock/metrics";
import { recentReports as fallbackReports } from "@/lib/mock/reports";
import { liveLogs as fallbackLiveLogs } from "@/lib/mock/logs";
import type { CriticalAlert } from "@/lib/types/alert";
import type { DashboardMetrics } from "@/lib/types/metric";
import type { RideReport } from "@/lib/types/report";
import type { LogEntry } from "@/lib/types/log";

type DashboardPayload = {
  criticalAlert: CriticalAlert;
  metrics: DashboardMetrics;
  reports: RideReport[];
  liveLogs: LogEntry[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardPayload>({
    criticalAlert: fallbackCriticalAlert,
    metrics: fallbackMetrics,
    reports: fallbackReports,
    liveLogs: fallbackLiveLogs,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        const response = await fetch("/api/admin/dashboard", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as DashboardPayload;
        if (isMounted) setData(payload);
      } catch {
        // Fallback values already set.
      }
    }
    void loadDashboard();
    const timer = window.setInterval(loadDashboard, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="space-y-6">
      <CriticalSafetyBanner alert={data.criticalAlert} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="TOTAL USERS"
          value={data.metrics.totalUsers.toLocaleString()}
          badge={data.metrics.totalUsersDelta}
          badgeVariant="success"
        />
        <MetricCard
          label="ACTIVE RIDES"
          value={data.metrics.activeRides.toLocaleString()}
          badge="Live"
          badgeVariant="success"
        />
        <MetricCard
          label="OPEN REPORTS"
          value={data.metrics.openReports}
          badge={data.metrics.openReportsPriority}
          badgeVariant="danger"
        />
        <MetricCard
          label="SOS ALERTS"
          value={data.metrics.sosAlerts}
          badge={data.metrics.sosAlertsStatus}
          badgeVariant="warning"
          showPulse
        />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.6fr]">
        <RecentReportsTable reports={data.reports} />
        <LiveSystemLogs logs={data.liveLogs} />
      </div>
    </div>
  );
}
