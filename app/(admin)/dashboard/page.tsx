"use client";

import { CriticalSafetyBanner } from "@/components/dashboard/CriticalSafetyBanner";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RecentReportsTable } from "@/components/dashboard/RecentReportsTable";
import { LiveSystemLogs } from "@/components/dashboard/LiveSystemLogs";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminQuery } from "@/lib/client/useAdminQuery";
import type { CriticalAlert } from "@/lib/types/alert";
import type { DashboardMetrics } from "@/lib/types/metric";
import type { RideReport } from "@/lib/types/report";
import type { LogEntry } from "@/lib/types/log";
import { UsersIcon, VehicleIcon, WarningIcon, SosIcon } from "@/components/icons/AppIcons";

type DashboardPayload = {
  criticalAlert: CriticalAlert;
  metrics: DashboardMetrics;
  reports: RideReport[];
  liveLogs: LogEntry[];
};

async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch("/api/admin/dashboard", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load dashboard");
  return (await response.json()) as DashboardPayload;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-[88px] w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.6fr]">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, loading } = useAdminQuery<DashboardPayload>({
    key: "dashboard",
    fetcher: fetchDashboard,
    refreshInterval: 45_000,
    staleTime: 10_000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Dashboard</h1>
        <p className="mt-1 text-sm text-text-secondary">Live ops overview across users, rides, and safety.</p>
      </div>

      {loading && !data ? (
        <DashboardSkeleton />
      ) : data ? (
        <>
          {(data.criticalAlert.count ?? 0) > 0 ? (
            <CriticalSafetyBanner alert={data.criticalAlert} />
          ) : null}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="TOTAL USERS"
              value={data.metrics.totalUsers.toLocaleString()}
              badge={data.metrics.totalUsersDelta}
              badgeVariant="success"
              icon={<UsersIcon size={18} />}
            />
            <MetricCard
              label="ACTIVE RIDES"
              value={data.metrics.activeRides.toLocaleString()}
              badge="Live"
              badgeVariant="success"
              icon={<VehicleIcon size={18} />}
            />
            <MetricCard
              label="OPEN REPORTS"
              value={data.metrics.openReports}
              badge={data.metrics.openReportsPriority}
              badgeVariant="danger"
              icon={<WarningIcon size={18} />}
            />
            <MetricCard
              label="SOS ALERTS"
              value={data.metrics.sosAlerts}
              badge={data.metrics.sosAlertsStatus}
              badgeVariant="warning"
              showPulse
              icon={<SosIcon size={18} />}
            />
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_0.6fr]">
            <RecentReportsTable reports={data.reports} />
            <LiveSystemLogs logs={data.liveLogs} />
          </div>
        </>
      ) : (
        <p className="rounded-2xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-secondary">
          Could not load dashboard from Firebase.
        </p>
      )}
    </div>
  );
}
