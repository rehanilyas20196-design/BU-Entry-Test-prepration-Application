import React from 'react';
import { ScrollView, ScrollViewProps, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { useResponsive } from '@/hooks/useResponsive';

interface ScreenScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
}

/**
 * Standard page scroll view. On web/desktop the content is centered in a
 * comfortable max-width column; on mobile it behaves exactly like a plain
 * ScrollView with the given contentContainerStyle.
 */
export const ScreenScrollView = React.forwardRef<ScrollView, ScreenScrollViewProps>(
  function ScreenScrollView({ children, style, contentContainerStyle, ...props }, ref) {
    const { colors } = useTheme();
    const { isWeb, isDesktop } = useResponsive();

    return (
      <ScrollView
        ref={ref}
        style={[{ backgroundColor: colors.background }, style]}
        contentContainerStyle={[
          styles.content,
          contentContainerStyle,
          isWeb && isDesktop && styles.wideContent,
        ]}
        {...props}
      >
        {children}
      </ScrollView>
    );
  }
);

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  wideContent: { width: '100%', maxWidth: 1120, marginHorizontal: 'auto' },
});
