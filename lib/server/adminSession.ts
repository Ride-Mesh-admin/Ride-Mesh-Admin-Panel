import { SignJWT, jwtVerify } from "jose";

export const ADMIN_SESSION_COOKIE = "ridemesh_admin_session";

function sessionSecret(): Uint8Array {
  const raw = process.env.ADMIN_SESSION_SECRET || "ridemesh-admin-local-session-secret-min-32-chars!!";
  return new TextEncoder().encode(raw.padEnd(32, "x").slice(0, 64));
}

export async function createAdminSessionToken(): Promise<string> {
  return new SignJWT({ sub: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(sessionSecret());
}

export async function verifyAdminSessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    await jwtVerify(token, sessionSecret());
    return true;
  } catch {
    return false;
  }
}
