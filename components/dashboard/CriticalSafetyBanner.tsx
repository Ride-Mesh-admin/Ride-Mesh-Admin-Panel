import { SosIcon } from "@/components/icons/AppIcons";
import type { CriticalAlert } from "@/lib/types/alert";

interface CriticalSafetyBannerProps {
  alert: CriticalAlert;
}

export function CriticalSafetyBanner({ alert }: CriticalSafetyBannerProps) {
  return (
    <div className="brand-surface-glow relative overflow-hidden rounded-2xl bg-brand px-6 py-5 text-brand-contrast">
      <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 left-16 h-32 w-32 rounded-full bg-brand-dark/40 blur-2xl" />
      <div className="relative flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
          <SosIcon size={26} className="text-brand-contrast" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-extrabold tracking-tight text-brand-contrast">{alert.title}</h2>
          <p className="text-sm text-brand-contrast/90">{alert.description}</p>
        </div>
        {alert.buttonLabel ? (
          <button
            type="button"
            className="focus-ring shrink-0 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand shadow-[0_0_18px_rgba(255,255,255,0.35)] hover:bg-white/95"
          >
            {alert.buttonLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
