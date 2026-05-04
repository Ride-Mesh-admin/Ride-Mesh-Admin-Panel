import { NextResponse } from "next/server";
import { verifyAdminCredentials } from "@/lib/server/adminCredentials";
import { ADMIN_SESSION_COOKIE, createAdminSessionToken } from "@/lib/server/adminSession";

export async function POST(request: Request) {
  let body: { email?: string; password?: string } = {};
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const email = String(body.email || "");
  const password = String(body.password || "");
  if (!verifyAdminCredentials(email, password)) {
    return NextResponse.json({ ok: false, error: "Invalid email or password" }, { status: 401 });
  }
  const token = await createAdminSessionToken();
  const res = NextResponse.json({ ok: true }, { status: 200 });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
