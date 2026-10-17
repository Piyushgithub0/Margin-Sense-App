import { Platform } from 'react-native';

export const Colors = {
  // Backgrounds — deep black with a barely-there green tint
  background: '#080C08',
  surface: '#0E1410',
  surfaceElevated: '#141C14',
  surfaceCard: 'rgba(255, 255, 255, 0.03)',
  surfaceHighlight: 'rgba(34, 197, 94, 0.06)',

  // Primary accent — vibrant emerald green
  primary: '#22C55E',
  primaryCyan: '#22C55E',      // legacy alias kept for zero-diff compat
  primaryGlow: 'rgba(34, 197, 94, 0.18)',

  // Secondary — a muted sage/lime for softer accents
  secondary: '#4ADE80',
  secondaryPurple: '#4ADE80',  // legacy alias
  purpleGlow: 'rgba(74, 222, 128, 0.12)',

  // Text — near-white on dark
  textPrimary: '#F0F4F0',
  textMuted: '#6B7A6B',
  textSecondary: '#9CAE9C',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.07)',
  borderCyan: 'rgba(34, 197, 94, 0.28)',    // legacy alias
  borderPurple: 'rgba(74, 222, 128, 0.22)', // legacy alias

  // Semantic
  error: '#EF4444',
  errorBackground: 'rgba(239, 68, 68, 0.1)',
  warning: '#F59E0B',
  warningBackground: 'rgba(245, 158, 11, 0.08)',
  success: '#22C55E',

  // Status Colors (green-centric)
  statusQueued: '#6B7A6B',
  statusOcr: '#4ADE80',
  statusProcessing: '#22C55E',
  statusIndexed: '#22C55E',
} as const;

export const Fonts = {
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    web: 'monospace',
    default: 'monospace',
  }),
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    web: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    default: 'System',
  }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};
