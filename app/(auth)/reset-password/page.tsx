"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { PasswordInput } from "@/components/ui/PasswordInput";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "Reset failed.");
        return;
      }
      setMessage(data.message || "Password updated.");
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-danger">This reset link is missing or invalid.</p>
        <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="reset-new-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
          New password
        </label>
        <PasswordInput
          id="reset-new-password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={10}
          className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
        />
      </div>
      <div>
        <label htmlFor="reset-confirm-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
          Confirm password
        </label>
        <PasswordInput
          id="reset-confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={10}
          className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
        />
      </div>
      <p className="text-xs text-text-secondary">At least 10 characters, including a letter and a number.</p>
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
      <button
        type="submit"
        disabled={submitting}
        className="focus-ring brand-surface-glow w-full rounded-xl bg-brand py-3 text-sm font-semibold text-brand-contrast disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-mesh-bg flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-8">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-extrabold tracking-[0.06em] text-text-primary">RIDE MESH</h1>
            <p className="mt-1 text-sm text-text-secondary">Choose a new admin password</p>
          </div>
          <Suspense fallback={<p className="text-sm text-text-secondary">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
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
