import { NextResponse } from "next/server";
import {
  changeAdminPassword,
  getAdminAccountPublic,
  updateAdminProfile,
} from "@/lib/server/adminAccount";
import { ADMIN_SESSION_COOKIE } from "@/lib/server/adminSession";

export async function GET() {
  try {
    const account = await getAdminAccountPublic();
    return NextResponse.json({ ok: true, account });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load admin account.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}

export async function PATCH(request: Request) {
  let body: {
    action?: string;
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action || "profile";
  const currentPassword = String(body.currentPassword || "");

  if (!currentPassword) {
    return NextResponse.json({ ok: false, error: "Current password is required." }, { status: 400 });
  }

  try {
    if (action === "password") {
      const result = await changeAdminPassword({
        currentPassword,
        newPassword: String(body.newPassword || ""),
      });
      if (!result.ok) {
        return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
      }
      const res = NextResponse.json({
        ok: true,
        message: "Password updated. Please sign in again.",
        requireReauth: true,
      });
      res.cookies.set(ADMIN_SESSION_COOKIE, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 0,
      });
      return res;
    }

    const result = await updateAdminProfile({
      name: body.name,
      email: body.email,
      currentPassword,
    });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ ok: true, account: result.account, message: "Profile updated." });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 503 });
  }
}
