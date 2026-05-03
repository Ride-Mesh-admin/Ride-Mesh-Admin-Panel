import { NextResponse } from "next/server";
import { fetchUsersData } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchUsersData();
  return NextResponse.json(payload, { status: 200 });
}
