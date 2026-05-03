"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, ChevronDown, List, LayoutGrid, Bell, RefreshCw } from "lucide-react";
import { RideListTable } from "@/components/rides/RideListTable";
import { RideDetailPanel } from "@/components/rides/RideDetailPanel";
import { mockRidesList, mockRideDetails, RIDE_MOD_STATS } from "@/lib/mock/rides";
import type { RideStatus, RideListItem, RideDetail } from "@/lib/types/ride";

const STATUS_OPTIONS: { value: "all" | RideStatus; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "under_review", label: "Under Review" },
  { value: "active", label: "Active" },
  { value: "reported", label: "Reported" },
  { value: "flagged_ai", label: "Flagged (AI)" },
];

export default function RidesPage() {
  const [rides, setRides] = useState<RideListItem[]>(mockRidesList);
  const [rideDetails, setRideDetails] = useState<Record<string, RideDetail>>(mockRideDetails);
  const [rideStats, setRideStats] = useState(RIDE_MOD_STATS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | RideStatus>("all");
  const [listView, setListView] = useState(true);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(mockRidesList[0]?.id ?? null);

  useEffect(() => {
    let isMounted = true;
    async function loadRides() {
      try {
        const response = await fetch("/api/admin/rides", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          rides: RideListItem[];
          detailsById: Record<string, RideDetail>;
          stats: { activeRides: number; reported: number; moderatorsOnline: number };
        };
        if (isMounted) {
          setRides(payload.rides);
          setRideDetails(payload.detailsById);
          setRideStats(payload.stats);
          setSelectedRideId((current) => current ?? payload.rides[0]?.id ?? null);
        }
      } catch {
        // Keep fallback data.
      }
    }
    void loadRides();
    const timer = window.setInterval(loadRides, 45000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredRides = useMemo(() => {
    let list = rides;
    if (statusFilter !== "all") list = list.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.hostName.toLowerCase().includes(q) ||
          r.rideId.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, statusFilter, rides]);

  const selectedDetail = selectedRideId ? rideDetails[selectedRideId] ?? null : null;

  return (
    <div className="flex h-full flex-col">
      {/* Stats bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-xs text-text-secondary">ACTIVE RIDES</p>
            <p className="text-2xl font-bold text-white">{rideStats.activeRides.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-text-secondary">REPORTED</p>
            <p className="text-2xl font-bold text-white">{rideStats.reported}</p>
          </div>
          <div className="flex items-center gap-2">
            <div>
              <p className="text-xs text-text-secondary">MODERATORS ONLINE</p>
              <p className="text-2xl font-bold text-white">{rideStats.moderatorsOnline}</p>
            </div>
            <button
              type="button"
              className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </button>
          </div>
        </div>
        <button
          type="button"
          className="focus-ring flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Queue
        </button>
      </div>

      {/* Search and filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search by ride title, host name, or ride ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-secondary focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "all" | RideStatus)}
              className="focus-ring appearance-none rounded-lg border border-border bg-surface py-2.5 pl-4 pr-10 text-sm text-white focus:border-brand"
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
              className={`rounded-md p-2 ${listView ? "bg-brand text-white" : "text-text-secondary hover:text-white"}`}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setListView(false)}
              className={`rounded-md p-2 ${!listView ? "bg-brand text-white" : "text-text-secondary hover:text-white"}`}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main content: list + detail panel */}
      <div className="flex min-h-[480px] gap-0">
        <div className={`min-w-0 flex-1 ${selectedRideId ? "pr-0" : ""}`}>
          <RideListTable
            rides={filteredRides}
            selectedId={selectedRideId}
            onSelectRide={setSelectedRideId}
          />
        </div>
        {selectedRideId && (
          <div className="w-full shrink-0 md:w-[400px] lg:w-[420px]">
            <RideDetailPanel
              ride={selectedDetail}
              onClose={() => setSelectedRideId(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
