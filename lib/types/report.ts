export type Severity = "high" | "medium" | "low";
export type ReportStatus = "pending" | "in_review" | "resolved";

export interface RideReport {
  id: string;
  userName: string;
  driverName: string;
  severity: Severity;
  status: ReportStatus;
}
