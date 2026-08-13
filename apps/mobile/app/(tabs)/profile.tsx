import React, { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { GlassCard } from '@/components/ui/GlassCard';
import { FloatingParticles } from '@/components/ui/FloatingParticles';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { Reveal } from '@/components/ui/Reveal';
import { Float3D } from '@/components/ui/Float3D';
import { AnimatedNumber } from '@/components/ui/Animated';
import { AnimatedSwitch } from '@/components/ui/AnimatedSwitch';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { Feather } from '@expo/vector-icons';
import { useToast } from '@/components/ui/Toast';
import { confirmAction } from '@/lib/confirm';

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

const STUDY_MENU = [
  { icon: 'bookmark' as const, label: 'My Bookmarks', route: '/bookmarks', gradient: ['#F59E0B', '#F97316'] as const },
  { icon: 'alert-circle' as const, label: 'My Mistakes', route: '/mistakes', gradient: ['#E11D48', '#F43F5E'] as const },
  { icon: 'bar-chart-2' as const, label: 'Performance', route: '/performance', gradient: ['#6366F1', '#7C3AED'] as const },
  { icon: 'trending-down' as const, label: 'Weak Areas', route: '/weak-areas', gradient: ['#0EA5E9', '#6366F1'] as const },
  { icon: 'calendar' as const, label: 'Study Plan', route: '/study-plan', gradient: ['#10B981', '#059669'] as const },
] as const;

const LEGAL_MENU = [
  { icon: 'shield' as const, label: 'Privacy Policy', route: '/privacy', gradient: ['#8B5CF6', '#D946EF'] as const },
  { icon: 'file-text' as const, label: 'Terms of Service', route: '/terms', gradient: ['#3B82F6', '#2563EB'] as const },
] as const;

export default function ProfileScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut, session } = useAuthStore();
  const { themePreference, notificationsEnabled, reducedMotion, setThemePreference, setNotificationsEnabled, setReducedMotion } = useSettingsStore();
  const { show } = useToast();

  const { data: profile, isLoading } = useQuery({
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

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const bgColors = colors.isDark
    ? ([colors.heroGradientStart, colors.gradientMid, colors.heroGradientEnd] as [string, string, string])
    : (['#FFFFFF', '#EEF2FF', '#F6F7FB'] as [string, string, string]);

  const heroParallax = useAnimatedStyle(() => ({
    opacity: reducedMotion ? 1 : 1 - Math.min(scrollY.value * 0.0014, 0.45),
    transform: [
      { perspective: 900 },
      { rotateX: `${Math.min(scrollY.value * 0.02, 7)}deg` },
    ],
  }));

  const handleSignOut = async () => {
    const ok = await confirmAction({
      title: 'Sign out',
      message: 'Are you sure you want to sign out?',
      confirmLabel: 'Sign out',
      destructive: true,
    });
    if (ok) await signOut();
  };

  const handleDeleteAccount = async () => {
    const ok = await confirmAction({
      title: 'Delete account',
      message: 'This permanently deletes your account and all progress. This cannot be undone.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (!ok) return;
    try {
      await api.delete('/users/me');
      show('Account deleted', 'success');
      await signOut();
    } catch (e) {
      show(e instanceof Error ? e.message : 'Failed to delete account. Please try again.', 'error');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GradientBackground colors={bgColors} animated>
        <Animated.ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {isLoading && !profile ? (
            <Reveal scrollY={scrollY} index={0}>
              <SkeletonCard lines={3} />
              <View style={styles.skeletonGap} />
              <SkeletonCard lines={1} />
            </Reveal>
          ) : (
            <Animated.View style={heroParallax}>
              <GlassCard
                gradient={[colors.heroGradientStart, colors.heroGradientMid, colors.heroGradientEnd]}
                glow
                style={styles.profileHeader}
              >
                <FloatingParticles count={8} color="#FFFFFF" />
                <TiltAvatar
                  letter={(profile?.full_name?.trim()?.[0] ?? 'S').toUpperCase()}
                  reduced={reducedMotion}
                />
                <AppText variant="h2" style={styles.whiteText}>{profile?.full_name ?? 'Student'}</AppText>
                <AppText variant="body" style={styles.white80}>{programName ?? 'Program not set'}</AppText>
                <View style={styles.badges}>
                  <View style={styles.badge}>
                    <Feather name="award" size={14} color="#FDE68A" />
                    <AppText variant="small" style={styles.whiteText}>Level {stats?.level ?? 1} · {stats?.xp ?? 0} XP</AppText>
                  </View>
                  {profile?.test_date && (
                    <View style={styles.badge}>
                      <Feather name="calendar" size={14} color="#FFF" />
                      <AppText variant="small" style={styles.whiteText}>{profile.test_date}</AppText>
                    </View>
                  )}
                </View>
              </GlassCard>
            </Animated.View>
          )}

          <Reveal scrollY={scrollY} index={1}>
            <Float3D style={styles.statsRow} phase={0.2}>
              <GlassCard style={styles.statCard}>
                <View style={styles.statValue}>
                  <AnimatedNumber value={stats?.current_streak ?? 0} delay={320} style={[styles.statNum, { color: colors.primary }]} />
                  <AppText style={[styles.statNum, { color: colors.primary }]}>d</AppText>
                </View>
                <AppText variant="small" color="muted">Streak</AppText>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <AnimatedNumber value={stats?.total_questions_answered ?? 0} delay={420} style={[styles.statNum, { color: colors.primary }]} />
                <AppText variant="small" color="muted">Questions</AppText>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <AnimatedNumber value={stats?.total_mock_tests ?? 0} delay={520} style={[styles.statNum, { color: colors.primary }]} />
                <AppText variant="small" color="muted">Mock tests</AppText>
              </GlassCard>
            </Float3D>
          </Reveal>

          <Reveal scrollY={scrollY} index={2}>
            <View style={styles.section}>
              <AppText variant="h3">Study</AppText>
              <Float3D phase={0.35}>
              <GlassCard style={styles.menuCard}>
                {STUDY_MENU.map((item) => (
                  <MenuRow
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    gradient={item.gradient}
                    onPress={() => router.push(item.route)}
                  />
                ))}
              </GlassCard>
              </Float3D>
            </View>
          </Reveal>

          <Reveal scrollY={scrollY} index={3}>
            <View style={styles.section}>
              <AppText variant="h3">Settings</AppText>
              <Float3D phase={0.5}>
              <GlassCard style={styles.menuCard}>
                <SettingRow
                  icon="moon"
                  label="Appearance"
                  gradient={['#6366F1', '#7C3AED'] as const}
                  value={
                    <View style={styles.segmented}>
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <Pressable
                          key={t}
                          onPress={() => setThemePreference(t)}
                          style={[styles.segment, { backgroundColor: themePreference === t ? colors.primary : colors.surfaceAlt }]}
                          accessibilityRole="button"
                          accessibilityLabel={`${t} theme`}
                        >
                          <AppText variant="small" style={{ color: themePreference === t ? '#FFF' : colors.textSecondary, textTransform: 'capitalize' }}>
                            {t}
                          </AppText>
                        </Pressable>
                      ))}
                    </View>
                  }
                />
                <SettingRow
                  icon="activity"
                  label="Reduce motion"
                  gradient={['#10B981', '#0D9488'] as const}
                  value={<AnimatedSwitch value={reducedMotion} onValueChange={setReducedMotion} />}
                />
                <SettingRow
                  icon="bell"
                  label="Notifications"
                  gradient={['#F59E0B', '#F97316'] as const}
                  value={<AnimatedSwitch value={notificationsEnabled} onValueChange={setNotificationsEnabled} />}
                />
                {LEGAL_MENU.map((item) => (
                  <MenuRow
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    gradient={item.gradient}
                    onPress={() => router.push(item.route)}
                  />
                ))}
              </GlassCard>
              </Float3D>
            </View>
          </Reveal>

          <Reveal scrollY={scrollY} index={4}>
            <Float3D phase={0.65}>
              <GlassCard style={styles.menuCard}>
                <MenuRow icon="log-out" label="Sign out" danger onPress={handleSignOut} />
                <MenuRow icon="trash-2" label="Delete account" danger onPress={handleDeleteAccount} />
              </GlassCard>
            </Float3D>
            <AppText variant="small" color="muted" style={styles.disclaimer}>
              BUET Prep AI is an independent educational preparation platform and is not affiliated with or endorsed by Bahria University.
            </AppText>
          </Reveal>
        </Animated.ScrollView>
      </GradientBackground>
    </View>
  );
}

function TiltAvatar({ letter, reduced }: { letter: string; reduced: boolean }) {
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const float = useSharedValue(0);

  useEffect(() => {
    if (reduced) {
      tiltX.value = 0;
      tiltY.value = 0;
      float.value = 0;
      return;
    }
    tiltX.value = withRepeat(withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.sin) }), -1, true);
    tiltY.value = withRepeat(withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.sin) }), -1, true);
    float.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [reduced, tiltX, tiltY, float]);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: reduced ? '0deg' : `${Math.sin(tiltX.value * Math.PI) * 18}deg` },
      { rotateY: reduced ? '0deg' : `${Math.sin(tiltY.value * Math.PI) * 16}deg` },
      { translateY: reduced ? 0 : -Math.sin(float.value * Math.PI) * 4 },
    ],
  }));

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reduced ? 0 : -Math.sin(float.value * Math.PI) * 3 }],
  }));

  return (
    <Animated.View style={[styles.avatarRing, ringStyle]}>
      <LinearGradient
        colors={['#FFFFFF', '#A5B4FC', '#818CF8'] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.avatarGradient}
      >
        <Animated.View style={[styles.avatar, floatStyle] as any}>
          <AppText variant="h1" style={styles.avatarText}>{letter}</AppText>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

function MenuRow({
  icon,
  label,
  onPress,
  danger,
  gradient,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
  gradient?: readonly [string, string, ...string[]];
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        if (!danger) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [styles.menuItem, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {gradient ? (
        <LinearGradient colors={[...gradient] as [string, string, ...string[]]} style={styles.menuTile}>
          <Feather name={icon} size={15} color="#FFF" />
        </LinearGradient>
      ) : (
        <View style={[styles.menuTile, { backgroundColor: danger ? 'rgba(225,29,72,0.16)' : colors.surfaceAlt }]}>
          <Feather name={icon} size={15} color={danger ? colors.danger : colors.textSecondary} />
        </View>
      )}
      <AppText variant="bodyMedium" style={{ flex: 1, color: danger ? colors.danger : colors.text }}>
        {label}
      </AppText>
      <Feather name="chevron-right" size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function SettingRow({
  icon,
  label,
  gradient,
  value,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  gradient: readonly [string, string, ...string[]];
  value: React.ReactNode;
}) {
  return (
    <View style={[styles.menuItem, { alignItems: 'center' }]}>
      <LinearGradient colors={[...gradient] as [string, string, ...string[]]} style={styles.menuTile}>
        <Feather name={icon} size={15} color="#FFF" />
      </LinearGradient>
      <AppText variant="bodyMedium" style={{ flex: 1 }}>{label}</AppText>
      {value}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { padding: 20, paddingBottom: 110, gap: 18 },
  skeletonGap: { height: 14 },
  profileHeader: { alignItems: 'center', gap: 6, padding: 24 },
  avatarRing: {
    width: 92, height: 92, borderRadius: 46,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  avatarGradient: {
    width: 92, height: 92, borderRadius: 46,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)',
  },
  avatar: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(10,14,31,0.4)',
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  avatarText: { color: '#FFF' },
  whiteText: { color: '#FFF' },
  white80: { color: 'rgba(255,255,255,0.85)' },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap', justifyContent: 'center' },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)',
  },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, padding: 14, alignItems: 'center', gap: 4 },
  statValue: { flexDirection: 'row', alignItems: 'baseline' },
  statNum: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  section: { gap: 10 },
  menuCard: { padding: 4 },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 12 },
  pressed: { transform: [{ scale: 0.98 }], opacity: 0.92 },
  menuTile: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  segmented: { flexDirection: 'row', gap: 6 },
  segment: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  disclaimer: { textAlign: 'center', marginTop: 8 },
});
