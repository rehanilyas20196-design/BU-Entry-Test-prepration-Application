import React from 'react';
import { ViewStyle } from 'react-native';
import { View } from 'react-native';

interface RevealProps {
  scrollY: { value: number };
  index?: number;
  distance?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

/** Scroll-reveal is disabled for the clean, minimal design. */
export function Reveal({ children, style }: RevealProps) {
  return <View style={style}>{children}</View>;
}

interface ScrollFadeProps {
  visible: boolean;
  index?: number;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function ScrollFade({ children, style }: ScrollFadeProps) {
  return <View style={style}>{children}</View>;
}

export const revealStyles = {};
