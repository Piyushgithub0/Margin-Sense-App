import { Platform } from 'react-native';

export const Colors = {
  // Backgrounds — clean white with crisp light surfaces
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceCard: '#F8FAFC',
  surfaceHighlight: 'rgba(22, 163, 74, 0.08)',

  // Primary accent — vibrant emerald green (profit, success, primary triggers)
  primary: '#16A34A',
  primaryCyan: '#16A34A',      // legacy alias kept for zero-diff compat
  primaryGlow: 'rgba(22, 163, 74, 0.18)',

  // Secondary accent — electric royal blue (tech intelligence, links, secondary)
  secondary: '#2563EB',
  secondaryPurple: '#2563EB',  // legacy alias
  purpleGlow: 'rgba(37, 99, 235, 0.15)',

  // Text — deep crisp black on white
  textPrimary: '#09090B',
  textMuted: '#64748B',
  textSecondary: '#334155',

  // Borders — sleek modern subtle borders
  borderSubtle: '#E2E8F0',
  borderCyan: 'rgba(22, 163, 74, 0.35)',    // legacy alias
  borderPurple: 'rgba(37, 99, 235, 0.35)',  // legacy alias
  borderBlue: 'rgba(37, 99, 235, 0.35)',

  // Semantic
  error: '#EF4444',
  errorBackground: 'rgba(239, 68, 68, 0.08)',
  warning: '#F59E0B',
  warningBackground: 'rgba(245, 158, 11, 0.08)',
  success: '#16A34A',

  // Status Colors (green & blue centric)
  statusQueued: '#64748B',
  statusOcr: '#2563EB',
  statusProcessing: '#16A34A',
  statusIndexed: '#16A34A',
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
