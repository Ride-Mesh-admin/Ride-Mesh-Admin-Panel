"use client";

import { X, Phone } from "lucide-react";
import type { IncidentDetails } from "@/lib/types/safety";

interface IncidentDetailsPanelProps {
  details: IncidentDetails | null;
  onClose: () => void;
}

export function IncidentDetailsPanel({ details, onClose }: IncidentDetailsPanelProps) {
  if (!details) return null;

  const { vehicleTelemetry, emergencyContacts } = details;

  return (
    <div className="absolute bottom-4 right-4 w-full max-w-sm rounded-lg border border-border bg-surface/95 shadow-xl backdrop-blur sm:max-w-md">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="font-bold text-white">INCIDENT DETAILS</h3>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded p-1.5 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="space-y-4 px-4 py-4">
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
            VEHICLE TELEMETRY
          </h4>
          <ul className="space-y-1 text-sm text-white">
            <li>Current Speed: {vehicleTelemetry.currentSpeed}</li>
            {vehicleTelemetry.gForceSpike && (
              <li className="text-danger">G-Force Spike: {vehicleTelemetry.gForceSpike}</li>
            )}
          </ul>
        </div>
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-text-secondary">
            EMERGENCY CONTACTS
          </h4>
          <ul className="space-y-2">
            {emergencyContacts.map((c) => (
              <li key={c.phone} className="flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium text-white">{c.name}</p>
                  <p className="text-xs text-text-secondary">{c.relation} • {c.phone}</p>
                </div>
                <button
                  type="button"
                  className="focus-ring shrink-0 rounded-full bg-brand p-2 text-white hover:bg-brand-dark"
                  aria-label={`Call ${c.name}`}
                >
                  <Phone className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            className="focus-ring flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-white hover:bg-surface"
          >
            VIEW TRIP HISTORY
          </button>
          <button
            type="button"
            className="focus-ring flex-1 rounded-lg border border-border bg-background py-2.5 text-sm font-medium text-white hover:bg-surface"
          >
            EXPORT LOG
          </button>
        </div>
      </div>
    </div>
  );
}
