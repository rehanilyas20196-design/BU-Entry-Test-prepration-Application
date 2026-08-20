import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { AnimatedProgressBar } from '@/components/ui/Animated';
import { Timer } from '@/components/ui/Timer';
import { QuestionCard, PracticeQuestion } from '@/components/question/QuestionCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface PracticeResponse {
  id: string;
  question_text: string;
  correct_option: string;
  explanation: string | null;
  hint: string | null;
  difficulty: string;
  solution_steps?: string[] | null;
  subject?: { name: string } | { name: string }[] | null;
  topic?: { name: string } | { name: string }[] | null;
  options: { option_key: string; option_text: string; is_correct: boolean }[];
}

export default function PracticeSessionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    subjectId: string;
    topicId?: string;
    topicName?: string;
    smartRetry?: string;
    similarTo?: string;
    limit?: string;
    difficulty?: string;
    excludeAnswered?: string;
    mode?: string;
    title?: string;
  }>();
  const { show } = useToast();
  const session = useAuthStore((s) => s.session);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const questionStart = useRef(Date.now());

  const limit = Math.min(Number(params.limit) || 20, 50);
  const isSpeed = params.mode === 'speed';
  const SPEED_SECONDS = 30;

  const queryParams = [
    `limit=${limit}`,
    params.subjectId && `subject_id=${params.subjectId}`,
    params.topicId && `topic_id=${params.topicId}`,
    params.difficulty && `difficulty=${params.difficulty}`,
    params.excludeAnswered === '1' && `exclude_answered=true`,
  ]
    .filter(Boolean)
    .join('&');

  const fetchQuestions = () => {
    if (params.smartRetry === '1') {
      return api.get<PracticeResponse[]>('/mistakes/smart-retry');
    }
    if (params.similarTo) {
      return api.get<PracticeResponse[]>(
        `/questions/similar?question_id=${params.similarTo}&exclude_id=${params.similarTo}`,
      );
    }
    return api.get<PracticeResponse[]>(`/questions/practice?${queryParams}`);
  };

  const { data: questions, isLoading, error, refetch } = useQuery({
    queryKey: ['practice-set', params.subjectId, params.topicId, params.smartRetry, params.similarTo, params.limit, params.difficulty, params.excludeAnswered],
    queryFn: fetchQuestions,
    enabled: !!session,
  });

  const question = questions?.[index];

  const handleSpeedTimeout = () => {
    if (index < (questions?.length ?? 1) - 1) {
      advance(index + 1);
    }
  };

  // Advance to the next question and reset the answer state in the same render.
  // Resetting via useEffect runs after the render, which briefly flashes the
  // previous answer state (and the correct-answer card) on the new question
  // before the user has answered it.
  const advance = (to: number) => {
    questionStart.current = Date.now();
    setSelected(null);
    setAnswered(false);
    setIsCorrect(false);
    setHint(null);
    setIndex(to);
  };

  const { data: bookmarkData } = useQuery({
    queryKey: ['bookmarked', question?.id],
    queryFn: () => api.get<{ bookmarked: boolean }>(`/bookmarks/${question?.id}`),
    enabled: !!question,
  });
  const bookmarked = bookmarkData?.bookmarked ?? false;
  const queryClient = useQueryClient();

  useEffect(() => {
    questionStart.current = Date.now();
    setSelected(null);
    setAnswered(false);
    setHint(null);
  }, [index]);

  const handleSelect = async (option: { key: string; text: string }) => {
    if (answered || !question) return;
    setSelected(option.key);
    setAnswered(true);

    const timeSpent = Math.round((Date.now() - questionStart.current) / 1000);
    const correct = option.key === question.correct_option;
    setIsCorrect(correct);

    if (correct) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    try {
      await api.post('/progress/answer', {
        question_id: question.id,
        subject_id: params.subjectId,
        topic_id: params.topicId ?? null,
        difficulty: question.difficulty,
        selected_option: option.key,
        is_correct: correct,
        time_spent_seconds: timeSpent,
        mode: params.mode ?? 'practice',
      });
    } catch {
      // offline — answer still recorded locally via retry queue in production
    }
  };

  const handleHint = async () => {
    if (!question) return;
    setHintLoading(true);
    try {
      const res = await api.post<{ hint: string }>('/ai/hint', { question_id: question.id });
      setHint(res.hint);
    } catch {
      setHint(question.hint ?? 'Hint unavailable for this question.');
    } finally {
      setHintLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!question) return;
    if (bookmarked) {
      await api.delete(`/bookmarks/${question.id}`);
    } else {
      await api.post('/bookmarks', { question_id: question.id });
      show('Bookmarked', 'success');
    }
    void queryClient.invalidateQueries({ queryKey: ['bookmarked', question.id] });
    void queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
  };

  const handleReport = () => {
    if (!question) return;
    Alert.alert('Report Question', 'What is the issue?', [
      { text: 'Wrong answer', onPress: () => report('wrong_answer') },
      { text: 'Incorrect explanation', onPress: () => report('incorrect_explanation') },
      { text: 'Ambiguous question', onPress: () => report('ambiguous') },
      { text: 'Typo', onPress: () => report('typo') },
      { text: 'Duplicate', onPress: () => report('duplicate') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const report = (reason: string) => {
    if (!question) return;
    void api.post('/questions/report', { question_id: question.id, reason })
      .then(() => show('Report submitted. Thank you!', 'success'))
      .catch(() => show('Failed to submit report. Please try again.', 'error'));
  };

  const toQuestionCard = (q: PracticeResponse): PracticeQuestion => ({
    id: q.id,
    question_text: q.question_text,
    correct_option: q.correct_option,
    explanation: q.explanation,
    solution_steps: q.solution_steps ?? null,
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic,
    options: q.options.map((o) => ({ key: o.option_key, text: o.option_text })),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard lines={3} style={{ width: '100%' }} />
        <SkeletonCard lines={4} style={{ width: '100%' }} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Unable to load questions"
          message={error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
          onRetry={() => refetch()}
        />
        <Button title="Go back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="book-open"
          title="No questions found"
          message="There are no approved practice questions for this selection yet."
        />
        <Button title="Go back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  const progress = (index + (answered ? 1 : 0)) / questions.length;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Exit practice">
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
<View style={styles.progressWrap}>
            <View style={styles.progressTop}>
              <AppText variant="label" color="secondary">
                {index + 1} / {questions.length}
              </AppText>
              <AppText variant="micro" color="muted">{params.title ?? params.topicName ?? 'Practice'}</AppText>
            </View>
            <AnimatedProgressBar progress={progress} height={5} delay={0} />
            {isSpeed && question && (
              <View style={styles.timerRow}>
                <Timer
                  key={question.id}
                  totalSeconds={SPEED_SECONDS}
                  warningAt={10}
                  paused={answered}
                  onExpire={handleSpeedTimeout}
                />
                <AppText variant="micro" color="muted">Answer before time runs out</AppText>
              </View>
            )}
          </View>
        <Pressable onPress={handleBookmark} style={styles.headerBtn} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark question'}>
          <Feather name="bookmark" size={22} color={bookmarked ? colors.primary : colors.textSecondary} />
        </Pressable>
        <Pressable onPress={handleReport} style={styles.headerBtn} accessibilityLabel="Report question">
          <Feather name="flag" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={question?.id} entering={FadeIn.duration(300)} style={{ gap: 16 }}>
          {question && <QuestionCard question={toQuestionCard(question)} selected={selected ?? undefined} showExplanation={answered} explanation={answered ? question.explanation : null} onSelect={(o) => handleSelect(o)} />}

          {answered && (
            <Animated.View
              entering={FadeInDown.duration(300)}
              style={[
                styles.resultBanner,
                { backgroundColor: isCorrect ? colors.successLight : colors.dangerLight, borderColor: isCorrect ? colors.success : colors.danger },
              ]}
            >
              <Feather name={isCorrect ? 'check-circle' : 'x-circle'} size={22} color={isCorrect ? colors.success : colors.danger} />
              <View style={{ flex: 1 }}>
                <AppText variant="bodyMedium" color={isCorrect ? 'success' : 'danger'}>
                  {isCorrect ? 'Correct!' : 'Not quite'}
                </AppText>
                <AppText variant="small" color="muted">
                  {isCorrect ? 'Great job — keep the momentum going.' : 'Review the explanation below and try similar questions.'}
                </AppText>
              </View>
            </Animated.View>
          )}

          {!answered && (
            <View style={styles.hintRow}>
              <Button title={hintLoading ? 'Loading…' : 'Give me a hint'} variant="ghost" onPress={handleHint} disabled={hintLoading} fullWidth={false} />
              <Pressable
                onPress={() => router.push({ pathname: '/ai-tutor', params: { questionId: question?.id } })}
                style={styles.tutorBtn}
                accessibilityRole="button"
              >
                <Feather name="message-circle" size={16} color={colors.primary} />
                <AppText variant="label" color="primary">Ask AI</AppText>
              </Pressable>
            </View>
          )}

          {hint && !answered && (
            <Animated.View
              entering={FadeInDown.duration(260)}
              style={[styles.hintBox, { backgroundColor: colors.warningLight, borderColor: colors.warning }]}
            >
              <AppText variant="caption" color="warning" style={{ fontWeight: '700' }}>Hint</AppText>
              <AppText variant="body">{hint}</AppText>
            </Animated.View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {answered ? (
          <AnimatedButton
            title={index < questions.length - 1 ? 'Next Question' : 'Finish Session'}
            onPress={() => (index < questions.length - 1 ? advance(index + 1) : router.back())}
            size="lg"
          />
        ) : (
          <Button title="Skip" variant="outline" onPress={() => advance(Math.min(index + 1, questions.length - 1))} size="lg" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  headerBtn: { padding: 4 },
  progressWrap: { flex: 1, gap: 6 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  body: { padding: 20, paddingBottom: 24 },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tutorBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintBox: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
  footer: { padding: 16, paddingBottom: 28 },
});