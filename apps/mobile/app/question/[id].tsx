import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { QuestionCard, PracticeQuestion } from '@/components/question/QuestionCard';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

interface QuestionDetail {
  id: string;
  question_text: string;
  correct_option: string;
  explanation: string | null;
  solution_steps: string[] | null;
  hint: string | null;
  difficulty: string;
  subject?: { name: string } | { name: string }[] | null;
  topic?: { name: string } | { name: string }[] | null;
  is_original: boolean;
  is_official_sample: boolean;
  source_reference: string | null;
  options: { option_key: string; option_text: string; is_correct: boolean }[];
}

export default function QuestionDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showAnswer, setShowAnswer] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const { data: question, isLoading } = useQuery({
    queryKey: ['question', id],
    queryFn: () => api.get<QuestionDetail>(`/questions/${id}`),
  });

  if (isLoading || !question) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const toCard = (q: QuestionDetail): PracticeQuestion => ({
    id: q.id,
    question_text: q.question_text,
    correct_option: q.correct_option,
    explanation: q.explanation,
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic,
    options: q.options.map((o) => ({ key: o.option_key, text: o.option_text })),
  });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="label" style={{ flex: 1 }}>Question Review</AppText>
        <Pressable onPress={() => router.push({ pathname: '/ai-tutor', params: { questionId: question.id } })} style={styles.headerBtn} accessibilityLabel="Ask AI about this question">
          <Feather name="message-circle" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <QuestionCard
          question={toCard(question)}
          selected={selected ?? undefined}
          showExplanation={showAnswer}
          explanation={showAnswer ? question.explanation : null}
          onSelect={(o) => setSelected(o.key)}
        />

        {question.solution_steps && question.solution_steps.length > 0 && showAnswer && (
          <View style={[styles.steps, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label">Step-by-step solution</AppText>
            {question.solution_steps.map((s, i) => (
              <AppText key={i} variant="body" color="secondary">{i + 1}. {s}</AppText>
            ))}
          </View>
        )}

        <View style={[styles.sourceNote, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="small" color="muted">
            {question.is_official_sample
              ? 'Official Bahria sample question (see app disclaimer).'
              : 'Original AI-generated practice question'}
          </AppText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {!showAnswer ? (
          <Button title="Show Solution" onPress={() => setShowAnswer(true)} size="lg" />
        ) : (
          <Button title="Practice another like this" variant="outline" onPress={() => router.push({ pathname: '/practice-session', params: { similarTo: question.id } })} size="lg" />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  headerBtn: { padding: 4 },
  body: { padding: 20, gap: 16 },
  steps: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  sourceNote: { borderRadius: 12, padding: 12 },
  footer: { padding: 16, paddingBottom: 28 },
});
