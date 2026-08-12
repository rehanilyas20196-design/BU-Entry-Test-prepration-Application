import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';

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
    <Card elevated={false} padded={false} style={[styles.card, { borderColor: colors.border }]}>
      <View style={styles.row}>
        {icon && (
          <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>{icon}</View>
        )}
        <View style={styles.content}>
          <AppText variant="micro" color="muted">
            {label}
          </AppText>
          <AppText variant="h3" style={{ color: colors.text }}>
            {value}
          </AppText>
          {sub && (
            <AppText variant="small" color="muted">
              {sub}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, gap: 2 },
});
