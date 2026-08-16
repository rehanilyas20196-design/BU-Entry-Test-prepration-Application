import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { AnimatedButton } from '@/components/ui/AnimatedButton';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { FadeInView } from '@/components/ui/Animated';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Feather } from '@expo/vector-icons';

interface Topic {
  id: string;
  name: string;
  description: string | null;
  attempted?: number;
  correct?: number;
  accuracy?: number | null;
  completed?: boolean;
}

export default function TopicsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ subjectId: string; subjectName: string }>();

  const { data: topics, isLoading, error, refetch } = useQuery({
    queryKey: ['topics', params.subjectId],
    queryFn: () => api.get<Topic[]>(`/catalog/topics?subject_id=${params.subjectId}`),
  });

  // Sequential chapter unlock: the first topic is always open; each next topic
  // unlocks once the previous one has been attempted.
  let prevAttempted = true;
  const topicsWithState = (topics ?? []).map((t) => {
    const isLocked = !prevAttempted;
    prevAttempted = (t.attempted ?? 0) > 0;
    return { ...t, isLocked };
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
          <AppText variant="body" color="secondary">Practice by topic</AppText>
        </View>
      </View>

      <AnimatedButton
        title="Practice Mixed Questions"
        onPress={() => router.push({ pathname: '/practice-session', params: { subjectId: params.subjectId, subjectName: params.subjectName } })}
      />

      <View style={styles.section}>
        <AppText variant="h3">Topics</AppText>
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
            {topicsWithState.map((t, idx) => (
              <FadeInView key={t.id} delay={idx * 40} distance={12}>
                <GlassCard style={t.isLocked ? [styles.topicCard, styles.topicLocked] : styles.topicCard}>
                  <Pressable
                    onPress={() => {
                      if (t.isLocked) return;
                      router.push({ pathname: '/practice-session', params: { subjectId: params.subjectId, topicId: t.id, topicName: t.name } });
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={t.isLocked ? `${t.name} locked` : t.name}
                    disabled={t.isLocked}
                  >
                    <View style={styles.topicRow}>
                      <View style={[styles.topicIcon, t.isLocked ? { backgroundColor: colors.surfaceAlt } : undefined]}>
                        <Feather name={t.isLocked ? 'lock' : 'layers'} size={18} color={t.isLocked ? colors.textMuted : colors.primary} />
                      </View>
                      <View style={{ flex: 1, gap: 4 }}>
                        <AppText variant="label" style={t.isLocked ? { color: colors.textMuted } : undefined}>{t.name}</AppText>
                        {t.isLocked ? (
                          <AppText variant="small" color="muted">Complete the previous chapter to unlock</AppText>
                        ) : (
                          <>
                            {t.description && (
                              <AppText variant="small" color="muted">{t.description}</AppText>
                            )}
                            {t.completed && (
                              <AppText variant="small" color="success">✓ Completed</AppText>
                            )}
                          </>
                        )}
                      </View>
                      <Feather name="chevron-right" size={18} color={t.isLocked ? colors.border : colors.textMuted} />
                    </View>
                  </Pressable>
                </GlassCard>
              </FadeInView>
            ))}
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
  topicLocked: { opacity: 0.65 },
  topicRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  topicIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(99,102,241,0.12)',
  },
});