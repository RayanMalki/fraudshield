import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./context/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Surface palette for the dark theme
        surface: {
          base: "#030712",    // gray-950
          card: "#111827",    // gray-900
          elevated: "#1f2937", // gray-800
          border: "#374151",  // gray-700
        },
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "bar-grow": {
          "0%": { width: "0%" },
          "100%": { width: "var(--bar-width)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.35s ease-out forwards",
        "fade-in": "fade-in 0.25s ease-out forwards",
        "bar-grow": "bar-grow 0.8s cubic-bezier(0.4,0,0.2,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
