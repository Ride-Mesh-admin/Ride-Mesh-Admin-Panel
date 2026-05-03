import { NextResponse } from "next/server";
import { fetchRidesData } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchRidesData();
  return NextResponse.json(payload, { status: 200 });
}
