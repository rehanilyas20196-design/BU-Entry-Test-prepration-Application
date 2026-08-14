import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { radiusTokens } from '@/theme/tokens';
import { FloatingParticles } from '@/components/ui/FloatingParticles';

const GOLD = {
  base: '#F59E0B',
  soft: '#FDE68A',
  ring: '#FCD34D',
  deep: '#B45309',
};

interface PremiumGateProps {
  feature: string;
  description?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  compact?: boolean;
  onUnlock?: () => void;
  style?: ViewStyle;
}

export function PremiumGate({
  feature,
  description,
  icon = 'crown',
  compact = false,
  onUnlock,
  style,
}: PremiumGateProps) {
  const router = useRouter();

  const goPremium = () => {
    if (onUnlock) onUnlock();
    else router.push('/premium');
  };

  if (compact) {
    return (
      <GlassPanel
        accent={[GOLD.soft, GOLD.base]}
        accentOpacity={0.12}
        radius={radiusTokens.card}
        style={style}
        contentStyle={styles.compactPanel}
      >
        <View style={styles.compactRow}>
          <View style={styles.lockIcon}>
            <MaterialCommunityIcons name={icon} size={20} color={GOLD.base} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="label" numberOfLines={1}>{feature}</AppText>
            <AppText variant="small" color="muted">Premium feature</AppText>
          </View>
          <Pressable
            onPress={goPremium}
            style={({ pressed }) => [styles.unlockBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={`Unlock ${feature} with Premium`}
          >
            <MaterialCommunityIcons name="lock-open-variant" size={15} color="#FFFFFF" />
            <AppText variant="label" style={styles.unlockText}>Unlock</AppText>
          </Pressable>
        </View>
      </GlassPanel>
    );
  }

  return (
    <View style={[styles.wrap, style]}>
      <GlassPanel
        accent={[GOLD.soft, GOLD.base]}
        accentOpacity={0.14}
        radius={24}
        shadowIntensity={0.35}
        contentStyle={styles.panel}
      >
        <LinearGradient
          colors={['#312E81', '#5B21B6', '#7C3AED'] as [string, string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <FloatingParticles count={8} color={GOLD.soft} />
        <View style={styles.content}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name={icon} size={30} color={GOLD.soft} />
          </View>
          <AppText variant="h2" style={styles.title}>Premium feature</AppText>
          <AppText variant="body" style={styles.desc}>
            {feature}. {description ?? 'Upgrade to Premium to unlock this instantly.'}
          </AppText>
          <Pressable
            onPress={goPremium}
            style={({ pressed }) => [styles.cta, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Go Premium"
          >
            <LinearGradient
              colors={['#F59E0B', '#F59E0B', '#D97706'] as [string, string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <MaterialCommunityIcons name="crown" size={18} color="#FFFFFF" />
            <AppText variant="label" style={styles.ctaText}>Go Premium</AppText>
          </Pressable>
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button">
            <AppText variant="small" color="muted" style={{ color: 'rgba(255,255,255,0.7)' }}>Maybe later</AppText>
          </Pressable>
        </View>
      </GlassPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', padding: 20 },
  panel: { padding: 0, overflow: 'hidden' },
  content: { alignItems: 'center', gap: 12, padding: 28, paddingVertical: 40 },
  iconWrap: {
    width: 68, height: 68, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.5)',
    marginBottom: 4,
  },
  title: { color: '#FFFFFF', fontWeight: '700', textAlign: 'center' },
  desc: { color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 21 },
  cta: {
    marginTop: 10,
    width: '100%',
    borderRadius: radiusTokens.control,
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  ctaText: { color: '#FFFFFF', fontWeight: '700' },
  pressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  compactPanel: { padding: 14 },
  compactRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.4)',
  },
  unlockBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: GOLD.base,
  },
  unlockText: { color: '#FFFFFF', fontWeight: '700' },
});
