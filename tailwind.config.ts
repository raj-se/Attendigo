import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#171B26",
          50: "#F4F5F7",
          100: "#E4E6EB",
          200: "#C4C8D2",
          300: "#9BA1B0",
          400: "#6B7284",
          500: "#4A5062",
          600: "#343A4C",
          700: "#232838",
          800: "#171B26",
          900: "#0D0F16",
        },
        paper: {
          DEFAULT: "#F6F3EC",
          dim: "#EAE5D8",
        },
        highlight: {
          DEFAULT: "#F5C344",
          dim: "#F0B929",
        },
        present: {
          DEFAULT: "#3E8F63",
          bg: "#E6F1EA",
        },
        absent: {
          DEFAULT: "#C1503D",
          bg: "#F5E7E3",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "4px",
        DEFAULT: "6px",
        lg: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
