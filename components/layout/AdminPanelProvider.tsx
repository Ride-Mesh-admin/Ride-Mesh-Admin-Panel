"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AdminNotification, AdminNotificationFeedItem } from "@/lib/types/adminNotifications";

export type { AdminNotification } from "@/lib/types/adminNotifications";

type ThemePreference = "dark" | "light";

export type AdminSettings = {
  theme: ThemePreference;
  pushNotifications: boolean;
};

export type AdminProfile = {
  name: string;
  role: string;
  email: string;
  initials: string;
  lastLogin: string;
};

type AdminPanelContextValue = {
  ready: boolean;
  settings: AdminSettings;
  profile: AdminProfile;
  notifications: AdminNotification[];
  unreadNotifications: number;
  updateSettings: (updates: Partial<AdminSettings>) => void;
  updateProfile: (updates: Partial<AdminProfile>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
};

const SETTINGS_KEY = "ridemesh_admin_settings_v2";
const PROFILE_KEY = "ridemesh_admin_profile_v2";
const LEGACY_PROFILE_KEY = "ridemesh_admin_profile";
const READ_IDS_KEY = "ridemesh_admin_notification_reads_v2";
const PUSH_SEEN_SESSION = "ridemesh_admin_push_seen_ids";
const LEGACY_NOTIFICATIONS_KEY = "ridemesh_admin_notifications";

const DEFAULT_SETTINGS: AdminSettings = {
  theme: "light",
  pushNotifications: false,
};

const DEFAULT_PROFILE: AdminProfile = {
  name: "K Patterson",
  role: "System Overseer",
  email: "Kristopher@ridemesh.app",
  initials: "KP",
  lastLogin: "Today, 9:42 PM",
};

const AdminPanelContext = createContext<AdminPanelContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

function normalizeProfileFromStorage(partial: Partial<AdminProfile>): AdminProfile {
  const merged: AdminProfile = { ...DEFAULT_PROFILE, ...partial };
  const legacyMarcus =
    merged.name.trim().toLowerCase() === "marcus vane" ||
    merged.email.trim().toLowerCase() === "marcus.vane@ridemesh.com";
  if (legacyMarcus) {
    return {
      ...merged,
      name: DEFAULT_PROFILE.name,
      email: DEFAULT_PROFILE.email,
      initials: DEFAULT_PROFILE.initials,
    };
  }
  return merged;
}

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(READ_IDS_KEY);
    const arr = JSON.parse(raw || "[]") as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveReadIds(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids]));
}

function loadPushSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const arr = JSON.parse(window.sessionStorage.getItem(PUSH_SEEN_SESSION) || "[]") as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function savePushSeen(ids: Set<string>) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PUSH_SEEN_SESSION, JSON.stringify([...ids].slice(-400)));
}

export function AdminPanelProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const feedCacheRef = useRef<AdminNotificationFeedItem[]>([]);
  const readIdsRef = useRef<Set<string>>(new Set());

  const mergeFeedToNotifications = useCallback((): AdminNotification[] => {
    const reads = readIdsRef.current;
    return feedCacheRef.current.map((it) => ({
      id: it.id,
      title: it.title,
      message: it.message,
      timestamp: it.timestamp,
      priority: it.priority,
      read: reads.has(it.id),
      createdAtMs: it.createdAtMs,
    }));
  }, []);

  useEffect(() => {
    try {
      const settingsRaw = window.localStorage.getItem(SETTINGS_KEY);
      const profileRaw = window.localStorage.getItem(PROFILE_KEY);

      window.localStorage.removeItem(LEGACY_PROFILE_KEY);
      window.localStorage.removeItem(LEGACY_NOTIFICATIONS_KEY);

      if (settingsRaw) {
        const p = JSON.parse(settingsRaw) as Partial<AdminSettings> & Record<string, unknown>;
        setSettings({
          theme: p.theme === "light" ? "light" : "dark",
          pushNotifications: Boolean(p.pushNotifications),
        });
      }
      if (profileRaw) {
        setProfile(normalizeProfileFromStorage(JSON.parse(profileRaw) as Partial<AdminProfile>));
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setProfile(DEFAULT_PROFILE);
    } finally {
      readIdsRef.current = loadReadIds();
      setReady(true);
    }
  }, []);

  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [ready, settings]);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }, [ready, profile]);

  useEffect(() => {
    if (!ready || !settings.pushNotifications || typeof Notification === "undefined") return;
    if (Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [ready, settings.pushNotifications]);

  useEffect(() => {
    if (!ready) return;
    readIdsRef.current = loadReadIds();

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/admin/notifications-feed", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { items: AdminNotificationFeedItem[] };
        feedCacheRef.current = data.items;
        const pushOn = settingsRef.current.pushNotifications;

        if (pushOn && typeof Notification !== "undefined" && Notification.permission === "granted") {
          const seen = loadPushSeen();
          for (const it of data.items) {
            if (!seen.has(it.id)) {
              seen.add(it.id);
              try {
                new Notification(it.title, { body: it.message, tag: it.id });
              } catch {
                /* ignore */
              }
            }
          }
          savePushSeen(seen);
          setNotifications([]);
        } else {
          setNotifications(mergeFeedToNotifications());
        }
      } catch {
        if (!cancelled) {
          feedCacheRef.current = [];
          setNotifications([]);
        }
      }
    }

    void poll();
    const timer = window.setInterval(poll, 25000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [ready, settings.pushNotifications, mergeFeedToNotifications]);

  const updateSettings = useCallback((updates: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateProfile = useCallback((updates: Partial<AdminProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const markNotificationAsRead = useCallback(
    (id: string) => {
      readIdsRef.current.add(id);
      saveReadIds(readIdsRef.current);
      if (!settingsRef.current.pushNotifications) {
        setNotifications(mergeFeedToNotifications());
      }
    },
    [mergeFeedToNotifications],
  );

  const markAllNotificationsAsRead = useCallback(() => {
    feedCacheRef.current.forEach((it) => readIdsRef.current.add(it.id));
    saveReadIds(readIdsRef.current);
    if (!settingsRef.current.pushNotifications) {
      setNotifications(mergeFeedToNotifications());
    }
  }, [mergeFeedToNotifications]);

  const unreadNotifications = useMemo(
    () => notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0),
    [notifications],
  );

  const value = useMemo<AdminPanelContextValue>(
    () => ({
      ready,
      settings,
      profile,
      notifications,
      unreadNotifications,
      updateSettings,
      updateProfile,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    }),
    [
      ready,
      settings,
      profile,
      notifications,
      unreadNotifications,
      updateSettings,
      updateProfile,
      markNotificationAsRead,
      markAllNotificationsAsRead,
    ],
  );

  return <AdminPanelContext.Provider value={value}>{children}</AdminPanelContext.Provider>;
}

export function useAdminPanel() {
  const context = useContext(AdminPanelContext);
  if (!context) {
    throw new Error("useAdminPanel must be used within AdminPanelProvider");
  }
  return context;
}
