"use client";

import { useState, useMemo, useDeferredValue, startTransition } from "react";
import { Search } from "lucide-react";
import { UserTable } from "@/components/users/UserTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { USERS_PER_PAGE } from "@/lib/constants";
import { useAdminQuery, invalidateAdminQuery } from "@/lib/client/useAdminQuery";
import { useDebouncedValue } from "@/lib/client/debounce";
import type { User, UserStatus } from "@/lib/types/user";

type RoleFilter = "all" | "host" | "rider";
type UsersPayload = { users: User[]; total: number };

async function fetchUsers(): Promise<UsersPayload> {
  const response = await fetch("/api/admin/users", { credentials: "include" });
  if (!response.ok) throw new Error("Failed to load users");
  return (await response.json()) as UsersPayload;
}

function UsersSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading users">
      <Skeleton className="h-12 w-full" />
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { data, loading, mutate } = useAdminQuery<UsersPayload>({
    key: "users",
    fetcher: fetchUsers,
    refreshInterval: 60_000,
    staleTime: 15_000,
  });
  const users = data?.users ?? [];
  const totalUsersCount = data?.total ?? 0;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);
  const deferredSearch = useDeferredValue(debouncedSearch);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter === "host") list = list.filter((u) => u.role === "host");
    if (roleFilter === "rider") list = list.filter((u) => u.role === "rider");
    if (deferredSearch.trim()) {
      const q = deferredSearch.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [deferredSearch, roleFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const start = (page - 1) * USERS_PER_PAGE + 1;
  const end = Math.min(page * USERS_PER_PAGE, filteredUsers.length);
  const pagedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  async function handleStatusChange(userId: string, status: UserStatus) {
    setActionError(null);
    mutate((prev) => ({
      users: (prev?.users ?? []).map((u) => (u.id === userId ? { ...u, status } : u)),
      total: prev?.total ?? 0,
    }));
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status }),
    });
    const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
    if (!res.ok || !result.ok) {
      setActionError(result.error || "Could not update user.");
      invalidateAdminQuery("users");
      return;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Users</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage rider and host accounts from Firestore.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className="flex items-center gap-2 text-sm text-text-secondary">
              <span className="h-2 w-2 rounded-full bg-success" />
              {totalUsersCount.toLocaleString()} users
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search by username, email, or ID…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              startTransition(() => setPage(1));
            }}
            className="focus-ring w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "hosts", "riders"] as const).map((key) => {
            const label = key === "all" ? "All" : key === "hosts" ? "Hosts" : "Riders";
            const value: RoleFilter = key === "all" ? "all" : key === "hosts" ? "host" : "rider";
            const isActive = roleFilter === value;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setRoleFilter(value);
                  setPage(1);
                }}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-brand/40 bg-brand/15 text-brand"
                    : "border border-border bg-transparent text-text-primary hover:bg-surface/80"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {actionError && (
        <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{actionError}</p>
      )}

      {loading && !data ? (
        <UsersSkeleton />
      ) : (
        <>
          <UserTable users={pagedUsers} onStatusChange={handleStatusChange} />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-text-secondary">
              Showing {filteredUsers.length === 0 ? 0 : start}-{end} of {filteredUsers.length.toLocaleString()}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="focus-ring rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface disabled:opacity-50"
              >
                Prev
              </button>
              <span className="px-3 text-sm text-text-primary">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="focus-ring rounded-lg px-3 py-2 text-sm text-text-secondary hover:bg-surface disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
