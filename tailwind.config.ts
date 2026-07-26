import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Tokens de marca "Woop" (ver UI_UX System for Woop (1)/src/App.tsx)
        woop: {
          yellow: "#FFC629",
          coral: "#FF6B4A",
          teal: "#17A398",
          indigo: "#16294D",
          cream: "#FFF9EE",
        },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Poppins", "sans-serif"],
        data: ["Inter", "sans-serif"],
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(-1deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        sparkle: {
          "0%, 100%": { opacity: "1", transform: "scale(1) rotate(0deg)" },
          "50%": { opacity: "0.5", transform: "scale(0.8) rotate(20deg)" },
        },
        fall: {
          "0%": { transform: "translateY(-30px) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(850px) rotate(400deg)", opacity: "0" },
        },
        "pop-in": {
          "0%": { opacity: "0", transform: "scale(0.7) translateY(16px)" },
          "100%": { opacity: "1", transform: "scale(1) translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,198,41,0.45)" },
          "100%": { boxShadow: "0 0 0 18px rgba(255,198,41,0)" },
        },
      },
      animation: {
        float: "float 3.2s ease-in-out infinite",
        sparkle: "sparkle 2s ease-in-out infinite",
        "pop-in": "pop-in 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards",
        "slide-up": "slide-up 0.4s ease-out forwards",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
