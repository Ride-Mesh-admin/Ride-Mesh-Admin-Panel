import { NextResponse } from "next/server";
import { fetchSystemLogsData } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchSystemLogsData();
  return NextResponse.json(payload, { status: 200 });
}
