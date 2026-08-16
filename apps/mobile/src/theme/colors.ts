/**
 * BUET Prep AI — design tokens (light, professional, academic).
 *
 * One blue primary accent. Neutral grays for structure.
 * Semantic colors only where meaningful (success / warning / danger / info).
 */

export const palette = {
  // Primary — single blue accent
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#DBEAFE',
  // Accent — same blue (one accent, applied consistently)
  accent: '#2563EB',
  accentLight: '#DBEAFE',
  // Secondary — neutral slate, not a competing accent
  secondary: '#64748B',
  secondaryLight: '#F1F5F9',
  // Legacy gradient stops (kept for compatibility; resolved to blue)
  gradientStart: '#2563EB',
  gradientMid: '#3B82F6',
  gradientEnd: '#60A5FA',
  heroGradientStart: '#2563EB',
  heroGradientMid: '#3B82F6',
  heroGradientEnd: '#60A5FA',
  // Legacy accent (teal) — kept for compatibility
  accentTeal: '#0D9488',
  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',
  // Neutrals
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#94A3B8',
  // Glass overlays (kept for compatibility)
  glassLight: 'rgba(255,255,255,0.92)',
  glassBorderLight: 'rgba(226,232,240,0.9)',
  // Neutrals (dark) — kept for compatibility; app is light-only
  backgroundDark: '#F8FAFC',
  surfaceDark: '#FFFFFF',
  surfaceAltDark: '#F1F5F9',
  borderDark: '#E2E8F0',
  textDark: '#111827',
  textSecondaryDark: '#4B5563',
  textMutedDark: '#94A3B8',
  glassDark: 'rgba(255,255,255,0.92)',
  glassBorderDark: 'rgba(226,232,240,0.9)',
  gradientStartDark: '#2563EB',
  gradientMidDark: '#3B82F6',
  gradientEndDark: '#60A5FA',
  heroGradientStartDark: '#2563EB',
  heroGradientMidDark: '#3B82F6',
  heroGradientEndDark: '#60A5FA',
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

/** Dark theme maps to the same light palette — the app is light-only. */
export const darkColors: ThemeColors = { ...lightColors, isDark: true };
