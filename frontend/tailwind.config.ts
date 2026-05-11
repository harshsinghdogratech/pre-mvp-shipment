import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F1F5F9",
        surface: "#FFFFFF",
        sidebar: "#1C2B4B",
        "sidebar-hover": "#243459",
        primary: {
          DEFAULT: "#F97316",
          hover: "#EA6C0A",
          light: "#FFF7ED",
        },
        accent: {
          DEFAULT: "#F97316",
          purple: "#7C3AED",
          cyan: "#06B6D4",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.12)",
        "orange-glow": "0 0 16px rgba(249,115,22,0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
