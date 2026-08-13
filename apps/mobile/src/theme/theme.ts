import { Platform } from 'react-native';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
};

export const typography = {
  // Display
  display: { fontSize: 32, lineHeight: 38, fontWeight: '800' as const },
  // Headings
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 18, lineHeight: 24, fontWeight: '700' as const },
  // Body
  body: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
  // Labels
  label: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' as const },
};

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: { elevation: 2 },
    default: {},
  }),
  subtle: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: { elevation: 1 },
    default: {},
  }),
  elevated: Platform.select({
    ios: {
      shadowColor: '#312E81',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.18,
      shadowRadius: 24,
    },
    android: { elevation: 10 },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 18,
    },
    android: { elevation: 8 },
    default: {},
  }),
  glow: Platform.select({
    ios: {
      shadowColor: '#7C3AED',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    android: { elevation: 12 },
    default: {},
  }),
};

export const gradients = {
  primary: ['#6366F1', '#7C3AED', '#A855F7'] as const,
  hero: ['#4F46E5', '#7C3AED', '#A855F7'] as const,
  success: ['#16A34A', '#0D9488'] as const,
  warning: ['#F59E0B', '#F97316'] as const,
  info: ['#0EA5E9', '#6366F1'] as const,
  danger: ['#E11D48', '#F97316'] as const,
  dark: ['#1E1B4B', '#312E81', '#4C1D95'] as const,
};

export const motion = {
  // Spec §11: entrances 300–700ms, micro 150–300ms, transitions 400–800ms
  micro: 180,
  fast: 300,
  standard: 450,
  slow: 650,
  entrance: 650,
  transition: 600,
  // Springs (spec §7)
  spring: { damping: 18, stiffness: 180, mass: 0.8 },
  springSnappy: { damping: 22, stiffness: 260, mass: 0.7 },
  springBouncy: { damping: 12, stiffness: 140, mass: 0.9 },
  // Stagger
  stagger: 60,
  staggerFast: 36,
};

export const zIndex = {
  base: 1,
  content: 10,
  modal: 50,
  overlay: 100,
  nav: 200,
  toast: 300,
};
