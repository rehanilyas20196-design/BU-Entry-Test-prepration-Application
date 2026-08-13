import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Feather } from '@expo/vector-icons';
import { OptionButton, QuestionOption } from './OptionButton';

export interface PracticeQuestion {
  id: string;
  question_text: string;
  subject?: { name: string } | { name: string }[] | null;
  topic?: { name: string } | { name: string }[] | null;
  difficulty?: string;
  options: QuestionOption[];
  correct_option?: string;
  explanation?: string | null;
  solution_steps?: string[] | null;
  hint?: string | null;
}

interface QuestionCardProps {
  question: PracticeQuestion;
  selected?: string;
  showExplanation?: boolean;
  explanation?: string | null;
  onSelect?: (option: QuestionOption) => void;
}

export function QuestionCard({
  question,
  selected,
  showExplanation,
  explanation,
  onSelect,
}: QuestionCardProps) {
  const { colors } = useTheme();

  const topicName = Array.isArray(question.topic) ? question.topic[0]?.name : question.topic?.name;
  const subjectName = Array.isArray(question.subject) ? question.subject[0]?.name : question.subject?.name;

  return (
    <View style={styles.container}>
      <View style={styles.metaRow}>
        <Badge label={subjectName ?? 'General'} tone="primary" />
        {topicName && <Badge label={topicName} tone="info" />}
        {question.difficulty && <Badge label={question.difficulty} tone="neutral" />}
      </View>

      <AppText variant="bodyMedium" style={styles.question}>
        {question.question_text}
      </AppText>

      <View style={styles.options}>
        {question.options?.map((option) => (
          <OptionButton
            key={option.key}
            option={option}
            selected={selected === option.key}
            showCorrect={showExplanation}
            isCorrectAnswer={showExplanation && question.correct_option === option.key}
            onSelect={onSelect}
          />
        ))}
      </View>

      {showExplanation && question.correct_option && (
        <Animated.View
          entering={ZoomIn.duration(260)}
          style={[styles.answerBanner, { backgroundColor: colors.successLight, borderColor: colors.success }]}
        >
          <Feather name="check-circle" size={18} color={colors.success} />
          <AppText variant="bodyMedium" color="success">
            Correct answer: {question.correct_option}
          </AppText>
        </Animated.View>
      )}

      {showExplanation && explanation && (
        <Animated.View
          entering={FadeInDown.duration(320)}
          style={[styles.explanation, { backgroundColor: colors.primaryLight }]}
        >
          <AppText variant="label" color="primary">
            Why is this the answer?
          </AppText>
          <AppText variant="body" color="text">
            {explanation}
          </AppText>
        </Animated.View>
      )}

      {showExplanation && question.solution_steps && question.solution_steps.length > 0 && (
        <Animated.View
          entering={FadeInDown.duration(380)}
          style={[styles.explanation, { backgroundColor: colors.surfaceAlt }]}
        >
          <AppText variant="label" color="secondary">
            Step-by-step solution
          </AppText>
          {question.solution_steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.primaryLight }]}>
                <AppText variant="small" color="primary">{i + 1}</AppText>
              </View>
              <AppText variant="body" color="text" style={styles.stepText}>{step}</AppText>
            </View>
          ))}
        </Animated.View>
      )}

      {showExplanation && !question.explanation && !explanation && (
        <Animated.View entering={FadeInDown.duration(320)} style={[styles.explanation, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="body" color="muted">
            No explanation provided for this question yet.
          </AppText>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  question: { fontSize: 17, lineHeight: 26 },
  options: { gap: 10 },
  answerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  explanation: { borderRadius: 12, padding: 14, gap: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  stepNum: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepText: { flex: 1 },
});