"use client";

import { useState, useMemo, useEffect } from "react";
import { AlertCard } from "@/components/safety/AlertCard";
import { SafetyMap } from "@/components/safety/SafetyMap";
import { IncidentDetailsPanel } from "@/components/safety/IncidentDetailsPanel";
import { mockSafetyAlerts, mockIncidentDetails, ACTIVE_RESPONDERS_COUNT } from "@/lib/mock/safety";
import type { IncidentDetails, SafetyAlert } from "@/lib/types/safety";

type FilterTab = "all" | "sos_only" | "help_signals" | "unassigned";

function formatUTC(): string {
  const now = new Date();
  return now.toISOString().slice(11, 19) + " UTC";
}

export default function SafetyAlertsPage() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>(mockSafetyAlerts);
  const [incidentMap, setIncidentMap] = useState<Record<string, IncidentDetails>>(mockIncidentDetails);
  const [activeRespondersCount, setActiveRespondersCount] = useState(ACTIVE_RESPONDERS_COUNT);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(mockSafetyAlerts[0]?.id ?? null);
  const [utcTime, setUtcTime] = useState(formatUTC());

  useEffect(() => {
    let isMounted = true;
    async function loadAlerts() {
      try {
        const response = await fetch("/api/admin/safety-alerts", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          alerts: SafetyAlert[];
          incidentDetails: Record<string, IncidentDetails>;
          activeResponders: number;
        };
        if (isMounted) {
          setAlerts(payload.alerts);
          setIncidentMap(payload.incidentDetails);
          setActiveRespondersCount(payload.activeResponders);
          setSelectedId((current) => current ?? payload.alerts[0]?.id ?? null);
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

  const filteredAlerts = useMemo(() => {
    if (filter === "all") return alerts;
    if (filter === "sos_only") return alerts.filter((a) => a.type === "sos_critical" || a.type === "manual_sos");
    if (filter === "help_signals") return alerts.filter((a) => a.type === "help_signal");
    return alerts.filter((a) => !a.hasLiveIndicator);
  }, [alerts, filter]);

  const incidentDetails = selectedId ? incidentMap[selectedId] ?? null : null;

  useEffect(() => {
    const t = setInterval(() => setUtcTime(formatUTC()), 1000);
    return () => clearInterval(t);
  }, []);

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All Alerts" },
    { key: "sos_only", label: "SOS Only" },
    { key: "help_signals", label: "Help Signals" },
    { key: "unassigned", label: "Unassigned" },
  ];

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white">Safety Operations Center</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-text-secondary">{utcTime}</span>
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <span>{activeRespondersCount} Active Responders</span>
            <div className="flex -space-x-2">
              {[1, 2].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-background bg-brand flex items-center justify-center text-xs font-bold text-white"
                >
                  {i}
                </div>
              ))}
            </div>
          </span>
        </div>
      </div>

      <div className="flex min-h-[500px] flex-col gap-4 lg:flex-row">
        {/* Left - Alerts panel */}
        <div className="w-full shrink-0 lg:w-[380px]">
          <div className="mb-3 flex gap-2">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  filter === key ? "bg-brand text-white" : "bg-surface text-text-secondary hover:text-white"
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
              />
            ))}
          </div>
        </div>

        {/* Right - Map + Incident panel */}
        <div className="relative min-h-[400px] flex-1">
          <SafetyMap selectedAlertId={selectedId} />
          {selectedId && (
            <IncidentDetailsPanel
              details={incidentDetails}
              onClose={() => setSelectedId(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}
