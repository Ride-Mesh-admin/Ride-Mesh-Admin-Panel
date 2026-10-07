import type { DocumentData } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/server/firebaseAdmin";

const GET_ALL_CHUNK = 100;

/** Batch-get documents by id (chunks of 100). Avoids full collection scans for joins. */
export async function getDocsByIds(
  collectionName: string,
  ids: Iterable<string>,
): Promise<Map<string, DocumentData>> {
  const unique = [...new Set([...ids].filter(Boolean))];
  const out = new Map<string, DocumentData>();
  if (!unique.length) return out;

  const db = getAdminDb();
  for (let i = 0; i < unique.length; i += GET_ALL_CHUNK) {
    const chunk = unique.slice(i, i + GET_ALL_CHUNK);
    const refs = chunk.map((id) => db.collection(collectionName).doc(id));
    const snaps = await db.getAll(...refs);
    for (const snap of snaps) {
      if (snap.exists) out.set(snap.id, snap.data() as DocumentData);
    }
  }
  return out;
}

export function logFirestoreReads(route: string, approxReads: number): void {
  if (process.env.NODE_ENV === "development" || process.env.ADMIN_LOG_READS === "1") {
    console.info(`[firestore] ${route} ~${approxReads} reads`);
  }
}
