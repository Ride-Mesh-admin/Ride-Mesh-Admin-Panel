import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb, probeFirebaseAdmin } from "@/lib/server/firebaseAdmin";
import type { AdminNotificationFeedItem } from "@/lib/types/adminNotifications";
import type { User, UserStatus } from "@/lib/types/user";
import type { RideDetail, RideListItem, RideStatus } from "@/lib/types/ride";
import type { SafetyAlert } from "@/lib/types/safety";
import type { DashboardMetrics } from "@/lib/types/metric";
import type { RideReport } from "@/lib/types/report";
import type { CriticalAlert } from "@/lib/types/alert";
import type { LogEntry, SystemActivityLog, SystemStatusBar } from "@/lib/types/log";
import type { NewsletterCampaign, NewsletterSubscriber } from "@/lib/types/newsletter";
import { SERVICE_ID } from "@/lib/mock/system-logs";

export type DataSource = "live" | "mock";

export function getBackendHealth() {
  const probe = probeFirebaseAdmin();
  return {
    firebase: probe.ok,
    projectId: probe.projectId ?? null,
    error: probe.error ?? null,
  };
}

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

function photoFromProfile(data: Record<string, unknown> | undefined): string | undefined {
  if (!data) return undefined;
  const raw =
    data.photoURL ?? data.photoUrl ?? data.avatarUrl ?? data.profileImage ?? data.profilePhoto;
  const url = typeof raw === "string" ? raw.trim() : "";
  return url || undefined;
}

/** Fixed sender identity for admin → host chat threads (must exist in `users`). */
export const ADMIN_CHAT_SENDER_ID = process.env.ADMIN_CHAT_SENDER_ID || "ridemesh_admin";

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

function mapRideStatus(
  raw: string | undefined,
  reportCount: number,
  isBlacklisted?: boolean,
): RideStatus {
  if (isBlacklisted) return "blacklisted";
  const s = String(raw || "").toLowerCase();
  if (s === "blacklisted") return "blacklisted";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  if (s === "approved") return "approved";
  if (reportCount >= 4) return "flagged_ai";
  if (reportCount > 0) return "reported";
  if (s === "ongoing" || s === "active") return "active";
  return "under_review";
}

export async function fetchUsersData(): Promise<{ users: User[]; total: number; source: DataSource }> {
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
        photoURL: photoFromProfile(data as Record<string, unknown>),
      };
    });
    return { users, total: users.length, source: "live" };
  } catch {
    return { users: [], total: 0, source: "mock" };
  }
}

