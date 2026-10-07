import { fetchRidesData } from "@/lib/server/adminBackend";
import { jsonCached } from "@/lib/server/httpCache";

export async function GET() {
  const payload = await fetchRidesData();
  return jsonCached(payload, 12);
}
