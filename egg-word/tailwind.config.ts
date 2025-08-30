import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sage: {
          50: '#f4f6f5',
          100: '#e8ece9',
          200: '#d4ddd6',
          300: '#b1c2b7',
          400: '#8fa199',
          500: '#6e8b74',
          600: '#5a725f',
          700: '#4a5e4f',
          800: '#3d4d42',
          900: '#344039',
        },
        greige: {
          50: '#fafafa',
          100: '#f7f7f7',
          200: '#e9ecea',
          300: '#d1d5d3',
          400: '#a6aaa8',
          500: '#898d8b',
          600: '#6c706e',
          700: '#4a4e4c',
          800: '#2d302f',
          900: '#1a1c1b',
        },
        // フランス風・北欧風のくすみカラー
        nordic: {
          bg: '#CBCBBD',      // さらに濃いオフホワイト背景（2倍濃く）
          text: '#333333',     // 濃いグレー文字
          input: '#E6E0DA',    // グレージュ入力欄
          orange: '#FF7B54',   // くすみオレンジボタン
          mustard: '#D4A017',  // マスタードhover
          olive: '#4A5D23',    // こいオリーブ（名言エリア用）
        },
        tricolore: {
          blue: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          red: {
            50: '#fef2f2',
            100: '#fee2e2',
            200: '#fecaca',
            300: '#fca5a5',
            400: '#f87171',
            500: '#ef4444',
            600: '#dc2626',
            700: '#b91c1c',
            800: '#991b1b',
            900: '#7f1d1d',
          },
          white: '#ffffff',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'serif-jp': ['var(--font-noto-serif-jp)', 'serif'],
        'sans': ['var(--font-geist-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
