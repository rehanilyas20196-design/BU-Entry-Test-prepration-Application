import { lightColors, ThemeColors } from '@/theme/colors';

/**
 * The app is light-only (professional, academic look).
 * Dark scheme is intentionally disabled.
 */
export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  return { colors: lightColors, isDark: false };
}
