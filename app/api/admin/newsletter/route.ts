import { NextResponse } from "next/server";
import { fetchNewsletterData, sendNewsletterCampaign } from "@/lib/server/adminBackend";

export async function GET() {
  const payload = await fetchNewsletterData();
  return NextResponse.json(payload, { status: 200 });
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

  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
