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
        manor: {
          50: "#fdfbf6",
          100: "#f8f4ec",
          200: "#efe9d8",
          300: "#e2d9bf",
          400: "#d0c49e",
          500: "#b8a87e",
          600: "#9e8e63",
          700: "#82744f",
          800: "#6a5e40",
          900: "#574d35"
        },
        cream: {
          DEFAULT: "#fdfcf8",
          warm: "#faf7f0",
          cool: "#f8f5ef"
        },
        sage: {
          50: "#f5f8f4",
          100: "#e8f0e5",
          200: "#d0e0cb",
          300: "#b1caaa",
          400: "#9bb895",
          500: "#7d9b76",
          600: "#6d8b66",
          700: "#587253",
          800: "#475d43",
          900: "#3a4c37"
        },
        gold: {
          50: "#fdf9f2",
          100: "#f9efd8",
          200: "#f2e2b4",
          300: "#e8cc85",
          400: "#d4b860",
          500: "#c9a84e",
          600: "#b8963e",
          700: "#957932",
          800: "#7a6329",
          900: "#655222"
        },
        rose: {
          50: "#fdf7f5",
          100: "#f9ebe7",
          200: "#f2d5ce",
          300: "#e6b5a9",
          400: "#da9589",
          500: "#c97a6c",
          600: "#af6456",
          700: "#8f5045",
          800: "#75423a",
          900: "#603731"
        },
        ink: {
          DEFAULT: "#4a4540",
          deep: "#2c2820",
          soft: "#767068",
          muted: "#a0988e",
          faint: "#c7c0b6"
        }
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "Inter",
          "MiSans",
          "HarmonyOS Sans SC",
          "PingFang SC",
          "Microsoft YaHei UI",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        "manor-sm": "0 1px 2px rgba(44, 40, 32, 0.04)",
        "manor-md": "0 2px 16px rgba(44, 40, 32, 0.05)",
        "manor-lg": "0 8px 32px rgba(44, 40, 32, 0.07)",
        "manor-sage": "0 2px 10px rgba(125, 155, 118, 0.22)",
        "manor-gold": "0 2px 10px rgba(184, 150, 62, 0.22)",
        "manor-bubble-user": "0 2px 12px rgba(125, 155, 118, 0.2)",
        "manor-bubble-friend": "0 1px 3px rgba(44, 40, 32, 0.03), 0 0 0 1px rgba(184, 150, 62, 0.04)"
      },
      borderRadius: {
        manor: "16px",
        "manor-lg": "22px",
        "manor-xl": "30px"
      },
      transitionTimingFunction: {
        "manor-spring": "cubic-bezier(0.34, 1.36, 0.48, 1)"
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" }
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.34, 1.36, 0.48, 1) both",
        "fade-in": "fade-in 0.3s ease both"
      }
    }
  },
  plugins: []
};

export default config;
