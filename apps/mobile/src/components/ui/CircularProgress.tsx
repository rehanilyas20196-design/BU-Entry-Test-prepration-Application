import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '@/hooks/useTheme';

interface CircularProgressProps {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0..1
  label?: string;
  sublabel?: string;
}

export function CircularProgress({
  size = 96,
  strokeWidth = 9,
  progress,
  label,
  sublabel,
}: CircularProgressProps) {
  const { colors } = useTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.surfaceAlt}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={clamped < 0.5 ? colors.warning : clamped < 0.75 ? colors.accent : colors.success}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - clamped)}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={[styles.label, { color: colors.text }]}>{label ?? `${Math.round(clamped * 100)}%`}</Text>
        {sublabel && <Text style={[styles.sublabel, { color: colors.textMuted }]}>{sublabel}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 22, fontWeight: '800' },
  sublabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
