import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = false, padded = true, children, style, ...props }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: elevated ? colors.border : colors.border,
          padding: padded ? 16 : 0,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
