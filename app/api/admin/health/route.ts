import { NextResponse } from "next/server";
import { getBackendHealth } from "@/lib/server/adminBackend";

export async function GET() {
  return NextResponse.json(getBackendHealth(), { status: 200 });
}
