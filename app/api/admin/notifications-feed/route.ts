import { fetchAdminNotificationFeed } from "@/lib/server/adminBackend";
import { jsonCached } from "@/lib/server/httpCache";

export async function GET() {
  const items = await fetchAdminNotificationFeed();
  return jsonCached({ items }, 10);
}
