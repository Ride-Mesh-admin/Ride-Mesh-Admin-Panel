"use client";

import { useState, useMemo } from "react";
import { useEffect } from "react";
import { Search, Plus, Bell, Filter } from "lucide-react";
import { UserTable } from "@/components/users/UserTable";
import { mockUsers, USERS_PER_PAGE } from "@/lib/mock/users";
import type { User } from "@/lib/types/user";

type RoleFilter = "all" | "host" | "rider";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [totalUsersCount, setTotalUsersCount] = useState<number>(mockUsers.length);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isMounted = true;
    async function loadUsers() {
      try {
        const response = await fetch("/api/admin/users", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { users: User[]; total: number };
        if (isMounted) {
          setUsers(payload.users);
          setTotalUsersCount(payload.total);
        }
      } catch {
        // Keep fallback.
      }
    }
    void loadUsers();
    const timer = window.setInterval(loadUsers, 45000);
    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const filteredUsers = useMemo(() => {
    let list = users;
    if (roleFilter === "host") list = list.filter((u) => u.role === "host");
    if (roleFilter === "rider") list = list.filter((u) => u.role === "rider");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.id.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, roleFilter, users]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));
  const start = (page - 1) * USERS_PER_PAGE + 1;
  const end = Math.min(page * USERS_PER_PAGE, filteredUsers.length);
  const pagedUsers = filteredUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">User Management</h1>
          <span className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="h-2 w-2 rounded-full bg-success" />
            LIVE: {totalUsersCount.toLocaleString()} USERS
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="focus-ring flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
          >
            <Plus className="h-4 w-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Search by username, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-text-secondary focus:border-brand"
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
                onClick={() => setRoleFilter(value)}
                className={`focus-ring rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-surface text-white border border-border"
                    : "border border-border bg-transparent text-white hover:bg-surface/80"
                }`}
              >
                {label}
              </button>
            );
          })}
          <button
            type="button"
            className="focus-ring flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-white hover:bg-border/50"
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <UserTable users={pagedUsers} />

      {/* Pagination */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-text-secondary">
          SHOWING {filteredUsers.length === 0 ? 0 : start}-{end} OF {filteredUsers.length.toLocaleString()} USERS
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white disabled:opacity-50 disabled:hover:bg-transparent"
            aria-label="Previous page"
          >
            <span className="sr-only">Previous</span>
            <span aria-hidden>&lt;</span>
          </button>
          <button
            type="button"
            onClick={() => setPage(1)}
            className={`focus-ring min-w-[2.25rem] rounded-lg py-2 px-2.5 text-sm font-medium ${
              page === 1 ? "bg-brand text-white" : "text-white hover:bg-surface"
            }`}
          >
            1
          </button>
          <button
            type="button"
            onClick={() => setPage(2)}
            className={`focus-ring min-w-[2.25rem] rounded-lg py-2 px-2.5 text-sm font-medium ${
              page === 2 ? "bg-brand text-white" : "text-white hover:bg-surface"
            }`}
          >
            2
          </button>
          <button
            type="button"
            onClick={() => setPage(3)}
            className={`focus-ring min-w-[2.25rem] rounded-lg py-2 px-2.5 text-sm font-medium ${
              page === 3 ? "bg-brand text-white" : "text-white hover:bg-surface"
            }`}
          >
            3
          </button>
          <span className="px-2 text-text-secondary">...</span>
          <button
            type="button"
            onClick={() => setPage(totalPages)}
            className={`focus-ring min-w-[2.25rem] rounded-lg py-2 px-2.5 text-sm font-medium ${
              page === totalPages ? "bg-brand text-white" : "text-white hover:bg-surface"
            }`}
          >
            {totalPages}
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white disabled:opacity-50 disabled:hover:bg-transparent"
            aria-label="Next page"
          >
            <span className="sr-only">Next</span>
            <span aria-hidden>&gt;</span>
          </button>
        </div>
      </div>
    </div>
  );
}
