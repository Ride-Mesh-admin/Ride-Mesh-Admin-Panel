import { NextResponse } from "next/server";
import { fetchUsersData, updateUserStatus } from "@/lib/server/adminBackend";
import { jsonCached, jsonNoStore } from "@/lib/server/httpCache";
import type { UserStatus } from "@/lib/types/user";

export async function GET() {
  const payload = await fetchUsersData();
  return jsonCached(payload, 15);
}

export async function PATCH(request: Request) {
  let body: { userId?: string; status?: UserStatus } = {};
  try {
    body = (await request.json()) as { userId?: string; status?: UserStatus };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const userId = String(body.userId || "").trim();
  const status = body.status;
  if (!userId || (status !== "active" && status !== "suspended")) {
    return NextResponse.json({ ok: false, error: "userId and status (active|suspended) required" }, { status: 400 });
  }

  const result = await updateUserStatus(userId, status);
  return jsonNoStore(result, result.ok ? 200 : 400);
}
