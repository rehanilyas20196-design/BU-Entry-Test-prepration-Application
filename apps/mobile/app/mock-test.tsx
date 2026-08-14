import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  FadeIn,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useMockTestStore } from '@/stores/mockTestStore';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface StartResponse {
  attempt: { id: string };
  duration_minutes: number;
  questions: { order: number; question: { id: string; subject_id: string; topic_id: string | null; difficulty: string; question_text: string; options: { key: string; text: string }[] } }[];
}

export default function MockTestScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string; mode?: string }>();
  const session = useAuthStore((s) => s.session);
  const store = useMockTestStore();

  const mode = (params.mode ?? 'practice') as 'practice' | 'timed_practice' | 'full_mock' | 'hard_mock';
  const [showPalette, setShowPalette] = useState(false);
  const paletteOpen = useSharedValue(0);

  useEffect(() => {
    paletteOpen.value = withTiming(showPalette ? 1 : 0, { duration: 240 });
  }, [showPalette, paletteOpen]);

  const paletteStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - paletteOpen.value) * 320 }],
    opacity: paletteOpen.value,
  }));

  const { isLoading, error } = useQuery({
    queryKey: ['start-test', params.testId, mode],
    queryFn: async () => {
      const res = await api.post<StartResponse>('/tests/start', { mock_test_id: params.testId, mode });
      store.setAttempt({
        attemptId: res.attempt.id,
        mode,
        questions: res.questions,
        durationMinutes: mode === 'practice' ? undefined : res.duration_minutes,
      });
      return res;
    },
    enabled: !!session,
    staleTime: 0,
  });

  const saveAnswer = useMutation({
    mutationFn: (payload: { question_id: string; selected_option: string }) =>
      api.post('/tests/answer', { attempt_id: store.attemptId, ...payload }),
  });

  const submitAttempt = useMutation({
    mutationFn: (durationSeconds: number) =>
      api.post(`/tests/${store.attemptId}/submit`, { duration_seconds: durationSeconds }),
    onSuccess: () => {
      router.replace({ pathname: '/mock-result', params: { attemptId: store.attemptId ?? '' } });
    },
    onError: () => Alert.alert('Submission failed', 'Please check your connection and try again.'),
  });

  const current = store.questions[store.currentIndex];
  const selected = store.answers[store.currentIndex];
  const isMarked = store.markedForReview.has(store.currentIndex);
  const answeredCount = Object.keys(store.answers).length;
  const progress = store.questions.length > 0 ? (store.currentIndex + 1) / store.questions.length : 0;

  const handleSelect = useCallback(
    (optionKey: string) => {
      if (!current) return;
      store.answer(store.currentIndex, optionKey);
      void Haptics.selectionAsync();
      void saveAnswer.mutateAsync({ question_id: current.question.id, selected_option: optionKey }).catch(() => {});
    },
    [current, store, saveAnswer],
  );

  const handleExpire = useCallback(() => {
    Alert.alert('Time is up!', 'Your test will be submitted automatically.', [
      { text: 'OK', onPress: () => submitAttempt.mutate(Math.round((Date.now() - (store.startedAt ?? Date.now())) / 1000)) },
    ]);
  }, [submitAttempt, store.startedAt]);

  const handleSubmit = () => {
    Alert.alert(
      'Submit test?',
      `You answered ${answeredCount} of ${store.questions.length} questions.`,
      [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Submit', onPress: () => submitAttempt.mutate(Math.round((Date.now() - (store.startedAt ?? Date.now())) / 1000)) },
      ],
    );
  };

  if (isLoading || !current) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard lines={4} style={{ width: '100%' }} />
        <SkeletonCard lines={3} style={{ width: '100%' }} />
        <AppText variant="body" color="secondary">Starting test…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Unable to start test"
          message="Check your connection and try again."
        />
        <Button title="Go back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerBtn} accessibilityLabel="Exit test">
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <View style={styles.headerMeta}>
            <AppText variant="micro" color="muted">{mode.replace('_', ' ')}</AppText>
            {store.secondsRemaining !== null && <Timer totalSeconds={store.secondsRemaining} onExpire={handleExpire} />}
          </View>
          <AnimatedProgressBar progress={progress} height={4} delay={0} />
        </View>
        <Pressable onPress={() => setShowPalette((v) => !v)} style={styles.headerBtn} accessibilityLabel="Open question palette">
          <Feather name="grid" size={20} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={current.question.id} entering={FadeIn.duration(280)} style={{ gap: 16 }}>
          <View style={styles.metaRow}>
            <View style={styles.qBadge}>
              <AppText variant="label" style={styles.qBadgeText}>
                Q{store.currentIndex + 1}
              </AppText>
            </View>
            <AppText variant="small" color="muted">{current.question.difficulty}</AppText>
            {isMarked && (
              <View style={[styles.markedBadge, { backgroundColor: colors.warningLight }]}>
                <Feather name="flag" size={12} color={colors.warning} />
                <AppText variant="micro" color="warning">Review</AppText>
              </View>
            )}
          </View>

          <AppText variant="bodyMedium" style={styles.questionText}>
            {current.question.question_text}
          </AppText>

          <View style={styles.options}>
            {current.question.options.map((o) => {
              const isSelected = selected === o.key;
              return (
                <Pressable
                  key={o.key}
                  onPress={() => handleSelect(o.key)}
                  style={({ pressed }) => [
                    styles.option,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                      borderColor: isSelected ? colors.primary : colors.border,
                    },
                    pressed && styles.optionPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                >
                  <View style={[styles.optionBadge, { backgroundColor: isSelected ? colors.primary : colors.surfaceAlt }]}>
                    <AppText variant="label" style={{ color: isSelected ? '#FFF' : colors.textSecondary }}>{o.key}</AppText>
                  </View>
                  <AppText variant="body" style={{ flex: 1 }}>{o.text}</AppText>
                  {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerRow}>
          <Button
            title="Review"
            variant="ghost"
            size="sm"
            fullWidth={false}
            icon={<Feather name="flag" size={14} color={isMarked ? colors.warning : colors.textSecondary} />}
            onPress={() => store.toggleReview(store.currentIndex)}
          />
          <Button title="Palette" variant="ghost" size="sm" fullWidth={false} onPress={() => setShowPalette((v) => !v)} />
        </View>
        <View style={styles.footerRow}>
          <Button title="Previous" variant="outline" size="sm" fullWidth={false} onPress={() => store.prev()} disabled={store.currentIndex === 0} />
          {store.currentIndex === store.questions.length - 1 ? (
            <Button title="Submit" size="sm" fullWidth={false} onPress={handleSubmit} loading={submitAttempt.isPending} />
          ) : (
            <Button title="Next" size="sm" fullWidth={false} onPress={() => store.next()} />
          )}
        </View>
      </View>

      {showPalette && (
        <Pressable style={styles.backdrop} onPress={() => setShowPalette(false)} accessibilityLabel="Close palette" />
      )}
      <Animated.View
        entering={SlideInDown.duration(240)}
        exiting={SlideOutDown.duration(200)}
        style={[
          styles.palette,
          { backgroundColor: colors.surface, borderColor: colors.border },
          paletteStyle,
        ]}
      >
        <GlassCard style={styles.paletteInner}>
          <View style={styles.paletteHeader}>
            <AppText variant="label">Questions · {answeredCount} answered</AppText>
            <Pressable onPress={() => setShowPalette(false)} hitSlop={8} accessibilityLabel="Close palette">
              <Feather name="x" size={18} color={colors.textMuted} />
            </Pressable>
          </View>
          <View style={styles.paletteGrid}>
            {store.questions.map((q, i) => {
              const isAnswered = store.answers[i] != null;
              const isCurrent = i === store.currentIndex;
              const isReview = store.markedForReview.has(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => {
                    store.goTo(i);
                    setShowPalette(false);
                  }}
                  style={[
                    styles.paletteItem,
                    {
                      backgroundColor: isCurrent
                        ? colors.primary
                        : isAnswered
                          ? colors.primaryLight
                          : isReview
                            ? colors.warningLight
                            : colors.surfaceAlt,
                      borderColor: isCurrent ? colors.primary : colors.border,
                    },
                  ]}
                  accessibilityLabel={`Question ${i + 1}`}
                >
                  <AppText variant="small" style={{ color: isCurrent ? '#FFF' : colors.text, fontWeight: '700' }}>
                    {i + 1}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <AppText variant="small" color="muted">Blue = current · filled = answered · yellow = review</AppText>
        </GlassCard>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { padding: 4 },
  headerMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  body: { padding: 20, paddingBottom: 24 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qBadge: {
    backgroundColor: '#6366F1', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  qBadgeText: { color: '#FFF' },
  markedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  questionText: { fontSize: 17, lineHeight: 26 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5,
  },
  optionPressed: { transform: [{ scale: 0.99 }], opacity: 0.9 },
  optionBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, gap: 10, paddingBottom: 28 },
  footerRow: { flexDirection: 'row', gap: 8 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', zIndex: 5 },
  palette: { position: 'absolute', left: 12, right: 12, bottom: 12, borderRadius: 16, borderWidth: 1, overflow: 'hidden', zIndex: 10 },
  paletteInner: { padding: 14 },
  paletteHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  paletteItem: { width: 38, height: 38, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});