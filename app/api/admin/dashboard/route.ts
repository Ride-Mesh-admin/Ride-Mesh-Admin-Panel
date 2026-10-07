import { fetchDashboardData } from "@/lib/server/adminBackend";
import { jsonCached } from "@/lib/server/httpCache";

export async function GET() {
  const payload = await fetchDashboardData();
  return jsonCached(payload, 10);
}
