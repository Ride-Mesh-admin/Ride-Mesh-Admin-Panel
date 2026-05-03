import { AlertTriangle } from "lucide-react";
import type { CriticalAlert } from "@/lib/types/alert";

interface CriticalSafetyBannerProps {
  alert: CriticalAlert;
}

export function CriticalSafetyBanner({ alert }: CriticalSafetyBannerProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg bg-brand/90 px-6 py-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10">
        <AlertTriangle className="h-7 w-7 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="font-bold text-white">{alert.title}</h2>
        <p className="text-sm text-white/90">{alert.description}</p>
      </div>
      <button
        type="button"
        className="focus-ring shrink-0 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-brand hover:bg-white/95"
      >
        {alert.buttonLabel}
      </button>
    </div>
  );
}
