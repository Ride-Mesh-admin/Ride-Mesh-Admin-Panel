"use client";

import { useState } from "react";
import { Ban, MoreHorizontal, ShieldCheck } from "lucide-react";
import type { User } from "@/lib/types/user";
import type { UserRole, UserStatus } from "@/lib/types/user";
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";

interface UserTableProps {
  users: User[];
  onStatusChange?: (userId: string, status: UserStatus) => Promise<void> | void;
}

function getInitials(username: string): string {
  const parts = username.split(/[_.-\s]/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return username.slice(0, 2).toUpperCase();
}

function RoleBadge({ role }: { role: UserRole }) {
  const config = USER_ROLE_CONFIG[role];
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

function StatusCell({ status }: { status: UserStatus }) {
  const config = USER_STATUS_CONFIG[status];
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${config.dotColor}`} />
      <span className={config.textColor}>{config.label}</span>
    </div>
  );
}

export function UserTable({ users, onStatusChange }: UserTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function changeStatus(user: User, status: UserStatus) {
    if (!onStatusChange) return;
    setBusyId(user.id);
    try {
      await onStatusChange(user.id, status);
      setOpenId(null);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="feature-card-glow overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-text-secondary">
            <th className="pb-3 pr-4 pt-4 pl-4">Username</th>
            <th className="pb-3 pr-4 pt-4">Role</th>
            <th className="pb-3 pr-4 pt-4">Status</th>
            <th className="pb-3 pr-4 pt-4">Join date</th>
            <th className="pb-3 pl-4 pr-4 pt-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/80 last:border-0 hover:bg-background/40">
              <td className="py-3 pr-4 pl-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${(AVATAR_COLORS[user.avatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"} ${AVATAR_COLORS[user.avatarColor] ?? "bg-surface"}`}
                  >
                    {getInitials(user.username)}
                  </div>
                  <div>
                    <p className="font-medium text-text-primary">{user.username}</p>
                    <p className="text-xs text-text-secondary">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4">
                <RoleBadge role={user.role} />
              </td>
              <td className="py-3 pr-4">
                <StatusCell status={user.status} />
              </td>
              <td className="py-3 pr-4 text-text-primary">{user.joinDate}</td>
              <td className="relative py-3 pl-4 pr-4 text-right">
                <button
                  type="button"
                  className="focus-ring rounded-lg p-1.5 text-text-secondary hover:bg-border hover:text-text-primary"
                  aria-label="Actions"
                  onClick={() => setOpenId((id) => (id === user.id ? null : user.id))}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {openId === user.id && (
                  <div className="absolute right-4 top-12 z-20 w-48 rounded-xl border border-border bg-background p-1.5 shadow-xl">
                    {user.status === "active" ? (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => void changeStatus(user, "suspended")}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
                      >
                        <Ban className="h-4 w-4" />
                        Suspend user
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === user.id}
                        onClick={() => void changeStatus(user, "active")}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-success hover:bg-success/10 disabled:opacity-50"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Reinstate user
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
