import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAdminAuthStore } from '../adminAuth';
import { adminColors } from './ui';

export type AdminTab =
  | 'dashboard'
  | 'users'
  | 'tests'
  | 'questions'
  | 'premium'
  | 'catalog'
  | 'announcements'
  | 'coupons'
  | 'analytics'
  | 'activity';

const NAV: { tab: AdminTab; label: string; icon: keyof typeof Feather.glyphMap; href: string }[] = [
  { tab: 'dashboard', label: 'Dashboard', icon: 'grid', href: '/admin' },
  { tab: 'users', label: 'Users', icon: 'users', href: '/admin/users' },
  { tab: 'tests', label: 'Tests', icon: 'clipboard', href: '/admin/tests' },
  { tab: 'questions', label: 'Questions', icon: 'help-circle', href: '/admin/questions' },
  { tab: 'premium', label: 'Premium', icon: 'star', href: '/admin/premium' },
  { tab: 'catalog', label: 'Catalog', icon: 'book-open', href: '/admin/catalog' },
  { tab: 'announcements', label: 'Announce', icon: 'send', href: '/admin/announcements' },
  { tab: 'coupons', label: 'Coupons', icon: 'tag', href: '/admin/coupons' },
  { tab: 'analytics', label: 'Analytics', icon: 'bar-chart-2', href: '/admin/analytics' },
  { tab: 'activity', label: 'Activity', icon: 'list', href: '/admin/activity' },
];

export function AdminShell({
  title,
  active,
  children,
}: {
  title: string;
  active: AdminTab;
  children: React.ReactNode;
}) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;
  const { session, logout } = useAdminAuthStore();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login' as any);
  };

  const navRow = (item: (typeof NAV)[number]) => {
    const isActive = item.tab === active;
    return (
      <Pressable
        key={item.tab}
        onPress={() => router.push(item.href as any)}
        style={({ pressed }) => [
          isDesktop ? styles.navItem : styles.navItemMobile,
          isActive && { backgroundColor: adminColors.primary },
          isDesktop && isActive && { backgroundColor: adminColors.primaryLight },
          pressed && { opacity: 0.7 },
        ]}
      >
        <Feather
          name={item.icon}
          size={isDesktop ? 16 : 15}
          color={isActive ? (isDesktop ? adminColors.primary : '#FFFFFF') : adminColors.textSecondary}
        />
        <Text
          style={[
            isDesktop ? styles.navText : styles.navTextMobile,
            { color: isActive ? (isDesktop ? adminColors.primary : '#FFFFFF') : adminColors.textSecondary },
          ]}
        >
          {item.label}
        </Text>
      </Pressable>
    );
  };

  const content = (
    <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>{title}</Text>
      {children}
    </ScrollView>
  );

  if (isDesktop) {
    return (
      <View style={[styles.root, styles.rootRow, { backgroundColor: adminColors.bg }]}>
        <View style={styles.sidebar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Feather name="shield" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandText}>BUET Prep AI</Text>
            <Text style={styles.brandSub}>Admin Console</Text>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 10, gap: 4 }}>
            {NAV.map(navRow)}
          </ScrollView>
          <View style={styles.sidebarFooter}>
            <View style={styles.footerEmailRow}>
              <Feather name="user" size={14} color={adminColors.textMuted} />
              <Text numberOfLines={1} style={styles.footerEmail}>
                {session?.display_name || session?.email}
              </Text>
            </View>
            <Pressable onPress={handleLogout} style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.7 }]}>
              <Feather name="log-out" size={15} color={adminColors.danger} />
              <Text style={styles.logoutText}>Log out</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.desktopContent}>{content}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: adminColors.bg }]}>
      <View style={styles.topbar}>
        <View style={styles.topbarBrand}>
          <View style={styles.brandIcon}>
            <Feather name="shield" size={14} color="#FFFFFF" />
          </View>
          <Text style={styles.topbarBrandText}>BUET Prep AI Admin</Text>
        </View>
        <Pressable onPress={handleLogout} hitSlop={8}>
          <Feather name="log-out" size={18} color={adminColors.textSecondary} />
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.mobileNavScroll}
        contentContainerStyle={styles.mobileNavContent}
      >
        {NAV.map(navRow)}
      </ScrollView>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootRow: { flexDirection: 'row' },
  sidebar: {
    width: 236,
    backgroundColor: adminColors.surface,
    borderRightWidth: 1,
    borderRightColor: adminColors.border,
    paddingTop: 20,
    paddingBottom: 16,
  },
  brandRow: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    marginBottom: 12,
  },
  brandIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: adminColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.text,
  },
  brandSub: {
    fontSize: 12,
    color: adminColors.textMuted,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sidebarFooter: {
    paddingHorizontal: 14,
    gap: 10,
  },
  footerEmailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerEmail: {
    fontSize: 12,
    color: adminColors.textMuted,
    flex: 1,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
    color: adminColors.danger,
  },
  topbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
  },
  topbarBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topbarBrandText: {
    fontSize: 15,
    fontWeight: '800',
    color: adminColors.text,
  },
  mobileNavScroll: {
    backgroundColor: adminColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    flexGrow: 0,
  },
  mobileNavContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  navItemMobile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: adminColors.surfaceAlt,
  },
  navTextMobile: {
    fontSize: 13,
    fontWeight: '600',
  },
  contentScroll: {
    flex: 1,
  },
  desktopContent: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
    gap: 16,
    flexGrow: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: adminColors.text,
  },
});
