"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Shield } from "lucide-react";
import { useAdminPanel } from "@/components/layout/AdminPanelProvider";
import { PasswordInput } from "@/components/ui/PasswordInput";

type Account = {
  email: string;
  name: string;
  role: string;
  updatedAt: string | null;
  passwordUpdatedAt: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AccountPage() {
  const router = useRouter();
  const { updateProfile } = useAdminPanel();
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/account", { cache: "no-store", credentials: "include" });
      const data = (await res.json()) as { ok?: boolean; account?: Account; error?: string };
      if (!res.ok || !data.ok || !data.account) {
        setError(data.error || "Could not load account.");
        return;
      }
      setAccount(data.account);
      setName(data.account.name);
      setEmail(data.account.email);
    } catch {
      setError("Could not load account.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    setSavingProfile(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "profile",
          name,
          email,
          currentPassword: profilePassword,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; account?: Account; error?: string; message?: string };
      if (!res.ok || !data.ok || !data.account) {
        setError(data.error || "Could not update profile.");
        return;
      }
      setAccount(data.account);
      setProfilePassword("");
      setMessage(data.message || "Profile updated.");
      const initials = data.account.name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join("");
      updateProfile({
        name: data.account.name,
        email: data.account.email,
        role: data.account.role,
        initials: initials || "AD",
      });
    } catch {
      setError("Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();
    setSavingPassword(true);
    setMessage(null);
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      setSavingPassword(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/account", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "password",
          currentPassword,
          newPassword,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        requireReauth?: boolean;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not update password.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(data.message || "Password updated.");
      if (data.requireReauth) {
        window.setTimeout(() => {
          router.replace("/login");
          router.refresh();
        }, 900);
      } else {
        void load();
      }
    } catch {
      setError("Could not update password.");
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="page-mesh-bg space-y-6 p-6 animate-fade-up">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Account</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage the admin profile and password. Credentials are stored hashed in Firestore.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
          className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:text-brand"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="feature-card-glow rounded-2xl border border-border bg-surface p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="brand-surface-glow flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-contrast">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Profile</h2>
              <p className="text-xs text-text-secondary">
                Role: {account?.role || "—"} · Password updated {formatWhen(account?.passwordUpdatedAt ?? null)}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="space-y-4">
            <div>
              <label htmlFor="account-name" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Display name
              </label>
              <input
                id="account-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label htmlFor="account-email" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Login email
              </label>
              <input
                id="account-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
              <p className="mt-1.5 text-xs text-text-secondary">
                Password reset emails are sent to this address.
              </p>
            </div>
            <div>
              <label htmlFor="account-profile-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Current password
              </label>
              <PasswordInput
                id="account-profile-password"
                autoComplete="current-password"
                value={profilePassword}
                onChange={(e) => setProfilePassword(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <button
              type="submit"
              disabled={savingProfile || loading}
              className="focus-ring brand-surface-glow rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast disabled:opacity-60"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        <section className="feature-card-glow rounded-2xl border border-border bg-surface p-6">
          <h2 className="mb-1 text-sm font-semibold text-text-primary">Change password</h2>
          <p className="mb-5 text-xs text-text-secondary">
            At least 10 characters, with a letter and a number. Stored with scrypt.
          </p>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label htmlFor="account-current-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Current password
              </label>
              <PasswordInput
                id="account-current-password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label htmlFor="account-new-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
                New password
              </label>
              <PasswordInput
                id="account-new-password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={10}
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label htmlFor="account-confirm-password" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Confirm new password
              </label>
              <PasswordInput
                id="account-confirm-password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={10}
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <button
              type="submit"
              disabled={savingPassword || loading}
              className="focus-ring brand-surface-glow rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast disabled:opacity-60"
            >
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
