import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080F19",
        panel: "#111827",
        panelHover: "#1E293B",
        accent: {
          DEFAULT: "#2563EB",
          purple: "#7C3AED",
          cyan: "#22D3EE",
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))',
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.5)',
        'neon-blue': '0 0 10px rgba(37, 99, 235, 0.5)',
        'neon-purple': '0 0 10px rgba(124, 58, 237, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};

export default config;
