import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb, isFirebaseAdminReady } from "@/lib/server/firebaseAdmin";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/server/passwordHash";

const ACCOUNT_COLLECTION = "adminAccounts";
const ACCOUNT_DOC_ID = "primary";
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESET_COOLDOWN_MS = 60 * 1000; // 1 minute between emails

export type AdminAccountPublic = {
  email: string;
  name: string;
  role: string;
  updatedAt: string | null;
  passwordUpdatedAt: string | null;
};

type AdminAccountRecord = {
  email: string;
  name: string;
  role: string;
  passwordHash: string;
  credentialsVersion?: number;
  updatedAt?: Timestamp | null;
  passwordUpdatedAt?: Timestamp | null;
  resetTokenHash?: string | null;
  resetTokenExpiresAt?: Timestamp | null;
  lastResetRequestAt?: Timestamp | null;
};

/**
 * Bootstrap seed only — used to create/migrate `adminAccounts/primary`.
 * After seed, login verifies against the Firestore scrypt hash + JWT session cookie.
 */
export const ADMIN_EMAIL_DEFAULT = "admin@ride-mesh.app";
export const ADMIN_PASSWORD_DEFAULT = "KPatterson@1";

/** Bump to re-seed email + password hash into Firestore once (does not overwrite later Account changes). */
const CREDENTIALS_SEED_VERSION = 3;

function bootstrapEmail(): string {
  return (process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).trim().toLowerCase();
}

