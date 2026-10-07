"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { UsersIcon, SendIcon, ChatIcon } from "@/components/icons/AppIcons";
import { useAdminQuery, invalidateAdminQuery } from "@/lib/client/useAdminQuery";
import { useDebouncedValue } from "@/lib/client/debounce";
import type { NewsletterCampaign, NewsletterSubscriber } from "@/lib/types/newsletter";

type Payload = {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
  source?: "live" | "mock";
};

const STATUS_STYLE: Record<NewsletterCampaign["status"], string> = {
  queued: "bg-warning/15 text-warning border-warning/30",
  sending: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  sent: "bg-success/15 text-success border-success/30",
  partial: "bg-brand/15 text-brand border-brand/30",
  failed: "bg-danger/15 text-danger border-danger/30",
};

async function fetchNewsletter(): Promise<Payload> {
  const res = await fetch("/api/admin/newsletter", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load newsletter");
  return (await res.json()) as Payload;
}

export default function NewsletterPage() {
  const { data, loading, reload } = useAdminQuery<Payload>({
    key: "newsletter",
    fetcher: fetchNewsletter,
    refreshInterval: 90_000,
    staleTime: 25_000,
  });
  const subscribers = data?.subscribers ?? [];
  const campaigns = data?.campaigns ?? [];

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 200);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter((s) => s.email.includes(q) || s.source.includes(q));
  }, [debouncedSearch, subscribers]);

  async function handleSend(event: React.FormEvent) {
    event.preventDefault();
    setSending(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/admin/newsletter", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, body }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        sent?: number;
        failed?: number;
        queued?: boolean;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "Could not send campaign.");
        return;
      }
      if (data.queued) {
        setMessage(
          `Campaign queued for ${subscribers.length} subscribers. Add RESEND_API_KEY to deliver live email.`,
        );
      } else {
        setMessage(`Sent ${data.sent ?? 0} · Failed ${data.failed ?? 0}`);
      }
      setSubject("");
      setBody("");
      invalidateAdminQuery("newsletter");
      await reload();
    } catch {
      setError("Network error — try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Newsletter</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Email people who subscribed on the landing page.
          </p>
          <p className="mt-2 rounded-xl border border-border bg-surface-variant/40 px-3 py-2 text-xs leading-snug text-text-secondary">
            Sending from <code className="text-[11px]">support@ride-mesh.app</code>. For best inbox
            placement, mark the first few messages as <strong>Not spam</strong> in Gmail, and keep your
            Resend domain verified (SPF/DKIM).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              invalidateAdminQuery("newsletter");
              void reload();
            }}
            className="focus-ring inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text-primary hover:bg-surface-variant"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="h-12 animate-pulse rounded-xl bg-border/60" />
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="h-12 animate-pulse rounded-xl bg-border/60" />
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <div className="h-12 animate-pulse rounded-xl bg-border/60" />
            </div>
          </>
        ) : (
          <>
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-5 hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <UsersIcon size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Subscribers</p>
              <p className="text-2xl font-extrabold text-text-primary">{subscribers.length}</p>
            </div>
          </div>
        </div>
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-5 hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <ChatIcon size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Campaigns</p>
              <p className="text-2xl font-extrabold text-text-primary">{campaigns.length}</p>
            </div>
          </div>
        </div>
        <div className="feature-card-glow rounded-2xl border border-border bg-surface p-5 hover:border-brand/40">
          <div className="flex items-center gap-3">
            <div className="icon-tile">
              <SendIcon size={20} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-text-secondary">Delivered</p>
              <p className="text-2xl font-extrabold text-text-primary">
                {campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <form
          onSubmit={handleSend}
          className="feature-card-glow rounded-2xl border border-border bg-surface p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary">Compose campaign</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Sends to all current newsletter subscribers ({subscribers.length}).
          </p>

          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="nl-subject" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Subject
              </label>
              <input
                id="nl-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
                placeholder="Spring trail season kicks off"
                className="focus-ring w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            <div>
              <label htmlFor="nl-body" className="mb-1.5 block text-xs font-medium text-text-secondary">
                Message
              </label>
              <textarea
                id="nl-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
                rows={10}
                placeholder="Write the email body…"
                className="focus-ring w-full resize-y rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-text-primary"
              />
            </div>
            {error && (
              <p className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
            )}
            {message && (
              <p className="rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">{message}</p>
            )}
            <button
              type="submit"
              disabled={sending || subscribers.length === 0}
              className="focus-ring brand-surface-glow inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-3 text-sm font-semibold text-brand-contrast hover:bg-brand-dark disabled:opacity-60"
            >
              <SendIcon size={18} />
              {sending ? "Sending…" : `Send to ${subscribers.length} subscribers`}
            </button>
          </div>
        </form>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-text-primary">Subscribers</h2>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email…"
                className="focus-ring w-44 rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-border/60" />
                ))
              ) : filtered.length === 0 ? (
                <p className="text-sm text-text-secondary">No subscribers yet.</p>
              ) : (
                filtered.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium text-text-primary">{sub.email}</p>
                      <p className="text-xs text-text-secondary">
                        {sub.source} · {sub.subscribedAt}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="mb-4 text-lg font-semibold text-text-primary">Recent campaigns</h2>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {campaigns.length === 0 ? (
                <p className="text-sm text-text-secondary">No campaigns yet.</p>
              ) : (
                campaigns.map((campaign) => (
                  <div key={campaign.id} className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-text-primary">{campaign.subject}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{campaign.preview}</p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-medium uppercase ${STATUS_STYLE[campaign.status]}`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-text-secondary">
                      {campaign.createdAt} · {campaign.sentCount}/{campaign.recipientCount} sent
                    </p>
                    {campaign.providerError ? (
                      <p className="mt-2 text-xs leading-snug text-danger">{campaign.providerError}</p>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
