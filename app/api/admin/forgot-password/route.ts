import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/server/adminAccount";

export async function POST(request: Request) {
  let body: { email?: string } = {};
  try {
    body = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body.email || "").trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }

  const result = await requestPasswordReset({ email, request });
  return NextResponse.json({
    ok: true,
    message: result.message,
    ...(result.devResetUrl ? { devResetUrl: result.devResetUrl } : {}),
  });
}
