import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';

export type QuickActionAccent = { main: string; soft: string; ring: string };
export type QuickActionTone = 'primary' | 'secondary' | 'info' | 'utility';
export type QuickActionIcon = keyof typeof MaterialCommunityIcons.glyphMap;

interface QuickActionCardProps {
  label: string;
  subtitle: string;
  icon: QuickActionIcon;
  accent: QuickActionAccent;
  tone?: QuickActionTone;
  index: number;
  badge?: QuickActionIcon;
  onPress: () => void;
  style?: ViewStyle;
}

export function QuickActionCard({
  label,
  subtitle,
  icon,
  accent,
  tone = 'secondary',
  index: _index,
  badge,
  onPress,
  style,
}: QuickActionCardProps) {
  const { colors } = useTheme();
  const emphasis = tone === 'primary';

  return (
    <Card style={[styles.card, emphasis && { borderColor: colors.primary }, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={({ pressed }) => [pressed && { backgroundColor: colors.surfaceAlt }]}
      >
        <View style={styles.content}>
          <View style={[styles.iconWrap, { backgroundColor: emphasis ? colors.primaryLight : accent.ring }]}>
            <MaterialCommunityIcons name={icon} size={19} color={emphasis ? colors.primary : accent.main} />
          </View>

          <View style={styles.textWrap}>
            <AppText variant="label" numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {label}
            </AppText>
            <AppText variant="small" color="muted" style={styles.subtitle}>
              {subtitle}
            </AppText>
          </View>

          {badge ? (
            <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
              <MaterialCommunityIcons name={badge} size={13} color={colors.textSecondary} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '100%' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 15,
  },
  iconWrap: {
    width: 42, height: 42,
    borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontWeight: '500' },
  subtitle: { lineHeight: 15 },
  badge: {
    width: 26, height: 26,
    borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
});
