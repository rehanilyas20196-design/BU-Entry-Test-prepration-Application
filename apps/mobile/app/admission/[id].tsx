import React from 'react';
import { ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { Feather } from '@expo/vector-icons';
import { getRoadmapArticle } from '@/content/admissions';

export default function AdmissionArticleScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const article = getRoadmapArticle(id ?? '');

  if (!article) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="file-text" size={32} color={colors.textMuted} />
        <AppText variant="body" color="muted">Article not found.</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Feather name="chevron-left" size={24} color={colors.text} />
        </Pressable>
        <AppText variant="label" style={{ flex: 1 }}>Admission Guide</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <GlassCard gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]} style={styles.hero}>
          <View style={styles.heroIcon}>
            <Feather name={(article.icon as any)} size={22} color="#FFF" />
          </View>
          <AppText variant="h2" style={styles.whiteText}>{article.title}</AppText>
          <AppText variant="caption" style={styles.white80}>{article.summary}</AppText>
        </GlassCard>

        {article.paragraphs.map((p, i) => (
          <AppText key={i} variant="body">{p}</AppText>
        ))}

        {article.bullets && article.bullets.length > 0 && (
          <View style={styles.section}>
            <AppText variant="h3">Key Points</AppText>
            <View style={styles.bulletList}>
              {article.bullets.map((b, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather name="check-circle" size={15} color={colors.success} style={{ marginTop: 2 }} />
                  <AppText variant="body" style={{ flex: 1 }}>{b}</AppText>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { padding: 4 },
  body: { padding: 20, gap: 16, paddingBottom: 40 },
  hero: { padding: 20, gap: 8, borderRadius: 18 },
  heroIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  section: { gap: 10 },
  bulletList: { gap: 10 },
  bulletRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
});