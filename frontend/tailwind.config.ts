import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        aurum: {
          black: "#050505",
          graphite: "#101114",
          panel: "#15171c",
          border: "#2a2518",
          gold: "#f5c542",
          goldSoft: "#d7a92f",
          amber: "#ffb020",
          muted: "#9ca3af"
        }
      },
      boxShadow: {
        aurum: "0 0 40px rgba(245, 197, 66, 0.12)",
        panel: "0 24px 80px rgba(0,0,0,0.35)"
      },
      backgroundImage: {
        aurumGlow: "radial-gradient(circle at top right, rgba(245,197,66,0.18), transparent 35%), radial-gradient(circle at bottom left, rgba(215,169,47,0.10), transparent 30%)"
      }
    }
  },
  plugins: []
};

export default config;
