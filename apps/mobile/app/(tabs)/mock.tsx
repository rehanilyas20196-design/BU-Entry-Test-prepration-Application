import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { usePremiumStore } from '@/stores/premiumStore';
import { useToast } from '@/components/ui/Toast';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  'No negative marking',
  'Exam-style timing',
  'Instant scoring',
  'Detailed review',
] as const;

const HOW_IT_WORKS = [
  { icon: 'cursor-default-click-outline', title: 'Pick a test', body: 'Choose any mock from the list below.' },
  { icon: 'timer-outline', title: 'Choose a mode', body: 'Practice, timed sprint, or a full-length exam.' },
  { icon: 'trophy-outline', title: 'Review instantly', body: 'Get your score and go through every answer.' },
] as const;

function SectionHeader({ icon, title, subtitle }: { icon: keyof typeof MaterialCommunityIcons.glyphMap; title: string; subtitle?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: colors.primaryLight }]}>
        <MaterialCommunityIcons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText variant="h3">{title}</AppText>
        {subtitle && <AppText variant="small" color="muted">{subtitle}</AppText>}
      </View>
    </View>
  );
}

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
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${mode.label} mode`}
      style={({ pressed }) => [styles.modePress, pressed && { opacity: 0.85 }]}
    >
      <View
        style={[
          styles.modeTileInner,
          selected
            ? { backgroundColor: colors.primaryLight, borderColor: colors.primary }
            : { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.modeTileIcon,
            selected
              ? { backgroundColor: colors.primary, borderColor: colors.primary }
              : { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
          ]}
        >
          <MaterialCommunityIcons name={mode.icon} size={18} color={selected ? '#FFF' : colors.textSecondary} />
        </View>
        <AppText variant="label" numberOfLines={1} style={selected ? { color: colors.primary } : undefined}>
          {mode.label}
        </AppText>
        <AppText variant="micro" color="muted" numberOfLines={2} style={styles.modeTileHint}>
          {mode.hint}
        </AppText>
        {mode.premium && <Badge label="Premium" tone="warning" />}
      </View>
    </Pressable>
  );
}

function MockTestCard({ test, index: _index }: { test: MockTest; index: number }) {
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
    <Card style={styles.testCard}>
      <View style={styles.testHeader}>
        <View style={[styles.testIcon, { backgroundColor: colors.primaryLight }]}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.primary} />
        </View>
        <View style={styles.testTitleWrap}>
          <AppText variant="label" numberOfLines={2} style={styles.testName}>
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
        <View style={[styles.statChip, { backgroundColor: colors.successLight }]}>
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

      <Button
        title={`Start ${selectedMeta?.label ?? 'Full Mock'}`}
        icon={<MaterialCommunityIcons name="play" size={16} color="#FFF" />}
        onPress={() => start(selected)}
      />
    </Card>
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

  const totalTests = tests?.length ?? 0;

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="h2">Mock tests</AppText>
        <AppText variant="body" color="secondary">Realistic simulations · instant scoring & review</AppText>
        <View style={styles.arenaBadges}>
          {ARENA_FEATURES.map((f) => (
            <View key={f} style={[styles.arenaBadge, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <AppText variant="micro" color="secondary">{f}</AppText>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionHeader
          icon="help-circle-outline"
          title="How it works"
          subtitle="Three simple steps to exam readiness"
        />
        <View style={styles.howRow}>
          {HOW_IT_WORKS.map((h, i) => (
            <Card key={h.title} style={styles.howStep}>
              <View style={[styles.howBadge, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name={h.icon} size={16} color={colors.primary} />
              </View>
              <AppText variant="label" style={{ textAlign: 'center' }}>{h.title}</AppText>
              <AppText variant="micro" color="muted" style={{ textAlign: 'center', lineHeight: 15 }}>{h.body}</AppText>
              {i < HOW_IT_WORKS.length - 1 && (
                <View style={styles.howConnector}>
                  <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textMuted} />
                </View>
              )}
            </Card>
          ))}
        </View>
      </View>

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
              <MockTestCard key={t.id} test={t} index={idx} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader icon="view-grid-outline" title="Modes explained" />
        <Card style={styles.guideList}>
          {MODES.map((m) => (
            <View key={m.key} style={styles.guideRow}>
              <View style={[styles.guideIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialCommunityIcons name={m.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <AppText variant="label">{m.label}</AppText>
                  {m.premium && <Badge label="Premium" tone="warning" />}
                </View>
                <AppText variant="small" color="muted">{m.hint}</AppText>
              </View>
            </View>
          ))}
        </Card>
      </View>

      <View style={[styles.tipCard, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
        <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.warning} />
        <View style={{ flex: 1 }}>
          <AppText variant="label" style={{ marginBottom: 2 }}>Pro tip</AppText>
          <AppText variant="small" color="secondary" style={{ lineHeight: 18 }}>
            Start with Practice mode to get comfortable, then try a timed sprint. Save the Full Mock for a week when you can give it your undivided attention.
          </AppText>
        </View>
      </View>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 120, gap: 28 },
  header: { gap: 4, marginTop: 8 },
  arenaBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  arenaBadge: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  section: { gap: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  sectionIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  howRow: { flexDirection: 'row', gap: 10 },
  howStep: { flex: 1, alignItems: 'center', gap: 6, padding: 14, position: 'relative' },
  howBadge: {
    width: 40, height: 40, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  howConnector: {
    position: 'absolute', top: 20, right: -10, zIndex: 3,
  },
  list: { gap: 16 },
  testCard: { padding: 20, gap: 16 },
  testHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  testIcon: {
    width: 46, height: 46, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  testTitleWrap: { flex: 1, gap: 4 },
  testName: { fontWeight: '500' },
  testStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999,
  },
  modeRow: { flexDirection: 'row', gap: 8 },
  modePress: { flex: 1 },
  modeTileInner: {
    alignItems: 'center', gap: 5, paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 12, borderWidth: 1,
  },
  modeTileIcon: {
    width: 34, height: 34, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 1,
  },
  modeTileHint: { textAlign: 'center' },
  tipCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  guideList: { padding: 4 },
  guideRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
  },
  guideIcon: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
});
