import React from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';
import { AppText } from '@/components/ui/AppText';
import { radius } from '@/theme/theme';

const TABS: Record<string, { icon: keyof typeof Feather.glyphMap; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  learn: { icon: 'book-open', label: 'Learn' },
  practice: { icon: 'edit-3', label: 'Practice' },
  mock: { icon: 'clipboard', label: 'Mock' },
  guide: { icon: 'map', label: 'Guide' },
  profile: { icon: 'user', label: 'Profile' },
};

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { isWeb, isDesktop } = useResponsive();

  const handlePress = (routeName: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeName,
      canPreventDefault: true,
    });
    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View
        style={[
          styles.bar,
          { backgroundColor: colors.surface, borderColor: colors.border },
          isWeb && isDesktop && styles.barWide,
        ]}
      >
        {state.routes.map((route, idx) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === idx;
          return (
            <Pressable
              key={route.key}
              onPress={() => handlePress(route.name, focused)}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={cfg.label}
              style={({ pressed }) => [
                styles.tab,
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
            >
              <Feather
                name={cfg.icon}
                size={20}
                color={focused ? colors.primary : colors.textMuted}
              />
              <AppText
                variant="micro"
                style={{ color: focused ? colors.primary : colors.textMuted, fontWeight: '500' }}
              >
                {cfg.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    alignItems: 'center',
    zIndex: 200,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.md,
    paddingVertical: 6,
    width: '100%',
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  barWide: { maxWidth: 480, alignSelf: 'center' },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
});
