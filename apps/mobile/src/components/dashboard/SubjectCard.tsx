import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { subjectConfig } from '@/components/dashboard/SubjectTile';
import { useTheme } from '@/hooks/useTheme';
import { timingTokens } from '@/theme/tokens';

interface SubjectCardProps {
  name: string;
  questionCount: number;
  accuracy?: number | null;
  onPress?: () => void;
  index?: number;
}

export function SubjectCard({ name, questionCount, accuracy, onPress, index = 0 }: SubjectCardProps) {
  const { colors } = useTheme();
  const cfg = subjectConfig(name);
  const hasAccuracy = accuracy != null;

  const reveal = useSharedValue(0);
  const press = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    reveal.value = withDelay(index * timingTokens.stagger, withTiming(1, { duration: 480, easing: Easing.out(Easing.cubic) }));
  }, [index, reveal]);

  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 14 }],
  }));

  const iconLiftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -press.value * 2.5 }],
  }));

  const onPressIn = () => {
    press.value = withSpring(1, { damping: 20, stiffness: 340, mass: 0.6 });
    sweep.value = 0;
    sweep.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 260, mass: 0.7 });
  };

  const iconColor = colors.isDark ? cfg.accent.soft : cfg.accent.main;

  return (
    <Animated.View style={[styles.wrap, revealStyle]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel={name}
        style={styles.pressable}
      >
        <GlassPanel
          accent={[cfg.accent.soft, cfg.accent.main]}
          accentOpacity={0.18}
          press={press}
          sweep={sweep}
          radius={20}
        >
          <View style={styles.header}>
            <View style={[styles.iconWrap, { borderColor: colors.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.6)' }]}>
              <Animated.View style={iconLiftStyle}>
                <MaterialCommunityIcons name={cfg.icon} size={19} color={iconColor} />
              </Animated.View>
            </View>
            <View style={styles.titleWrap}>
              <AppText variant="label" numberOfLines={1} style={styles.title}>
                {name}
              </AppText>
              <AppText variant="micro" color="muted" style={styles.count}>
                {questionCount} questions
              </AppText>
            </View>
            {hasAccuracy && (
              <View style={styles.accuracyBadge}>
                <AppText variant="micro" style={{ color: accuracy >= 70 ? colors.success : colors.textSecondary }}>
                  {Math.round(accuracy)}%
                </AppText>
              </View>
            )}
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
          </View>
        </GlassPanel>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: 252 },
  pressable: { borderRadius: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 14 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  titleWrap: { flex: 1, gap: 1 },
  title: { fontWeight: '700' },
  count: { fontWeight: '500' },
  accuracyBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
    backgroundColor: 'rgba(22,163,74,0.1)',
  },
});
