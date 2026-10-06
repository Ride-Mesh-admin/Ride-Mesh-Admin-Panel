import { timingSafeEqual } from "node:crypto";

/** Single admin — override with env in production. */
export const ADMIN_EMAIL_DEFAULT = "Kristopher@ridemesh.app";
export const ADMIN_PASSWORD_DEFAULT = "KP@3000$";

function adminEmail(): string {
  return (process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).trim().toLowerCase();
}

function adminPassword(): string {
  return process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Shown on the login page in development only — not for production. */
export function getDevAdminCredentials(): { email: string; password: string } | null {
  if (process.env.NODE_ENV !== "development") return null;
  return {
    email: process.env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT,
    password: process.env.ADMIN_PASSWORD || ADMIN_PASSWORD_DEFAULT,
  };
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  const e = normalizeEmail(email);
  const want = adminEmail();
  if (e.length !== want.length) return false;
  try {
    if (!timingSafeEqual(Buffer.from(e, "utf8"), Buffer.from(want, "utf8"))) return false;
  } catch {
    return false;
  }
  const p = password;
  const pw = adminPassword();
  if (p.length !== pw.length) return false;
  try {
    return timingSafeEqual(Buffer.from(p, "utf8"), Buffer.from(pw, "utf8"));
  } catch {
    return false;
  }
}
