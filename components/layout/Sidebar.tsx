"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Car,
  AlertTriangle,
  FileText,
  LogOut,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { RideMeshIcon } from "@/components/layout/RideMeshIcon";
import { useAdminPanel } from "@/components/layout/AdminPanelProvider";

const ICONS = [LayoutDashboard, Users, Car, AlertTriangle, FileText] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { profile } = useAdminPanel();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border bg-background-sidebar">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand">
          <RideMeshIcon className="h-5 w-5 text-white" />
        </div>
        <span className="font-semibold text-text-primary">RideMesh Admin</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV_ITEMS.map((item, i) => {
          const Icon = ICONS[i];
          const isActive = pathname === item.href || (pathname === "/" && item.href === "/dashboard");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`focus-ring flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand text-white"
                  : "text-text-secondary hover:bg-surface hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge !== undefined && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-medium text-white">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
            {profile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary">{profile.name}</p>
            <p className="truncate text-xs text-text-secondary">{profile.role}</p>
          </div>
          <button
            type="button"
            className="focus-ring rounded p-1 text-text-secondary hover:bg-surface hover:text-white"
            aria-label="Log out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
