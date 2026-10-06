"use client";

import { Ban } from "lucide-react";
import type { RideListItem } from "@/lib/types/ride";
import { AVATAR_COLORS } from "@/lib/constants";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface RideCardGridProps {
  rides: RideListItem[];
  selectedId: string | null;
  onSelectRide: (id: string) => void;
  onBlacklist: (rideId: string) => void | Promise<void>;
  moderatingId?: string | null;
}

export function RideCardGrid({
  rides,
  selectedId,
  onSelectRide,
  onBlacklist,
  moderatingId,
}: RideCardGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rides.map((ride) => {
        const isSelected = selectedId === ride.id;
        const busy = moderatingId === ride.id;
        const blacklisted = ride.isBlacklisted || ride.status === "blacklisted";
        const { sosCount, helpCount, total } = ride.safetySignals;
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
            <div className="mb-3 min-w-0">
              <p className="font-medium text-text-primary">{ride.title}</p>
              <p className="text-xs text-text-secondary">
                ID: {ride.rideId} · Posted {ride.postedAgo}
              </p>
            </div>
            <div className="mb-3 flex items-center gap-3">
              <UserAvatar
                name={ride.hostName}
                photoURL={ride.hostPhotoURL}
                className="h-10 w-10 rounded-full"
                textClassName={`text-xs font-semibold ${(AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"}`}
                fallbackClassName={AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface"}
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary">{ride.hostName}</p>
                <p className="text-xs text-text-secondary">{ride.hostRating} ★</p>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-1.5">
              {total === 0 ? (
                <span className="text-xs text-text-secondary">No safety signals</span>
              ) : (
                <>
                  {sosCount > 0 ? (
                    <span className="inline-flex rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-medium text-danger">
                      {sosCount} SOS
                    </span>
                  ) : null}
                  {helpCount > 0 ? (
                    <span className="inline-flex rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-medium text-warning">
                      {helpCount} Help
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <div className="border-t border-border/80 pt-3" onClick={(e) => e.stopPropagation()}>
              {blacklisted ? (
                <span className="inline-flex w-full items-center justify-center rounded-lg border border-danger/40 bg-danger/15 py-2 text-sm font-medium text-danger">
                  Blacklisted
                </span>
              ) : (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onBlacklist(ride.id)}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-danger/50 py-2 text-sm font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  <Ban className="h-4 w-4" />
                  Blacklist ride
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
