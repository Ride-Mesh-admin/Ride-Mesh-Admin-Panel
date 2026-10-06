export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string;
  subscribedAt: string;
  createdAtMs: number;
};

export type NewsletterCampaignStatus = "queued" | "sending" | "sent" | "partial" | "failed";

export type NewsletterCampaign = {
  id: string;
  subject: string;
  preview: string;
  status: NewsletterCampaignStatus;
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  providerError?: string | null;
  createdAt: string;
  createdAtMs: number;
};
