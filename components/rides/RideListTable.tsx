"use client";

import { Ban } from "lucide-react";
import type { RideListItem } from "@/lib/types/ride";
import { AVATAR_COLORS } from "@/lib/constants";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface RideListTableProps {
  rides: RideListItem[];
  selectedId: string | null;
  onSelectRide: (id: string) => void;
  onBlacklist: (rideId: string) => void | Promise<void>;
  moderatingId?: string | null;
}

function SafetyCell({ ride }: { ride: RideListItem }) {
  const { sosCount, helpCount, total } = ride.safetySignals;
  if (total === 0) {
    return <span className="text-text-secondary">None</span>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}

export function RideListTable({
  rides,
  selectedId,
  onSelectRide,
  onBlacklist,
  moderatingId,
}: RideListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
            <th className="pb-3 pr-4 pt-4 pl-4">Ride info</th>
            <th className="pb-3 pr-4 pt-4">Host</th>
            <th className="pb-3 pr-4 pt-4">Safety signals</th>
            <th className="pb-3 pl-4 pr-4 pt-4 text-right">Blacklist</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => {
            const isSelected = selectedId === ride.id;
            const busy = moderatingId === ride.id;
            const blacklisted = ride.isBlacklisted || ride.status === "blacklisted";
            return (
              <tr
                key={ride.id}
                onClick={() => onSelectRide(ride.id)}
                className={`cursor-pointer border-b border-border/80 transition-colors last:border-0 hover:bg-surface/80 ${isSelected ? "bg-brand/10" : ""}`}
              >
                <td className="relative py-3 pr-4 pl-4">
                  {isSelected && <span className="absolute bottom-0 left-0 top-0 w-1 rounded-l bg-brand" />}
                  <div className="pl-1">
                    <p className="font-medium text-text-primary">{ride.title}</p>
                    <p className="text-xs text-text-secondary">
                      ID: {ride.rideId} · Posted {ride.postedAgo}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      name={ride.hostName}
                      photoURL={ride.hostPhotoURL}
                      className="h-8 w-8 rounded-full"
                      textClassName={`text-xs font-semibold ${(AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"}`}
                      fallbackClassName={AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface"}
                    />
                    <div>
                      <p className="font-medium text-text-primary">{ride.hostName}</p>
                      <p className="text-xs text-text-secondary">{ride.hostRating} ★</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <SafetyCell ride={ride} />
                </td>
                <td className="py-3 pl-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  {blacklisted ? (
                    <span className="inline-flex rounded-full border border-danger/40 bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger">
                      Blacklisted
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onBlacklist(ride.id)}
                      className="focus-ring inline-flex items-center gap-1 rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Blacklist
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
