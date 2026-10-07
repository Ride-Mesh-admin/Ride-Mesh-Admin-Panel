import { NextResponse } from "next/server";

/** Private short-lived cache for authenticated admin GET JSON. */
export function jsonCached(data: unknown, maxAgeSeconds = 10): NextResponse {
  const res = NextResponse.json(data, { status: 200 });
  res.headers.set("Cache-Control", `private, max-age=${maxAgeSeconds}, stale-while-revalidate=${maxAgeSeconds * 2}`);
  return res;
}

export function jsonNoStore(data: unknown, status = 200): NextResponse {
  const res = NextResponse.json(data, { status });
  res.headers.set("Cache-Control", "no-store");
  return res;
}
