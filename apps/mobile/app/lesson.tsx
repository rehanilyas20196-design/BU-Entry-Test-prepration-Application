import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { Feather } from '@expo/vector-icons';
import { getLesson } from '@/content/lessons';

export default function LessonScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ topicId: string; topicName: string; subjectId?: string }>();
  const lesson = getLesson(params.topicName ?? '');

  if (!lesson) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="book-open" size={32} color={colors.textMuted} />
        <AppText variant="body" color="muted">Lesson not available yet.</AppText>
        <Button title="Practice this topic" onPress={() => router.back()} variant="outline" />
      </View>
    );
  }

  const practice = () =>
    router.push({
      pathname: '/practice-session',
      params: {
        subjectId: params.subjectId ?? '',
        topicId: params.topicId,
        topicName: lesson.topicName,
        title: `Practice ${lesson.topicName}`,
      },
    });

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="label" style={{ flex: 1 }}>Lesson</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <GlassCard gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]} style={styles.hero}>
          <Feather name="book-open" size={22} color="#FFF" />
          <AppText variant="h2" style={styles.whiteText}>{lesson.topicName}</AppText>
          <AppText variant="caption" style={styles.white80}>Concept · Formula · Solved Example</AppText>
        </GlassCard>

        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Feather name="info" size={16} color={colors.primary} />
            <AppText variant="h3">Concept</AppText>
          </View>
          <AppText variant="body">{lesson.concept}</AppText>
        </View>

        {lesson.formula && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Feather name="hash" size={16} color={colors.warning} />
              <AppText variant="h3">Formula</AppText>
            </View>
            <View style={[styles.formulaBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <AppText variant="bodyMedium" style={{ textAlign: 'center' }}>{lesson.formula}</AppText>
            </View>
          </View>
        )}

        {lesson.solvedExample && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <AppText variant="h3">Solved Example</AppText>
            </View>
            <GlassCard style={styles.exampleCard}>
              <AppText variant="label" color="secondary">{lesson.solvedExample.problem}</AppText>
              <AppText variant="body">{lesson.solvedExample.solution}</AppText>
            </GlassCard>
          </View>
        )}

        {lesson.examples.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Feather name="layers" size={16} color={colors.secondary} />
              <AppText variant="h3">Examples</AppText>
            </View>
            <View style={styles.exampleList}>
              {lesson.examples.map((ex) => (
                <GlassCard key={ex.title} style={styles.exampleCard}>
                  <View style={styles.exampleTitleRow}>
                    <View style={styles.exampleBadge}>
                      <AppText variant="micro" style={styles.whiteText}>{ex.title}</AppText>
                    </View>
                  </View>
                  <AppText variant="label" color="secondary">{ex.problem}</AppText>
                  <AppText variant="body">{ex.solution}</AppText>
                </GlassCard>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedButton title={`Practice ${lesson.topicName}`} onPress={practice} size="lg" icon={<Feather name="zap" size={16} color="#FFF" />} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, gap: 20, paddingBottom: 24 },
  hero: { padding: 20, gap: 6, borderRadius: 18 },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  section: { gap: 10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  formulaBox: { borderRadius: 12, padding: 14, borderWidth: 1 },
  exampleList: { gap: 10 },
  exampleCard: { padding: 16, gap: 8, borderRadius: 14 },
  exampleTitleRow: { marginBottom: 2 },
  exampleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#6366F1',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
  },
  footer: { padding: 16, paddingBottom: 28 },
});