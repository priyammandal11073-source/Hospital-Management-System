/** @type {import('tailwindcss').Config} */
export default {
  future: {
    hoverOnlyWhenSupported: true,
  },
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        control: "#7b8b91",
        slate: {
          400: "#52656e",
          500: "#475569",
        },
        gray: {
          400: "#52656e",
          500: "#475569",
        },
        amber: {
          500: "#92400e",
          600: "#854d0e",
          700: "#78350f",
          800: "#78350f",
        },
        yellow: {
          500: "#854d0e",
          600: "#713f12",
        },
        emerald: {
          500: "#047857",
          600: "#065f46",
          700: "#064e3b",
        },
        rose: {
          500: "#be123c",
          600: "#9f1239",
          700: "#881337",
        },
        red: {
          500: "#b91c1c",
          600: "#991b1b",
        },
        blue: {
          500: "#1d4ed8",
          600: "#1e40af",
        },
        sky: {
          500: "#0369a1",
          600: "#0284c7",
          700: "#0369a1",
        },
        indigo: {
          500: "#4338ca",
          600: "#3730a3",
        },
        purple: {
          500: "#6b21a8",
          600: "#581c87",
        },
        primary: {
          DEFAULT: "#0F766E",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
        },
        secondary: {
          DEFAULT: "#0F766E",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#0891B2",
          600: "#0F766E",
          700: "#10B981",
          800: "#059669",
          900: "#047857",
        },
      },
      fontFamily: {
        sans: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "Geist",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "Geist Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      transitionTimingFunction: {
        'ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'ease-in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
        'ease-drawer': 'cubic-bezier(0.32, 0.72, 0, 1)',
        'ease-spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.15)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
        drawer: '280ms',
      },
    },
  },
  plugins: [],
};
