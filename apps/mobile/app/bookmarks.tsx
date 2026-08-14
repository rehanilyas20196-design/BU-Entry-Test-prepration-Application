import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useBookmarkTagsStore } from '@/stores/bookmarkTagsStore';
import { Feather } from '@expo/vector-icons';

interface BookmarkItem {
  id: string;
  question: {
    id: string;
    question_text: string;
    difficulty: string;
    subject?: { name: string } | { name: string }[] | null;
    topic?: { name: string } | { name: string }[] | null;
  };
}

type SectionKey = 'all' | 'difficult' | 'review' | 'important';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'all', label: 'Saved' },
  { key: 'difficult', label: 'Difficult' },
  { key: 'review', label: 'Review Later' },
  { key: 'important', label: 'Important' },
];

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const [section, setSection] = useState<SectionKey>('all');
  const { reviewLater, important, toggleReviewLater, toggleImportant } = useBookmarkTagsStore();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get<BookmarkItem[]>('/bookmarks'),
    enabled: !!session,
  });

  const remove = async (questionId: string) => {
    await api.delete(`/bookmarks/${questionId}`);
    void refetch();
  };

  const filtered = useMemo(() => {
    const list = data ?? [];
    switch (section) {
      case 'difficult':
        return list.filter((b) => b.question.difficulty === 'hard' || b.question.difficulty === 'expert');
      case 'review':
        return list.filter((b) => reviewLater.includes(b.question.id));
      case 'important':
        return list.filter((b) => important.includes(b.question.id));
      default:
        return list;
    }
  }, [data, section, reviewLater, important]);

  const counts: Record<SectionKey, number> = {
    all: data?.length ?? 0,
    difficult: (data ?? []).filter((b) => b.question.difficulty === 'hard' || b.question.difficulty === 'expert').length,
    review: (data ?? []).filter((b) => reviewLater.includes(b.question.id)).length,
    important: (data ?? []).filter((b) => important.includes(b.question.id)).length,
  };

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">My Bookmarks</AppText>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
        {SECTIONS.map((s) => (
          <Pressable
            key={s.key}
            onPress={() => setSection(s.key)}
            style={[
              styles.tab,
              { backgroundColor: section === s.key ? colors.primary : colors.surfaceAlt },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: section === s.key }}
          >
            <AppText variant="small" style={{ color: section === s.key ? '#FFF' : colors.textSecondary }}>
              {s.label} ({counts[s.key]})
            </AppText>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <AppText variant="body" color="muted" style={{ textAlign: 'center', marginTop: 40 }}>
            {section === 'all'
              ? 'No bookmarks yet. Tap the bookmark icon on any question to save it here.'
              : section === 'difficult'
                ? 'No difficult bookmarks yet — save hard questions to find them here.'
                : 'No questions in this section yet.'}
          </AppText>
        ) : (
          <View style={styles.list}>
            {filtered.map((b) => {
              const topicName = Array.isArray(b.question.topic) ? b.question.topic[0]?.name : b.question.topic?.name;
              const isReview = reviewLater.includes(b.question.id);
              const isImportant = important.includes(b.question.id);
              return (
                <Card key={b.id} elevated={false} style={styles.card}>
                  <Pressable onPress={() => router.push({ pathname: '/question/[id]', params: { id: b.question.id } })} style={{ flex: 1 }}>
                    <AppText variant="bodyMedium" numberOfLines={2}>{b.question.question_text}</AppText>
                    <View style={styles.meta}>
                      <AppText variant="small" color="muted">{topicName ?? 'General'} · {b.question.difficulty}</AppText>
                    </View>
                    {(isReview || isImportant) && (
                      <View style={styles.tagRow}>
                        {isImportant && (
                          <View style={[styles.tag, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                            <AppText variant="micro" color="warning">Important</AppText>
                          </View>
                        )}
                        {isReview && (
                          <View style={[styles.tag, { backgroundColor: 'rgba(99,102,241,0.14)' }]}>
                            <AppText variant="micro" color="primary">Review later</AppText>
                          </View>
                        )}
                      </View>
                    )}
                  </Pressable>
                  <View style={styles.actions}>
                    <Pressable onPress={() => toggleImportant(b.question.id)} style={styles.iconBtn} accessibilityLabel={isImportant ? 'Remove important' : 'Mark important'}>
                      <Feather name="star" size={18} color={isImportant ? colors.warning : colors.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => toggleReviewLater(b.question.id)} style={styles.iconBtn} accessibilityLabel={isReview ? 'Remove review later' : 'Mark review later'}>
                      <Feather name="flag" size={18} color={isReview ? colors.primary : colors.textMuted} />
                    </Pressable>
                    <Pressable onPress={() => remove(b.question.id)} style={styles.iconBtn} accessibilityLabel="Remove bookmark">
                      <Feather name="bookmark" size={18} color={colors.primary} />
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8, paddingHorizontal: 20 },
  backBtn: { padding: 4 },
  tabs: { gap: 8, paddingHorizontal: 20, paddingVertical: 12 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  container: { paddingHorizontal: 20, paddingBottom: 40, gap: 16 },
  list: { gap: 10 },
  card: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  actions: { gap: 14, alignItems: 'center' },
  iconBtn: { padding: 2 },
});