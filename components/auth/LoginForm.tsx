"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";

type DevCredentials = { email: string; password: string; note?: string };

export function LoginForm({ devCredentials }: { devCredentials?: DevCredentials | null }) {
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

  function fillDevCredentials() {
    if (!devCredentials) return;
    setEmail(devCredentials.email);
    setPassword(devCredentials.password);
    setError(null);
  }

  return (
    <div className="page-mesh-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-4 animate-fade-up">
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-8">
          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="text-xl font-extrabold tracking-[0.06em] text-text-primary">RIDE MESH</h1>
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
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary"
                placeholder="admin@ride-mesh.app"
              />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <label htmlFor="admin-login-password" className="block text-xs font-medium text-text-secondary">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-medium text-brand hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="admin-login-password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary"
                placeholder="••••••••"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring brand-surface-glow w-full rounded-xl bg-brand py-3 text-sm font-semibold text-brand-contrast transition hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        {devCredentials ? (
          <div
            className="feature-card-glow rounded-2xl border border-dashed border-brand/40 bg-brand-soft p-5"
            data-testid="dev-login-hint"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-brand">Development only</p>
            <p className="mt-1 text-sm text-text-secondary">
              {devCredentials.note || "Use these credentials to sign in locally."}
            </p>
            <dl className="mt-4 space-y-3 rounded-xl border border-border/60 bg-surface px-3 py-3 font-mono text-sm">
              <div>
                <dt className="text-xs text-text-secondary">Email</dt>
                <dd className="mt-0.5 break-all text-text-primary">{devCredentials.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-text-secondary">Password</dt>
                <dd className="mt-0.5 break-all text-text-primary">{devCredentials.password}</dd>
              </div>
            </dl>
            <button
              type="button"
              onClick={fillDevCredentials}
              className="focus-ring mt-4 w-full rounded-xl border border-brand/40 bg-surface py-2.5 text-sm font-medium text-brand transition-colors hover:bg-brand hover:text-brand-contrast"
            >
              Fill sign-in form
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
