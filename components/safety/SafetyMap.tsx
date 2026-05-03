"use client";

import { MapPin, Car, Plus, Minus, Layers, Compass, Crosshair } from "lucide-react";

interface SafetyMapProps {
  selectedAlertId: string | null;
}

export function SafetyMap({ selectedAlertId }: SafetyMapProps) {
  return (
    <div className="relative h-full min-h-[400px] w-full overflow-hidden rounded-lg border border-border bg-[#1e2a2a]">
      {/* Placeholder map background - dark muted style */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(circle at 30% 40%, #2a3a3a 0%, transparent 50%), radial-gradient(circle at 70% 60%, #253535 0%, transparent 45%)`,
        }}
      />
      {/* Grid hint */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {/* Mock labels */}
      <div className="absolute left-[15%] top-[25%] text-xs text-text-secondary/60">Mission District</div>
      <div className="absolute right-[20%] top-[35%] text-xs text-text-secondary/60">Twin Peaks</div>
      <div className="absolute left-[45%] bottom-[30%] text-xs text-text-secondary/60">Downtown</div>
      <div className="absolute right-[25%] bottom-[25%] text-xs text-text-secondary/60">Golden Gate Park</div>

      {/* Markers */}
      <div className="absolute left-[35%] top-[40%] flex flex-col items-center">
        <div className="rounded-full bg-brand p-1.5 shadow-lg">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="mt-1 rounded bg-surface/90 px-2 py-0.5 text-xs text-white shadow">Marcus Henderson [SOS]</span>
      </div>
      <div className="absolute right-[40%] top-[30%] flex flex-col items-center">
        <div className="rounded-full bg-brand p-1.5 shadow-lg">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="mt-1 rounded bg-surface/90 px-2 py-0.5 text-xs text-white shadow">Sarah J.</span>
      </div>
      <div className="absolute left-[50%] top-[55%] flex flex-col items-center">
        <div className="rounded-full bg-blue-500 p-1.5 shadow-lg">
          <Car className="h-4 w-4 text-white" />
        </div>
        <span className="mt-1 rounded bg-surface/90 px-2 py-0.5 text-xs text-white shadow">UNIT EN ROUTE</span>
      </div>
      <div className="absolute right-[30%] bottom-[40%] flex flex-col items-center">
        <div className="rounded-full bg-surface border border-border p-1.5">
          <MapPin className="h-4 w-4 text-text-secondary" />
        </div>
        <span className="mt-1 text-xs text-text-secondary">Golden Gate Park</span>
      </div>

      {/* Map controls - top right */}
      <div className="absolute right-3 top-3 flex flex-col gap-1 rounded-lg border border-border bg-surface/90 p-1">
        <button
          type="button"
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute right-3 top-24 flex flex-col gap-1 rounded-lg border border-border bg-surface/90 p-1">
        <button
          type="button"
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Layers"
        >
          <Layers className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Compass"
        >
          <Compass className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Recenter"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
