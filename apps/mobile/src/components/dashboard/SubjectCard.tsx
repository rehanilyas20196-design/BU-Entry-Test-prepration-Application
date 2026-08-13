import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Subject3DIcon } from '@/components/ui/Subject3DIcon';
import { subjectConfig } from '@/components/dashboard/SubjectTile';
import { Feather } from '@expo/vector-icons';

interface SubjectCardProps {
  name: string;
  questionCount: number;
  accuracy?: number | null;
  onPress?: () => void;
}

export function SubjectCard({ name, questionCount, accuracy, onPress }: SubjectCardProps) {
  const { colors } = useTheme();
  const hasAccuracy = accuracy != null;
  const cfg = subjectConfig(name);

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={name}>
      <Card elevated={false} style={styles.card}>
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
            <Subject3DIcon emoji={cfg.emoji} size={22} />
          </View>
          <AppText variant="label" style={{ flex: 1 }}>
            {name}
          </AppText>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </View>
        <View style={styles.footer}>
          <AppText variant="small" color="muted">
            {questionCount} questions
          </AppText>
          {hasAccuracy && (
            <View style={styles.accuracy}>
              <ProgressBar progress={(accuracy ?? 0) / 100} height={4} style={{ flex: 1 }} />
              <AppText variant="micro" color={accuracy >= 70 ? 'success' : 'secondary'}>
                {Math.round(accuracy)}%
              </AppText>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { gap: 6 },
  accuracy: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
