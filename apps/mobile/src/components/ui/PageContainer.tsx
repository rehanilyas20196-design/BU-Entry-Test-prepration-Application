import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

interface PageContainerProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * Centers page content within a comfortable reading width on web.
 * On mobile it is a no-op (full width), so mobile layout is unchanged.
 */
export function PageContainer({ children, style, ...props }: PageContainerProps) {
  const { isWeb, isDesktop } = useResponsive();

  return (
    <View
      style={[styles.base, isWeb && isDesktop && styles.wide, style]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%' },
  wide: { maxWidth: 1120, alignSelf: 'center', width: '100%' },
});
