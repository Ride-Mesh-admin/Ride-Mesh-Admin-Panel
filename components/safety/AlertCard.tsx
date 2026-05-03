"use client";

import { AlertTriangle, Phone, Headphones, Check } from "lucide-react";
import type { SafetyAlert } from "@/lib/types/safety";
import { SAFETY_ALERT_TYPE_CONFIG } from "@/lib/constants";

interface AlertCardProps {
  alert: SafetyAlert;
  isSelected?: boolean;
  onSelect: () => void;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function MessageIcon({ icon }: { icon: "impact" | "warning" | "audio" }) {
  const cls = icon === "impact" ? "text-danger" : icon === "warning" ? "text-warning" : "text-blue-400";
  if (icon === "audio") return <Headphones className={`h-4 w-4 ${cls}`} />;
  return <AlertTriangle className={`h-4 w-4 ${cls}`} />;
}

export function AlertCard({ alert, isSelected, onSelect }: AlertCardProps) {
  const config = SAFETY_ALERT_TYPE_CONFIG[alert.type];
  const avatarBg = alert.avatarColor === "grey" ? "bg-surface" : alert.avatarColor === "blue" ? "bg-blue-500/80" : "bg-brand";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={`focus-ring cursor-pointer rounded-lg border p-4 ${isSelected ? "border-brand bg-brand/10" : "border-border bg-surface hover:border-border/80"}`}
    >
      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.badgeClass}`}>
        {config.label}
      </span>
      <p className="mb-3 mt-2 text-xs text-text-secondary">ACTIVE: {alert.activeDuration}</p>
      <div className="mb-3 flex items-center gap-3">
        <div className="relative shrink-0">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-white ${avatarBg}`}>
            {getInitials(alert.userName)}
          </div>
          {alert.hasLiveIndicator && (
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-success" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white">{alert.userName}</p>
          <p className="text-xs text-text-secondary">Trip ID: {alert.tripId} • {alert.vehicle}</p>
        </div>
      </div>
      <div className={`mb-4 flex items-center gap-2 ${config.messageIconColor}`}>
        <MessageIcon icon={alert.alertIcon} />
        <span className="text-sm font-medium">{alert.alertMessage}</span>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="focus-ring flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-brand py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          {alert.primaryButtonIcon === "phone" && <Phone className="h-3.5 w-3.5" />}
          {alert.primaryButtonIcon === "headphone" && <Headphones className="h-3.5 w-3.5" />}
          {alert.primaryButtonLabel}
        </button>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="focus-ring flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-white hover:bg-border/50"
        >
          <Check className="h-3.5 w-3.5" />
          Mark Resolved
        </button>
      </div>
    </div>
  );
}
