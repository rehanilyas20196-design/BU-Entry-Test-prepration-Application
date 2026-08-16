import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { subjectConfig } from '@/components/dashboard/SubjectTile';
import { useTheme } from '@/hooks/useTheme';

interface SubjectCardProps {
  name: string;
  questionCount: number;
  accuracy?: number | null;
  onPress?: () => void;
  index?: number;
}

export function SubjectCard({ name, questionCount, accuracy, onPress, index: _index = 0 }: SubjectCardProps) {
  const { colors } = useTheme();
  const cfg = subjectConfig(name);
  const hasAccuracy = accuracy != null;

  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={name}
        style={({ pressed }) => [pressed && { backgroundColor: colors.surfaceAlt }]}
      >
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: cfg.accent.ring }]}>
            <MaterialCommunityIcons name={cfg.icon} size={19} color={cfg.accent.main} />
          </View>
          <View style={styles.titleWrap}>
            <AppText variant="label" numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              {name}
            </AppText>
            <AppText variant="micro" color="muted" style={styles.count}>
              {questionCount} questions
            </AppText>
          </View>
          {hasAccuracy && (
            <View style={[styles.accuracyBadge, { backgroundColor: colors.successLight }]}>
              <AppText variant="micro" style={{ color: accuracy >= 70 ? colors.success : colors.textSecondary }}>
                {Math.round(accuracy)}%
              </AppText>
            </View>
          )}
          <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
        </View>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { width: 252 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  titleWrap: { flex: 1, gap: 1 },
  title: { fontWeight: '500' },
  count: { fontWeight: '400' },
  accuracyBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
  },
});
