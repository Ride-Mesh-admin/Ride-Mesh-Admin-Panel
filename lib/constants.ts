export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/users", label: "Users", icon: "Users" },
  { href: "/rides", label: "Rides", icon: "Car" },
  { href: "/safety-alerts", label: "Safety", icon: "AlertTriangle" },
  { href: "/newsletter", label: "Newsletter", icon: "Mail" },
  { href: "/system-logs", label: "System Logs", icon: "FileText" },
  { href: "/account", label: "Account", icon: "Shield" },
] as const;

export const USERS_PER_PAGE = 5;

export const SEVERITY_CONFIG = {
  high: { label: "High", color: "text-danger", dotColor: "bg-danger" },
  medium: { label: "Medium", color: "text-warning", dotColor: "bg-warning" },
  low: { label: "Low", color: "text-teal", dotColor: "bg-teal" },
} as const;

export const STATUS_CONFIG = {
  pending: { label: "PENDING", color: "bg-teal/20 text-teal border-teal/30" },
  in_review: { label: "IN REVIEW", color: "bg-warning/20 text-warning border-warning/30" },
  resolved: { label: "RESOLVED", color: "bg-success/20 text-success border-success/30" },
} as const;

export const USER_ROLE_CONFIG = {
  rider: { label: "RIDER", color: "bg-blue-500/90 text-brand-contrast" },
  host: { label: "HOST", color: "bg-brand text-brand-contrast" },
} as const;

export const USER_STATUS_CONFIG = {
  active: { label: "Active", dotColor: "bg-success", textColor: "text-text-primary" },
  suspended: { label: "Suspended", dotColor: "bg-text-secondary", textColor: "text-text-primary" },
} as const;

export const AVATAR_COLORS: Record<string, string> = {
  orange: "bg-brand",
  purple: "bg-purple-600",
  teal: "bg-teal",
  green: "bg-green-600",
  blue: "bg-blue-500",
};

export const RIDE_STATUS_CONFIG: Record<
  "under_review" | "active" | "reported" | "flagged_ai" | "approved" | "cancelled" | "blacklisted",
  { label: string; color: string }
> = {
  under_review: { label: "UNDER REVIEW", color: "bg-warning/20 text-warning border-warning/30" },
  active: { label: "ACTIVE", color: "bg-success/20 text-success border-success/30" },
  reported: { label: "REPORTED", color: "bg-warning/20 text-warning border-warning/30" },
  flagged_ai: { label: "FLAGGED (AI)", color: "bg-text-secondary/30 text-text-secondary border-border" },
  approved: { label: "APPROVED", color: "bg-success/30 text-success border-success/40" },
  cancelled: { label: "CANCELLED", color: "bg-danger/20 text-danger border-danger/30" },
  blacklisted: { label: "BLACKLISTED", color: "bg-danger/25 text-danger border-danger/40" },
};

export const SAFETY_ALERT_TYPE_CONFIG: Record<
  "sos_critical" | "help_signal" | "manual_sos",
  { label: string; badgeClass: string; messageIconColor: string }
> = {
  sos_critical: { label: "SOS CRITICAL", badgeClass: "bg-brand text-brand-contrast", messageIconColor: "text-danger" },
  help_signal: { label: "HELP SIGNAL", badgeClass: "bg-warning text-text-primary", messageIconColor: "text-warning" },
  manual_sos: { label: "MANUAL SOS", badgeClass: "bg-blue-500 text-brand-contrast", messageIconColor: "text-blue-400" },
};
