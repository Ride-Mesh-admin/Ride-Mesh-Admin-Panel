import type { RideReport } from "@/lib/types/report";

export const recentReports: RideReport[] = [
  { id: "REP-8821", userName: "Elena Fisher", driverName: "Sam Drake", severity: "high", status: "pending" },
  { id: "REP-8819", userName: "Joel Miller", driverName: "Tommy M.", severity: "medium", status: "in_review" },
  { id: "REP-8815", userName: "Arthur Morgan", driverName: "John M.", severity: "low", status: "resolved" },
];
