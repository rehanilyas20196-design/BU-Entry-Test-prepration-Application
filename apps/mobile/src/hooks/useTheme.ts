import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/stores/settingsStore';
import { darkColors, lightColors, ThemeColors } from '@/theme/colors';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const system = useColorScheme();
  const preference = useSettingsStore((s) => s.themePreference);
  const isDark =
    preference === 'system' ? system === 'dark' : preference === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}
