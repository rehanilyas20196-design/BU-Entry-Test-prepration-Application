import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
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

      {showExplanation && explanation && (
        <View style={[styles.explanation, { backgroundColor: colors.primaryLight }]}>
          <AppText variant="label" color="primary">
            Explanation
          </AppText>
          <AppText variant="body" color="text">
            {explanation}
          </AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 14 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  question: { fontSize: 17, lineHeight: 26 },
  options: { gap: 10 },
  explanation: { borderRadius: 12, padding: 14, gap: 6 },
});
