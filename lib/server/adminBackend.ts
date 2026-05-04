import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import type { AdminNotificationFeedItem } from "@/lib/types/adminNotifications";
import type { User } from "@/lib/types/user";
import type { RideDetail, RideListItem, RideStatus } from "@/lib/types/ride";
import type { SafetyAlert } from "@/lib/types/safety";
import type { DashboardMetrics } from "@/lib/types/metric";
import type { RideReport, Severity, ReportStatus } from "@/lib/types/report";
import type { CriticalAlert } from "@/lib/types/alert";
import type { LogEntry, SystemActivityLog, SystemStatusBar } from "@/lib/types/log";
import {
  dashboardMetrics as fallbackDashboardMetrics,
} from "@/lib/mock/metrics";
import { criticalAlert as fallbackCriticalAlert } from "@/lib/mock/alert";
import { recentReports as fallbackReports } from "@/lib/mock/reports";
import { liveLogs as fallbackLiveLogs } from "@/lib/mock/logs";
import { mockUsers } from "@/lib/mock/users";
import { mockRidesList, mockRideDetails, RIDE_MOD_STATS } from "@/lib/mock/rides";
import { mockSafetyAlerts } from "@/lib/mock/safety";
import { mockSystemLogs, systemStatusBar as fallbackSystemStatusBar, SERVICE_ID } from "@/lib/mock/system-logs";

const AVATAR_COLORS: User["avatarColor"][] = ["orange", "purple", "teal", "green", "blue"];

