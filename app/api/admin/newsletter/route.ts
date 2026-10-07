import { NextResponse } from "next/server";
import { fetchNewsletterData, sendNewsletterCampaign } from "@/lib/server/adminBackend";
import { jsonCached, jsonNoStore } from "@/lib/server/httpCache";

export async function GET() {
  const payload = await fetchNewsletterData();
  return jsonCached(payload, 20);
}

export async function POST(request: Request) {
  let body: { subject?: string; body?: string } = {};
  try {
    body = (await request.json()) as { subject?: string; body?: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const result = await sendNewsletterCampaign({
    subject: String(body.subject || ""),
    body: String(body.body || ""),
  });

  return jsonNoStore(result, result.ok ? 200 : 400);
}
