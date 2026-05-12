import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        surface: "#FFFFFF",
        sidebar: "#0A1628",
        "sidebar-hover": "#112240",
        primary: {
          DEFAULT: "#00C9B1",
          hover: "#00b09b",
          light: "#e6f9f7",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)",
        "card-hover": "0 4px 12px 0 rgba(0,0,0,0.12)",
        "teal-glow": "0 0 16px rgba(0,201,177,0.35)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
