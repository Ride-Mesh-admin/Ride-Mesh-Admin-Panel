interface MetricCardProps {
  label: string;
  value: string | number;
  badge?: string;
  badgeVariant?: "success" | "danger" | "warning";
  showPulse?: boolean;
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
}: MetricCardProps) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-text-secondary">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <span className="text-2xl font-bold text-white">{value}</span>
        <div className="flex items-center gap-2">
          {showPulse && (
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-brand" />
            </span>
          )}
          {badge && (
            <span className={`text-xs font-medium ${BADGE_CLASSES[badgeVariant]}`}>
              {badge}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
