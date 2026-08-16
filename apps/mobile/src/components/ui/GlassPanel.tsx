import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface GlassPanelProps {
  children?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentStyle?: ViewStyle;
  radius?: number;
  accent?: readonly [string, string, ...string[]];
  accentOpacity?: number;
  press?: { value: number };
  sweep?: { value: number };
  gloss?: boolean;
  ring?: boolean;
  shadowIntensity?: number;
  surface?: 'auto' | 'light' | 'dark';
}

/** Clean light surface panel (hairline border, 12px radius, no effects). */
export function GlassPanel({
  children,
  style,
  contentStyle,
  radius: r = radius.md,
  surface: _surface,
  ..._rest
}: GlassPanelProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.wrap, style]}>
      <View
        style={[
          styles.panel,
          contentStyle,
          { borderRadius: r, backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%' },
  panel: {
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    flex: 1,
  },
});
