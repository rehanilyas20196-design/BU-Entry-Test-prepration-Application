import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { radiusTokens } from '@/theme/tokens';

const GOLD = {
  base: '#F59E0B',
  soft: '#FDE68A',
  ring: '#FCD34D',
  deep: '#B45309',
};

const FEATURES = [
  { icon: 'school-outline', label: 'Explain any topic with the AI tutor' },
  { icon: 'shield-star-outline', label: 'Hard Mode practice — only difficult questions' },
  { icon: 'clipboard-text-outline', label: 'Hard Mock tests for full practice' },
  { icon: 'school-outline', label: 'All subjects and topics unlocked' },
  { icon: 'message-processing-outline', label: 'Unlimited AI tutor sessions' },
  { icon: 'chart-timeline-variant', label: 'Advanced analytics and weak-area insights' },
  { icon: 'infinity', label: 'Mistake notebook with smart retries' },
] as const;

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { show } = useToast();

  const bgColors = colors.isDark
    ? ([colors.heroGradientStart, colors.gradientMid, colors.heroGradientEnd] as [string, string, string])
    : (['#FFFFFF', '#EEF2FF', '#F6F7FB'] as [string, string, string]);

  const handleBuy = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    show('Premium is coming soon — stay tuned!', 'info');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GradientBackground colors={bgColors}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
              <MaterialCommunityIcons name="chevron-left" size={26} color={colors.text} />
            </Pressable>
            <AppText variant="h2">Premium</AppText>
          </View>

          <View style={styles.heroWrap}>
            <View style={styles.heroShadow} />
            <View style={styles.hero}>
              <LinearGradient
                colors={['#312E81', '#5B21B6', '#7C3AED'] as [string, string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.04)', 'rgba(255,255,255,0)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 0.8 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.goldGlow} pointerEvents="none" />
              <FloatingParticles count={10} color={GOLD.soft} />

              <View style={styles.heroContent}>
                <View style={styles.crownWrap}>
                  <MaterialCommunityIcons name="crown" size={28} color={GOLD.soft} />
                </View>
                <AppText variant="h2" style={styles.whiteText}>BUET Prep AI Premium</AppText>
                <AppText variant="body" style={styles.white80}>
                  Everything you need to walk into the BUET with confidence.
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="h3">Plans</AppText>

            <GlassPanel
              accent={[GOLD.soft, GOLD.base]}
              accentOpacity={0.18}
              radius={radiusTokens.card}
              shadowIntensity={0.3}
            >
              <View style={styles.planBody}>
                <View style={styles.planHeader}>
                  <AppText variant="h3" style={{ flex: 1 }}>Premium Plan</AppText>
                  <View style={styles.popularPill}>
                    <MaterialCommunityIcons name="star" size={11} color={GOLD.deep} />
                    <AppText variant="micro" style={styles.popularText}>Popular</AppText>
                  </View>
                </View>

                <View style={styles.priceRow}>
                  <AppText variant="caption" color="secondary" style={styles.currency}>Rs</AppText>
                  <AppText variant="display" style={styles.price}>5,000</AppText>
                </View>
                <AppText variant="small" color="muted">One-time payment</AppText>

                <View style={styles.divider} />

                <View style={styles.featureList}>
                  {FEATURES.map((f) => (
                    <View key={f.label} style={styles.feature}>
                      <View style={styles.featureIcon}>
                        <MaterialCommunityIcons name="check" size={13} color="#FFFFFF" />
                      </View>
                      <MaterialCommunityIcons name={f.icon} size={17} color={GOLD.deep} />
                      <AppText variant="small" color="secondary" style={{ flex: 1 }}>{f.label}</AppText>
                    </View>
                  ))}
                </View>

                <Pressable
                  onPress={handleBuy}
                  accessibilityRole="button"
                  accessibilityLabel="Buy Premium for Rs 5,000"
                  style={({ pressed }) => [styles.buyButton, pressed && styles.buyPressed]}
                >
                  <LinearGradient
                    colors={['#F59E0B', '#F59E0B', '#D97706'] as [string, string, string]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <MaterialCommunityIcons name="crown" size={18} color="#FFFFFF" />
                  <AppText variant="label" style={styles.buyText}>Buy Now</AppText>
                </Pressable>

                <AppText variant="micro" color="muted" style={styles.secureNote}>
                  <MaterialCommunityIcons name="clock-outline" size={12} color={colors.textMuted} />{' '}
                  Premium is coming soon — stay tuned!
                </AppText>
              </View>
            </GlassPanel>

            <AppText variant="small" color="muted" style={styles.footerNote}>
              Coming soon. We'll let you know when Premium launches.
            </AppText>
          </View>
        </ScrollView>
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 48, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  heroWrap: { position: 'relative' },
  heroShadow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(76,29,149,0.02)',
    shadowColor: '#1E1B4B',
    shadowOpacity: 1,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 14 },
    elevation: 12,
  },
  hero: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  goldGlow: {
    position: 'absolute',
    top: -50, right: -40,
    width: 190, height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(251,191,36,0.16)',
  },
  heroContent: { padding: 24, gap: 6, alignItems: 'center' },
  crownWrap: {
    width: 60, height: 60, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(251,191,36,0.18)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(251,191,36,0.5)',
    marginBottom: 6,
  },
  whiteText: { color: '#FFFFFF', fontWeight: '700' },
  white80: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  section: { gap: 14 },
  planBody: { padding: 20, gap: 10 },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  popularPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: 'rgba(251,191,36,0.18)',
  },
  popularText: { color: GOLD.deep, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  currency: { fontWeight: '700' },
  price: { color: GOLD.deep, fontWeight: '800' },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(120,120,140,0.25)',
    marginVertical: 6,
  },
  featureList: { gap: 12, marginVertical: 4 },
  feature: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureIcon: {
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  buyButton: {
    marginTop: 8,
    borderRadius: radiusTokens.control,
    overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
  },
  buyPressed: { transform: [{ scale: 0.985 }], opacity: 0.94 },
  buyText: { color: '#FFFFFF', fontWeight: '700' },
  secureNote: { textAlign: 'center', marginTop: 2 },
  footerNote: { textAlign: 'center' },
});