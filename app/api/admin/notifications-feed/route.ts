import { NextResponse } from "next/server";
import { fetchAdminNotificationFeed } from "@/lib/server/adminBackend";

export async function GET() {
  const items = await fetchAdminNotificationFeed();
  return NextResponse.json({ items }, { status: 200 });
}
