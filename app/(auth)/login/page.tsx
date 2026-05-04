"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { RideMeshIcon } from "@/components/layout/RideMeshIcon";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!response.ok) {
        setError(data.error || "Sign-in failed.");
        return;
      }
      const from = searchParams.get("from");
      const safeFrom = from && from.startsWith("/") && !from.startsWith("//") ? from : "/dashboard";
      router.replace(safeFrom);
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand">
            <RideMeshIcon className="h-8 w-8 text-brand-contrast" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">RideMesh Admin</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to the operations console</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-login-email" className="mb-1.5 block text-xs font-medium text-text-secondary">
              Email
            </label>
            <input
              id="admin-login-email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary"
              placeholder="you@ridemesh.app"
            />
          </div>
          <div>
            <label htmlFor="admin-login-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
              Password
            </label>
            <input
              id="admin-login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="focus-ring w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="focus-ring w-full rounded-lg bg-brand py-3 text-sm font-semibold text-brand-contrast transition-opacity hover:bg-brand-dark disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
