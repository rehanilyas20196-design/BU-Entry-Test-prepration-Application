import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface MistakeItem {
  id: string;
  wrong_count: number;
  resolved: boolean;
  last_accuracy: number | null;
  question: {
    id: string;
    question_text: string;
    difficulty: string;
    subject?: { name: string } | { name: string }[] | null;
    topic?: { name: string } | { name: string }[] | null;
  };
}

export default function MistakesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data, isLoading } = useQuery({
    queryKey: ['mistakes'],
    queryFn: () => api.get<MistakeItem[]>('/mistakes'),
    enabled: !!session,
  });

  const { data: retrySet, isLoading: retryLoading } = useQuery({
    queryKey: ['smart-retry'],
    queryFn: () => api.get<{ id: string }[]>('/mistakes/smart-retry'),
    enabled: !!session,
  });

  const openRetry = () => {
    router.push({ pathname: '/practice-session', params: { smartRetry: '1' } });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="h2">My Mistakes</AppText>
      </View>

      {retryLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (retrySet?.length ?? 0) > 0 ? (
        <Card style={styles.retryCard}>
          <AppText variant="label">Smart Retry available</AppText>
          <AppText variant="small" color="secondary">
            Based on your recent answers, we found weak topics worth practicing. Let's improve them.
          </AppText>
          <Button title="Start Smart Practice" onPress={openRetry} size="sm" fullWidth={false} />
        </Card>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} />
      ) : (data ?? []).length === 0 ? (
        <AppText variant="body" color="muted" style={{ textAlign: 'center', marginTop: 40 }}>
          No mistakes recorded yet. Keep practicing!
        </AppText>
      ) : (
        <View style={styles.list}>
          {(data ?? []).slice(0, 30).map((m) => {
            const topicName = Array.isArray(m.question.topic) ? m.question.topic[0]?.name : m.question.topic?.name;
            return (
              <Card key={m.id} elevated={false} style={styles.card}>
                <Pressable onPress={() => router.push({ pathname: '/question/[id]', params: { id: m.question.id } })}>
                  <AppText variant="bodyMedium" numberOfLines={2}>{m.question.question_text}</AppText>
                  <View style={styles.meta}>
                    <AppText variant="small" color="muted">{topicName ?? 'General'} · wrong {m.wrong_count}×</AppText>
                  </View>
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
  retryCard: { padding: 16, gap: 10 },
  list: { gap: 10 },
  card: { padding: 14 },
  meta: { marginTop: 4 },
});
