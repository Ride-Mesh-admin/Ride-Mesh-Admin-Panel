import { NextResponse } from "next/server";
import { resetPasswordWithToken } from "@/lib/server/adminAccount";

export async function POST(request: Request) {
  let body: { token?: string; newPassword?: string; confirmPassword?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const token = String(body.token || "");
  const newPassword = String(body.newPassword || "");
  const confirmPassword = String(body.confirmPassword || "");

  if (!token) {
    return NextResponse.json({ ok: false, error: "Reset token is required." }, { status: 400 });
  }
  if (newPassword !== confirmPassword) {
    return NextResponse.json({ ok: false, error: "Passwords do not match." }, { status: 400 });
  }

  const result = await resetPasswordWithToken({ token, newPassword });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }
  return NextResponse.json({ ok: true, message: "Password reset. You can sign in now." });
}
