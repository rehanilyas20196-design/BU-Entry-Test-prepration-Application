import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface FooterLink {
  label: string;
  route: string;
}

interface FooterProps {
  links?: FooterLink[];
  onNavigate: (route: string) => void;
}

export function Footer({ links = [], onNavigate }: FooterProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.footer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.inner}>
        <Text style={[styles.copyright, { color: colors.textMuted }]}>
          © {new Date().getFullYear()} BUET Prep AI. Independent preparation for the Bahria University Entry Test.
        </Text>
        <View style={styles.links}>
          {links.map((link) => (
            <Pressable key={link.route} onPress={() => onNavigate(link.route)} accessibilityRole="link">
              <Text style={[styles.linkText, { color: colors.textSecondary }]}>{link.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { borderTopWidth: 1 },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  copyright: { fontSize: 13, flex: 1 },
  links: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  linkText: { fontSize: 13, fontWeight: '500' },
});
