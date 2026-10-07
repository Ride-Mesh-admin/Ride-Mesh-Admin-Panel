"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

const ROW_HEIGHT = 72;

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

function RideRow({
  ride,
  isSelected,
  busy,
  onSelectRide,
  onBlacklist,
}: {
  ride: RideListItem;
  isSelected: boolean;
  busy: boolean;
  onSelectRide: (id: string) => void;
  onBlacklist: (rideId: string) => void | Promise<void>;
}) {
  const blacklisted = ride.isBlacklisted || ride.status === "blacklisted";
  return (
    <>
      <div className="relative py-3 pl-4 pr-4" onClick={() => onSelectRide(ride.id)}>
        {isSelected && <span className="absolute bottom-0 left-0 top-0 w-1 rounded-l bg-brand" />}
        <div className="pl-1">
          <p className="font-medium text-text-primary">{ride.title}</p>
          <p className="text-xs text-text-secondary">
            ID: {ride.rideId} · Posted {ride.postedAgo}
          </p>
        </div>
      </div>
      <div className="py-3 pr-4" onClick={() => onSelectRide(ride.id)}>
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
      </div>
      <div className="py-3 pr-4" onClick={() => onSelectRide(ride.id)}>
        <SafetyCell ride={ride} />
      </div>
      <div className="py-3 pl-4 pr-4 text-right">
        {blacklisted ? (
          <span className="inline-flex rounded-full border border-danger/40 bg-danger/15 px-2.5 py-1 text-xs font-medium text-danger">
            Blacklisted
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation();
              void onBlacklist(ride.id);
            }}
            className="focus-ring inline-flex items-center gap-1 rounded-lg border border-danger/50 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            <Ban className="h-3.5 w-3.5" />
            Blacklist
          </button>
        )}
      </div>
    </>
  );
}

export function RideListTable({
  rides,
  selectedId,
  onSelectRide,
  onBlacklist,
  moderatingId,
}: RideListTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rides.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  if (rides.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface px-4 py-10 text-center text-sm text-text-secondary">
        No rides match this filter.
      </div>
    );
  }

  const useVirtual = rides.length > 35;

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[2fr_1.4fr_1.2fr_auto] border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            <span>Ride info</span>
            <span>Host</span>
            <span>Safety signals</span>
            <span className="text-right">Blacklist</span>
          </div>

          {useVirtual ? (
            <div ref={parentRef} className="max-h-[560px] overflow-y-auto">
              <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const ride = rides[item.index]!;
                  const isSelected = selectedId === ride.id;
                  return (
                    <div
                      key={ride.id}
                      className={`absolute left-0 top-0 grid w-full cursor-pointer grid-cols-[2fr_1.4fr_1.2fr_auto] items-center border-b border-border/80 transition-colors hover:bg-surface/80 ${isSelected ? "bg-brand/10" : ""}`}
                      style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                    >
                      <RideRow
                        ride={ride}
                        isSelected={isSelected}
                        busy={moderatingId === ride.id}
                        onSelectRide={onSelectRide}
                        onBlacklist={onBlacklist}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {rides.map((ride) => {
                const isSelected = selectedId === ride.id;
                return (
                  <div
                    key={ride.id}
                    className={`grid cursor-pointer grid-cols-[2fr_1.4fr_1.2fr_auto] items-center border-b border-border/80 transition-colors last:border-0 hover:bg-surface/80 ${isSelected ? "bg-brand/10" : ""}`}
                  >
                    <RideRow
                      ride={ride}
                      isSelected={isSelected}
                      busy={moderatingId === ride.id}
                      onSelectRide={onSelectRide}
                      onBlacklist={onBlacklist}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
