import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface NavItem {
  label: string;
  route: string;
  active?: boolean;
  icon?: keyof typeof Feather.glyphMap;
}

interface NavbarProps {
  brand?: string;
  items?: NavItem[];
  onNavigate: (route: string) => void;
  right?: React.ReactNode;
}

export function Navbar({ brand = 'BUET Prep AI', items = [], onNavigate, right }: NavbarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.inner}>
        <Pressable onPress={() => onNavigate('/')} style={styles.brand} accessibilityRole="link">
          <Feather name="book-open" size={18} color={colors.primary} />
          <Text style={[styles.brandText, { color: colors.text }]}>{brand}</Text>
        </Pressable>

        <View style={styles.links}>
          {items.map((item) => (
            <Pressable
              key={item.route}
              onPress={() => onNavigate(item.route)}
              style={({ pressed }) => [
                styles.link,
                item.active && { backgroundColor: colors.primaryLight },
                pressed && { backgroundColor: colors.surfaceAlt },
              ]}
              accessibilityRole="link"
            >
              {item.icon ? <Feather name={item.icon} size={16} color={item.active ? colors.primary : colors.textSecondary} /> : null}
              <Text style={[styles.linkText, { color: item.active ? colors.primary : colors.textSecondary }]}>
                {item.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: 1,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontSize: 17, fontWeight: '500' },
  links: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, flexWrap: 'wrap' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  linkText: { fontSize: 14, fontWeight: '500' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
