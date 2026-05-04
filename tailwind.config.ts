import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        "background-sidebar": "var(--background-sidebar)",
        surface: "var(--surface)",
        "surface-variant": "var(--surface-variant)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        brand: "var(--brand)",
        "brand-dark": "var(--brand-dark)",
        "brand-light": "var(--brand-light)",
        "brand-contrast": "var(--brand-contrast)",
        success: "var(--success)",
        danger: "var(--danger)",
        warning: "var(--warning)",
        teal: "var(--teal)",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        pill: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
