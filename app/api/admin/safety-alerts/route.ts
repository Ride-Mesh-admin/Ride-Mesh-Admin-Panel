import { fetchSafetyData } from "@/lib/server/adminBackend";
import { jsonCached } from "@/lib/server/httpCache";

export async function GET() {
  const payload = await fetchSafetyData();
  return jsonCached(payload, 8);
}
