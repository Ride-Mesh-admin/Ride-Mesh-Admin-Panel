"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertCard } from "@/components/safety/AlertCard";
import { SafetyMap } from "@/components/safety/SafetyMap";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminQuery } from "@/lib/client/useAdminQuery";
import type { SafetyAlert } from "@/lib/types/safety";

type FilterTab = "all" | "sos_only" | "help_signals" | "resolved";
type SafetyPayload = { alerts: SafetyAlert[] };

const SAFETY_MAP_MAX_HEIGHT_PX = 560;
const SAFETY_MAP_MIN_HEIGHT_PX = 320;

function formatUTC(): string {
  const now = new Date();
  return now.toISOString().slice(11, 19) + " UTC";
}

async function fetchSafety(): Promise<SafetyPayload> {
  const response = await fetch("/api/admin/safety-alerts", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load safety alerts");
  return (await response.json()) as SafetyPayload;
}

function SafetySkeleton() {
  return (
    <div className="flex min-h-[500px] flex-col gap-4 lg:flex-row" aria-busy="true" aria-label="Loading safety alerts">
      <div className="w-full shrink-0 space-y-3 lg:w-[380px]">
        <div className="mb-3 flex gap-2">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-36 w-full" />
        ))}
      </div>
      <Skeleton className="min-h-[320px] w-full flex-1" style={{ maxHeight: SAFETY_MAP_MAX_HEIGHT_PX }} />
    </div>
  );
}

export default function SafetyAlertsPage() {
  const { data, loading } = useAdminQuery<SafetyPayload>({
    key: "safety",
    fetcher: fetchSafety,
    refreshInterval: 30_000,
    staleTime: 8_000,
  });
  const alerts = data?.alerts ?? [];

  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [utcTime, setUtcTime] = useState(formatUTC());
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notifyErrorByAlertId, setNotifyErrorByAlertId] = useState<Record<string, string>>({});
  const [notifySuccessByAlertId, setNotifySuccessByAlertId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (alerts.length === 0) {
      setSelectedId(null);
      return;
    }
    setSelectedId((current) => {
      if (current && alerts.some((a) => a.id === current)) return current;
      const sosAlerts = alerts.filter((a) => a.type === "sos_critical" || a.type === "manual_sos");
      if (sosAlerts.length > 0) {
        return sosAlerts.reduce((best, a) => ((a.createdAtMs ?? 0) >= (best.createdAtMs ?? 0) ? a : best)).id;
      }
      return alerts[0]?.id ?? null;
    });
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "sos_only") return alerts.filter((a) => a.type === "sos_critical" || a.type === "manual_sos");
    if (filter === "help_signals") return alerts.filter((a) => a.type === "help_signal");
    if (filter === "resolved") return alerts.filter((a) => !a.hasLiveIndicator);
    return alerts;
  }, [alerts, filter]);

  useEffect(() => {
    const t = setInterval(() => setUtcTime(formatUTC()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleNotifyHost = useCallback(async (alert: SafetyAlert) => {
    setNotifyingId(alert.id);
    setNotifySuccessByAlertId((prev) => ({ ...prev, [alert.id]: true }));
    setNotifyErrorByAlertId((prev) => {
      const next = { ...prev };
      delete next[alert.id];
      return next;
    });
    try {
      const response = await fetch("/api/admin/safety-alerts/notify-host", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ alertId: alert.id }),
      });
      const result = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) {
        setNotifySuccessByAlertId((prev) => {
          const next = { ...prev };
          delete next[alert.id];
          return next;
        });
        setNotifyErrorByAlertId((prev) => ({
          ...prev,
          [alert.id]: result.error || "Notify host failed.",
        }));
        return;
      }
    } catch {
      setNotifySuccessByAlertId((prev) => {
        const next = { ...prev };
        delete next[alert.id];
        return next;
      });
      setNotifyErrorByAlertId((prev) => ({
        ...prev,
        [alert.id]: "Network error — try again.",
      }));
    } finally {
      setNotifyingId(null);
    }
  }, []);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Alerts" },
    { key: "sos_only", label: "SOS Only" },
    { key: "help_signals", label: "Help Signals" },
    { key: "resolved", label: "Resolved" },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-text-primary">Safety Operations Center</h1>
        <span className="text-sm text-text-secondary">{utcTime}</span>
      </div>

      {loading && !data ? (
        <SafetySkeleton />
      ) : (
        <div className="flex min-h-[500px] flex-col gap-4 lg:flex-row">
          <div className="w-full shrink-0 lg:w-[380px]">
            <div className="mb-3 flex gap-2">
              {tabs.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFilter(key)}
                  className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    filter === key ? "bg-brand text-brand-contrast" : "bg-surface text-text-secondary hover:text-text-primary"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-3 overflow-y-auto pr-2">
              {filteredAlerts.length === 0 ? (
                <p className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-text-secondary">
                  No active safety alerts from Firebase.
                </p>
              ) : (
                filteredAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    isSelected={selectedId === alert.id}
                    onSelect={() => setSelectedId(alert.id)}
                    onNotifyHost={handleNotifyHost}
                    notifyingId={notifyingId}
                    notifyErrorMessage={notifyErrorByAlertId[alert.id] ?? null}
                    notifySuccess={Boolean(notifySuccessByAlertId[alert.id])}
                  />
                ))
              )}
            </div>
          </div>

          <div
            className="relative w-full flex-1 overflow-hidden lg:min-w-0"
            style={{
              minHeight: SAFETY_MAP_MIN_HEIGHT_PX,
              maxHeight: SAFETY_MAP_MAX_HEIGHT_PX,
              height: `min(${SAFETY_MAP_MAX_HEIGHT_PX}px, 65vh)`,
            }}
          >
            <SafetyMap alerts={filteredAlerts} selectedAlertId={selectedId} />
          </div>
        </div>
      )}
    </div>
  );
}
