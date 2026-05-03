"use client";

import { Eye, AlertTriangle, Ban } from "lucide-react";
import type { RideListItem } from "@/lib/types/ride";
import type { RideStatus } from "@/lib/types/ride";
import { RIDE_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";

interface RideListTableProps {
  rides: RideListItem[];
  selectedId: string | null;
  onSelectRide: (id: string) => void;
}

function getInitials(name: string): string {
  const parts = name.split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function StatusBadge({ status }: { status: RideStatus }) {
  const config = RIDE_STATUS_CONFIG[status];
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${config.color}`}
    >
      {config.label}
    </span>
  );
}

export function RideListTable({
  rides,
  selectedId,
  onSelectRide,
}: RideListTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
            <th className="w-10 pb-3 pl-4 pr-2 pt-4">
              <input type="checkbox" className="rounded border-border bg-surface" aria-label="Select all" />
            </th>
            <th className="pb-3 pr-4 pt-4">RIDE INFO</th>
            <th className="pb-3 pr-4 pt-4">HOST</th>
            <th className="pb-3 pr-4 pt-4">REPORTS</th>
            <th className="pb-3 pr-4 pt-4">STATUS</th>
            <th className="pb-3 pl-4 pr-4 pt-4 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {rides.map((ride) => {
            const isSelected = selectedId === ride.id;
            return (
              <tr
                key={ride.id}
                onClick={() => onSelectRide(ride.id)}
                className={`cursor-pointer border-b border-border/80 transition-colors last:border-0 hover:bg-surface/80 ${isSelected ? "bg-brand/10" : ""}`}
              >
                <td className="w-10 py-3 pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" className="rounded border-border bg-surface" aria-label={`Select ${ride.title}`} />
                </td>
                <td className="relative py-3 pr-4 pl-4">
                  {isSelected && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l bg-brand" />
                  )}
                  <div className="pl-1">
                    <p className="font-medium text-white">{ride.title}</p>
                    <p className="text-xs text-text-secondary">
                      ID: {ride.rideId} · Posted {ride.postedAgo}
                    </p>
                  </div>
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ${AVATAR_COLORS[ride.hostAvatarColor] ?? "bg-surface"}`}
                    >
                      {getInitials(ride.hostName)}
                    </div>
                    <div>
                      <p className="font-medium text-white">{ride.hostName}</p>
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
                  <div className="flex justify-end gap-1">
                    <button type="button" className="focus-ring rounded-full p-2 text-text-secondary hover:bg-border hover:text-white" aria-label="View">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button type="button" className="focus-ring rounded-full p-2 text-text-secondary hover:bg-border hover:text-warning" aria-label="Flag">
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                    <button type="button" className="focus-ring rounded-full p-2 text-text-secondary hover:bg-border hover:text-danger" aria-label="Ban">
                      <Ban className="h-4 w-4" />
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
