import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f6f3",
          100: "#eeece6",
          200: "#d9d5ca",
          300: "#bfb9a8",
          400: "#9e9681",
          500: "#7d7560",
          600: "#5f5947",
          700: "#423f33",
          800: "#2b2922",
          900: "#1a1916",
        },
        clay: {
          50: "#faf7f2",
          100: "#f3ece1",
          200: "#e6d8c4",
          300: "#d4bd9d",
          400: "#bf9d72",
          500: "#a87f50",
          600: "#8a6640",
          700: "#6b4f33",
          800: "#4d3925",
          900: "#2e2218",
        },
        sage: {
          50: "#f4f7f4",
          100: "#e3ece4",
          200: "#c7d8ca",
          300: "#9fbc9f",
          400: "#729672",
          500: "#527552",
          600: "#3f5d3f",
          700: "#334a33",
          800: "#283828",
          900: "#1a241a",
        },
      },
      fontFamily: {
        sans: [
          "LXGW WenKai",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
        serif: [
          "Noto Serif SC",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        mono: ["SFMono-Regular", "Consolas", "Liberation Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,25,22,0.04), 0 4px 12px rgba(26,25,22,0.04)",
        lift: "0 2px 4px rgba(26,25,22,0.06), 0 8px 24px rgba(26,25,22,0.06)",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-out",
        slideUp: "slideUp 0.35s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
