export const palette = {
  // Primary (indigo — professional, academic)
  primary: '#4F46E5',
  primaryDark: '#4338CA',
  primaryLight: '#EEF2FF',
  // Accent (teal)
  accent: '#0D9488',
  // Semantic
  success: '#16A34A',
  successLight: '#DCFCE7',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#0284C7',
  infoLight: '#E0F2FE',
  // Neutrals (light)
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  // Neutrals (dark)
  backgroundDark: '#0B1120',
  surfaceDark: '#111A2E',
  surfaceAltDark: '#1E293B',
  borderDark: '#2B3A55',
  textDark: '#E2E8F0',
  textSecondaryDark: '#94A3B8',
  textMutedDark: '#64748B',
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
  accent: string;
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
  accent: palette.accent,
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
  accent: '#2DD4BF',
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
