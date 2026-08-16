import { Platform, useWindowDimensions } from 'react-native';

export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
  wide: 1280,
} as const;

export const WEB_MAX_WIDTH = 1120;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  return {
    width,
    isWeb,
    isTablet: width >= BREAKPOINTS.tablet,
    isDesktop: width >= BREAKPOINTS.desktop,
    isWide: width >= BREAKPOINTS.wide,
    isCompact: width < BREAKPOINTS.tablet,
    maxWidth: WEB_MAX_WIDTH,
  };
}
