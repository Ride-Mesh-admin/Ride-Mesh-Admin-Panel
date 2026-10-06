import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp, type App, type ServiceAccount } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

let cachedApp: App | null = null;
let initError: string | null = null;

function serviceAccountFromEnv(): ServiceAccount | null {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey };
}

function resolveServiceAccountPath(): string | null {
  const candidates = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    resolve(process.cwd(), "serviceAccount.json"),
    resolve(process.cwd(), "ride-mesh-firebase-adminsdk.json"),
    resolve(process.cwd(), "..", "ride-mesh-firebase-adminsdk-fbsvc-350a8fa8e1.json"),
    resolve(process.cwd(), "..", "functions", "serviceAccount.json"),
  ].filter(Boolean) as string[];

  for (const path of candidates) {
    if (existsSync(path)) return path;
  }
  return null;
}

function serviceAccountFromFile(): ServiceAccount | null {
  const path = resolveServiceAccountPath();
  if (!path) return null;
  try {
    const raw = JSON.parse(readFileSync(path, "utf8")) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };
    if (!raw.project_id || !raw.client_email || !raw.private_key) return null;
    return {
      projectId: raw.project_id,
      clientEmail: raw.client_email,
      privateKey: raw.private_key,
    };
  } catch {
    return null;
  }
}

function getServiceAccount(): ServiceAccount | null {
  return serviceAccountFromEnv() || serviceAccountFromFile();
}

export function getFirebaseInitError(): string | null {
  return initError;
}

export function isFirebaseAdminReady(): boolean {
  try {
    getAdminApp();
    return true;
  } catch {
    return false;
  }
}

export function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  if (getApps().length) {
    cachedApp = getApps()[0]!;
    return cachedApp;
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount) {
    initError =
      "Firebase Admin credentials missing. Set FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY, or FIREBASE_SERVICE_ACCOUNT_PATH to a service-account JSON.";
    throw new Error(initError);
  }

  try {
    cachedApp = initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
    initError = null;
    return cachedApp;
  } catch (err) {
    initError = err instanceof Error ? err.message : "Failed to initialize Firebase Admin";
    throw err;
  }
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Quiet helper for health UI — does not throw. */
export function probeFirebaseAdmin(): { ok: boolean; projectId?: string; error?: string } {
  try {
    const app = getAdminApp();
    return { ok: true, projectId: app.options.projectId };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
