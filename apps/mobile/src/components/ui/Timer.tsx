import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface TimerProps {
  totalSeconds: number;
  onExpire?: () => void;
  warningAt?: number; // seconds remaining that triggers warning styling
  paused?: boolean;
}

function format(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function Timer({ totalSeconds, onExpire, warningAt = 60, paused = false }: TimerProps) {
  const { colors } = useTheme();
  const [remaining, setRemaining] = useState(totalSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [paused]);

  const isWarning = remaining <= warningAt && remaining > 0;

  return (
    <View
      accessibilityLabel={`Time remaining ${format(remaining)}`}
      style={[
        styles.container,
        { backgroundColor: isWarning ? colors.dangerLight : colors.surfaceAlt },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isWarning ? colors.danger : colors.text },
          remaining === 0 && { color: colors.danger },
        ]}
      >
        {format(remaining)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  text: { fontSize: 14, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
