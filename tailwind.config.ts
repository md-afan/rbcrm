import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111111",
        ocean: "#000000",
        sky: "#f3f3f3",
        sand: "#fafafa",
        coral: "#4b4b4b",
        moss: "#2f2f2f"
      },
      boxShadow: {
        soft: "0 18px 40px rgba(0, 0, 0, 0.08)"
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(rgba(17, 17, 17, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(17, 17, 17, 0.06) 1px, transparent 1px)"
      }
    }
  },
  plugins: []
};

export default config;
