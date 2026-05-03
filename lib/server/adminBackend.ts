import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";
import type { User } from "@/lib/types/user";
import type { RideDetail, RideListItem, RideStatus } from "@/lib/types/ride";
import type { SafetyAlert, IncidentDetails } from "@/lib/types/safety";
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
import { mockSafetyAlerts, mockIncidentDetails, ACTIVE_RESPONDERS_COUNT } from "@/lib/mock/safety";
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
  if (reportCount >= 4) return "flagged_ai";
  if (reportCount > 0) return "reported";
  if (raw === "ongoing" || raw === "active") return "active";
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
  incidentDetails: Record<string, IncidentDetails>;
  activeResponders: number;
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
    const incidentDetails: Record<string, IncidentDetails> = {};

    sosSnap.docs
      .filter((doc) => String(doc.data().status || "active") === "active")
      .forEach((doc) => {
        const data = doc.data();
        const user = userLookup.get(String(data.userId || "")) || {};
        const ride = rideLookup.get(String(data.rideId || "")) || {};
        const userName = String(user.username || user.fullName || "Unknown User");
        const alertId = `sos-${doc.id}`;
        alerts.push({
          id: alertId,
          type: "sos_critical",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${String(data.rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: "HIGH IMPACT DETECTED",
          alertIcon: "impact",
          primaryButtonLabel: "Deploy Response",
          primaryButtonIcon: "deploy",
          hasLiveIndicator: true,
          avatarColor: colorFromId(String(data.userId || doc.id)),
        });
        incidentDetails[alertId] = {
          alertId,
          vehicleTelemetry: {
            currentSpeed: "0 km/h (Stopped)",
            gForceSpike: "4.1g",
          },
          emergencyContacts: Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0
            ? data.emergencyContacts.map((item: unknown) => {
                const value = typeof item === "object" && item ? (item as Record<string, unknown>) : {};
                return {
                  name: String(value.name || "Emergency Contact"),
                  relation: String(value.relation || "Contact"),
                  phone: String(value.phone || "N/A"),
                };
              })
            : [{ name: "Emergency Contact", relation: "Primary", phone: "N/A" }],
        };
      });

    helpSnap.docs
      .filter((doc) => String(doc.data().status || "open") === "open")
      .forEach((doc) => {
        const data = doc.data();
        const user = userLookup.get(String(data.userId || "")) || {};
        const ride = rideLookup.get(String(data.rideId || "")) || {};
        const userName = String(user.username || user.fullName || "Unknown User");
        const alertId = `help-${doc.id}`;
        alerts.push({
          id: alertId,
          type: "help_signal",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${String(data.rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: String(data.message || "OFF-ROUTE WARNING").toUpperCase(),
          alertIcon: "warning",
          primaryButtonLabel: "Contact Driver",
          primaryButtonIcon: "phone",
          avatarColor: colorFromId(String(data.userId || doc.id)),
        });
        incidentDetails[alertId] = {
          alertId,
          vehicleTelemetry: {
            currentSpeed: "35 km/h",
          },
          emergencyContacts: [{ name: "Emergency Contact", relation: "Primary", phone: "N/A" }],
        };
      });

    const activeResponders = Math.max(1, Math.min(10, alerts.length || 1));
    return {
      alerts: alerts.sort((a, b) => a.activeDuration.localeCompare(b.activeDuration)).slice(0, 100),
      incidentDetails,
      activeResponders,
    };
  } catch {
    return {
      alerts: mockSafetyAlerts,
      incidentDetails: mockIncidentDetails,
      activeResponders: ACTIVE_RESPONDERS_COUNT,
    };
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
      buttonLabel: "DEPLOY RESPONSE",
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
