/**
 * RideMesh design tokens — light mode matches Figma (orange primary, white surfaces).
 * Dark mode mirrors the admin console palette. CSS variables in `app/globals.css` stay in sync.
 */
const common = {
  background: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceVariant: "#F5F5F5",
  text: "#1A1A1A",
  textSecondary: "#4A4A4A",
  textMuted: "#9CA3AF",
  border: "#E5E7EB",
  borderLight: "#F3F4F6",
  error: "#DC2626",
  success: "#16A34A",
  warning: "#D97706",
} as const;

const auth = {
  overlay: "rgba(0,0,0,0.4)",
  bottomBg: "#3D2914",
  bottomBgSolid: "#4A3520",
  textOnDark: "#FFFFFF",
  textMutedOnDark: "rgba(255,255,255,0.85)",
} as const;

const primary = {
  main: "#FF7918",
  dark: "#D54D02",
  light: "#F97316",
  contrast: "#FFFFFF",
} as const;

const rider = {
  primary: primary.main,
  primaryDark: primary.dark,
  primaryLight: "#FFF7ED",
  accent: primary.light,
  badge: primary.main,
} as const;

const host = {
  primary: primary.main,
  primaryDark: primary.dark,
  primaryLight: "#FFF7ED",
  accent: primary.light,
  badge: primary.main,
} as const;

export const ridemeshColors = {
  common,
  auth,
  primaryPalette: primary,
  rider,
  host,
  ...common,
  primary: primary.main,
  primaryDark: primary.dark,
  primaryContrast: primary.contrast,
  secondary: common.textSecondary,
};

export default ridemeshColors;
