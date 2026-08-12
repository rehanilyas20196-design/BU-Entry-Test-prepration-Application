import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface TopicCardProps {
  name: string;
  subjectName?: string;
  attempted: number;
  accuracy: number | null;
  onPress?: () => void;
}

export function TopicCard({ name, subjectName, attempted, accuracy, onPress }: TopicCardProps) {
  const { colors } = useTheme();
  const acc = accuracy ?? 0;
  const accColor = acc >= 75 ? colors.success : acc >= 50 ? colors.warning : colors.danger;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
      <Card elevated={false} style={styles.card}>
        <View style={styles.row}>
          <View style={styles.info}>
            <AppText variant="label">{name}</AppText>
            <AppText variant="small" color="muted">
              {subjectName ?? 'General'} · {attempted} attempts
            </AppText>
          </View>
          <AppText variant="h3" style={{ color: accColor }}>
            {attempted > 0 ? `${Math.round(acc)}%` : '—'}
          </AppText>
        </View>
        {attempted > 0 && <ProgressBar progress={acc / 100} height={6} color={accColor} />}
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1, gap: 2 },
});
