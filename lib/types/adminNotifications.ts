export type NotificationPriority = "critical" | "high" | "normal";

export type AdminNotification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  priority: NotificationPriority;
  read: boolean;
  createdAtMs?: number;
};

export type AdminNotificationFeedItem = Omit<AdminNotification, "read"> & {
  createdAtMs: number;
};
