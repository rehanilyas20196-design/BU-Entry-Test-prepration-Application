import React from 'react';
import { Pressable, StyleSheet, View, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
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

function TabItem({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: keyof typeof Feather.glyphMap;
  focused: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const reduced = useReducedMotion();
  const progress = useSharedValue(focused ? 1 : 0);
  const pressed = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 220 });
  }, [focused, progress]);

  const itemStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + progress.value * 0.06 + pressed.value * -0.04 }],
  }));

  const pillStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.7 + progress.value * 0.3 }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.65,
    transform: [{ translateY: progress.value * 2 }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => {
        if (reduced) return;
        pressed.value = withTiming(1, { duration: 80 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 120 });
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      style={styles.tab}
      android_ripple={{ color: 'transparent' }}
    >
      <Animated.View style={[styles.iconWrap, itemStyle]}>
        {focused && (
          <Animated.View style={[styles.pill, pillStyle]}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <Feather name={icon} size={22} color={focused ? '#FFFFFF' : colors.textMuted} />
      </Animated.View>
      <Animated.View style={textStyle}>
        <AppText
          variant="micro"
          style={{ color: focused ? colors.primary : colors.textMuted }}
        >
          {label}
        </AppText>
      </Animated.View>
    </Pressable>
  );
}

export function FloatingTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

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
      style={[styles.container, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      <View
        style={[
          styles.bar,
          {
            backgroundColor: colors.glass,
            borderColor: colors.glassBorder,
            shadowColor: colors.secondary,
          },
        ]}
      >
        {state.routes.map((route, idx) => {
          const cfg = TABS[route.name];
          if (!cfg) return null;
          const focused = state.index === idx;
          return (
            <TabItem
              key={route.key}
              label={cfg.label}
              icon={cfg.icon}
              focused={focused}
              onPress={() => handlePress(route.name, focused)}
            />
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
    paddingHorizontal: 18,
    alignItems: 'center',
    zIndex: 200,
  },
  bar: {
    flexDirection: 'row',
    borderRadius: radius.xl,
    paddingVertical: 8,
    paddingHorizontal: 6,
    width: '100%',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 22,
    elevation: Platform.select({ android: 18, default: 12 }),
    borderWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: 4,
  },
  iconWrap: {
    width: 44,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: 17,
    overflow: 'hidden',
  },
});