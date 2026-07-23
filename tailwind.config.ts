import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf1fb",
          100: "#d0e0f7",
          500: "#0057b8",
          600: "#0046ad",
          700: "#003da5",
        },
        accent: {
          400: "#ffd54a",
          500: "#ffc629",
          600: "#f0b400",
        },
      },
    },
  },
  plugins: [],
};
export default config;
