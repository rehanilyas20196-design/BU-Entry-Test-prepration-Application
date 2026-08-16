import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { useTheme } from '@/hooks/useTheme';
import { accents, type AccentColor } from '@/theme/tokens';

export interface SubjectTileConfig {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: AccentColor;
}

const DEFAULT_CONFIG: SubjectTileConfig = {
  icon: 'book-open-variant',
  accent: accents.indigo,
};

export function subjectConfig(name: string): SubjectTileConfig {
  const n = name.toLowerCase();
  if (n.includes('english') || n.includes('verbal')) return { icon: 'message-text-outline', accent: accents.indigo };
  if (n.includes('quant')) return { icon: 'chart-line', accent: accents.teal };
  if (n.includes('math')) return { icon: 'sigma', accent: accents.violet };
  if (n.includes('phys')) return { icon: 'lightning-bolt-outline', accent: accents.amber };
  if (n.includes('chem')) return { icon: 'flask-outline', accent: accents.emerald };
  if (n.includes('bio')) return { icon: 'dna', accent: accents.pink };
  if (n.includes('iq') || n.includes('intel')) return { icon: 'brain', accent: accents.cyan };
  if (n.includes('analyt') || n.includes('reason')) return { icon: 'source-branch', accent: accents.blue };
  if (n.includes('islam')) return { icon: 'moon-waning-crescent', accent: accents.teal };
  if (n.includes('pakist') || n.includes('general')) return { icon: 'earth', accent: accents.blue };
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
      style={({ pressed }) => [
        styles.press,
        { borderColor: colors.border, backgroundColor: colors.surface },
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.cardInner}>
        <View style={[styles.iconCircle, { backgroundColor: cfg.accent.ring }]}>
          <MaterialCommunityIcons name={cfg.icon} size={20} color={cfg.accent.main} />
        </View>
        <AppText variant="label" style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="micro" color="muted" style={styles.count}>
          {questionCount} questions
        </AppText>
        {hasAccuracy && (
          <View style={styles.accuracy}>
            <View style={[styles.accuracyDot, { backgroundColor: cfg.accent.main }]} />
            <AppText variant="micro" color="muted" style={styles.count}>{Math.round(accuracy)}% accuracy</AppText>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: 12, borderWidth: 1, width: 158 },
  pressed: { backgroundColor: '#F1F5F9' },
  cardInner: { flex: 1, justifyContent: 'space-between', gap: 6, padding: 14 },
  iconCircle: {
    width: 40, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  name: { marginTop: 4 },
  count: { fontWeight: '400' },
  accuracy: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  accuracyDot: { width: 6, height: 6, borderRadius: 3 },
});
