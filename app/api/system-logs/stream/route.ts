import { fetchSystemLogsData } from "@/lib/server/adminBackend";
import { jsonCached } from "@/lib/server/httpCache";

export async function GET() {
  const payload = await fetchSystemLogsData();
  return jsonCached(payload, 12);
}
