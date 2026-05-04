"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { AlertCard } from "@/components/safety/AlertCard";
import { SafetyMap } from "@/components/safety/SafetyMap";
import { mockSafetyAlerts } from "@/lib/mock/safety";
import type { SafetyAlert } from "@/lib/types/safety";

type FilterTab = "all" | "sos_only" | "help_signals" | "resolved";

/** Leaflet map viewport on Safety Alerts (max height cap + responsive height). */
const SAFETY_MAP_MAX_HEIGHT_PX = 560;
const SAFETY_MAP_MIN_HEIGHT_PX = 320;

function formatUTC(): string {
  const now = new Date();
  return now.toISOString().slice(11, 19) + " UTC";
}

export default function SafetyAlertsPage() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>(mockSafetyAlerts);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(mockSafetyAlerts[0]?.id ?? null);
  const [utcTime, setUtcTime] = useState(formatUTC());
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [notifyErrorByAlertId, setNotifyErrorByAlertId] = useState<Record<string, string>>({});

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const response = await fetch("/api/admin/safety-alerts", { cache: "no-store", credentials: "include" });
        if (!response.ok) return;
        const payload = (await response.json()) as { alerts: SafetyAlert[] };
        if (isMounted) {
          setAlerts(payload.alerts);
        }
      } catch {
        // Keep fallback.
      }
    }
    void loadAlerts();
    const timer = window.setInterval(loadAlerts, 30000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

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
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        setNotifyErrorByAlertId((prev) => ({
          ...prev,
          [alert.id]: data.error || "Notify host failed.",
        }));
        return;
      }
      setNotifyErrorByAlertId((prev) => {
        const next = { ...prev };
        delete next[alert.id];
        return next;
      });
    } catch {
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
            {filteredAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                isSelected={selectedId === alert.id}
                onSelect={() => setSelectedId(alert.id)}
                onNotifyHost={handleNotifyHost}
                notifyingId={notifyingId}
                notifyErrorMessage={notifyErrorByAlertId[alert.id] ?? null}
              />
            ))}
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
          <SafetyMap alerts={alerts} selectedAlertId={selectedId} />
        </div>
      </div>
    </div>
  );
}
