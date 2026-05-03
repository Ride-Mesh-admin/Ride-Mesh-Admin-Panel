"use client";

import { X, Mail, FileText } from "lucide-react";
import type { RideDetail } from "@/lib/types/ride";

interface RideDetailPanelProps {
  ride: RideDetail | null;
  onClose: () => void;
}

export function RideDetailPanel({ ride, onClose }: RideDetailPanelProps) {
  if (!ride) return null;

  const reportCount = ride.reportCount;

  return (
    <div className="flex h-full flex-col border-l border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="font-bold text-white">RIDE DETAILS</h2>
        <button
          type="button"
          onClick={onClose}
          className="focus-ring rounded p-2 text-text-secondary hover:bg-border hover:text-white"
          aria-label="Close panel"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Ride summary card */}
        <div className="rounded-lg border border-border bg-background p-4">
          <div className="mb-3 flex items-start justify-between gap-2">
            {ride.riskLevel === "high" && (
              <span className="inline-flex rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-medium text-danger">
                HIGH RISK
              </span>
            )}
            <span className="text-xs text-text-secondary">{ride.rideId}</span>
          </div>
          <h3 className="mb-2 text-lg font-bold text-white">{ride.title}</h3>
          <p className="mb-4 text-sm text-text-secondary">{ride.description}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded border border-border bg-surface/50 p-2">
              <p className="text-xs text-text-secondary">Pickup</p>
              <p className="text-sm font-medium text-white">{ride.pickup}</p>
            </div>
            <div className="rounded border border-border bg-surface/50 p-2">
              <p className="text-xs text-text-secondary">Dropoff</p>
              <p className="text-sm font-medium text-white">{ride.dropoff}</p>
            </div>
          </div>
        </div>

        {/* Report logs */}
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-text-secondary" />
            <h4 className="font-bold text-white">REPORT LOGS ({reportCount})</h4>
          </div>
          {ride.reportLogs.length > 0 ? (
            <ul className="space-y-3">
              {ride.reportLogs.map((log) => (
                <li
                  key={log.id}
                  className="rounded-lg border border-border bg-background p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-white">{log.title}</p>
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

        {/* Host reputation */}
        <div className="mt-6">
          <h4 className="mb-3 font-bold text-white">HOST REPUTATION</h4>
          <div className="rounded-lg border border-border bg-background p-4">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Member since</dt>
                <dd className="font-medium text-white">{ride.hostReputation.memberSince}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Rides hosted</dt>
                <dd className="font-medium text-white">{ride.hostReputation.ridesHosted}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Past Warnings</dt>
                <dd className="font-medium text-white">{ride.hostReputation.pastWarnings}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 space-y-3">
          <button
            type="button"
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Mail className="h-4 w-4" />
            Send Warning to Host
          </button>
          <div className="flex gap-3">
            <button
              type="button"
              className="focus-ring flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text-secondary hover:bg-border/50"
            >
              Dismiss All
            </button>
            <button
              type="button"
              className="focus-ring flex-1 rounded-lg border border-danger/50 py-2.5 text-sm font-medium text-danger hover:bg-danger/10"
            >
              Cancel Ride
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
