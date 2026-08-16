import React from 'react';
import { View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

interface GradientCTAProps {
  title: string;
  icon?: keyof typeof Feather.glyphMap;
  onPress: () => void;
  gradient?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

/** Primary call-to-action rendered as the standard filled button. */
export function GradientCTA({ title, icon, onPress, gradient: _gradient, style }: GradientCTAProps) {
  const { colors } = useTheme();
  return (
    <View style={[{ width: '100%' }, style]}>
      <Button
        title={title}
        onPress={onPress}
        icon={icon ? <Feather name={icon} size={16} color="#FFFFFF" /> : undefined}
      />
    </View>
  );
}
