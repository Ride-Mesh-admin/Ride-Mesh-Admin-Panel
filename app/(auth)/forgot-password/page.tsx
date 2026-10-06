"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);
    try {
      const res = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        devResetUrl?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Request failed.");
        return;
      }
      setMessage(data.message || "Check your email for a reset link.");
      if (data.devResetUrl) setDevResetUrl(data.devResetUrl);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-mesh-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-8">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-extrabold tracking-[0.06em] text-text-primary">RIDE MESH</h1>
            <p className="mt-1 text-sm text-text-secondary">Reset admin password</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Admin email
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
                placeholder="you@ridemesh.app"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                {error}
              </p>
            )}
            {message && (
              <p className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success" role="status">
                {message}
              </p>
            )}
            {devResetUrl && (
              <p className="break-all rounded-xl border border-brand/40 bg-brand-soft px-3 py-2 text-xs text-text-primary">
                Dev reset link:{" "}
                <a href={devResetUrl} className="font-medium text-brand underline">
                  {devResetUrl}
                </a>
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="focus-ring brand-surface-glow w-full rounded-xl bg-brand py-3 text-sm font-semibold text-brand-contrast disabled:opacity-60"
            >
              {submitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-text-secondary">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
