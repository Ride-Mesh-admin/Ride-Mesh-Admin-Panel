export type RideStatus =
  | "under_review"
  | "active"
  | "reported"
  | "flagged_ai";

export interface RideListItem {
  id: string;
  title: string;
  subtitle?: string;
  rideId: string;
  postedAgo: string;
  hostName: string;
  hostAvatarColor: string;
  hostRating: number;
  reportCount: number;
  status: RideStatus;
}

export interface ReportLogEntry {
  id: string;
  title: string;
  timestamp: string;
  description: string;
}

export interface HostReputation {
  memberSince: string;
  ridesHosted: number;
  pastWarnings: number;
}

export interface RideDetail {
  id: string;
  rideId: string;
  riskLevel?: "high" | "medium" | "low";
  title: string;
  description: string;
  pickup: string;
  dropoff: string;
  reportCount: number;
  reportLogs: ReportLogEntry[];
  hostReputation: HostReputation;
}
