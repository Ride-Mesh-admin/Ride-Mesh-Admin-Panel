import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  badge?: string;
  badgeVariant?: "success" | "danger" | "warning";
  showPulse?: boolean;
  icon?: ReactNode;
}

const BADGE_CLASSES = {
  success: "text-success",
  danger: "text-danger",
  warning: "text-warning",
};

export function MetricCard({
  label,
  value,
  badge,
  badgeVariant = "success",
  showPulse = false,
  icon,
}: MetricCardProps) {
  return (
    <div className="feature-card-glow group rounded-2xl border border-border bg-surface p-5 hover:border-brand/40">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-text-secondary">{label}</p>
        {icon ? <div className="icon-tile h-9 w-9">{icon}</div> : null}
      </div>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span className="text-2xl font-extrabold tracking-tight text-text-primary">{value}</span>
        <div className="flex items-center gap-2">
          {showPulse && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-soft-pulse rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand shadow-[0_0_10px_rgba(255,121,24,0.8)]" />
            </span>
          )}
          {badge && (
            <span className={`text-xs font-semibold ${BADGE_CLASSES[badgeVariant]}`}>{badge}</span>
          )}
        </div>
      </div>
    </div>
  );
}
