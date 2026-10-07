"use client";

import { useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Ban, MoreHorizontal, ShieldCheck } from "lucide-react";
import type { User } from "@/lib/types/user";
import type { UserRole, UserStatus } from "@/lib/types/user";
import { USER_ROLE_CONFIG, USER_STATUS_CONFIG, AVATAR_COLORS } from "@/lib/constants";
import { UserAvatar } from "@/components/ui/UserAvatar";

interface UserTableProps {
  users: User[];
  onStatusChange?: (userId: string, status: UserStatus) => Promise<void> | void;
}

const ROW_HEIGHT = 64;

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
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
  });

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

  if (users.length === 0) {
    return (
      <div className="feature-card-glow rounded-2xl border border-border bg-surface px-4 py-10 text-center text-sm text-text-secondary">
        No users match this filter.
      </div>
    );
  }

  const useVirtual = users.length > 40;

  return (
    <div className="feature-card-glow overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="overflow-x-auto">
        <div className="min-w-[720px]">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] border-b border-border px-4 py-3 text-xs font-medium uppercase tracking-wider text-text-secondary">
            <span>Username</span>
            <span>Role</span>
            <span>Status</span>
            <span>Join date</span>
            <span className="text-right">Actions</span>
          </div>

          {useVirtual ? (
            <div ref={parentRef} className="max-h-[560px] overflow-y-auto">
              <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
                {virtualizer.getVirtualItems().map((item) => {
                  const user = users[item.index]!;
                  return (
                    <div
                      key={user.id}
                      className="absolute left-0 top-0 grid w-full grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-b border-border/80 px-4 hover:bg-background/40"
                      style={{ height: item.size, transform: `translateY(${item.start}px)` }}
                    >
                      <UserRow
                        user={user}
                        openId={openId}
                        busyId={busyId}
                        setOpenId={setOpenId}
                        changeStatus={changeStatus}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div>
              {users.map((user) => (
                <div
                  key={user.id}
                  className="grid grid-cols-[2fr_1fr_1fr_1fr_auto] items-center border-b border-border/80 px-4 py-3 last:border-0 hover:bg-background/40"
                >
                  <UserRow
                    user={user}
                    openId={openId}
                    busyId={busyId}
                    setOpenId={setOpenId}
                    changeStatus={changeStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function UserRow({
  user,
  openId,
  busyId,
  setOpenId,
  changeStatus,
}: {
  user: User;
  openId: string | null;
  busyId: string | null;
  setOpenId: (id: string | null | ((prev: string | null) => string | null)) => void;
  changeStatus: (user: User, status: UserStatus) => Promise<void>;
}) {
  return (
    <>
      <div className="flex items-center gap-3 py-2 pr-4">
        <UserAvatar
          name={user.username}
          photoURL={user.photoURL}
          className="h-10 w-10 rounded-xl"
          textClassName={`text-sm font-semibold ${(AVATAR_COLORS[user.avatarColor] ?? "bg-surface") === "bg-surface" ? "text-text-primary" : "text-brand-contrast"}`}
          fallbackClassName={AVATAR_COLORS[user.avatarColor] ?? "bg-surface"}
        />
        <div className="min-w-0">
          <p className="truncate font-medium text-text-primary">{user.username}</p>
          <p className="truncate text-xs text-text-secondary">{user.email}</p>
        </div>
      </div>
      <div className="pr-4">
        <RoleBadge role={user.role} />
      </div>
      <div className="pr-4">
        <StatusCell status={user.status} />
      </div>
      <div className="pr-4 text-text-primary">{user.joinDate}</div>
      <div className="relative py-2 pl-4 text-right">
        <button
          type="button"
          className="focus-ring rounded-lg p-1.5 text-text-secondary hover:bg-border hover:text-text-primary"
          aria-label="Actions"
          onClick={() => setOpenId((id) => (id === user.id ? null : user.id))}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {openId === user.id && (
          <div className="absolute right-0 top-10 z-20 w-48 rounded-xl border border-border bg-background p-1.5 shadow-xl">
            {user.status === "active" ? (
              <button
                type="button"
                disabled={busyId === user.id}
                onClick={() => void changeStatus(user, "suspended")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
              >
                <Ban className="h-4 w-4" />
                Suspend
              </button>
            ) : (
              <button
                type="button"
                disabled={busyId === user.id}
                onClick={() => void changeStatus(user, "active")}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-success hover:bg-success/10 disabled:opacity-50"
              >
                <ShieldCheck className="h-4 w-4" />
                Reactivate
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
