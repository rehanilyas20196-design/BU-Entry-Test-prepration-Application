import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
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
  const iconColor = colors.isDark ? cfg.accent.soft : cfg.accent.main;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={name}
      style={({ pressed }) => [styles.press, pressed && styles.pressed, style]}
    >
      <GlassPanel
        accent={[cfg.accent.soft, cfg.accent.main]}
        accentOpacity={0.22}
        radius={20}
        style={styles.card}
      >
        <View style={styles.cardInner}>
          <View style={[styles.iconCircle, { borderColor: colors.isDark ? 'rgba(255,255,255,0.16)' : 'rgba(255,255,255,0.6)' }]}>
            <MaterialCommunityIcons name={cfg.icon} size={20} color={iconColor} />
          </View>
          <AppText variant="label" style={styles.name} numberOfLines={2}>
            {name}
          </AppText>
          <AppText variant="micro" color="muted" style={styles.count}>
            {questionCount} questions
          </AppText>
          {hasAccuracy && (
            <View style={styles.accuracy}>
              <View style={[styles.accuracyDot, { backgroundColor: iconColor }]} />
              <AppText variant="micro" color="muted" style={styles.count}>{Math.round(accuracy)}% accuracy</AppText>
            </View>
          )}
        </View>
      </GlassPanel>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: 20, width: 158 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.96 },
  card: { height: 150, justifyContent: 'center' },
  cardInner: { flex: 1, justifyContent: 'space-between', gap: 6, padding: 14 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderWidth: StyleSheet.hairlineWidth,
  },
  name: { marginTop: 4 },
  count: { fontWeight: '500' },
  accuracy: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  accuracyDot: { width: 6, height: 6, borderRadius: 3 },
});
