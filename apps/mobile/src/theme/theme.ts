import { Platform } from 'react-native';

/**
 * Design tokens — spacing, radius, typography, motion.
 * Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
 * Radius: cards 12px, controls 8px, pills full.
 * Motion: subtle only — 150–200ms hover/active ease transitions.
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const typography = {
  // Display — used sparingly for hero/landing
  display: { fontSize: 30, lineHeight: 38, fontWeight: '500' as const },
  // Headings — weight 500, never bold
  h1: { fontSize: 26, lineHeight: 34, fontWeight: '500' as const },
  h2: { fontSize: 22, lineHeight: 30, fontWeight: '500' as const },
  h3: { fontSize: 18, lineHeight: 26, fontWeight: '500' as const },
  // Body — 14–15px, line-height 1.6
  body: { fontSize: 15, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 15, lineHeight: 24, fontWeight: '500' as const },
  // Labels & meta
  label: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  caption: { fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
  small: { fontSize: 13, lineHeight: 20, fontWeight: '400' as const },
  micro: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

export const shadow = {
  // Cards: thin hairline border, near-flat. No heavy drop shadows.
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 1 },
    default: {},
  }),
  subtle: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 2,
    },
    android: { elevation: 1 },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.1,
      shadowRadius: 10,
    },
    android: { elevation: 4 },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    android: { elevation: 4 },
    default: {},
  }),
};

export const gradients = {
  primary: ['#2563EB', '#3B82F6'] as const,
  hero: ['#2563EB', '#3B82F6'] as const,
  success: ['#16A34A', '#22C55E'] as const,
  warning: ['#D97706', '#F59E0B'] as const,
  info: ['#2563EB', '#3B82F6'] as const,
  danger: ['#DC2626', '#EF4444'] as const,
  dark: ['#1E293B', '#334155'] as const,
};

export const motion = {
  // Hover/active only — 150–200ms ease transitions
  micro: 150,
  fast: 200,
  standard: 250,
  slow: 300,
  entrance: 300,
  transition: 250,
  spring: { damping: 20, stiffness: 200, mass: 0.9 },
  springSnappy: { damping: 22, stiffness: 260, mass: 0.8 },
  springBouncy: { damping: 18, stiffness: 220, mass: 0.9 },
  stagger: 40,
  staggerFast: 24,
};

export const zIndex = {
  base: 1,
  content: 10,
  modal: 50,
  overlay: 100,
  nav: 200,
  toast: 300,
};
