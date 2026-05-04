"use client";

import { Check, Ban } from "lucide-react";
import type { RideListItem } from "@/lib/types/ride";
import type { RideStatus } from "@/lib/types/ride";
import { RIDE_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";

interface RideCardGridProps {
  rides: RideListItem[];
  selectedId: string | null;
  onSelectRide: (id: string) => void;
  onModerate: (rideId: string, action: "approve" | "cancel") => void | Promise<void>;
  moderatingId?: string | null;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: RideStatus }) {
  const config = RIDE_STATUS_CONFIG[status];
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function RideCardGrid({
  rides,
  selectedId,
  onSelectRide,
  onModerate,
  moderatingId,
}: RideCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rides.map((ride) => {
        const isSelected = selectedId === ride.id;
        const busy = moderatingId === ride.id;
        return (
          <div
            key={ride.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectRide(ride.id)}
            onKeyDown={(e) => e.key === "Enter" && onSelectRide(ride.id)}
            className={`focus-ring cursor-pointer rounded-lg border p-4 transition-colors ${
              isSelected ? "border-brand bg-brand/10" : "border-border bg-surface hover:border-border/80"
            }`}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-text-primary">{ride.title}</p>
                <p className="text-xs text-text-secondary">
                  ID: {ride.rideId} · Posted {ride.postedAgo}
                </p>
              </div>
              <StatusBadge status={ride.status} />
            </div>
            <div className="mb-3 flex items-center gap-3">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${(AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"} ${AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface"}`}
              >
                {getInitials(ride.hostName)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{ride.hostName}</p>
                <p className="text-xs text-text-secondary">{ride.hostRating} ★</p>
              </div>
            </div>
            <div className="mb-4 flex items-center justify-between">
              {ride.reportCount > 0 ? (
                <span className="inline-flex rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-medium text-danger">
                  {ride.reportCount} Reports
                </span>
              ) : (
                <span className="text-xs text-text-secondary">0 reports</span>
              )}
            </div>
            <div className="flex flex-col gap-2 border-t border-border/80 pt-3" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onModerate(ride.id, "approve")}
                className="focus-ring flex items-center justify-center gap-2 rounded-lg bg-brand py-2 text-sm font-medium text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve ride
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void onModerate(ride.id, "cancel")}
                className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-danger/50 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Cancel ride
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
