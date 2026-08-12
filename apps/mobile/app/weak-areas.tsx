import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { Feather } from '@expo/vector-icons';

interface TopicBreakdown {
  topic_id: string;
  attempted: number;
  correct: number;
  last_accuracy: number | null;
  topic: { name: string; subject?: { name: string } | { name: string }[] | null } | { name: string; subject?: { name: string } | { name: string }[] | null }[] | null;
}

export default function WeakAreasScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);

  const { data, isLoading } = useQuery({
    queryKey: ['topic-breakdown'],
    queryFn: () => api.get<TopicBreakdown[]>('/progress/topics'),
    enabled: !!session,
  });

  const topicName = (t: TopicBreakdown['topic']) => (Array.isArray(t) ? t[0]?.name : t?.name) ?? 'Unknown';
  const weak = (data ?? []).filter((t) => t.last_accuracy != null && t.last_accuracy < 60).sort((a, b) => (a.last_accuracy ?? 0) - (b.last_accuracy ?? 0));
  const strong = (data ?? []).filter((t) => t.last_accuracy != null && t.last_accuracy >= 75).sort((a, b) => (b.last_accuracy ?? 0) - (a.last_accuracy ?? 0));

  const renderTopic = (t: TopicBreakdown) => (
    <Card key={t.topic_id} elevated={false} style={styles.card}>
      <View style={styles.cardHeader}>
        <AppText variant="bodyMedium" style={{ flex: 1 }}>{topicName(t.topic)}</AppText>
        <AppText variant="label" color={(t.last_accuracy ?? 0) >= 60 ? 'success' : 'danger'}>
          {Math.round(t.last_accuracy ?? 0)}%
        </AppText>
      </View>
      <ProgressBar progress={(t.last_accuracy ?? 0) / 100} height={6} color={(t.last_accuracy ?? 0) >= 60 ? colors.success : colors.danger} />
      <AppText variant="small" color="muted">{t.attempted} attempts · {t.correct} correct</AppText>
    </Card>
  );

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2">Weak Areas</AppText>
          <AppText variant="body" color="secondary">Focus here to improve your score</AppText>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.section}>
            <AppText variant="h3" color="danger">Needs improvement</AppText>
            <View style={styles.list}>
              {weak.length > 0 ? weak.slice(0, 10).map(renderTopic) : <AppText variant="body" color="muted">No weak topics yet — great job!</AppText>}
            </View>
          </View>

          <View style={styles.section}>
            <AppText variant="h3" color="success">Strengths</AppText>
            <View style={styles.list}>
              {strong.length > 0 ? strong.slice(0, 10).map(renderTopic) : <AppText variant="body" color="muted">Answer more questions to identify strengths.</AppText>}
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  backBtn: { padding: 4 },
  section: { gap: 10 },
  list: { gap: 8 },
  card: { padding: 14, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
