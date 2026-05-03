"use client";

import { MoreHorizontal } from "lucide-react";
import type { User } from "@/lib/types/user";
import type { UserRole, UserStatus } from "@/lib/types/user";
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";

interface UserTableProps {
  users: User[];
}

function getInitials(username: string): string {
  const parts = username.split(/[_.-]/).filter(Boolean);
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

export function UserTable({ users }: UserTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-white">
            <th className="pb-3 pr-4 pt-4 pl-4">USERNAME</th>
            <th className="pb-3 pr-4 pt-4">ROLE</th>
            <th className="pb-3 pr-4 pt-4">STATUS</th>
            <th className="pb-3 pr-4 pt-4">JOIN DATE</th>
            <th className="pb-3 pl-4 pr-4 pt-4 text-right">ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/80 last:border-0">
              <td className="py-3 pr-4 pl-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white ${AVATAR_COLORS[user.avatarColor] ?? "bg-surface"}`}
                  >
                    {getInitials(user.username)}
                  </div>
                  <div>
                    <p className="font-medium text-white">{user.username}</p>
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
              <td className="py-3 pr-4 text-white">{user.joinDate}</td>
              <td className="py-3 pl-4 pr-4 text-right">
                <button
                  type="button"
                  className="focus-ring rounded p-1.5 text-text-secondary hover:bg-border hover:text-white"
                  aria-label="Actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
