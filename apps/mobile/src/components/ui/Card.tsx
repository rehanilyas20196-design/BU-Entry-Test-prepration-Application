import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { shadow, radius } from '@/theme/theme';

export interface CardProps extends ViewProps {
  elevated?: boolean;
  padded?: boolean;
  children: React.ReactNode;
}

export function Card({ elevated = true, padded = true, children, style, ...props }: CardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          padding: padded ? 16 : 0,
          ...(elevated ? shadow.card : {}),
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
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
