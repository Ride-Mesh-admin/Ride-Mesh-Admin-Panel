"use client";

import { useAdminPanel } from "@/components/layout/AdminPanelProvider";

export function Footer() {
  const { settings, unreadNotifications, profile } = useAdminPanel();

  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-xs text-text-secondary sm:px-6">
      <span>© 2026 RIDEMESH CORE SYSTEMS. ENCRYPTED SESSION ACTIVE.</span>
      <span>
        • {settings.theme.toUpperCase()} MODE • {unreadNotifications} Unread Alerts • {profile.lastLogin}
      </span>
    </footer>
  );
}
