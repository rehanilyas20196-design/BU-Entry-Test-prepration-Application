import React from 'react';
import { ViewStyle } from 'react-native';
import { Button } from '@/components/ui/Button';

interface AnimatedButtonProps {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  gradient?: readonly [string, string, ...string[]];
  fullWidth?: boolean;
  style?: ViewStyle;
}

/** Compat wrapper around the shared Button. */
export function AnimatedButton({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  gradient: _gradient,
  fullWidth = true,
  style,
}: AnimatedButtonProps) {
  return (
    <Button
      title={title}
      onPress={onPress}
      variant={variant}
      size={size}
      loading={loading}
      disabled={disabled}
      icon={icon}
      fullWidth={fullWidth}
      style={style}
    />
  );
}
