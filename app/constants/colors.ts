export const COLORS = {
  primary: {
    50:  '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },

  // Light mode surfaces
  light: {
    bg:           '#f1f5f9',   // page canvas (slightly tinted so cards pop)
    bgCard:       '#ffffff',   // sidebar + cards + panels
    border:       '#e2e8f0',
    textPrimary:  '#0f172a',
    textSecondary:'#475569',
    textMuted:    '#94a3b8',
  },

  // Semantic accent colors
  accent: {
    blue:    '#3b82f6',
    cyan:    '#06b6d4',
    amber:   '#f59e0b',
    emerald: '#10b981',
    rose:    '#f43f5e',
  },

  // Nav item tokens
  nav: {
    activeBgLight:   '#eff6ff',   // primary-50
    activeTextLight: '#2563eb',   // primary-600
    activeBorder:    '#3b82f6',   // primary-500
    hoverBgLight:    '#f8fafc',   // slate-50
  },
} as const;

export type Colors = typeof COLORS;
