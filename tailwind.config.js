const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [
    heroui({
      themes: {
        // ── Light ────────────────────────────────────────────────────────────
        light: {
          colors: {
            background: "#f1f5f9",   // COLORS.light.bg
            foreground: "#0f172a",   // COLORS.light.textPrimary
            divider:    "#e2e8f0",   // COLORS.light.border

            // All cards / panels use COLORS.light.bgCard
            content1:   "#ffffff",
            content2:   "#f8fafc",
            content3:   "#f1f5f9",
            content4:   "#e2e8f0",

            // Neutral scale for hover states, inputs, badges
            default: {
              50:  "#f8fafc",
              100: "#f1f5f9",
              200: "#e2e8f0",
              300: "#cbd5e1",
              400: "#94a3b8",
              500: "#64748b",
              600: "#475569",
              700: "#334155",
              800: "#1e293b",
              900: "#0f172a",
              DEFAULT: "#e2e8f0",
              foreground: "#0f172a",
            },

            primary: {
              50:  "#eff6ff",
              100: "#dbeafe",
              200: "#bfdbfe",
              300: "#93c5fd",
              400: "#60a5fa",
              500: "#3b82f6",
              600: "#2563eb",
              700: "#1d4ed8",
              DEFAULT: "#2563eb",
              foreground: "#ffffff",
            },
            focus: "#2563eb",
          },
        },

        // ── Dark ─────────────────────────────────────────────────────────────
        dark: {
          colors: {
            background: "#020812",   // COLORS.dark.bg
            foreground: "#f1f5f9",   // COLORS.dark.textPrimary
            divider:    "#1e293b",   // COLORS.dark.border

            // Cards = COLORS.dark.bgCard — matches sidebar tone
            content1:   "#0d1424",
            content2:   "#080f1e",
            content3:   "#1a2744",
            content4:   "#1e293b",

            // Neutral scale — dark mode inputs & hover states
            default: {
              50:  "#0d1424",
              100: "#1a2744",
              200: "#1e293b",
              300: "#334155",
              400: "#475569",
              500: "#64748b",
              600: "#94a3b8",
              700: "#cbd5e1",
              800: "#e2e8f0",
              900: "#f1f5f9",
              DEFAULT: "#1a2744",
              foreground: "#f1f5f9",
            },

            primary: {
              50:  "#172554",
              100: "#1e3a8a",
              200: "#1e40af",
              300: "#1d4ed8",
              400: "#2563eb",
              500: "#3b82f6",
              600: "#60a5fa",
              700: "#93c5fd",
              DEFAULT: "#3b82f6",
              foreground: "#ffffff",
            },
            focus: "#3b82f6",
          },
        },
      },
    }),
  ],
};
