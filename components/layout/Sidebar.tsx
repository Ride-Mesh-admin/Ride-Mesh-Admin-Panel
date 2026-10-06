"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { useAdminPanel } from "@/components/layout/AdminPanelProvider";
import { adminLogoutAndRedirect } from "@/lib/client/adminLogout";
import {
  CalendarIcon,
  UsersIcon,
  VehicleIcon,
  SosIcon,
  SendIcon,
  MilesIcon,
} from "@/components/icons/AppIcons";

const ICONS = [CalendarIcon, UsersIcon, VehicleIcon, SosIcon, SendIcon, MilesIcon] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAdminPanel();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background-sidebar/95 backdrop-blur">
      <div className="flex h-16 items-center border-b border-border px-5">
        <div>
          <p className="text-sm font-extrabold tracking-[0.06em] text-text-primary">RIDE MESH</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Admin</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV_ITEMS.map((item, i) => {
          const Icon = ICONS[i];
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "brand-surface-glow bg-brand text-brand-contrast"
                  : "text-text-secondary hover:bg-brand-soft hover:text-brand"
              }`}
            >
              <Icon size={20} strokeWidth={1.85} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="feature-card-glow flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
          <div className="brand-surface-glow flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-brand-contrast">
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{profile.name}</p>
            <p className="truncate text-xs text-text-secondary">{profile.role}</p>
          </div>
          <button
            type="button"
            className="focus-ring rounded-lg p-1.5 text-text-secondary hover:bg-brand-soft hover:text-brand"
            aria-label="Log out"
            onClick={() => void adminLogoutAndRedirect()}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