export async function updateUserStatus(
  userId: string,
  status: UserStatus,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    const ref = db.collection("users").doc(userId);
    const snap = await ref.get();
    if (!snap.exists) return { ok: false, error: "User not found." };

    const suspended = status === "suspended";
    await ref.update({
      status,
      isSuspended: suspended,
      disabled: suspended,
      adminUpdatedAt: FieldValue.serverTimestamp(),
    });

    try {
      await getAdminAuth().updateUser(userId, { disabled: suspended });
    } catch {
      // Auth user may not exist for every Firestore profile; profile update still succeeds.
    }

    await db.collection("systemLogs").add({
      module: "USER_ADMIN",
      severity: "info",
      message: `User ${userId} marked ${status} by admin.`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to update user." };
  }
}

export async function fetchRidesData(): Promise<{
  rides: RideListItem[];
  detailsById: Record<string, RideDetail>;
  stats: { activeRides: number; reported: number; moderatorsOnline: number };
  source: DataSource;
}> {
  try {
    const db = getAdminDb();
    const [ridesSnap, seatReqSnap, usersSnap, sosSnap, helpSnap] = await Promise.all([
      db.collection("rides").orderBy("createdAt", "desc").limit(500).get(),
      db.collection("seatRequests").orderBy("createdAt", "desc").limit(1000).get(),
      db.collection("users").get(),
      db.collection("sosAlerts").limit(500).get().catch(() => null),
      db.collection("helpSignals").limit(500).get().catch(() => null),
    ]);

    const hostLookup = new Map(usersSnap.docs.map((doc) => [doc.id, doc.data()]));
    const hostedCounts = new Map<string, number>();
    ridesSnap.docs.forEach((doc) => {
      const hostId = String(doc.data().hostId || "");
      if (!hostId) return;
      hostedCounts.set(hostId, (hostedCounts.get(hostId) || 0) + 1);
    });

    const safetyByRide = new Map<string, { sosCount: number; helpCount: number }>();
    sosSnap?.docs.forEach((doc) => {
      const rideId = String(doc.data().rideId || "");
      if (!rideId) return;
      const cur = safetyByRide.get(rideId) || { sosCount: 0, helpCount: 0 };
      cur.sosCount += 1;
      safetyByRide.set(rideId, cur);
    });
    helpSnap?.docs.forEach((doc) => {
      const rideId = String(doc.data().rideId || "");
      if (!rideId) return;
      const cur = safetyByRide.get(rideId) || { sosCount: 0, helpCount: 0 };
      cur.helpCount += 1;
      safetyByRide.set(rideId, cur);
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
      const isBlacklisted = data.isBlacklisted === true || String(data.status || "").toLowerCase() === "blacklisted";
      const status = mapRideStatus(String(data.status || "upcoming"), reportCount, isBlacklisted);
      const hostRating = Number(((hostedCounts.get(hostId) || 1) > 3 ? 4.7 : 4.1).toFixed(1));
      const safety = safetyByRide.get(doc.id) || { sosCount: 0, helpCount: 0 };
      const safetySignals = {
        sosCount: safety.sosCount,
        helpCount: safety.helpCount,
        total: safety.sosCount + safety.helpCount,
      };

      rides.push({
        id: doc.id,
        title: String(data.title || "Untitled Ride"),
        subtitle: String(data.type || ""),
        rideId: `RM-${doc.id.slice(0, 6).toUpperCase()}`,
        postedAgo: formatRelativeTime(data.createdAt || data.updatedAt),
        hostName,
        hostAvatarColor: colorFromId(hostId || doc.id),
        hostPhotoURL: photoFromProfile(hostProfile as Record<string, unknown>),
        hostRating,
        reportCount,
        safetySignals,
        status,
        isBlacklisted,
      });

      detailsById[doc.id] = {
        id: doc.id,
        rideId: `RM-${doc.id.slice(0, 6).toUpperCase()}`,
        riskLevel: safetySignals.total >= 2 || reportCount >= 4 ? "high" : reportCount >= 2 ? "medium" : "low",
        title: String(data.title || "Untitled Ride"),
        description: String(data.description || "No additional description provided."),
        pickup: String(data.startLocationLabel || "Unknown pickup"),
        dropoff: String(data.endLocationLabel || "Unknown dropoff"),
        reportCount,
        safetySignals,
        reportLogs: logs,
        isBlacklisted,
        hostReputation: {
          memberSince: formatShortDate(hostProfile.createdAt || Date.now()),
          ridesHosted: hostedCounts.get(hostId) || 0,
          pastWarnings: reportCount,
        },
      };
    }

    const stats = {
      activeRides: rides.filter((ride) => ride.status === "active").length,
      reported: rides.filter((ride) => ride.safetySignals.total > 0 || ride.reportCount > 0).length,
      moderatorsOnline: Math.max(1, Math.min(12, Math.floor(rides.length / 20) + 2)),
    };

    return { rides, detailsById, stats, source: "live" };
  } catch {
    return {
      rides: [],
      detailsById: {},
      stats: { activeRides: 0, reported: 0, moderatorsOnline: 0 },
      source: "mock",
    };
  }
}

export async function fetchSafetyData(): Promise<{
  alerts: SafetyAlert[];
  source: DataSource;
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
        const rideId = String(data.rideId || "");
        alerts.push({
          id: alertId,
          type: "sos_critical",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${(rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: "HIGH IMPACT DETECTED",
          alertIcon: "impact",
          hasLiveIndicator: true,
          avatarColor: colorFromId(String(data.userId || doc.id)),
          photoURL: photoFromProfile(user as Record<string, unknown>),
          rideId: rideId || undefined,
          hostId: String(ride.hostId || "") || undefined,
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
        const rideId = String(data.rideId || "");
        alerts.push({
          id: alertId,
          type: "help_signal",
          activeDuration: formatRelativeTime(data.createdAt).replace(" ago", ""),
          userName,
          tripId: `RMM-${(rideId || doc.id).slice(0, 6).toUpperCase()}`,
          vehicle: String(ride.vehicleType || "Unknown Vehicle"),
          alertMessage: String(data.message || "OFF-ROUTE WARNING").toUpperCase(),
          alertIcon: "warning",
          avatarColor: colorFromId(String(data.userId || doc.id)),
          photoURL: photoFromProfile(user as Record<string, unknown>),
          rideId: rideId || undefined,
          hostId: String(ride.hostId || "") || undefined,
          createdAtMs,
          ...alertCoordsFromDoc(raw),
        });
      });

    alerts.sort((a, b) => (b.createdAtMs ?? 0) - (a.createdAtMs ?? 0));
    return {
      alerts: alerts.slice(0, 100),
      source: "live",
    };
  } catch {
    return {
      alerts: [],
      source: "mock",
    };
  }
}

/** Shown in the host app chat when admin uses “Notify host” from Safety Alerts. */
export const ADMIN_HOST_EMERGENCY_TITLE = "RideMesh Admin";
export const ADMIN_HOST_EMERGENCY_BODY =
  "A RideMesh administrator is contacting you about an active safety alert on your ride. Open this chat and review your ride immediately. Follow any on-screen instructions.";

function parseSafetyAlertId(alertId: string): { kind: "sos" | "help"; docId: string } | null {
  if (alertId.startsWith("sos-")) return { kind: "sos", docId: alertId.slice(4) };
  if (alertId.startsWith("help-")) return { kind: "help", docId: alertId.slice(5) };
  return null;
}

async function ensureAdminChatSenderProfile(): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection("users").doc(ADMIN_CHAT_SENDER_ID);
  const snap = await ref.get();
  const base = {
    username: "RideMesh Admin",
    fullName: "RideMesh Admin",
    role: "admin",
    isSystemAdmin: true,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (!snap.exists) {
    await ref.set({
      ...base,
      email: process.env.ADMIN_EMAIL || "admin@ride-mesh.app",
      createdAt: FieldValue.serverTimestamp(),
    });
    return;
  }
  await ref.set(base, { merge: true });
}

/**
 * Sends a personal chat message to the ride host (appears in their Chat list/thread)
 * via `chatThreads` + `messages`, matching the mobile app schema in chatService.js.
 * Also writes a `notifications` doc (type `new_chat`) so push delivery runs.
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
    const rideData = rideSnap.data() as Record<string, unknown>;
    const hostId = String(rideData.hostId || "");
    if (!hostId) {
      return { ok: false, error: "No host is assigned to this ride." };
    }

    await ensureAdminChatSenderProfile();

    const senderId = ADMIN_CHAT_SENDER_ID;
    const participantIds = [senderId, hostId].sort();
    const rideTitle = String(rideData.title || "Safety alert");
    const messageText =
      parsed.kind === "sos"
        ? `${ADMIN_HOST_EMERGENCY_BODY}\n\nAlert type: SOS critical on ride “${rideTitle}”.`
        : `${ADMIN_HOST_EMERGENCY_BODY}\n\nAlert type: Help signal on ride “${rideTitle}”.`;

    // Prefer an existing admin↔host thread for this ride; otherwise create one.
    const existing = await db
      .collection("chatThreads")
      .where("rideId", "==", rideId)
      .where("participantIds", "array-contains", hostId)
      .limit(20)
      .get();

    let threadId: string | null = null;
    for (const docSnap of existing.docs) {
      const ids = ((docSnap.data().participantIds as string[]) || []).slice().sort();
      if (ids.length === 2 && ids[0] === participantIds[0] && ids[1] === participantIds[1]) {
        threadId = docSnap.id;
        break;
      }
      // Also match threads already marked as admin support for this ride+host
      if (docSnap.data().isAdminThread === true && ids.includes(hostId) && ids.includes(senderId)) {
        threadId = docSnap.id;
        break;
      }
    }

    if (!threadId) {
      const threadRef = db.collection("chatThreads").doc();
      threadId = threadRef.id;
      await threadRef.set({
        rideId,
        participantIds,
        rideTitle,
        isAdminThread: true,
        lastMessage: null,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    const now = new Date();
    const previewText = messageText.length > 180 ? `${messageText.slice(0, 180).trimEnd()}…` : messageText;

    await db.collection("chatThreads").doc(threadId).collection("messages").add({
      senderId,
      text: messageText,
      type: "text",
      attachmentUrl: "",
      attachmentName: "",
      mimeType: "",
      createdAt: now,
      sentAt: now,
      alertId,
      source: "safety_alerts_console",
    });

    await db.collection("chatThreads").doc(threadId).set(
      {
        rideTitle,
        isAdminThread: true,
        participantIds,
        lastMessage: {
          text: previewText,
          senderId,
          type: "text",
          createdAt: now,
          sentAt: now,
          deliveredAt: null,
          readAt: null,
        },
        updatedAt: now,
      },
      { merge: true },
    );

    // Triggers Cloud Function push (type `new_chat` → directMessages pref).
    await db.collection("notifications").add({
      userId: hostId,
      type: "new_chat",
      title: ADMIN_HOST_EMERGENCY_TITLE,
      message: previewText,
      read: false,
      rideId,
      threadId,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Keep legacy collection for any older listeners.
    await db.collection("adminHostNotifications").add({
      hostId,
      rideId,
      alertId,
      threadId,
      title: ADMIN_HOST_EMERGENCY_TITLE,
      body: messageText,
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
  source: DataSource;
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

    const usersSnapForReports = await db.collection("users").get().catch(() => null);
    const userNameById = new Map(
      (usersSnapForReports?.docs || []).map((doc) => {
        const d = doc.data();
        return [doc.id, String(d.username || d.fullName || "User")] as const;
      }),
    );
    const ridesSnapForReports = await db.collection("rides").get().catch(() => null);
    const rideHostMeta = new Map(
      (ridesSnapForReports?.docs || []).map((doc) => {
        const d = doc.data();
        const hostId = String(d.hostId || "");
        return [
          doc.id,
          {
            hostId,
            hostLabel: String(d.hostUsername || userNameById.get(hostId) || "Host"),
          },
        ] as const;
      }),
    );

    const reportRows: RideReport[] = [];
    sosSnap.docs.slice(0, 6).forEach((doc) => {
      const data = doc.data();
      const rideId = String(data.rideId || "");
      const hostMeta = rideHostMeta.get(rideId);
      reportRows.push({
        id: `SOS-${doc.id.slice(0, 6).toUpperCase()}`,
        userName: userNameById.get(String(data.userId || "")) || "Unknown rider",
        driverName: hostMeta?.hostLabel || "Host",
        severity: "high",
        status: "pending",
        href: "/safety-alerts",
      });
    });
    helpSnap.docs.slice(0, 6).forEach((doc) => {
      const data = doc.data();
      const rideId = String(data.rideId || "");
      const hostMeta = rideHostMeta.get(rideId);
      reportRows.push({
        id: `HLP-${doc.id.slice(0, 6).toUpperCase()}`,
        userName: userNameById.get(String(data.userId || "")) || "Unknown rider",
        driverName: hostMeta?.hostLabel || "Host",
        severity: "medium",
        status: "in_review",
        href: "/safety-alerts",
      });
    });
    const reports: RideReport[] = reportRows.slice(0, 8);

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

    return {
      criticalAlert,
      metrics,
      reports,
      liveLogs,
      source: "live",
    };
  } catch {
    return {
      criticalAlert: {
        title: "Unable to load safety status",
        description: "Firebase connection failed. Retry shortly.",
        count: 0,
      },
      metrics: {
        totalUsers: 0,
        totalUsersDelta: "0%",
        activeRides: 0,
        activeRidesLive: false,
        openReports: 0,
        openReportsPriority: "—",
        sosAlerts: 0,
        sosAlertsStatus: "—",
      },
      reports: [],
      liveLogs: [],
      source: "mock",
    };
  }
}

export async function fetchSystemLogsData(): Promise<{
  logs: SystemActivityLog[];
  status: SystemStatusBar;
  serviceId: string;
  source: DataSource;
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
      source: "live",
    };
  } catch {
    return {
      logs: [],
      status: {
        apiSync: { status: "API SYNC OFFLINE", ok: false },
        dbLoad: "DB LOAD: —",
        uptime: "UPTIME: —",
        memory: "—",
      },
      serviceId: SERVICE_ID,
      source: "mock",
    };
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
  action: "approve" | "cancel" | "blacklist",
): Promise<{ ok: boolean; error?: string }> {
  try {
    const db = getAdminDb();
    if (action === "blacklist") {
      await db.collection("rides").doc(rideId).update({
        status: "blacklisted",
        isBlacklisted: true,
        adminModeratedAt: FieldValue.serverTimestamp(),
        adminModerationAction: "blacklist",
      });
      await db.collection("systemLogs").add({
        module: "RIDE_ADMIN",
        severity: "warning",
        message: `Ride ${rideId} blacklisted by admin.`,
        timestamp: FieldValue.serverTimestamp(),
      });
      return { ok: true };
    }
    const status = action === "approve" ? "approved" : "cancelled";
    await db.collection("rides").doc(rideId).update({
      status,
      isBlacklisted: false,
      adminModeratedAt: FieldValue.serverTimestamp(),
      adminModerationAction: action,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchNewsletterData(): Promise<{
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  source: DataSource;
}> {
  try {
    const db = getAdminDb();
    const [subsSnap, campaignsSnap] = await Promise.all([
      db.collection("newsletterSubscribers").orderBy("createdAt", "desc").limit(2000).get(),
      db.collection("newsletterCampaigns").orderBy("createdAt", "desc").limit(50).get(),
    ]);

    const subscribers: NewsletterSubscriber[] = subsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        email: String(data.email || doc.id),
        source: String(data.source || "landing"),
        subscribedAt: formatShortDate(data.createdAt),
        createdAtMs: toMillis(data.createdAt),
      };
    });

    const campaigns: NewsletterCampaign[] = campaignsSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        subject: String(data.subject || ""),
        preview: String(data.preview || data.body || "").slice(0, 160),
        status: (String(data.status || "queued") as NewsletterCampaign["status"]),
        recipientCount: Number(data.recipientCount || 0),
        sentCount: Number(data.sentCount || 0),
        failedCount: Number(data.failedCount || 0),
        providerError: data.providerError ? String(data.providerError) : null,
        createdAt: formatRelativeTime(data.createdAt),
        createdAtMs: toMillis(data.createdAt),
      };
    });

    return { subscribers, campaigns, source: "live" };
  } catch {
    return { subscribers: [], campaigns: [], source: "mock" };
  }
}

async function deliverViaResend(opts: {
  to: string[];
  subject: string;
  html: string;
  text: string;
}): Promise<{ sent: number; failed: number; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "RideMesh <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO || "support@ride-mesh.app";
  const siteUrl = (process.env.NEWSLETTER_SITE_URL || "https://ride-mesh.app").replace(/\/$/, "");
  if (!apiKey) {
    return { sent: 0, failed: 0, error: "RESEND_API_KEY not configured" };
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Resend /emails accepts one primary recipient per request; send individually.
  for (const email of opts.to) {
    try {
      const unsubscribePageUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}`;
      const unsubscribeApiUrl = `${siteUrl}/api/newsletter/unsubscribe?email=${encodeURIComponent(email)}`;
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          reply_to: replyTo,
          subject: opts.subject,
          html: opts.html.replaceAll("{{UNSUBSCRIBE_URL}}", unsubscribePageUrl),
          text: `${opts.text}\n\nUnsubscribe: ${unsubscribePageUrl}`,
          headers: {
            "List-Unsubscribe": `<${unsubscribeApiUrl}>, <mailto:${replyTo}?subject=unsubscribe>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
          tags: [{ name: "category", value: "newsletter" }],
        }),
      });

      if (res.ok) {
        sent += 1;
        continue;
      }

      failed += 1;
      const payload = (await res.json().catch(() => null)) as { message?: string } | null;
      const message = payload?.message || `Resend HTTP ${res.status}`;
      if (!errors.includes(message)) errors.push(message);
    } catch (err) {
      failed += 1;
      const message = err instanceof Error ? err.message : "Network error talking to Resend";
      if (!errors.includes(message)) errors.push(message);
    }
  }

  return {
    sent,
    failed,
    error: errors.length ? errors.join(" · ") : undefined,
  };
}

function buildNewsletterHtml(subject: string, body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.6;color:#1a1a1a;font-size:15px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <div style="max-width:560px;margin:24px auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="padding:20px 24px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0;color:#FF7918;font-weight:700;font-size:14px;">Ride Mesh</p>
      <h1 style="margin:8px 0 0;color:#111827;font-size:20px;line-height:1.35;font-weight:700;">${escapeHtml(subject)}</h1>
    </div>
    <div style="padding:24px;">${paragraphs}</div>
    <div style="padding:16px 24px 24px;border-top:1px solid #f3f4f6;">
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
        You’re receiving this because you subscribed on Ride Mesh.
      </p>
      <p style="margin:0 0 8px;color:#6b7280;font-size:12px;line-height:1.5;">
        Ride Mesh · <a href="https://ride-mesh.app" style="color:#FF7918;text-decoration:underline;">ride-mesh.app</a>
      </p>
      <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendNewsletterCampaign(input: {
  subject: string;
  body: string;
}): Promise<{ ok: boolean; campaignId?: string; sent?: number; failed?: number; queued?: boolean; error?: string }> {
  const subject = input.subject.trim();
  const body = input.body.trim();
  if (subject.length < 3) return { ok: false, error: "Subject is too short." };
  if (body.length < 10) return { ok: false, error: "Message body is too short." };

  try {
    const db = getAdminDb();
    const subsSnap = await db.collection("newsletterSubscribers").get();
    const recipients = subsSnap.docs
      .map((doc) => String(doc.data().email || doc.id).trim().toLowerCase())
      .filter((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

    if (!recipients.length) {
      return { ok: false, error: "No newsletter subscribers found." };
    }

    const html = buildNewsletterHtml(subject, body);
    const text = `${subject}\n\n${body}\n\n— RideMesh`;

    const campaignRef = await db.collection("newsletterCampaigns").add({
      subject,
      body,
      preview: body.slice(0, 160),
      status: "sending",
      recipientCount: recipients.length,
      sentCount: 0,
      failedCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const hasProvider = Boolean(process.env.RESEND_API_KEY);
    if (!hasProvider) {
      await campaignRef.update({
        status: "queued",
        sentCount: 0,
        failedCount: 0,
        note: "Queued — set RESEND_API_KEY and RESEND_FROM_EMAIL to deliver live email.",
        updatedAt: FieldValue.serverTimestamp(),
      });
      await db.collection("systemLogs").add({
        module: "NEWSLETTER",
        severity: "info",
        message: `Campaign queued for ${recipients.length} subscribers (no email provider configured).`,
        timestamp: FieldValue.serverTimestamp(),
      });
      return { ok: true, campaignId: campaignRef.id, sent: 0, failed: 0, queued: true };
    }

    const delivery = await deliverViaResend({ to: recipients, subject, html, text });
    const status = delivery.failed === 0 ? "sent" : delivery.sent > 0 ? "partial" : "failed";
    await campaignRef.update({
      status,
      sentCount: delivery.sent,
      failedCount: delivery.failed,
      providerError: delivery.error || null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    await db.collection("systemLogs").add({
      module: "NEWSLETTER",
      severity: status === "failed" ? "error" : "info",
      message: `Campaign ${campaignRef.id}: ${delivery.sent} sent, ${delivery.failed} failed.${delivery.error ? ` ${delivery.error}` : ""}`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ok: status !== "failed",
      campaignId: campaignRef.id,
      sent: delivery.sent,
      failed: delivery.failed,
      queued: false,
      error: status === "failed" ? delivery.error || "Delivery failed." : undefined,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send campaign." };
  }
}
