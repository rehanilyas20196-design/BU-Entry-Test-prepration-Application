import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientCTA } from '@/components/ui/GradientCTA';
import { FadeInView } from '@/components/ui/Animated';
import { Reveal } from '@/components/ui/Reveal';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useToast } from '@/components/ui/Toast';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { accents } from '@/theme/tokens';
import type { SharedValue } from 'react-native-reanimated';

interface MockTest {
  id: string;
  name: string;
  description: string | null;
  question_count: number;
  actual_question_count: number;
  duration_minutes: number;
}

type Mode = 'practice' | 'timed_practice' | 'full_mock' | 'hard_mock';

const MODES: { key: Mode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; hint: string; premium?: boolean }[] = [
  { key: 'practice', label: 'Practice', icon: 'pencil-outline', hint: 'Untimed · learn as you go' },
  { key: 'timed_practice', label: 'Timed', icon: 'timer-outline', hint: 'Short sprint · timer on' },
  { key: 'full_mock', label: 'Full Mock', icon: 'clipboard-text-outline', hint: 'Full exam · real conditions' },
  { key: 'hard_mock', label: 'Hard Mock', icon: 'shield-star-outline', hint: 'Full practice · hard questions only', premium: true },
];

const ARENA_FEATURES = [
  { icon: 'shield-check-outline', label: 'No negative marking' },
  { icon: 'timer-outline', label: 'Exam-style timing' },
  { icon: 'clipboard-check-outline', label: 'Instant scoring' },
  { icon: 'chart-line', label: 'Detailed review' },
] as const;

const HOW_IT_WORKS = [
  { step: '1', icon: 'cursor-default-click-outline', title: 'Pick a test', body: 'Choose any mock from the list below.' },
  { step: '2', icon: 'timer-outline', title: 'Choose a mode', body: 'Practice, timed sprint, or a full-length exam.' },
  { step: '3', icon: 'trophy-outline', title: 'Review instantly', body: 'Get your score and go through every answer.' },
] as const;

