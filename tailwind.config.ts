// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "DM Sans", "system-ui", "sans-serif"],
      },
      colors: {
        accent: {
          DEFAULT: "#6366f1",
          light:   "#eef2ff",
          dark:    "#312e81",
        },
      },
      animation: {
        "slide-up":   "slideUp 0.3s ease forwards",
        "slide-down": "slideDown 0.3s ease forwards",
        "fade-in":    "fadeIn 0.25s ease forwards",
        "pulse-ring": "pulseRing 2s infinite",
      },
      keyframes: {
        slideUp:   { from: { opacity:"0", transform:"translateY(16px)" }, to: { opacity:"1", transform:"translateY(0)" } },
        slideDown: { from: { opacity:"0", transform:"translateY(-10px)" }, to: { opacity:"1", transform:"translateY(0)" } },
        fadeIn:    { from: { opacity:"0" }, to: { opacity:"1" } },
        pulseRing: {
          "0%":   { boxShadow: "0 0 0 0 rgba(99,102,241,0.4)" },
          "70%":  { boxShadow: "0 0 0 10px rgba(99,102,241,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(99,102,241,0)" },
        },
      },
      borderRadius: { "2xl": "16px", "3xl": "24px" },
    },
  },
  plugins: [],
};

export default config;
