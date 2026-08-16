import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useTheme } from '@/hooks/useTheme';

const GOLD = {
  base: '#B45309',
  soft: '#D97706',
  ring: '#FDE68A',
};

interface PremiumCardProps {
  onPress: () => void;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
}

export function PremiumCard({
  onPress,
  style,
  title = 'Go Premium',
  subtitle = 'Unlock every feature and ace the BUET',
}: PremiumCardProps) {
  const { colors } = useTheme();

  return (
    <Card style={[styles.card, style]}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Upgrade to Premium"
        style={({ pressed }) => [pressed && { backgroundColor: colors.warningLight }]}
      >
        <View style={styles.row}>
          <View style={styles.crownWrap}>
            <MaterialCommunityIcons name="crown" size={22} color={GOLD.base} />
          </View>
          <View style={styles.textWrap}>
            <AppText variant="label" style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {title}
            </AppText>
            <AppText variant="caption" color="secondary" numberOfLines={1}>
              {subtitle}
            </AppText>
          </View>
          <View style={styles.pill}>
            <AppText variant="caption" style={styles.pillText}>Upgrade</AppText>
            <MaterialCommunityIcons name="chevron-right" size={15} color={GOLD.base} />
          </View>
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderColor: '#FDE68A' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  crownWrap: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: GOLD.ring,
  },
  textWrap: { flex: 1, gap: 1 },
  title: { fontWeight: '500' },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: GOLD.ring,
  },
  pillText: { color: GOLD.base, fontWeight: '500' },
});