function ModeTile({
  mode,
  selected,
  onPress,
}: {
  mode: { key: Mode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; hint: string; premium?: boolean };
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const press = useSharedValue(0);

  const onPressIn = () => {
    press.value = withSpring(1, { damping: 20, stiffness: 340, mass: 0.6 });
  };

  const onPressOut = () => {
    press.value = withSpring(0, { damping: 18, stiffness: 260, mass: 0.7 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      accessibilityRole="button"
      accessibilityLabel={`${mode.label} mode`}
      style={styles.modePress}
    >
      <GlassPanel
        accent={[accents.indigo.soft, accents.indigo.main]}
        accentOpacity={selected ? 0.15 : 0.04}
        press={press}
        ring={selected}
        radius={18}
      >
        <View style={styles.modeTileInner}>
          <View
            style={[
              styles.modeTileIcon,
              selected
                ? { backgroundColor: 'rgba(99,102,241,0.18)', borderColor: 'rgba(99,102,241,0.5)' }
                : { backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.22)' },
            ]}
          >
            <MaterialCommunityIcons name={mode.icon} size={19} color={selected ? accents.indigo.main : colors.textSecondary} />
          </View>
          <AppText
            variant="caption"
            numberOfLines={1}
            style={[styles.modeTileLabel, selected && { color: accents.indigo.main }]}
          >
            {mode.label}
          </AppText>
          <AppText variant="micro" color="muted" numberOfLines={2} style={styles.modeTileHint}>
            {mode.hint}
          </AppText>
          {mode.premium && (
            <View style={styles.modePremiumBadge}>
              <MaterialCommunityIcons name="crown" size={9} color="#B45309" />
            </View>
          )}
          {selected && (
            <View style={styles.modeCheck}>
              <MaterialCommunityIcons name="check" size={10} color="#FFF" />
            </View>
          )}
        </View>
      </GlassPanel>
    </Pressable>
  );
}

function MockTestCard({ test, scrollY, index }: { test: MockTest; scrollY: SharedValue<number>; index: number }) {
  const { colors } = useTheme();
  const router = useRouter();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const { show } = useToast();
  const [selected, setSelected] = useState<Mode>('full_mock');
  const count = test.actual_question_count || test.question_count;

  const start = (mode: Mode) => {
    if (mode === 'hard_mock' && !isPremium) {
      show('Hard Mock is a Premium feature', 'info');
      router.push('/premium');
      return;
    }
    router.push({ pathname: '/mock-test', params: { testId: test.id, mode } });
  };

  const selectedMeta = MODES.find((m) => m.key === selected);

  return (
    <Reveal scrollY={scrollY} index={index}>
      <GlassPanel
        accent={[accents.violet.soft, accents.violet.main]}
        accentOpacity={0.05}
        radius={22}
        contentStyle={styles.testCardContent}
        style={styles.testCard}
      >
        <View style={styles.testHeader}>
          <View style={styles.testIcon}>
            <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={accents.violet.main} />
          </View>
          <View style={styles.testTitleWrap}>
            <AppText variant="label" style={styles.testName} numberOfLines={2}>
              {test.name}
            </AppText>
            {test.description && (
              <AppText variant="small" color="muted" numberOfLines={1}>{test.description}</AppText>
            )}
          </View>
        </View>

        <View style={styles.testStats}>
          <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="format-list-numbered" size={14} color={colors.primary} />
            <AppText variant="small" color="secondary">{count} questions</AppText>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="clock-outline" size={14} color={colors.primary} />
            <AppText variant="small" color="secondary">{test.duration_minutes} min</AppText>
          </View>
          <View style={[styles.statChip, { backgroundColor: colors.surfaceAlt }]}>
            <MaterialCommunityIcons name="shield-check-outline" size={14} color={colors.success} />
            <AppText variant="small" color="secondary">No negative</AppText>
          </View>
        </View>

        <View style={styles.modeRow}>
          {MODES.map((m) => (
            <ModeTile
              key={m.key}
              mode={m}
              selected={selected === m.key}
              onPress={() => {
                setSelected(m.key);
                start(m.key);
              }}
            />
          ))}
        </View>

        <GradientCTA
          title={`Start ${selectedMeta?.label ?? 'Full Mock'}`}
          icon="play"
          gradient={[accents.indigo.main, accents.violet.main]}
          onPress={() => start(selected)}
        />
      </GlassPanel>
    </Reveal>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: 'rgba(99,102,241,0.12)', borderColor: 'rgba(99,102,241,0.25)' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {subtitle && <AppText variant="small" color="muted">{subtitle}</AppText>}
      </View>
    </View>
  );
}

export default function MockTestsScreen() {
  const { colors } = useTheme();
  const session = useAuthStore((s) => s.session);

  const { data: tests, isLoading, error, refetch } = useQuery({
    queryKey: ['mock-tests'],
    queryFn: () => api.get<MockTest[]>('/tests'),
    enabled: !!session,
  });

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const totalTests = tests?.length ?? 0;

  return (
    <Animated.ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
    >
      <FadeInView>
        <View style={styles.arenaWrap}>
          <View style={styles.arenaShadow} />
          <View style={styles.arena}>
            <LinearGradient
              colors={['#4F46E5', '#5C4BD8', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.10)', 'rgba(8,6,40,0.32)'] as [string, string]}
              style={StyleSheet.absoluteFill}
            />
            <LinearGradient
              colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0)'] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 0.6 }}
              style={StyleSheet.absoluteFill}
            />
            <FloatingParticles count={10} color="#FFFFFF" />
            <View style={styles.arenaIcon}>
              <MaterialCommunityIcons name="crosshairs" size={20} color="#FFF" />
            </View>
            <AppText variant="h2" style={styles.whiteText}>Mock Arena</AppText>
            <AppText variant="body" style={styles.white80}>
              Realistic simulations · instant scoring & review
            </AppText>

            <View style={styles.arenaBadges}>
              {ARENA_FEATURES.map((f) => (
                <View key={f.label} style={styles.arenaBadge}>
                  <MaterialCommunityIcons name={f.icon} size={12} color="#FDE68A" />
                  <AppText variant="micro" style={styles.white90}>{f.label}</AppText>
                </View>
              ))}
            </View>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={80}>
        <View style={styles.section}>
          <SectionHeader
            icon="help-circle-outline"
            title="How it works"
            subtitle="Three simple steps to exam readiness"
          />
          <View style={styles.howRow}>
            {HOW_IT_WORKS.map((h, i) => (
              <View key={h.step} style={styles.howStep}>
                <View style={styles.howBadge}>
                  <MaterialCommunityIcons name={h.icon} size={16} color={colors.primary} />
                </View>
                <View style={styles.howStepNum}>
                  <AppText variant="micro" style={styles.howStepNumText}>{h.step}</AppText>
                </View>
                <AppText variant="label" style={{ textAlign: 'center' }}>{h.title}</AppText>
                <AppText variant="micro" color="muted" style={{ textAlign: 'center', lineHeight: 15 }}>{h.body}</AppText>
                {i < HOW_IT_WORKS.length - 1 && (
                  <View style={styles.howConnector}>
                    <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={140}>
        <View style={styles.section}>
          <SectionHeader
            icon="clipboard-text-outline"
            title="Available mocks"
            subtitle={totalTests > 0 ? `${totalTests} test${totalTests > 1 ? 's' : ''} ready to attempt` : 'New simulations are being prepared'}
          />
          {isLoading ? (
            <View style={styles.list}>
              {[0, 1].map((i) => (
                <SkeletonCard key={i} lines={4} />
              ))}
            </View>
          ) : error ? (
            <ErrorState
              title="Couldn't load mock tests"
              message="Please check your connection and try again."
              onRetry={() => refetch()}
            />
          ) : (tests?.length ?? 0) === 0 ? (
            <EmptyState
              icon="clipboard"
              title="No mock tests yet"
              message="New simulations will appear here soon."
            />
          ) : (
            <View style={styles.list}>
              {(tests ?? []).map((t, idx) => (
                <MockTestCard key={t.id} test={t} scrollY={scrollY} index={idx} />
              ))}
            </View>
          )}
        </View>
      </FadeInView>

      <FadeInView delay={200}>
        <View style={[styles.tipCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.warning} />
          <View style={{ flex: 1 }}>
            <AppText variant="label" style={{ marginBottom: 2 }}>Pro tip</AppText>
            <AppText variant="small" color="secondary" style={{ lineHeight: 18 }}>
              Start with Practice mode to get comfortable, then try a timed sprint. Save the Full Mock for a week when you can give it your undivided attention.
            </AppText>
          </View>
        </View>
      </FadeInView>

      <FadeInView delay={260}>
        <View style={styles.modeGuide}>
          <SectionHeader icon="view-grid-outline" title="Modes explained" />
          <View style={styles.guideList}>
            {MODES.map((m) => (
              <View key={m.key} style={styles.guideRow}>
                <View style={[styles.guideIcon, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                  <MaterialCommunityIcons name={m.icon} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <AppText variant="label">{m.label}</AppText>
                    {m.premium && (
                      <View style={styles.guidePremiumPill}>
                        <MaterialCommunityIcons name="crown" size={9} color="#B45309" />
                        <AppText variant="micro" style={{ color: '#B45309', fontWeight: '700' }}>Premium</AppText>
                      </View>
                    )}
                  </View>
                  <AppText variant="small" color="muted">{m.hint}</AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </FadeInView>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120, gap: 28 },
  arenaWrap: { position: 'relative' },
  arenaShadow: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 24,
    backgroundColor: 'rgba(99,102,241,0.02)',
    shadowColor: '#2E2A63',
    shadowOpacity: 1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 11,
  },
  arena: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
    padding: 26,
    gap: 10,
    alignItems: 'center',
  },
  arenaIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
    marginBottom: 6,
  },
  arenaBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  arenaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)', textAlign: 'center' },
  white90: { color: 'rgba(255,255,255,0.92)' },
  section: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  howRow: { flexDirection: 'row', gap: 10 },
  howStep: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 16,
    paddingHorizontal: 10,
    borderRadius: 18,
    backgroundColor: 'rgba(99,102,241,0.05)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.14)',
    position: 'relative',
  },
  howBadge: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.25)',
    marginBottom: 2,
  },
  howStepNum: {
    position: 'absolute',
    top: 8, right: 8,
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: accents.indigo.main,
  },
  howStepNumText: { color: '#FFF', fontWeight: '700' },
  howConnector: {
    position: 'absolute',
    top: 20, right: -10,
    zIndex: 3,
  },
  list: { gap: 16 },
  testCard: {},
  testCardContent: { padding: 20, gap: 16 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.25)',
  },
  testTitleWrap: { flex: 1, gap: 4 },
  testName: { fontWeight: '700' },
  testStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modePress: { flex: 1, borderRadius: 18 },
  modeTileInner: { alignItems: 'center', gap: 5, paddingVertical: 12, paddingHorizontal: 6 },
  modeTileIcon: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 1,
  },
  modeTileLabel: { fontWeight: '600' },
  modeTileHint: { textAlign: 'center' },
  modeCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: accents.indigo.main,
  },
  modePremiumBadge: {
    position: 'absolute', top: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FDE68A',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F59E0B',
  },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  modeGuide: { gap: 14 },
  guideList: { gap: 10 },
  guideRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(99,102,241,0.04)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(99,102,241,0.12)',
  },
  guideIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  guidePremiumPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 999,
    backgroundColor: '#FDE68A',
  },
});
