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
        background: "#0F0F0F",
        "background-sidebar": "#121212",
        surface: "#1E1E1E",
        border: "#2A2A2A",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A1A1AA",
        brand: "#FF7918",
        "brand-dark": "#D54D02",
        success: "#22C55E",
        danger: "#EF4444",
        warning: "#F59E0B",
        teal: "#14B8A6",
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
