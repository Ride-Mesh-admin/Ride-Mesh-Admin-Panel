"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ThemePreference = "dark" | "light";
type NotificationPriority = "critical" | "high" | "normal";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: NotificationPriority;
  read: boolean;
};

export type AdminSettings = {
  theme: ThemePreference;
  emailNotifications: boolean;
  pushNotifications: boolean;
  safetyEscalationsOnly: boolean;
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

const SETTINGS_KEY = "ridemesh_admin_settings";
const PROFILE_KEY = "ridemesh_admin_profile";
const NOTIFICATIONS_KEY = "ridemesh_admin_notifications";

const DEFAULT_SETTINGS: AdminSettings = {
  theme: "dark",
  emailNotifications: true,
  pushNotifications: true,
  safetyEscalationsOnly: false,
};

const DEFAULT_PROFILE: AdminProfile = {
  name: "Marcus Vane",
  role: "System Overseer",
  email: "marcus.vane@ridemesh.com",
  initials: "MV",
  lastLogin: "Today, 9:42 PM",
};

const DEFAULT_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "Critical SOS escalation",
    message: "Manual SOS triggered near Canal Road. Priority review required.",
    timestamp: "2m ago",
    priority: "critical",
    read: false,
  },
  {
    id: "notif-2",
    title: "Ride report threshold reached",
    message: "Ride #RM-9124 received 4 reports in the last hour.",
    timestamp: "14m ago",
    priority: "high",
    read: false,
  },
  {
    id: "notif-3",
    title: "User appeal updated",
    message: "A suspended host submitted additional identity documents.",
    timestamp: "38m ago",
    priority: "normal",
    read: true,
  },
];

const AdminPanelContext = createContext<AdminPanelContextValue | null>(null);

function applyTheme(theme: ThemePreference) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function AdminPanelProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [profile, setProfile] = useState<AdminProfile>(DEFAULT_PROFILE);
  const [notifications, setNotifications] = useState<AdminNotification[]>(DEFAULT_NOTIFICATIONS);

  useEffect(() => {
    try {
      const settingsRaw = window.localStorage.getItem(SETTINGS_KEY);
      const profileRaw = window.localStorage.getItem(PROFILE_KEY);
      const notificationsRaw = window.localStorage.getItem(NOTIFICATIONS_KEY);

      if (settingsRaw) {
        setSettings({ ...DEFAULT_SETTINGS, ...(JSON.parse(settingsRaw) as Partial<AdminSettings>) });
      }
      if (profileRaw) {
        setProfile({ ...DEFAULT_PROFILE, ...(JSON.parse(profileRaw) as Partial<AdminProfile>) });
      }
      if (notificationsRaw) {
        setNotifications(JSON.parse(notificationsRaw) as AdminNotification[]);
      }
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setProfile(DEFAULT_PROFILE);
      setNotifications(DEFAULT_NOTIFICATIONS);
    } finally {
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
    if (!ready) return;
    window.localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [ready, notifications]);

  const updateSettings = useCallback((updates: Partial<AdminSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateProfile = useCallback((updates: Partial<AdminProfile>) => {
    setProfile((prev) => ({ ...prev, ...updates }));
  }, []);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

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