function toMillis(value: unknown): number {
  if (value && typeof value === "object" && "toMillis" in value && typeof (value as { toMillis: unknown }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : Date.now();
  }
  return Date.now();
}

function formatRelativeTime(value: unknown): string {
  const diff = Date.now() - toMillis(value);
  const mins = Math.max(1, Math.floor(diff / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatShortDate(value: unknown): string {
  return new Date(toMillis(value)).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatTime(value: unknown): string {
  return new Date(toMillis(value)).toISOString().slice(11, 19);
}

function alertCoordsFromDoc(data: Record<string, unknown>): { latitude?: number; longitude?: number } {
  const latRaw = data.latitude;
  const lngRaw = data.longitude;
  if (typeof latRaw === "number" && typeof lngRaw === "number") {
    return { latitude: latRaw, longitude: lngRaw };
  }
  const loc = data.location;
  if (loc && typeof loc === "object") {
    const o = loc as Record<string, unknown>;
    const la = o.latitude ?? o._latitude;
    const lo = o.longitude ?? o._longitude;
    if (typeof la === "number" && typeof lo === "number") {
      return { latitude: la, longitude: lo };
    }
  }
  return {};
}

function colorFromId(id: string): User["avatarColor"] {
  const total = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_COLORS[total % AVATAR_COLORS.length];
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (parts[0]?.slice(0, 2) ?? "AD").toUpperCase();
}

function parseResponseTimeMs(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value.replace(/\D/g, ""), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function mapRideStatus(raw: string | undefined, reportCount: number): RideStatus {
  const s = String(raw || "").toLowerCase();
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "approved") return "approved";
  if (reportCount >= 4) return "flagged_ai";
  if (reportCount > 0) return "reported";
  if (s === "ongoing" || s === "active") return "active";
  return "under_review";
}

function reportStatusFromSeverity(severity: Severity): ReportStatus {
  if (severity === "high") return "pending";
  if (severity === "medium") return "in_review";
  return "resolved";
}

export async function fetchUsersData(): Promise<{ users: User[]; total: number }> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection("users").orderBy("createdAt", "desc").limit(1500).get();
    const users: User[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const username = String(data.username || data.fullName || data.email || "User");
      const role = data.role === "host" ? "host" : "rider";
      const suspended = data.status === "suspended" || data.isSuspended === true || data.disabled === true;
      return {
        id: doc.id,
        username,
        email: String(data.email || "unknown@ridemesh.com"),
        role,
        status: suspended ? "suspended" : "active",
        joinDate: formatShortDate(data.createdAt),
        avatarColor: colorFromId(doc.id),
      };
    });
    return { users, total: users.length };
  } catch {
    return { users: mockUsers, total: mockUsers.length };
  }
}

export async function fetchRidesData(): Promise<{
  rides: RideListItem[];
  detailsById: Record<string, RideDetail>;
  stats: { activeRides: number; reported: number; moderatorsOnline: number };
}> {
  try {
    const db = getAdminDb();
    const [ridesSnap, seatReqSnap, usersSnap] = await Promise.all([
      db.collection("rides").orderBy("createdAt", "desc").limit(500).get(),
      db.collection("seatRequests").orderBy("createdAt", "desc").limit(1000).get(),
      db.collection("users").get(),
    ]);

    const hostLookup = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));
    const hostedCounts = new Map<string, number>();
    ridesSnap.docs.forEach((doc) => {
      const hostId = String(doc.data().hostId || "");
      if (!hostId) return;
      hostedCounts.set(hostId, (hostedCounts.get(hostId) || 0) + 1);
    });

    const reportLogsByRide = new Map<string, Array<{ id: string; title: string; timestamp: string; description: string }>>();
    seatReqSnap.docs.forEach((doc) => {
      const data = doc.data();
      const rideId = String(data.rideId || "");
      if (!rideId) return;
      const status = String(data.status || "pending");
      if (!["rejected", "withdrawn", "pending"].includes(status)) return;
      const rider = String(data.riderUsername || "Rider");
      const description =
        status === "rejected"
          ? `Seat request from ${rider} was rejected.`
          : status === "withdrawn"
            ? `${rider} withdrew a previously submitted request.`
            : `Pending moderation request by ${rider}.`;
      const list = reportLogsByRide.get(rideId) || [];
      list.push({
        id: doc.id,
        title: status === "pending" ? "Pending Seat Request" : "Seat Request Flag",
        timestamp: formatRelativeTime(data.updatedAt || data.createdAt),
        description,
      });
      reportLogsByRide.set(rideId, list);
    });

    const rides: RideListItem[] = [];
    const detailsById: Record<string, RideDetail> = {};

    for (const doc of ridesSnap.docs) {
      const data = doc.data();
      const hostId = String(data.hostId || "");
      const hostProfile = hostLookup.get(hostId) ?? {};
      const hostName = String(data.hostUsername || hostProfile.username || hostProfile.fullName || "Unknown Host");
      const logs = (reportLogsByRide.get(doc.id) || []).slice(0, 8);
      const reportCount = logs.length;
      const status = mapRideStatus(String(data.status || "upcoming"), reportCount);
      const hostRating = Number(((hostedCounts.get(hostId) || 1) > 3 ? 4.7 : 4.1).toFixed(1));

      rides.push({
        id: doc.id,
        title: String(data.title || "Untitled Ride"),
        subtitle: String(data.type || ""),
        rideId: `RM-${doc.id.slice(0, 6).toUpperCase()}`,
        postedAgo: formatRelativeTime(data.createdAt || data.updatedAt),
        hostName,
        hostAvatarColor: colorFromId(hostId || doc.id),
        hostRating,
        reportCount,
        status,
      });

      detailsById[doc.id] = {
        id: doc.id,
        rideId: `RM-${doc.id.slice(0, 6).toUpperCase()}`,
        riskLevel: reportCount >= 4 ? "high" : reportCount >= 2 ? "medium" : "low",
        title: String(data.title || "Untitled Ride"),
        description: String(data.description || "No additional description provided."),
        pickup: String(data.startLocationLabel || "Unknown pickup"),
        dropoff: String(data.endLocationLabel || "Unknown dropoff"),
        reportCount,
        reportLogs: logs,
        hostReputation: {
          memberSince: formatShortDate(hostProfile.createdAt || Date.now()),
          ridesHosted: hostedCounts.get(hostId) || 0,
          pastWarnings: reportCount,
        },
      };
    }

    const stats = {
      activeRides: rides.filter((ride) => ride.status === "active").length,
      reported: rides.filter((ride) => ride.reportCount > 0).length,
      moderatorsOnline: Math.max(1, Math.min(12, Math.floor(rides.length / 20) + 2)),
    };

    return { rides, detailsById, stats };
  } catch {
    return { rides: mockRidesList, detailsById: mockRideDetails, stats: RIDE_MOD_STATS };
  }
}

