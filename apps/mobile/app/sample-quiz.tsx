import React, { useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { TextField } from '@/components/ui/TextField';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { QuestionCard, PracticeQuestion } from '@/components/question/QuestionCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface SampleQuestion {
  id: string;
  difficulty: string;
  question_text: string;
  correct_option: string;
  explanation: string | null;
  hint: string | null;
  subject?: { name: string } | { name: string }[] | null;
  topic?: { name: string } | { name: string }[] | null;
  options: { key: string; text: string }[];
}

export default function SampleQuizScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [email, setEmail] = useState('');

  const { data: questions, isLoading, error, refetch } = useQuery({
    queryKey: ['sample-quiz'],
    queryFn: () => api.get<SampleQuestion[]>('/public/sample-quiz'),
    staleTime: 60_000,
  });

  const question = questions?.[index];
  const total = questions?.length ?? 0;

  const handleSelect = (option: { key: string; text: string }) => {
    if (answered || !question) return;
    setSelected(option.key);
    setAnswered(true);
    if (option.key === question.correct_option) setScore((s) => s + 1);
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(session ? '/(tabs)' : '/sign-in');
    }
  };

  const handleNext = () => {
    if (index < total - 1) {
      setIndex(index + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const toQuestion = (q: SampleQuestion): PracticeQuestion => ({
    id: q.id,
    question_text: q.question_text,
    correct_option: q.correct_option,
    explanation: q.explanation,
    difficulty: q.difficulty,
    subject: q.subject,
    topic: q.topic,
    options: q.options.map((o) => ({ key: o.key, text: o.text })),
  });

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <SkeletonCard lines={3} style={{ width: '100%' }} />
        <SkeletonCard lines={4} style={{ width: '100%' }} />
      </View>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ErrorState
          title="Couldn't load the sample quiz"
          message="Please check your connection and try again."
          onRetry={() => refetch()}
        />
        <Button title="Go back" variant="outline" onPress={handleClose} />
      </View>
    );
  }

  if (finished) {
    const pct = Math.round((score / total) * 100);
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.resultBody} showsVerticalScrollIndicator={false}>
          <Animated.View entering={FadeIn.duration(400)} style={styles.resultHero}>
            <View style={[styles.resultIcon, { backgroundColor: pct >= 60 ? colors.successLight : colors.primaryLight }]}>
              <Feather name={pct >= 60 ? 'award' : 'trending-up'} size={34} color={pct >= 60 ? colors.success : colors.primary} />
            </View>
            <AppText variant="h1">{pct >= 60 ? 'Nice work!' : 'Good start!'}</AppText>
            <AppText variant="display" style={{ color: colors.primary, fontVariant: ['tabular-nums'] }}>
              {score} / {total}
            </AppText>
            <AppText variant="body" color="secondary">
              {pct >= 80
                ? 'Outstanding — you have a strong foundation.'
                : pct >= 60
                  ? 'Solid attempt. With a bit of practice, you will fly.'
                  : 'This gives you a clear idea of what to work on.'}
            </AppText>
          </Animated.View>

          <Card style={styles.ctaCard}>
            <AppText variant="bodyMedium">Want your full score, progress tracking and a personalized study plan?</AppText>
            <AppText variant="small" color="muted">
              {session ? 'You can keep practicing with full analytics right now.' : 'Create a free account in under a minute — no card required.'}
            </AppText>
            {session ? (
              <Button title="Continue practicing" onPress={() => router.replace('/practice')} size="lg" />
            ) : (
              <>
                <TextField
                  label="Email (optional)"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  icon={<Feather name="mail" size={16} color={colors.textMuted} />}
                />
                <Button
                  title="Save my score & create free account"
                  onPress={() =>
                    router.replace({
                      pathname: '/sign-up',
                      params: email.trim() ? { email: email.trim() } : {},
                    })
                  }
                  size="lg"
                />
                <Button title="Go home" variant="outline" onPress={() => router.replace('/(tabs)')} />
              </>
            )}
          </Card>

          {!session && (
            <AppText variant="small" color="muted" style={styles.privacyNote}>
              No payment required. You can delete your account at any time.
            </AppText>
          )}
        </ScrollView>
      </View>
    );
  }

  const progress = (index + (answered ? 1 : 0)) / total;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={handleClose} style={styles.backBtn} accessibilityLabel="Close sample quiz">
          <Feather name="x" size={22} color={colors.text} />
        </Pressable>
        <View style={styles.progressWrap}>
          <View style={styles.progressTop}>
            <AppText variant="label" color="secondary">Sample quiz</AppText>
            <AppText variant="label" color="secondary">{index + 1} / {total}</AppText>
          </View>
          <ProgressBar progress={progress} height={6} color={colors.primary} />
        </View>
        <View style={styles.freePill}>
          <Badge label="Free" tone="success" />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Animated.View key={question?.id} entering={FadeIn.duration(260)} style={{ gap: 16 }}>
          <Card padded={false} style={styles.questionCard}>
            {question && <QuestionCard question={toQuestion(question)} selected={selected ?? undefined} showExplanation={answered} explanation={answered ? question.explanation : null} onSelect={(o) => handleSelect(o)} />}
          </Card>
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        {answered && (
          <Animated.View entering={FadeInDown.duration(260)}>
            <Button title={index < total - 1 ? 'Next question' : 'See my results'} onPress={handleNext} size="lg" />
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  progressWrap: { flex: 1, gap: 6 },
  progressTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  freePill: {},
  body: { padding: 20, paddingBottom: 24 },
  questionCard: { padding: 16 },
  footer: { padding: 16, paddingBottom: 28 },
  resultBody: { padding: 20, paddingBottom: 40, gap: 16 },
  resultHero: { alignItems: 'center', gap: 6, paddingTop: 20 },
  resultIcon: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  ctaCard: { gap: 10 },
  privacyNote: { textAlign: 'center' },
});