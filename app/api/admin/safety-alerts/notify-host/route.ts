import { NextResponse } from "next/server";
import { notifyHostForSafetyAlert } from "@/lib/server/adminBackend";

export async function POST(request: Request) {
  let body: { alertId?: string } = {};
  try {
    body = (await request.json()) as { alertId?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }
  const alertId = String(body.alertId || "").trim();
  if (!alertId) {
    return NextResponse.json({ ok: false, error: "alertId is required" }, { status: 400 });
  }
  const result = await notifyHostForSafetyAlert(alertId);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error || "Failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
