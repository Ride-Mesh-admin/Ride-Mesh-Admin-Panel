"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Bell, Settings, User, CheckCircle2, Moon, Sun } from "lucide-react";
import { RideMeshIcon } from "@/components/layout/RideMeshIcon";
import { useAdminPanel } from "@/components/layout/AdminPanelProvider";

type PanelName = "notifications" | "settings" | "profile" | null;

export function Header() {
  const {
    notifications,
    unreadNotifications,
    settings,
    updateSettings,
    profile,
    updateProfile,
    markAllNotificationsAsRead,
    markNotificationAsRead,
  } = useAdminPanel();
  const [openPanel, setOpenPanel] = useState<PanelName>(null);
  const [profileDraft, setProfileDraft] = useState({ name: profile.name, email: profile.email });
  const [saved, setSaved] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setProfileDraft({ name: profile.name, email: profile.email });
  }, [profile.email, profile.name]);

  useEffect(() => {
    if (!openPanel) return;
    function handleClick(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpenPanel(null);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpenPanel(null);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openPanel]);

  const notificationButtonLabel = useMemo(() => {
    if (unreadNotifications === 0) return "Notifications";
    return `Notifications (${unreadNotifications} unread)`;
  }, [unreadNotifications]);

  function saveProfile() {
    const trimmedName = profileDraft.name.trim();
    const trimmedEmail = profileDraft.email.trim();
    if (!trimmedName || !trimmedEmail) return;
    const initials = trimmedName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
    updateProfile({ name: trimmedName, email: trimmedEmail, initials: initials || "AD", lastLogin: "Just now" });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand">
          <RideMeshIcon className="h-5 w-5 text-white" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-semibold text-text-primary">RideMesh Admin</p>
          <p className="text-xs text-text-secondary">Operations Console</p>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            placeholder="Global search for users, rides, or reports..."
            className="focus-ring w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-brand"
          />
        </div>
      </div>
      <div className="relative flex items-center gap-3" ref={panelRef}>
        <span className="flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
          <span className="h-2 w-2 rounded-full bg-success" />
          SYSTEMS NOMINAL
        </span>
        <button
          type="button"
          className="focus-ring relative rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white"
          aria-label={notificationButtonLabel}
          onClick={() => setOpenPanel((prev) => (prev === "notifications" ? null : "notifications"))}
        >
          <Bell className="h-5 w-5" />
          {unreadNotifications > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />}
        </button>
        <button
          type="button"
          className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white"
          aria-label="Settings"
          onClick={() => setOpenPanel((prev) => (prev === "settings" ? null : "settings"))}
        >
          <Settings className="h-5 w-5" />
        </button>
        <button
          type="button"
          className="focus-ring rounded-lg p-2 text-text-secondary hover:bg-surface hover:text-white"
          aria-label="Profile"
          onClick={() => setOpenPanel((prev) => (prev === "profile" ? null : "profile"))}
        >
          <User className="h-5 w-5" />
        </button>

        {openPanel === "notifications" && (
          <div className="absolute right-0 top-12 w-[22rem] rounded-xl border border-border bg-background p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
              <button
                type="button"
                onClick={markAllNotificationsAsRead}
                className="focus-ring text-xs text-brand hover:text-brand-dark"
              >
                Mark all as read
              </button>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {notifications.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markNotificationAsRead(item.id)}
                  className={`focus-ring w-full rounded-lg border p-3 text-left transition-colors ${
                    item.read ? "border-border bg-surface/50" : "border-brand/40 bg-brand/10"
                  }`}
                >
                  <p className="text-xs text-text-secondary">{item.timestamp}</p>
                  <p className="mt-1 text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">{item.message}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {openPanel === "settings" && (
          <div className="absolute right-0 top-12 w-[22rem] rounded-xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Admin Settings</h3>
            <div className="space-y-3">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-secondary">Theme</p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className={`focus-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      settings.theme === "light"
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => updateSettings({ theme: "light" })}
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </button>
                  <button
                    type="button"
                    className={`focus-ring flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                      settings.theme === "dark"
                        ? "border-brand bg-brand text-white"
                        : "border-border bg-surface text-text-secondary hover:text-text-primary"
                    }`}
                    onClick={() => updateSettings({ theme: "dark" })}
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </button>
                </div>
              </div>
              <label className="flex items-center justify-between text-sm text-text-primary">
                Email notifications
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(event) => updateSettings({ emailNotifications: event.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
              </label>
              <label className="flex items-center justify-between text-sm text-text-primary">
                Push notifications
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(event) => updateSettings({ pushNotifications: event.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
              </label>
              <label className="flex items-center justify-between text-sm text-text-primary">
                Safety escalations only
                <input
                  type="checkbox"
                  checked={settings.safetyEscalationsOnly}
                  onChange={(event) => updateSettings({ safetyEscalationsOnly: event.target.checked })}
                  className="h-4 w-4 accent-brand"
                />
              </label>
            </div>
          </div>
        )}

        {openPanel === "profile" && (
          <div className="absolute right-0 top-12 w-[22rem] rounded-xl border border-border bg-background p-4 shadow-2xl">
            <h3 className="mb-3 text-sm font-semibold text-text-primary">Admin Profile</h3>
            <div className="space-y-3">
              <div>
                <label htmlFor="admin-name" className="mb-1 block text-xs text-text-secondary">
                  Name
                </label>
                <input
                  id="admin-name"
                  value={profileDraft.name}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, name: event.target.value }))}
                  className="focus-ring w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <div>
                <label htmlFor="admin-email" className="mb-1 block text-xs text-text-secondary">
                  Email
                </label>
                <input
                  id="admin-email"
                  type="email"
                  value={profileDraft.email}
                  onChange={(event) => setProfileDraft((prev) => ({ ...prev, email: event.target.value }))}
                  className="focus-ring w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary"
                />
              </div>
              <p className="text-xs text-text-secondary">Role: {profile.role}</p>
              <button
                type="button"
                onClick={saveProfile}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save Profile
              </button>
              {saved && <p className="text-center text-xs text-success">Profile updated.</p>}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
