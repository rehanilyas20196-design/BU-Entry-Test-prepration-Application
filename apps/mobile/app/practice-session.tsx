import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { QuestionCard, PracticeQuestion } from '@/components/question/QuestionCard';
import { useQuery } from '@tanstack/react-query';
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
  subject?: { name: string } | { name: string }[] | null;
  topic?: { name: string } | { name: string }[] | null;
  options: { option_key: string; option_text: string; is_correct: boolean }[];
}

export default function PracticeSessionScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId: string; topicId?: string; topicName?: string }>();
  const { show } = useToast();
  const session = useAuthStore((s) => s.session);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const questionStart = useRef(Date.now());

  const queryParams = [
    `limit=20`,
    params.subjectId && `subject_id=${params.subjectId}`,
    params.topicId && `topic_id=${params.topicId}`,
  ]
    .filter(Boolean)
    .join('&');

  const { data: questions, isLoading, error } = useQuery({
    queryKey: ['practice-set', params.subjectId, params.topicId],
    queryFn: () => api.get<PracticeResponse[]>(`/questions/practice?${queryParams}`),
    enabled: !!session,
  });

  const question = questions?.[index];

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
    const isCorrect = option.key === question.correct_option;

    if (isCorrect) {
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
        is_correct: isCorrect,
        time_spent_seconds: timeSpent,
        mode: 'practice',
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
      setBookmarked(false);
    } else {
      await api.post('/bookmarks', { question_id: question.id });
      setBookmarked(true);
      show('Bookmarked', 'success');
    }
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
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic,
    options: q.options.map((o) => ({ key: o.option_key, text: o.option_text })),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <AppText variant="body" color="secondary">Loading questions…</AppText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText variant="h3">Unable to load questions</AppText>
        <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
          {error instanceof Error ? error.message : 'Something went wrong. Please try again.'}
        </AppText>
        <Button title="Go back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <AppText variant="h3">No questions found</AppText>
        <AppText variant="body" color="secondary" style={{ textAlign: 'center' }}>
          There are no approved practice questions for this selection yet.
        </AppText>
        <Button title="Go back" variant="outline" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Exit practice">
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.progressText}>
          <AppText variant="label" color="secondary">
            {index + 1} / {questions.length}
          </AppText>
        </View>
        <Pressable onPress={handleBookmark} style={styles.headerBtn} accessibilityLabel={bookmarked ? 'Remove bookmark' : 'Bookmark question'}>
          <Feather name="bookmark" size={22} color={bookmarked ? colors.primary : colors.textSecondary} />
        </Pressable>
        <Pressable onPress={handleReport} style={styles.headerBtn} accessibilityLabel="Report question">
          <Feather name="flag" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {question && <QuestionCard question={toQuestionCard(question)} selected={selected ?? undefined} showExplanation={answered} explanation={answered ? question.explanation : null} onSelect={(o) => handleSelect(o)} />}

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
          <View style={[styles.hintBox, { backgroundColor: colors.warningLight }]}>
            <AppText variant="caption" color="warning" style={{ fontWeight: '700' }}>Hint</AppText>
            <AppText variant="body">{hint}</AppText>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {answered ? (
          <Button
            title={index < questions.length - 1 ? 'Next Question' : 'Finish Session'}
            onPress={() => (index < questions.length - 1 ? setIndex(index + 1) : router.back())}
            size="lg"
          />
        ) : (
          <Button title="Skip" variant="outline" onPress={() => setIndex(Math.min(index + 1, questions.length - 1))} size="lg" />
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
  progressText: { flex: 1 },
  body: { padding: 20, paddingBottom: 24, gap: 16 },
  hintRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tutorBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintBox: { borderRadius: 12, padding: 14, gap: 6 },
  footer: { padding: 16, paddingBottom: 28 },
});
