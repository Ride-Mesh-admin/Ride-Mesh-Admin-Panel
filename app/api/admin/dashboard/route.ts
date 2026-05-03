import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchDashboardData();
  return NextResponse.json(payload, { status: 200 });
}
