import React from 'react';
import { StyleSheet, View, Pressable, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { ScreenScrollView } from '@/components/ui/ScreenScrollView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Feather } from '@expo/vector-icons';
import { ROADMAP_STAGES, ROADMAP_ARTICLES, APPLY_URL } from '@/content/admissions';

export default function GuideScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <ScreenScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppText variant="h2">Admission Guide</AppText>
        <AppText variant="body" color="secondary">Your roadmap to Bahria University</AppText>
      </View>

      <Card style={styles.hero}>
        <View style={[styles.heroIcon, { backgroundColor: colors.primaryLight }]}>
          <Feather name="map" size={22} color={colors.primary} />
        </View>
        <AppText variant="h3">Admission Roadmap</AppText>
        <AppText variant="small" color="secondary">
          Create account → online form → fee voucher → entry test slip → BUET → merit list → interview. Track every stage with this guide.
        </AppText>
        <Button
          title="Apply Now"
          icon={<Feather name="external-link" size={15} color="#FFF" />}
          onPress={() => Linking.openURL(APPLY_URL)}
          fullWidth={false}
        />
      </Card>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="h3">Application Stages</AppText>
        </View>
        <View style={styles.stageList}>
          {ROADMAP_STAGES.map((stage, idx) => (
            <Card key={stage.title} style={styles.stageCard}>
              <View style={styles.stageLeft}>
                <View style={[styles.stageNum, { backgroundColor: colors.primary }]}>
                  <AppText variant="label" style={{ color: '#FFF' }}>{idx + 1}</AppText>
                </View>
                {idx < ROADMAP_STAGES.length - 1 && <View style={[styles.stageLine, { backgroundColor: colors.surfaceAlt }]} />}
              </View>
              <View style={styles.stageBody}>
                <View style={styles.stageTitleRow}>
                  <Feather name={(stage.icon as any)} size={15} color={colors.primary} />
                  <AppText variant="label" style={{ flex: 1 }}>{stage.title}</AppText>
                </View>
                <AppText variant="small" color="secondary">{stage.description}</AppText>
              </View>
            </Card>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <AppText variant="h3">Everything You Need to Know</AppText>
        </View>
        <View style={styles.articleList}>
          {ROADMAP_ARTICLES.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => router.push({ pathname: '/admission/[id]', params: { id: a.id } })}
              style={({ pressed }) => [pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={a.title}
            >
              <Card style={styles.articleCard}>
                <View style={[styles.articleIcon, { backgroundColor: colors.primaryLight }]}>
                  <Feather name={(a.icon as any)} size={18} color={colors.primary} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <AppText variant="label">{a.title}</AppText>
                  <AppText variant="small" color="muted">{a.summary}</AppText>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textMuted} />
              </Card>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/achievements')}
        style={({ pressed }) => [pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="View achievements"
      >
        <Card style={styles.achievementCard}>
          <View style={[styles.achievementIcon, { backgroundColor: colors.warningLight }]}>
            <Feather name="award" size={20} color={colors.warning} />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="label">Achievements</AppText>
            <AppText variant="micro" color="muted">Track your milestones and earn your BUET Master crown</AppText>
          </View>
          <Feather name="chevron-right" size={18} color={colors.textMuted} />
        </Card>
      </Pressable>
    </ScreenScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  header: { gap: 4, marginTop: 8 },
  hero: { padding: 20, gap: 12 },
  heroIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  section: { gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stageList: { gap: 0 },
  stageCard: { padding: 14, flexDirection: 'row', gap: 12, marginBottom: 10 },
  stageLeft: { alignItems: 'center', width: 28 },
  stageNum: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  stageLine: { width: 2, flex: 1, marginTop: 4 },
  stageBody: { flex: 1, gap: 4 },
  stageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  articleList: { gap: 10 },
  articleCard: {
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  articleIcon: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center',
  },
  achievementCard: {
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  achievementIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.94 },
});
