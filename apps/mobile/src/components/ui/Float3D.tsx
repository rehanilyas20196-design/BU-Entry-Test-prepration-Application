import React from 'react';
import { View, ViewStyle } from 'react-native';

interface Float3DProps {
  children: React.ReactNode;
  phase?: number;
  intensity?: number;
  duration?: number;
  style?: ViewStyle;
}

/** Continuous 3D float is disabled for the clean, minimal design. */
export function Float3D({ children, style }: Float3DProps) {
  return <View style={style}>{children}</View>;
}