function bootstrapPassword(): string {
  return process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function emailsEqual(a: string, b: string): boolean {
  const left = Buffer.from(normalizeEmail(a), "utf8");
  const right = Buffer.from(normalizeEmail(b), "utf8");
  if (left.length !== right.length) return false;
  try {
    return timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function timestampToIso(value: Timestamp | null | undefined): string | null {
  if (!value || typeof value.toDate !== "function") return null;
  try {
    return value.toDate().toISOString();
  } catch {
    return null;
  }
}

function accountRef() {
  return getAdminDb().collection(ACCOUNT_COLLECTION).doc(ACCOUNT_DOC_ID);
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getAdminAppBaseUrl(request?: Request): string {
  const fromEnv = process.env.ADMIN_APP_URL || process.env.NEXT_PUBLIC_ADMIN_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }
  if (request) {
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "http";
    if (host) return `${proto}://${host}`;
  }
  return "http://localhost:3000";
}

async function readAccount(): Promise<AdminAccountRecord | null> {
  if (!isFirebaseAdminReady()) return null;
  const snap = await accountRef().get();
  if (!snap.exists) return null;
  const data = snap.data() as Partial<AdminAccountRecord>;
  if (!data.email || !data.passwordHash) return null;
  return {
    email: normalizeEmail(data.email),
    name: (data.name || "Admin").trim() || "Admin",
    role: (data.role || "System Overseer").trim() || "System Overseer",
    passwordHash: data.passwordHash,
    credentialsVersion: typeof data.credentialsVersion === "number" ? data.credentialsVersion : 0,
    updatedAt: data.updatedAt ?? null,
    passwordUpdatedAt: data.passwordUpdatedAt ?? null,
    resetTokenHash: data.resetTokenHash ?? null,
    resetTokenExpiresAt: data.resetTokenExpiresAt ?? null,
    lastResetRequestAt: data.lastResetRequestAt ?? null,
  };
}

/**
 * Ensures `adminAccounts/primary` exists in Firestore.
 * Auth path: Firestore hashed password → JWT httpOnly cookie (no plain-text env check after seed).
 */
export async function ensureAdminAccount(): Promise<AdminAccountRecord> {
  if (!isFirebaseAdminReady()) {
    throw new Error("Firebase Admin is not configured. Cannot manage admin account.");
  }

  const existing = await readAccount();
  const email = bootstrapEmail();
  const needsSeed =
    !existing ||
    (existing.credentialsVersion ?? 0) < CREDENTIALS_SEED_VERSION ||
    existing.email === "kristopher@ridemesh.app";

  if (!needsSeed && existing) return existing;

  const passwordHash = await hashPassword(bootstrapPassword());
  const name = existing?.name && existing.name !== "Admin" ? existing.name : "Admin";
  const role = existing?.role || "System Overseer";

  await accountRef().set(
    {
      email,
      name,
      role,
      passwordHash,
      credentialsVersion: CREDENTIALS_SEED_VERSION,
      updatedAt: FieldValue.serverTimestamp(),
      passwordUpdatedAt: FieldValue.serverTimestamp(),
      ...(existing
        ? {
            resetTokenHash: FieldValue.delete(),
            resetTokenExpiresAt: FieldValue.delete(),
          }
        : { createdAt: FieldValue.serverTimestamp() }),
    },
    { merge: true },
  );

  return {
    email,
    name,
    role,
    passwordHash,
    credentialsVersion: CREDENTIALS_SEED_VERSION,
    updatedAt: existing?.updatedAt ?? null,
    passwordUpdatedAt: existing?.passwordUpdatedAt ?? null,
    resetTokenHash: null,
    resetTokenExpiresAt: null,
    lastResetRequestAt: existing?.lastResetRequestAt ?? null,
  };
}

export async function getAdminAccountPublic(): Promise<AdminAccountPublic> {
  const account = await ensureAdminAccount();
  return {
    email: account.email,
    name: account.name,
    role: account.role,
    updatedAt: timestampToIso(account.updatedAt),
    passwordUpdatedAt: timestampToIso(account.passwordUpdatedAt),
  };
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  try {
    const account = await ensureAdminAccount();
    const emailOk = emailsEqual(email, account.email);
    const hash = account.passwordHash || "";
    const hashLooksScrypt = hash.startsWith("scrypt$");
    const passwordOk = hashLooksScrypt ? await verifyPassword(password, hash) : false;

    console.error("======== ADMIN LOGIN DEBUG ========");
    console.error("firebaseReady:", isFirebaseAdminReady());
    console.error("inputEmail:", JSON.stringify(email));
    console.error("storedEmail:", JSON.stringify(account.email));
    console.error("emailMatch:", emailOk);
    console.error("inputPasswordLen:", password.length);
    console.error("hashPrefix:", hash.slice(0, 40));
    console.error("hashLooksScrypt:", hashLooksScrypt);
    console.error("passwordMatch:", passwordOk);
    console.error("credentialsVersion:", account.credentialsVersion);
    console.error("bootstrapEmailEnvSet:", Boolean(process.env.ADMIN_EMAIL));
    console.error("bootstrapPasswordEnvSet:", Boolean(process.env.ADMIN_PASSWORD));
    console.error("===================================");

    return emailOk && passwordOk;
  } catch (err) {
    console.error("======== ADMIN LOGIN DEBUG ERROR ========");
    console.error(err);
    console.error("========================================");
    return false;
  }
}

/** Shown on the login page in development only — not for production. */
export function getDevAdminCredentials(): { email: string; password: string; note: string } | null {
  if (process.env.NODE_ENV !== "development") return null;
  return {
    email: bootstrapEmail(),
    password: bootstrapPassword(),
    note: "Seed credentials. Login uses the Firestore password hash + JWT session after bootstrap.",
  };
}

export async function updateAdminProfile(input: {
  name?: string;
  email?: string;
  currentPassword: string;
}): Promise<{ ok: true; account: AdminAccountPublic } | { ok: false; error: string }> {
  const account = await ensureAdminAccount();
  const currentOk = await verifyPassword(input.currentPassword, account.passwordHash);
  if (!currentOk) return { ok: false, error: "Current password is incorrect." };

  const name = input.name !== undefined ? input.name.trim() : account.name;
  const email = input.email !== undefined ? normalizeEmail(input.email) : account.email;

  if (!name) return { ok: false, error: "Name is required." };
  if (!email || !email.includes("@")) return { ok: false, error: "A valid email is required." };

  await accountRef().update({
    name,
    email,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return {
    ok: true,
    account: {
      email,
      name,
      role: account.role,
      updatedAt: new Date().toISOString(),
      passwordUpdatedAt: timestampToIso(account.passwordUpdatedAt),
    },
  };
}

export async function changeAdminPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const strengthError = validatePasswordStrength(input.newPassword);
  if (strengthError) return { ok: false, error: strengthError };
  if (input.currentPassword === input.newPassword) {
    return { ok: false, error: "New password must be different from the current password." };
  }

  const account = await ensureAdminAccount();
  const currentOk = await verifyPassword(input.currentPassword, account.passwordHash);
  if (!currentOk) return { ok: false, error: "Current password is incorrect." };

  const passwordHash = await hashPassword(input.newPassword);
  await accountRef().update({
    passwordHash,
    passwordUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    resetTokenHash: FieldValue.delete(),
    resetTokenExpiresAt: FieldValue.delete(),
  });

  return { ok: true };
}

async function sendAdminEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "RideMesh <onboarding@resend.dev>";
  if (!apiKey) {
    return { ok: false, error: "Email is not configured (RESEND_API_KEY)." };
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [opts.to],
      reply_to: process.env.RESEND_REPLY_TO || undefined,
      subject: opts.subject,
      html: opts.html,
      text: opts.text,
      tags: [{ name: "category", value: "admin-security" }],
    }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, error: payload?.message || `Email provider error (${res.status})` };
  }
  return { ok: true };
}

export async function requestPasswordReset(opts: {
  email: string;
  request: Request;
}): Promise<{
  ok: true;
  message: string;
  /** Only returned in development when Resend is missing — never in production. */
  devResetUrl?: string;
}> {
  const generic = {
    ok: true as const,
    message: "If that email matches the admin account, a reset link has been sent.",
  };

  let account: AdminAccountRecord;
  try {
    account = await ensureAdminAccount();
  } catch {
    return generic;
  }

  if (!emailsEqual(opts.email, account.email)) {
    return generic;
  }

  const last = account.lastResetRequestAt?.toMillis?.() ?? 0;
  if (Date.now() - last < RESET_COOLDOWN_MS) {
    return generic;
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashResetToken(token);
  const expiresAt = Timestamp.fromMillis(Date.now() + RESET_TTL_MS);

  await accountRef().update({
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: expiresAt,
    lastResetRequestAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const baseUrl = getAdminAppBaseUrl(opts.request);
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

  const subject = "Reset your RideMesh Admin password";
  const text = `Reset your RideMesh Admin password using this link (valid for 1 hour):\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`;
  const html = `<!DOCTYPE html>
<html lang="en"><body style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.5;">
  <p style="margin:0 0 12px;color:#FF7918;font-weight:700;">Ride Mesh Admin</p>
  <p style="margin:0 0 16px;">We received a request to reset your admin password.</p>
  <p style="margin:0 0 20px;">
    <a href="${resetUrl}" style="display:inline-block;background:#FF7918;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:600;">
      Reset password
    </a>
  </p>
  <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">This link expires in 1 hour. If you did not request it, ignore this email.</p>
  <p style="margin:0;color:#9ca3af;font-size:12px;word-break:break-all;">${resetUrl}</p>
</body></html>`;

  const sent = await sendAdminEmail({ to: account.email, subject, html, text });
  if (!sent.ok) {
    if (process.env.NODE_ENV === "development") {
      return {
        ...generic,
        devResetUrl: resetUrl,
        message: `${generic.message} (Dev: email not configured — use the link below.)`,
      };
    }
    // Keep token briefly so a flaky provider can still be retried via a second request after cooldown;
    // do not reveal whether the email matched.
    console.error("[admin] password reset email failed:", sent.error);
    return generic;
  }

  return generic;
}

export async function resetPasswordWithToken(input: {
  token: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const strengthError = validatePasswordStrength(input.newPassword);
  if (strengthError) return { ok: false, error: strengthError };

  const token = input.token.trim();
  if (!token || token.length < 32) return { ok: false, error: "Invalid or expired reset link." };

  const account = await ensureAdminAccount();
  if (!account.resetTokenHash || !account.resetTokenExpiresAt) {
    return { ok: false, error: "Invalid or expired reset link." };
  }

  const expiresMs = account.resetTokenExpiresAt.toMillis();
  if (Date.now() > expiresMs) {
    await accountRef().update({
      resetTokenHash: FieldValue.delete(),
      resetTokenExpiresAt: FieldValue.delete(),
    });
    return { ok: false, error: "Invalid or expired reset link." };
  }

  const providedHash = hashResetToken(token);
  const expected = Buffer.from(account.resetTokenHash, "utf8");
  const actual = Buffer.from(providedHash, "utf8");
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return { ok: false, error: "Invalid or expired reset link." };
  }

  const passwordHash = await hashPassword(input.newPassword);
  await accountRef().update({
    passwordHash,
    passwordUpdatedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    resetTokenHash: FieldValue.delete(),
    resetTokenExpiresAt: FieldValue.delete(),
  });

  return { ok: true };
}
