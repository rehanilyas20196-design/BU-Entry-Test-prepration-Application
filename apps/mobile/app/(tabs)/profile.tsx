import React from 'react';
import { ScrollView, StyleSheet, View, Pressable, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';

interface Profile {
  full_name: string | null;
  program: { name: string } | { name: string }[] | null;
  test_date: string | null;
  preparation_level: string | null;
  daily_study_minutes: number | null;
}

interface Stats {
  xp: number;
  level: number;
  current_streak: number;
  total_questions_answered: number;
  total_mock_tests: number;
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut, session } = useAuthStore();
  const { themePreference, notificationsEnabled, setThemePreference, setNotificationsEnabled } = useSettingsStore();
  const { show } = useToast();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get<Profile>('/users/me/profile'),
    enabled: !!session,
  });

  const { data: stats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => api.get<Stats>('/users/me/stats'),
    enabled: !!session,
  });

  const programName = profile?.program ? (Array.isArray(profile.program) ? profile.program[0]?.name : profile.program.name) : null;

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert('Delete account', 'This permanently deletes your account and all progress. This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete('/users/me');
            show('Account deleted', 'success');
            await signOut();
          } catch (e) {
            show(e instanceof Error ? e.message : 'Failed to delete account. Please try again.', 'error');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AppText variant="h1" style={{ color: '#FFF' }}>
            {(profile?.full_name ?? 'S')[0].toUpperCase()}
          </AppText>
        </View>
        <AppText variant="h2">{profile?.full_name ?? 'Student'}</AppText>
        <AppText variant="body" color="secondary">{programName ?? 'Program not set'}</AppText>
        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
            <Feather name="award" size={14} color={colors.primary} />
            <AppText variant="small" color="primary">Level {stats?.level ?? 1} · {stats?.xp ?? 0} XP</AppText>
          </View>
          {profile?.test_date && (
            <View style={[styles.badge, { backgroundColor: colors.warningLight }]}>
              <Feather name="calendar" size={14} color={colors.warning} />
              <AppText variant="small" color="warning">{profile.test_date}</AppText>
            </View>
          )}
        </View>
      </View>

      <View style={styles.statsRow}>
        <Card elevated={false} style={styles.statCard}>
          <AppText variant="h3" color="primary">{stats?.current_streak ?? 0}d</AppText>
          <AppText variant="small" color="muted">Streak</AppText>
        </Card>
        <Card elevated={false} style={styles.statCard}>
          <AppText variant="h3" color="primary">{stats?.total_questions_answered ?? 0}</AppText>
          <AppText variant="small" color="muted">Questions</AppText>
        </Card>
        <Card elevated={false} style={styles.statCard}>
          <AppText variant="h3" color="primary">{stats?.total_mock_tests ?? 0}</AppText>
          <AppText variant="small" color="muted">Mock tests</AppText>
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Study</AppText>
        <Card elevated={false} style={styles.menuCard}>
          <MenuItem icon="bookmark" label="My Bookmarks" onPress={() => router.push('/bookmarks')} />
          <MenuItem icon="alert-circle" label="My Mistakes" onPress={() => router.push('/mistakes')} />
          <MenuItem icon="trending-down" label="Weak Areas" onPress={() => router.push('/weak-areas')} />
          <MenuItem icon="calendar" label="Study Plan" onPress={() => router.push('/study-plan')} />
        </Card>
      </View>

      <View style={styles.section}>
        <AppText variant="h3">Settings</AppText>
        <Card elevated={false} style={styles.menuCard}>
          <SettingItem
            icon="moon"
            label="Dark mode"
            value={
              <View style={styles.segmented}>
                {(['light', 'dark', 'system'] as const).map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => setThemePreference(t)}
                    style={[styles.segment, { backgroundColor: themePreference === t ? colors.primary : colors.surfaceAlt }]}
                  >
                    <AppText variant="small" style={{ color: themePreference === t ? '#FFF' : colors.textSecondary, textTransform: 'capitalize' }}>
                      {t}
                    </AppText>
                  </Pressable>
                ))}
              </View>
            }
          />
          <View style={styles.toggleRow}>
            <View style={styles.toggleIcon}>
              <Feather name="bell" size={16} color={colors.primary} />
            </View>
            <AppText variant="bodyMedium" style={{ flex: 1 }}>Notifications</AppText>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
            />
          </View>
          <MenuItem icon="shield" label="Privacy Policy" onPress={() => router.push('/privacy')} />
          <MenuItem icon="file-text" label="Terms of Service" onPress={() => router.push('/terms')} />
        </Card>
      </View>

      <Card elevated={false} style={styles.menuCard}>
        <MenuItem icon="log-out" label="Sign out" danger onPress={handleSignOut} />
        <MenuItem icon="trash-2" label="Delete account" danger onPress={handleDeleteAccount} />
      </Card>

      <AppText variant="small" color="muted" style={styles.disclaimer}>
        BUET Prep AI is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
      </AppText>
    </ScrollView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
  danger,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.menuItem} accessibilityRole="button" accessibilityLabel={label}>
      <Feather name={icon} size={16} color={danger ? colors.danger : colors.textSecondary} />
      <AppText variant="bodyMedium" style={{ flex: 1, color: danger ? colors.danger : colors.text }}>
        {label}
      </AppText>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function SettingItem({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.menuItem, { alignItems: 'center' }]}>
      <Feather name={icon} size={16} color={colors.textSecondary} />
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{label}</AppText>
      {value}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 20 },
  profileHeader: { alignItems: 'center', gap: 8, marginTop: 8 },
  avatar: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  section: { gap: 10 },
  menuCard: { padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12 },
  segmented: { flexDirection: 'row', gap: 6 },
  segment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12 },
  toggleIcon: { width: 20, alignItems: 'center' },
  disclaimer: { textAlign: 'center', marginTop: 8 },
});
