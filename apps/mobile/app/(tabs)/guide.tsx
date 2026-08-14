import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { FadeInView } from '@/components/ui/Animated';
import { Feather } from '@expo/vector-icons';
import { ROADMAP_STAGES, ROADMAP_ARTICLES, APPLY_URL } from '@/content/admissions';

export default function GuideScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <FadeInView>
        <View style={styles.header}>
          <AppText variant="h2">Admission Guide</AppText>
          <AppText variant="body" color="secondary">Your roadmap to Bahria University</AppText>
        </View>
      </FadeInView>

      <FadeInView delay={60}>
        <GlassCard gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]} glow style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name="map" size={22} color="#FFF" />
          </View>
          <AppText variant="h3" style={styles.whiteText}>Admission Roadmap</AppText>
          <AppText variant="small" style={styles.white80}>
            Create account → online form → fee voucher → entry test slip → BUET → merit list → interview. Track every stage with this guide.
          </AppText>
          <Pressable
            onPress={() => Linking.openURL(APPLY_URL)}
            style={({ pressed }) => [styles.applyBtn, pressed && styles.pressed]}
            accessibilityRole="link"
            accessibilityLabel="Apply Now on the Bahria portal"
          >
            <Feather name="external-link" size={15} color="#FFF" />
            <AppText variant="label" style={styles.whiteText}>Apply Now</AppText>
          </Pressable>
        </GlassCard>
      </FadeInView>

      <FadeInView delay={100}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Application Stages</AppText>
          </View>
          <View style={styles.stageList}>
            {ROADMAP_STAGES.map((stage, idx) => (
              <GlassCard key={stage.title} style={styles.stageCard}>
                <View style={styles.stageLeft}>
                  <View style={styles.stageNum}>
                    <AppText variant="label" style={styles.whiteText}>{idx + 1}</AppText>
                  </View>
                  {idx < ROADMAP_STAGES.length - 1 && <View style={[styles.stageLine, { backgroundColor: colors.surfaceAlt }]} />}
                </View>
                <View style={styles.stageBody}>
                  <View style={styles.stageTitleRow}>
                    <Feather name={(stage.icon as any)} size={15} color={colors.primary} />
                    <AppText variant="label" style={{ flex: 1 }}>{stage.title}</AppText>
                  </View>
                  <AppText variant="small" color="secondary">{stage.description}</AppText>
                </View>
              </GlassCard>
            ))}
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={140}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AppText variant="h3">Everything You Need to Know</AppText>
          </View>
          <View style={styles.articleList}>
            {ROADMAP_ARTICLES.map((a) => (
              <Pressable
                key={a.id}
                onPress={() => router.push({ pathname: '/admission/[id]', params: { id: a.id } })}
                style={({ pressed }) => [pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={a.title}
              >
                <GlassCard style={styles.articleCard}>
                  <View style={[styles.articleIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                    <Feather name={(a.icon as any)} size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <AppText variant="label">{a.title}</AppText>
                    <AppText variant="small" color="muted">{a.summary}</AppText>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.textMuted} />
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={180}>
        <Pressable
          onPress={() => router.push('/achievements')}
          style={({ pressed }) => [pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="View achievements"
        >
          <GlassCard gradient={['#F59E0B', '#F97316']} style={styles.achievementCard}>
            <Feather name="award" size={20} color="#FFF" />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="label" style={styles.whiteText}>Achievements</AppText>
              <AppText variant="micro" style={styles.white80}>Track your milestones and earn your BUET Master crown</AppText>
            </View>
            <Feather name="chevron-right" size={18} color="#FFF" />
          </GlassCard>
        </Pressable>
      </FadeInView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  header: { gap: 4, marginTop: 8 },
  hero: { padding: 20, gap: 8, borderRadius: 18 },
  heroIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageList: { gap: 0 },
  stageCard: { padding: 14, flexDirection: 'row', gap: 12, marginBottom: 10 },
  stageLeft: { alignItems: 'center', width: 28 },
  stageNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#6366F1',
  },
  stageLine: { width: 2, flex: 1, marginTop: 4 },
  stageBody: { flex: 1, gap: 4 },
  stageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  articleList: { gap: 10 },
  articleCard: {
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  articleIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementCard: {
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16,
  },
  applyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.2)', marginTop: 4,
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
});