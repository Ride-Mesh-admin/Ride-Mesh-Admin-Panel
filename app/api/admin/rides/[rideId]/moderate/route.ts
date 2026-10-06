import { NextResponse } from "next/server";
import { moderateRide } from "@/lib/server/adminBackend";

type Body = { action?: string };

export async function POST(request: Request, context: { params: Promise<{ rideId: string }> }) {
  const { rideId } = await context.params;
  if (!rideId) {
    return NextResponse.json({ ok: false, error: "Missing ride id" }, { status: 400 });
  }
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
  } catch {
    body = {};
  }
  const action =
    body.action === "blacklist"
      ? "blacklist"
      : body.action === "approve"
        ? "approve"
        : body.action === "cancel"
          ? "cancel"
          : null;
  if (!action) {
    return NextResponse.json({ ok: false, error: "action must be blacklist, approve, or cancel" }, { status: 400 });
  }
  const result = await moderateRide(rideId, action);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? "Update failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}
