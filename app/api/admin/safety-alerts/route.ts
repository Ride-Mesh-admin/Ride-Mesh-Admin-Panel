import { NextResponse } from "next/server";
import { fetchSafetyData } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchSafetyData();
  return NextResponse.json(payload, { status: 200 });
}
