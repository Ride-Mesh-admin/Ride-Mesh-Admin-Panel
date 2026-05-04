"use client";

import { X, Check, Ban } from "lucide-react";
import type { RideDetail } from "@/lib/types/ride";

interface RideDetailPanelProps {
  ride: RideDetail | null;
  onClose: () => void;
  onModerate: (rideId: string, action: "approve" | "cancel") => void | Promise<void>;
  isModerating?: boolean;
}

export function RideDetailPanel({ ride, onClose, onModerate, isModerating }: RideDetailPanelProps) {
  if (!ride) return null;

  const reportCount = ride.reportCount;
  const disabled = Boolean(isModerating);

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-bold text-text-primary">RIDE DETAILS</h2>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-text-primary"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            {ride.riskLevel === "high" && (
              <span className="inline-flex rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-medium text-danger">
                HIGH RISK
              </span>
            )}
            <span className="text-xs text-text-secondary">{ride.rideId}</span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-text-primary">{ride.title}</h3>
          <p className="mb-4 text-sm text-text-secondary">{ride.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-border bg-surface/50 p-2">
              <p className="text-xs text-text-secondary">Pickup</p>
              <p className="text-sm font-medium text-text-primary">{ride.pickup}</p>
            </div>
            <div className="rounded border border-border bg-surface/50 p-2">
              <p className="text-xs text-text-secondary">Dropoff</p>
              <p className="text-sm font-medium text-text-primary">{ride.dropoff}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="mb-3 font-bold text-text-primary">REPORT LOGS ({reportCount})</h4>
          {ride.reportLogs.length > 0 ? (
            <ul className="space-y-3">
              {ride.reportLogs.map((log) => (
                <li key={log.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-text-primary">{log.title}</p>
                    <span className="shrink-0 text-xs text-text-secondary">{log.timestamp}</span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{log.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-text-secondary">No report logs.</p>
          )}
        </div>

        <div className="mt-6">
          <h4 className="mb-3 font-bold text-text-primary">HOST REPUTATION</h4>
          <div className="rounded-lg border border-border bg-background p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Member since</dt>
                <dd className="font-medium text-text-primary">{ride.hostReputation.memberSince}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Rides hosted</dt>
                <dd className="font-medium text-text-primary">{ride.hostReputation.ridesHosted}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Past Warnings</dt>
                <dd className="font-medium text-text-primary">{ride.hostReputation.pastWarnings}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onModerate(ride.id, "approve")}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-medium text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
          >
            <Check className="h-4 w-4" />
            Approve ride
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void onModerate(ride.id, "cancel")}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-danger/50 py-3 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            Cancel ride
          </button>
        </div>
      </div>
    </div>
  );
}
