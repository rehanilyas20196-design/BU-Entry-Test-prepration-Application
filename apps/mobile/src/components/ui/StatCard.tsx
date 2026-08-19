import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { radius } from '@/theme/theme';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  accent?: string;
  sub?: string;
  horizontal?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ label, value, icon, accent, sub, horizontal, style }: StatCardProps) {
  const { colors } = useTheme();
  const accentColor = accent ?? colors.primary;

  if (horizontal) {
    return (
      <Card padded={false} style={[styles.card, style]}>
        <View style={styles.hRow}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: accentColor + '14' }]}>{icon}</View>
          )}
          <AppText variant="micro" color="muted" numberOfLines={1} style={styles.hLabel}>
            {label}
          </AppText>
          <AppText variant="bodyMedium" style={[styles.hValue, { color: colors.text }]} numberOfLines={1}>
            {value}
          </AppText>
        </View>
      </Card>
    );
  }

  return (
    <Card padded={false} style={[styles.card, style]}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          {icon && (
            <View style={[styles.iconWrap, { backgroundColor: accentColor + '14' }]}>{icon}</View>
          )}
          <AppText variant="bodyMedium" style={[styles.value, { color: colors.text }]} numberOfLines={1}>
            {value}
          </AppText>
        </View>
        <AppText variant="micro" color="muted" numberOfLines={1}>
          {label}
        </AppText>
        {sub && (
          <AppText variant="small" color="muted" numberOfLines={1}>
            {sub}
          </AppText>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: radius.md },
  inner: { padding: 12, gap: 3 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  iconWrap: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  value: { fontSize: 18, lineHeight: 24, fontWeight: '600', flexShrink: 1 },
  hRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 13, minWidth: 0 },
  hLabel: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 16 },
  hValue: { fontSize: 16, lineHeight: 22, fontWeight: '700', flexShrink: 0 },
});
