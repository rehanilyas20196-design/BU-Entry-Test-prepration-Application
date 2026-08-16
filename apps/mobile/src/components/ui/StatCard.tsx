import React from 'react';
import { StyleSheet, View } from 'react-native';
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
}

export function StatCard({ label, value, icon, accent, sub }: StatCardProps) {
  const { colors } = useTheme();
  const accentColor = accent ?? colors.primary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: accentColor + '14' }]}>{icon}</View>
        )}
        <View style={styles.content}>
          <AppText variant="micro" color="muted">
            {label}
          </AppText>
          <AppText variant="bodyMedium" style={[styles.value, { color: colors.text }]}>
            {value}
          </AppText>
          {sub && (
            <AppText variant="small" color="muted" numberOfLines={1}>
              {sub}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: radius.md },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
  iconWrap: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 1 },
  value: { fontSize: 18, lineHeight: 24, fontWeight: '500' },
});