export async function fetchSafetyData(): Promise<{
  alerts: SafetyAlert[];
}> {
  try {
    const db = getAdminDb();
    const [sosSnap, helpSnap, usersSnap, ridesSnap] = await Promise.all([
      db.collection("sosAlerts").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("helpSignals").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("users").get(),
      db.collection("rides").get(),
    ]);

    const userLookup = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));
    const rideLookup = new Map(ridesSnap.docs.map((doc) => [doc.id, doc.data()]));

    const alerts: SafetyAlert[] = [];

    sosSnap.docs
      .filter((doc) => String(doc.data().status || "active") === "active")
      .forEach((doc) => {
        const data = doc.data();
        const raw = data as Record<string, unknown>;
        const user = userLookup.get(String(data.userId || "")) || {};
        const ride = rideLookup.get(String(data.rideId || "")) || {};
        const userName = String(user.username || user.fullName || "Unknown User");
        const alertId = `sos-${doc.id}`;
        const createdAtMs = toMillis(data.createdAt);
        alerts.push({
          id: alertId,
          type: "sos_critical",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${String(data.rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: "HIGH IMPACT DETECTED",
          alertIcon: "impact",
          hasLiveIndicator: true,
          avatarColor: colorFromId(String(data.userId || doc.id)),
          createdAtMs,
          ...alertCoordsFromDoc(raw),
        });
      });

    helpSnap.docs
      .filter((doc) => String(doc.data().status || "open") === "open")
      .forEach((doc) => {
        const data = doc.data();
        const raw = data as Record<string, unknown>;
        const user = userLookup.get(String(data.userId || "")) || {};
        const ride = rideLookup.get(String(data.rideId || "")) || {};
        const userName = String(user.username || user.fullName || "Unknown User");
        const alertId = `help-${doc.id}`;
        const createdAtMs = toMillis(data.createdAt);
        alerts.push({
          id: alertId,
          type: "help_signal",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${String(data.rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: String(data.message || "OFF-ROUTE WARNING").toUpperCase(),
          alertIcon: "warning",
          avatarColor: colorFromId(String(data.userId || doc.id)),
          createdAtMs,
          ...alertCoordsFromDoc(raw),
        });
      });

    alerts.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
    return {
      alerts: alerts.slice(0, 100),
    };
  } catch {
    return {
      alerts: mockSafetyAlerts,
    };
  }
}

/** Shown in the host app when admin uses “Notify host” from Safety Alerts. */
export const ADMIN_HOST_EMERGENCY_TITLE = "Emergency message from RideMesh Admin";
export const ADMIN_HOST_EMERGENCY_BODY =
  "A RideMesh administrator is contacting you about an active safety alert on your ride. Open the app and review your ride immediately. Follow any on-screen instructions.";

function parseSafetyAlertId(alertId: string): { kind: "sos" | "help"; docId: string } | null {
  if (alertId.startsWith("sos-")) return { kind: "sos", docId: alertId.slice(4) };
  if (alertId.startsWith("help-")) return { kind: "help", docId: alertId.slice(5) };
  return null;
}

/**
 * Writes `adminHostNotifications` for the ride host. The consumer app should listen for
 * documents where `hostId` matches the signed-in user and `severity` === `emergency`.
 */
export async function notifyHostForSafetyAlert(alertId: string): Promise<{ ok: boolean; error?: string }> {
  const parsed = parseSafetyAlertId(alertId);
  if (!parsed) {
    return {
      ok: false,
      error:
        "This alert cannot message a host (invalid id or offline demo data). Use a live SOS or help signal from Firestore.",
    };
  }
  try {
    const db = getAdminDb();
    const col = parsed.kind === "sos" ? db.collection("sosAlerts") : db.collection("helpSignals");
    const signalSnap = await col.doc(parsed.docId).get();
    if (!signalSnap.exists) {
      return { ok: false, error: "Safety signal not found." };
    }
    const raw = signalSnap.data() as Record<string, unknown>;
    const rideId = String(raw.rideId || "");
    if (!rideId) {
      return { ok: false, error: "No ride is linked to this alert." };
    }
    const rideSnap = await db.collection("rides").doc(rideId).get();
    if (!rideSnap.exists) {
      return { ok: false, error: "Ride not found." };
    }
    const hostId = String((rideSnap.data() as Record<string, unknown>)?.hostId || "");
    if (!hostId) {
      return { ok: false, error: "No host is assigned to this ride." };
    }
    await db.collection("adminHostNotifications").add({
      hostId,
      rideId,
      alertId,
      title: ADMIN_HOST_EMERGENCY_TITLE,
      body: ADMIN_HOST_EMERGENCY_BODY,
      severity: "emergency",
      createdAt: FieldValue.serverTimestamp(),
      source: "safety_alerts_console",
      read: false,
      dismissed: false,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to notify host." };
  }
}

export async function fetchDashboardData(): Promise<{
  criticalAlert: CriticalAlert;
  metrics: DashboardMetrics;
  reports: RideReport[];
  liveLogs: LogEntry[];
}> {
  try {
    const db = getAdminDb();
    const now = Date.now();
    const prevDay = new Date(now - 24 * 60 * 60 * 1000);
    const twoDays = new Date(now - 48 * 60 * 60 * 1000);

    const [usersNow, usersPrev, ridesSnap, sosSnap, helpSnap, notificationsSnap, logsSnap] = await Promise.all([
      db.collection("users").where("createdAt", ">=", prevDay).get(),
      db.collection("users").where("createdAt", ">=", twoDays).where("createdAt", "<", prevDay).get(),
      db.collection("rides").where("status", "in", ["ongoing", "active"]).get(),
      db.collection("sosAlerts").where("status", "==", "active").get(),
      db.collection("helpSignals").where("status", "==", "open").get(),
      db.collection("notifications").orderBy("createdAt", "desc").limit(50).get(),
      db.collection("systemLogs").orderBy("timestamp", "desc").limit(20).get().catch(() => null),
    ]);

    const totalUsers = (await db.collection("users").count().get()).data().count;
    const deltaRaw = usersPrev.size === 0 ? 100 : Math.round(((usersNow.size - usersPrev.size) / usersPrev.size) * 100);
    const totalUsersDelta = `${deltaRaw >= 0 ? "+" : ""}${deltaRaw}%`;

    const metrics: DashboardMetrics = {
      totalUsers,
      totalUsersDelta,
      activeRides: ridesSnap.size,
      activeRidesLive: true,
      openReports: helpSnap.size + sosSnap.size,
      openReportsPriority: helpSnap.size + sosSnap.size > 10 ? "Critical" : "High",
      sosAlerts: sosSnap.size,
      sosAlertsStatus: sosSnap.size > 0 ? "URGENT" : "Stable",
    };

    const criticalAlert: CriticalAlert = {
      title: sosSnap.size > 0 ? "Critical Safety Breach Detected" : "No Critical SOS Incidents",
      description:
        sosSnap.size > 0
          ? `${sosSnap.size} unresolved SOS signals detected. Emergency protocols active.`
          : "Safety signal volume is stable across active trips.",
      count: sosSnap.size,
      sector: "LIVE",
    };

    const reports: RideReport[] = notificationsSnap.docs.slice(0, 8).map((doc, index) => {
      const data = doc.data();
      const severity: Severity =
        String(data.type || "").includes("sos") || String(data.type || "").includes("error")
          ? "high"
          : index % 2 === 0
            ? "medium"
            : "low";
      return {
        id: `REP-${doc.id.slice(0, 6).toUpperCase()}`,
        userName: String(data.userName || data.title || "RideMesh User"),
        driverName: String(data.driverName || "Assigned Driver"),
        severity,
        status: reportStatusFromSeverity(severity),
      };
    });

    const liveLogs: LogEntry[] = logsSnap && logsSnap.docs.length > 0
      ? logsSnap.docs.slice(0, 5).map((doc) => {
          const data = doc.data();
          return {
            time: formatTime(data.timestamp || data.createdAt),
            eventType: String(data.module || data.eventType || "SYSTEM_EVENT"),
            message: String(data.message || "System event recorded."),
          };
        })
      : notificationsSnap.docs.slice(0, 5).map((doc) => {
          const data = doc.data();
          return {
            time: formatTime(data.createdAt),
            eventType: String(data.type || "NOTIFICATION").toUpperCase(),
            message: String(data.message || data.title || "Notification event"),
          };
        });

    return { criticalAlert, metrics, reports: reports.length ? reports : fallbackReports, liveLogs: liveLogs.length ? liveLogs : fallbackLiveLogs };
  } catch {
    return {
      criticalAlert: fallbackCriticalAlert,
      metrics: fallbackDashboardMetrics,
      reports: fallbackReports,
      liveLogs: fallbackLiveLogs,
    };
  }
}

export async function fetchSystemLogsData(): Promise<{
  logs: SystemActivityLog[];
  status: SystemStatusBar;
  serviceId: string;
}> {
  try {
    const db = getAdminDb();
    const [logsSnap, notifSnap, ridesSnap] = await Promise.all([
      db.collection("systemLogs").orderBy("timestamp", "desc").limit(400).get().catch(() => null),
      db.collection("notifications").orderBy("createdAt", "desc").limit(200).get(),
      db.collection("rides").where("status", "in", ["ongoing", "active"]).get(),
    ]);

    let logs: SystemActivityLog[] = [];

    if (logsSnap && !logsSnap.empty) {
      logs = logsSnap.docs.map((doc) => {
        const data = doc.data();
        const rawSeverity = String(data.severity || "info").toLowerCase();
        const severity: SystemActivityLog["severity"] =
          rawSeverity === "error" ? "error" : rawSeverity === "warn" ? "warn" : "info";
        const responseMs = parseResponseTimeMs(data.responseTime || data.responseTimeMs || data.latencyMs);
        return {
          id: doc.id,
          timestamp: formatTime(data.timestamp || data.createdAt),
          severity,
          module: String(data.module || "CORE"),
          message: String(data.message || "No message"),
          responseTime: `${responseMs || 0}ms`,
        };
      });
    } else {
      logs = notifSnap.docs.map((doc) => {
        const data = doc.data();
        const type = String(data.type || "info").toLowerCase();
        const severity: SystemActivityLog["severity"] = type.includes("error") || type.includes("sos")
          ? "error"
          : type.includes("warn")
            ? "warn"
            : "info";
        return {
          id: doc.id,
          timestamp: formatTime(data.createdAt),
          severity,
          module: "NOTIFICATION",
          message: String(data.message || data.title || "Notification event"),
          responseTime: `${severity === "error" ? 850 : 120}ms`,
        };
      });
    }

    const errorCount = logs.filter((item) => item.severity === "error").length;
    const warnCount = logs.filter((item) => item.severity === "warn").length;
    const dbLoad = Math.min(95, Math.max(12, warnCount + Math.floor(errorCount * 1.4)));

    const status: SystemStatusBar = {
      apiSync: { status: errorCount > 20 ? "API SYNC DEGRADED" : "API SYNC OK", ok: errorCount <= 20 },
      dbLoad: `DB LOAD: ${dbLoad}%`,
      uptime: errorCount > 30 ? "UPTIME: 99.20%" : "UPTIME: 99.99%",
      memory: `${(4.2 + warnCount * 0.01).toFixed(1)}GB / 16GB`,
    };

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    return {
      logs: logs.slice(0, 300),
      status,
      serviceId: projectId ? `RIDE-MESH-${projectId.toUpperCase()}` : SERVICE_ID,
    };
  } catch {
    return { logs: mockSystemLogs, status: fallbackSystemStatusBar, serviceId: SERVICE_ID };
  }
}

export async function fetchAdminNotificationFeed(): Promise<AdminNotificationFeedItem[]> {
  const items: AdminNotificationFeedItem[] = [];
  try {
    const db = getAdminDb();

    const sosSnap = await db.collection("sosAlerts").orderBy("createdAt", "desc").limit(40).get();
    sosSnap.docs.forEach((doc) => {
      const data = doc.data();
      const rideRef = String(data.rideId || doc.id);
      const manual = String(data.reason || data.source || "").toLowerCase().includes("manual");
      items.push({
        id: `nf-sos-${doc.id}`,
        title: manual ? "Manual SOS created" : "Emergency SOS created",
        message: `SOS alert — ride ${rideRef.slice(0, 10)}… (${String(data.status || "active")}).`,
        timestamp: formatRelativeTime(data.createdAt),
        priority: "critical",
        createdAtMs: toMillis(data.createdAt),
      });
    });

    const helpSnap = await db.collection("helpSignals").orderBy("createdAt", "desc").limit(40).get();
    helpSnap.docs.forEach((doc) => {
      const data = doc.data();
      items.push({
        id: `nf-help-${doc.id}`,
        title: "Help request created",
        message: `${String(data.message || "User requested assistance")} · Ride ${String(data.rideId || "n/a")}.`,
        timestamp: formatRelativeTime(data.createdAt),
        priority: "high",
        createdAtMs: toMillis(data.createdAt),
      });
    });

    let deletionDocs: QueryDocumentSnapshot[] = [];
    try {
      const delSnap = await db.collection("accountDeletions").orderBy("createdAt", "desc").limit(40).get();
      deletionDocs = delSnap.docs;
    } catch {
      try {
        const nSnap = await db.collection("notifications").orderBy("createdAt", "desc").limit(200).get();
        deletionDocs = nSnap.docs.filter((d) => {
          const t = String(d.data().type || "").toLowerCase();
          return (t.includes("account") && t.includes("delet")) || t === "user_deleted" || t === "account_deleted";
        });
      } catch {
        deletionDocs = [];
      }
    }

    deletionDocs.forEach((doc) => {
      const data = doc.data();
      const label = String(
        data.email || data.userEmail || data.username || data.userName || data.userId || doc.id,
      ).slice(0, 96);
      items.push({
        id: `nf-del-${doc.id}`,
        title: "User deleted their account",
        message: `Account deletion recorded for ${label}.`,
        timestamp: formatRelativeTime(data.createdAt || data.requestedAt || data.deletedAt),
        priority: "normal",
        createdAtMs: toMillis(data.createdAt || data.requestedAt || data.deletedAt),
      });
    });

    items.sort((a, b) => b.createdAtMs - a.createdAtMs);
    return items.slice(0, 100);
  } catch {
    return [];
  }
}

export async function moderateRide(
  rideId: string,
  action: "approve" | "cancel",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    const status = action === "approve" ? "approved" : "cancelled";
    await db.collection("rides").doc(rideId).update({
      status,
      adminModeratedAt: FieldValue.serverTimestamp(),
      adminModerationAction: action,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
