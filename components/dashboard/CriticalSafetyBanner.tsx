import { AlertTriangle } from "lucide-react";
import type { CriticalAlert } from "@/lib/types/alert";

interface CriticalSafetyBannerProps {
  alert: CriticalAlert;
}

export function CriticalSafetyBanner({ alert }: CriticalSafetyBannerProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-brand/90 px-6 py-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <AlertTriangle className="h-7 w-7 text-brand-contrast" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-brand-contrast">{alert.title}</h2>
        <p className="text-sm text-brand-contrast opacity-90">{alert.description}</p>
      </div>
      {alert.buttonLabel ? (
        <button
          type="button"
          className="focus-ring shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-white/95"
        >
          {alert.buttonLabel}
        </button>
      ) : null}
    </div>
  );
}
