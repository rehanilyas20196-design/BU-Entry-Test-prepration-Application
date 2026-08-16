import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';

export type PracticeAccent = { main: string; soft: string; ring: string };
export type PracticeEffect = 'zap' | 'target' | 'activity' | 'calendar' | 'clock' | 'shield' | 'undo';
export type PracticeModeIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface PracticeModeCardProps {
  label: string;
  subtitle: string;
  icon: PracticeModeIcon;
  accent: PracticeAccent;
  effect: PracticeEffect;
  index: number;
  wide?: boolean;
  premium?: boolean;
  onPress: () => void;
}

export function PracticeModeCard({
  label,
  subtitle,
  icon,
  accent,
  index: _index,
  wide = false,
  premium = false,
  onPress,
}: PracticeModeCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.card, wide && styles.cardWide]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [pressed && { backgroundColor: colors.surfaceAlt }]}
      >
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: accent.ring }]}>
            <MaterialCommunityIcons name={icon} size={19} color={accent.main} />
          </View>

          <View style={styles.textWrap}>
            <AppText variant="label" numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {label}
            </AppText>
            <AppText variant="small" color="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>

          {premium && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.warningLight }]}>
              <MaterialCommunityIcons name="crown" size={11} color={colors.warning} />
            </View>
          )}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '100%' },
  cardWide: { flexBasis: '100%' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  premiumBadge: {
    width: 22,
    height: 22,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: 40, height: 40,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontWeight: '500' },
  subtitle: { lineHeight: 15 },
});
