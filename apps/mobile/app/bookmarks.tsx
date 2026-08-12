import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
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

export default function BookmarksScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => api.get<BookmarkItem[]>('/bookmarks'),
    enabled: !!session,
  });

  const remove = async (questionId: string) => {
    await api.delete(`/bookmarks/${questionId}`);
    void refetch();
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">My Bookmarks</AppText>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (data ?? []).length === 0 ? (
        <AppText variant="body" color="muted" style={{ textAlign: 'center', marginTop: 40 }}>
          No bookmarks yet. Tap the bookmark icon on any question to save it here.
        </AppText>
      ) : (
        <View style={styles.list}>
          {(data ?? []).map((b) => {
            const topicName = Array.isArray(b.question.topic) ? b.question.topic[0]?.name : b.question.topic?.name;
            return (
              <Card key={b.id} elevated={false} style={styles.card}>
                <Pressable onPress={() => router.push({ pathname: '/question/[id]', params: { id: b.question.id } })}>
                  <AppText variant="bodyMedium" numberOfLines={2}>{b.question.question_text}</AppText>
                  <View style={styles.meta}>
                    <AppText variant="small" color="muted">{topicName ?? 'General'} · {b.question.difficulty}</AppText>
                  </View>
                </Pressable>
                <Pressable onPress={() => remove(b.question.id)} style={styles.removeBtn} accessibilityLabel="Remove bookmark">
                  <Feather name="bookmark" size={18} color={colors.primary} />
                </Pressable>
              </Card>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  list: { gap: 10 },
  card: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  meta: { marginTop: 4 },
  removeBtn: { padding: 8 },
});
