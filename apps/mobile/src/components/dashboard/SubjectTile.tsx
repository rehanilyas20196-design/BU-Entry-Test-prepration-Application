import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Subject3DIcon } from '@/components/ui/Subject3DIcon';
import { useTheme } from '@/hooks/useTheme';

export interface SubjectTileConfig {
  icon: keyof typeof Feather.glyphMap;
  emoji: string;
  gradient: readonly [string, string, ...string[]];
}

const DEFAULT_CONFIG: SubjectTileConfig = {
  icon: 'book-open',
  emoji: '📖',
  gradient: ['#6366F1', '#7C3AED', '#A855F7'],
};

export function subjectConfig(name: string): SubjectTileConfig {
  const n = name.toLowerCase();
  if (n.includes('english') || n.includes('verbal')) return { icon: 'message-square', emoji: '📚', gradient: ['#0EA5E9', '#6366F1'] };
  if (n.includes('math')) return { icon: 'hash', emoji: '🧮', gradient: ['#6366F1', '#7C3AED', '#A855F7'] };
  if (n.includes('phys')) return { icon: 'zap', emoji: '⚡', gradient: ['#F59E0B', '#F97316'] };
  if (n.includes('chem')) return { icon: 'droplet', emoji: '🧪', gradient: ['#10B981', '#059669'] };
  if (n.includes('bio')) return { icon: 'activity', emoji: '🧬', gradient: ['#EC4899', '#DB2777'] };
  if (n.includes('iq') || n.includes('intel')) return { icon: 'cpu', emoji: '🧠', gradient: ['#8B5CF6', '#D946EF'] };
  if (n.includes('analyt') || n.includes('reason')) return { icon: 'git-branch', emoji: '🧩', gradient: ['#06B6D4', '#0891B2'] };
  if (n.includes('islam')) return { icon: 'moon', emoji: '🕌', gradient: ['#10B981', '#0D9488'] };
  if (n.includes('pakist') || n.includes('general')) return { icon: 'globe', emoji: '🌍', gradient: ['#3B82F6', '#2563EB'] };
  return DEFAULT_CONFIG;
}

interface SubjectTileProps {
  name: string;
  questionCount: number;
  accuracy?: number | null;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SubjectTile({ name, questionCount, accuracy, onPress, style }: SubjectTileProps) {
  const { colors } = useTheme();
  const cfg = subjectConfig(name);
  const hasAccuracy = accuracy != null;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={({ pressed }) => [styles.press, pressed && styles.pressed, style]}
    >
      <GlassCard gradient={cfg.gradient} style={styles.card}>
        <View style={styles.cardInner}>
          <View style={styles.iconCircle}>
            <Subject3DIcon emoji={cfg.emoji} />
          </View>
          <AppText variant="label" style={styles.name} numberOfLines={2}>
            {name}
          </AppText>
          <AppText variant="micro" style={styles.count}>
            {questionCount} questions
          </AppText>
          {hasAccuracy && (
            <View style={styles.accuracy}>
              <View style={[styles.accuracyDot, { backgroundColor: colors.glass }]} />
              <AppText variant="micro" style={styles.count}>{Math.round(accuracy)}% accuracy</AppText>
            </View>
          )}
        </View>
      </GlassCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: 16, width: 158 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.94 },
  card: { padding: 14, height: 150, justifyContent: 'space-between' },
  cardInner: { gap: 6 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  name: { color: '#FFF', marginTop: 6 },
  count: { color: 'rgba(255,255,255,0.82)' },
  accuracy: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  accuracyDot: { width: 6, height: 6, borderRadius: 3 },
});