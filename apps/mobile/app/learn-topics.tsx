import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FadeInView } from '@/components/ui/Animated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';
import { getLesson } from '@/content/lessons';

interface Topic {
  id: string;
  name: string;
  description: string | null;
}

export default function LearnTopicsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId: string; subjectName: string }>();

  const { data: topics, isLoading, error, refetch } = useQuery({
    queryKey: ['topics', params.subjectId],
    queryFn: () => api.get<Topic[]>(`/catalog/topics?subject_id=${params.subjectId}`),
  });

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">{params.subjectName ?? 'Topics'}</AppText>
          <AppText variant="body" color="secondary">Learn a concept, then practice it</AppText>
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Lessons</AppText>
        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((_i) => (
              <SkeletonCard key={_i} lines={2} />
            ))}
          </View>
        ) : error ? (
          <ErrorState title="Couldn't load topics" message="Please check your connection." onRetry={() => refetch()} />
        ) : (topics?.length ?? 0) === 0 ? (
          <EmptyState icon="book-open" title="No topics yet" message="This subject has no topics available yet." />
        ) : (
          <View style={styles.topicList}>
            {(topics ?? []).map((t, idx) => {
              const lesson = getLesson(t.name);
              return (
                <FadeInView key={t.id} delay={idx * 40} distance={12}>
                  <GlassCard style={styles.topicCard}>
                    <Pressable
                      onPress={() => {
                        if (lesson) {
                          router.push({ pathname: '/lesson', params: { topicId: t.id, topicName: t.name, subjectId: params.subjectId } });
                        } else {
                          router.push({ pathname: '/practice-session', params: { subjectId: params.subjectId, topicId: t.id, topicName: t.name, title: t.name } });
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={t.name}
                    >
                      <View style={styles.topicRow}>
                        <View style={[styles.topicIcon, { backgroundColor: lesson ? 'rgba(16,185,129,0.14)' : 'rgba(99,102,241,0.12)' }]}>
                          <Feather name={lesson ? 'book-open' : 'edit-3'} size={18} color={lesson ? colors.success : colors.primary} />
                        </View>
                        <View style={{ flex: 1, gap: 4 }}>
                          <View style={styles.topicTitleRow}>
                            <AppText variant="label" style={{ flex: 1 }}>{t.name}</AppText>
                            {lesson && (
                              <View style={[styles.lessonBadge, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                                <AppText variant="micro" color="success">Lesson</AppText>
                              </View>
                            )}
                          </View>
                          {t.description && <AppText variant="small" color="muted">{t.description}</AppText>}
                        </View>
                        <Feather name="chevron-right" size={18} color={colors.textMuted} />
                      </View>
                    </Pressable>
                  </GlassCard>
                </FadeInView>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  section: { gap: 12 },
  topicList: { gap: 8 },
  topicCard: { padding: 0 },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  topicIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  topicTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lessonBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
});