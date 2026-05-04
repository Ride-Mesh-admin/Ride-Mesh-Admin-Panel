"use client";

import { Check, Ban } from "lucide-react";
import type { RideListItem } from "@/lib/types/ride";
import type { RideStatus } from "@/lib/types/ride";
import { RIDE_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";

interface RideListTableProps {
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

export function RideListTable({
  rides,
  selectedId,
  onSelectRide,
  onModerate,
  moderatingId,
}: RideListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
            <th className="pb-3 pr-4 pt-4 pl-4">RIDE INFO</th>
            <th className="pb-3 pr-4 pt-4">HOST</th>
            <th className="pb-3 pr-4 pt-4">REPORTS</th>
            <th className="pb-3 pr-4 pt-4">STATUS</th>
            <th className="pb-3 pl-4 pr-4 pt-4 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => {
            const isSelected = selectedId === ride.id;
            const busy = moderatingId === ride.id;
            return (
              <tr
                key={ride.id}
                onClick={() => onSelectRide(ride.id)}
                className={`cursor-pointer border-b border-border/80 transition-colors last:border-0 hover:bg-surface/80 ${isSelected ? "bg-brand/10" : ""}`}
              >
                <td className="relative py-3 pr-4 pl-4">
                  {isSelected && <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l bg-brand" />}
                  <div className="pl-1">
                    <p className="font-medium text-text-primary">{ride.title}</p>
                    <p className="text-xs text-text-secondary">
                      ID: {ride.rideId} · Posted {ride.postedAgo}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${(AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"} ${AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface"}`}
                    >
                      {getInitials(ride.hostName)}
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">{ride.hostName}</p>
                      <p className="text-xs text-text-secondary">{ride.hostRating} ★</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  {ride.reportCount > 0 ? (
                    <span className="inline-flex rounded-full bg-danger/20 px-2.5 py-0.5 text-xs font-medium text-danger">
                      {ride.reportCount} Reports
                    </span>
                  ) : (
                    <span className="text-text-secondary">0</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <StatusBadge status={ride.status} />
                </td>
                <td className="py-3 pl-4 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onModerate(ride.id, "approve")}
                      className="focus-ring inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-medium text-brand-contrast hover:bg-brand-dark disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void onModerate(ride.id, "cancel")}
                      className="focus-ring inline-flex items-center gap-1 rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                    >
                      <Ban className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
