import React, { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Timer } from '@/components/ui/Timer';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useMockTestStore } from '@/stores/mockTestStore';
import { Feather } from '@expo/vector-icons';

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

  const mode = (params.mode ?? 'practice') as 'practice' | 'timed_practice' | 'full_mock';
  const [showPalette, setShowPalette] = useState(false);

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

  const handleSelect = useCallback(
    (optionKey: string) => {
      if (!current) return;
      store.answer(store.currentIndex, optionKey);
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
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="body" color="secondary">Starting test…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText variant="h3">Unable to start test</AppText>
        <AppText variant="body" color="secondary">Check your connection and try again.</AppText>
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
          <AppText variant="micro" color="muted">{mode.replace('_', ' ')}</AppText>
          <AppText variant="label">
            Question {store.currentIndex + 1} of {store.questions.length}
          </AppText>
        </View>
        {store.secondsRemaining !== null && (
          <Timer totalSeconds={store.secondsRemaining} onExpire={handleExpire} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.metaRow}>
          <AppText variant="small" color="muted">{current.question.difficulty}</AppText>
          {isMarked && (
            <View style={[styles.markedBadge, { backgroundColor: colors.warningLight }]}>
              <Feather name="flag" size={12} color={colors.warning} />
              <AppText variant="micro" color="warning">Marked for review</AppText>
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
                style={[
                  styles.option,
                  { backgroundColor: isSelected ? colors.primaryLight : colors.surface, borderColor: isSelected ? colors.primary : colors.border },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.optionBadge, { backgroundColor: isSelected ? colors.primary : colors.surfaceAlt }]}>
                  <AppText variant="label" style={{ color: isSelected ? '#FFF' : colors.textSecondary }}>{o.key}</AppText>
                </View>
                <AppText variant="body" style={{ flex: 1 }}>{o.text}</AppText>
              </Pressable>
            );
          })}
        </View>
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
        <View style={[styles.palette, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ marginBottom: 8 }}>
            Questions · {answeredCount} answered
          </AppText>
          <View style={styles.paletteGrid}>
            {store.questions.map((q, i) => {
              const isAnswered = store.answers[i] != null;
              const isCurrent = i === store.currentIndex;
              const isReview = store.markedForReview.has(i);
              return (
                <Pressable
                  key={i}
                  onPress={() => store.goTo(i)}
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
                  <AppText
                    variant="small"
                    style={{ color: isCurrent ? '#FFF' : colors.text, fontWeight: '700' }}
                  >
                    {i + 1}
                  </AppText>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.paletteLegend}>
            <AppText variant="small" color="muted">Blue = current · filled = answered · yellow = review</AppText>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  headerBtn: { padding: 4 },
  body: { padding: 20, paddingBottom: 24, gap: 16 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  markedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  questionText: { fontSize: 17, lineHeight: 26 },
  options: { gap: 10 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  footer: { padding: 16, gap: 10, paddingBottom: 28 },
  footerRow: { flexDirection: 'row', gap: 8 },
  palette: { position: 'absolute', top: 56, left: 12, right: 12, borderRadius: 14, borderWidth: 1, padding: 14, zIndex: 10 },
  paletteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  paletteItem: { width: 38, height: 38, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  paletteLegend: { marginTop: 10 },
});
