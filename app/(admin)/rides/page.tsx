"use client";

import { useState, useMemo, useCallback, useDeferredValue, useEffect } from "react";
import { Search, ChevronDown, List, LayoutGrid, RefreshCw } from "lucide-react";
import { RideListTable } from "@/components/rides/RideListTable";
import { RideCardGrid } from "@/components/rides/RideCardGrid";
import { RideDetailPanel } from "@/components/rides/RideDetailPanel";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminQuery, invalidateAdminQuery } from "@/lib/client/useAdminQuery";
import { useDebouncedValue } from "@/lib/client/debounce";
import type { RideStatus, RideListItem, RideDetail } from "@/lib/types/ride";

const STATUS_OPTIONS: { value: "all" | RideStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "under_review", label: "Under review" },
  { value: "active", label: "Active" },
  { value: "reported", label: "Reported" },
  { value: "flagged_ai", label: "Flagged (AI)" },
  { value: "blacklisted", label: "Blacklisted" },
  { value: "cancelled", label: "Cancelled" },
];

const EMPTY_STATS = { activeRides: 0, reported: 0, moderatorsOnline: 0 };

type RidesPayload = {
  rides: RideListItem[];
  detailsById: Record<string, RideDetail>;
  stats: { activeRides: number; reported: number; moderatorsOnline: number };
};

async function fetchRides(): Promise<RidesPayload> {
  const response = await fetch("/api/admin/rides", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load rides");
  return (await response.json()) as RidesPayload;
}

function RidesSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading rides">
      <div className="mb-6 flex gap-6">
        <Skeleton className="h-14 w-28" />
        <Skeleton className="h-14 w-28" />
        <Skeleton className="h-14 w-28" />
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}

export default function RidesPage() {
  const { data, loading, reload, mutate } = useAdminQuery<RidesPayload>({
    key: "rides",
    fetcher: fetchRides,
    refreshInterval: 60_000,
    staleTime: 12_000,
  });

  const rides = data?.rides ?? [];
  const rideDetails = data?.detailsById ?? {};
  const rideStats = data?.stats ?? EMPTY_STATS;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | RideStatus>("all");
  const [listView, setListView] = useState(true);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [queueRefreshing, setQueueRefreshing] = useState(false);
  const [lastQueueSyncAt, setLastQueueSyncAt] = useState<number | null>(null);
  const [queueRefreshError, setQueueRefreshError] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setLastQueueSyncAt(Date.now());
    setSelectedRideId((current) => {
      const ids = new Set(data.rides.map((r) => r.id));
      if (current && ids.has(current)) return current;
      return data.rides[0]?.id ?? null;
    });
  }, [data]);

  const refreshQueue = useCallback(async () => {
    setQueueRefreshing(true);
    setQueueRefreshError(null);
    try {
      invalidateAdminQuery("rides");
      await reload();
      setLastQueueSyncAt(Date.now());
    } catch {
      setQueueRefreshError("Network error — try again.");
    } finally {
      setQueueRefreshing(false);
    }
  }, [reload]);

  const handleBlacklist = useCallback(
    async (rideId: string) => {
      setModeratingId(rideId);
      mutate((prev) => ({
        rides: (prev?.rides ?? []).map((r) =>
          r.id === rideId ? { ...r, status: "blacklisted" as const, isBlacklisted: true } : r,
        ),
        detailsById: prev?.detailsById ?? {},
        stats: prev?.stats ?? EMPTY_STATS,
      }));
      try {
        const res = await fetch(`/api/admin/rides/${rideId}/moderate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ action: "blacklist" }),
        });
        if (!res.ok) {
          console.warn("Ride blacklist failed", await res.text());
          invalidateAdminQuery("rides");
          await reload();
        }
      } catch (e) {
        console.warn(e);
        invalidateAdminQuery("rides");
        await reload();
      } finally {
        setModeratingId(null);
      }
    },
    [mutate, reload],
  );

  const filteredRides = useMemo(() => {
    let list = rides;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.hostName.toLowerCase().includes(q) ||
          r.rideId.toLowerCase().includes(q),
      );
    }
    return list;
  }, [deferredSearch, statusFilter, rides]);

  const selectedDetail = selectedRideId ? rideDetails[selectedRideId] ?? null : null;

  if (loading && !data) {
    return (
      <div className="flex h-full flex-col">
        <RidesSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-text-secondary">ACTIVE RIDES</p>
            <p className="text-2xl font-bold text-text-primary">{rideStats.activeRides.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">WITH SAFETY SIGNALS</p>
            <p className="text-2xl font-bold text-text-primary">{rideStats.reported}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">MODERATORS ONLINE</p>
            <p className="text-2xl font-bold text-text-primary">{rideStats.moderatorsOnline}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            disabled={queueRefreshing || moderatingId !== null}
            onClick={() => void refreshQueue()}
            className="focus-ring flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-brand-contrast hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 shrink-0 ${queueRefreshing ? "animate-spin" : ""}`} aria-hidden />
            {queueRefreshing ? "Refreshing…" : "Refresh Queue"}
          </button>
          {lastQueueSyncAt !== null && (
            <p className="text-xs text-text-secondary">
              Last synced {new Date(lastQueueSyncAt).toLocaleTimeString(undefined, { timeStyle: "medium" })}
            </p>
          )}
          {queueRefreshError && (
            <p className="max-w-xs text-right text-xs text-danger" role="alert">
              {queueRefreshError}
            </p>
          )}
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search by ride title, host name, or ride ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | RideStatus)}
              className="focus-ring appearance-none rounded-lg border border-border bg-surface py-2.5 pl-4 pr-10 text-sm text-text-primary focus:border-brand"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          </div>
          <div className="flex rounded-lg border border-border bg-surface p-0.5">
            <button
              type="button"
              onClick={() => setListView(true)}
              className={`rounded-md p-2 ${listView ? "bg-brand text-brand-contrast" : "text-text-secondary hover:text-text-primary"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setListView(false)}
              className={`rounded-md p-2 ${!listView ? "bg-brand text-brand-contrast" : "text-text-secondary hover:text-text-primary"}`}
              aria-label="Cards view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex min-h-[480px] gap-0">
        <div className={`min-w-0 flex-1 ${selectedRideId ? "pr-0" : ""}`}>
          {listView ? (
            <RideListTable
              rides={filteredRides}
              selectedId={selectedRideId}
              onSelectRide={setSelectedRideId}
              onBlacklist={handleBlacklist}
              moderatingId={moderatingId}
            />
          ) : (
            <RideCardGrid
              rides={filteredRides}
              selectedId={selectedRideId}
              onSelectRide={setSelectedRideId}
              onBlacklist={handleBlacklist}
              moderatingId={moderatingId}
            />
          )}
        </div>
        {selectedRideId && (
          <div className="w-full shrink-0 md:w-[400px] lg:w-[420px]">
            <RideDetailPanel
              ride={selectedDetail}
              onClose={() => setSelectedRideId(null)}
              onBlacklist={handleBlacklist}
              isModerating={moderatingId === selectedRideId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
