export const palette = {
  // Primary (deep indigo — professional, academic)
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  // Secondary (electric violet)
  secondary: '#7C3AED',
  secondaryLight: '#F3EEFF',
  // Accent (soft blue)
  accent: '#38BDF8',
  accentLight: '#E0F2FE',
  // Legacy accent (teal) — kept for compatibility
  accentTeal: '#0D9488',
  // Gradient stops
  gradientStart: '#6366F1',
  gradientMid: '#7C3AED',
  gradientEnd: '#A855F7',
  heroGradientStart: '#4F46E5',
  heroGradientMid: '#7C3AED',
  heroGradientEnd: '#A855F7',
  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#E11D48',
  dangerLight: '#FFE4E6',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  // Neutrals (light)
  background: '#F6F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EEF0F6',
  border: '#E4E7F0',
  text: '#101428',
  textSecondary: '#4B5268',
  textMuted: '#969DB4',
  // Glass overlays
  glassLight: 'rgba(255,255,255,0.62)',
  glassBorderLight: 'rgba(255,255,255,0.75)',
  // Neutrals (dark)
  backgroundDark: '#0A0E1F',
  surfaceDark: '#141A33',
  surfaceAltDark: '#1D2542',
  borderDark: '#27304F',
  textDark: '#E6E9F5',
  textSecondaryDark: '#A5AECB',
  textMutedDark: '#6C7592',
  // Glass overlays (dark)
  glassDark: 'rgba(20,26,51,0.6)',
  glassBorderDark: 'rgba(255,255,255,0.12)',
  // Dark gradient stops
  gradientStartDark: '#6366F1',
  gradientMidDark: '#7C3AED',
  gradientEndDark: '#C026D3',
  heroGradientStartDark: '#312E81',
  heroGradientMidDark: '#6D28D9',
  heroGradientEndDark: '#A855F7',
};

export type ThemeColors = {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  heroGradientStart: string;
  heroGradientMid: string;
  heroGradientEnd: string;
  glass: string;
  glassBorder: string;
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  warningLight: string;
  info: string;
  infoLight: string;
  isDark: boolean;
};

export const lightColors: ThemeColors = {
  background: palette.background,
  surface: palette.surface,
  surfaceAlt: palette.surfaceAlt,
  border: palette.border,
  text: palette.text,
  textSecondary: palette.textSecondary,
  textMuted: palette.textMuted,
  primary: palette.primary,
  primaryDark: palette.primaryDark,
  primaryLight: palette.primaryLight,
  secondary: palette.secondary,
  secondaryLight: palette.secondaryLight,
  accent: palette.accent,
  accentLight: palette.accentLight,
  gradientStart: palette.gradientStart,
  gradientMid: palette.gradientMid,
  gradientEnd: palette.gradientEnd,
  heroGradientStart: palette.heroGradientStart,
  heroGradientMid: palette.heroGradientMid,
  heroGradientEnd: palette.heroGradientEnd,
  glass: palette.glassLight,
  glassBorder: palette.glassBorderLight,
  success: palette.success,
  successLight: palette.successLight,
  danger: palette.danger,
  dangerLight: palette.dangerLight,
  warning: palette.warning,
  warningLight: palette.warningLight,
  info: palette.info,
  infoLight: palette.infoLight,
  isDark: false,
};

export const darkColors: ThemeColors = {
  background: palette.backgroundDark,
  surface: palette.surfaceDark,
  surfaceAlt: palette.surfaceAltDark,
  border: palette.borderDark,
  text: palette.textDark,
  textSecondary: palette.textSecondaryDark,
  textMuted: palette.textMutedDark,
  primary: '#818CF8',
  primaryDark: '#6366F1',
  primaryLight: '#1E1B4B',
  secondary: '#A78BFA',
  secondaryLight: '#2E1A5E',
  accent: '#2DD4BF',
  accentLight: '#0C4A6E',
  gradientStart: palette.gradientStartDark,
  gradientMid: palette.gradientMidDark,
  gradientEnd: palette.gradientEndDark,
  heroGradientStart: palette.heroGradientStartDark,
  heroGradientMid: palette.heroGradientMidDark,
  heroGradientEnd: palette.heroGradientEndDark,
  glass: palette.glassDark,
  glassBorder: palette.glassBorderDark,
  success: '#4ADE80',
  successLight: '#14532D',
  danger: '#F87171',
  dangerLight: '#7F1D1D',
  warning: '#FBBF24',
  warningLight: '#78350F',
  info: '#38BDF8',
  infoLight: '#0C4A6E',
  isDark: true,
};
