import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { AppText } from '@/components/ui/AppText';
import { Feather } from '@expo/vector-icons';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export interface DatePickerProps {
  value?: string | null;
  onChange: (dateKey: string | null) => void;
  minDate?: string | null;
  label?: string;
  error?: string | null;
}

export function DatePicker({ value, onChange, minDate, label, error }: DatePickerProps) {
  const { colors } = useTheme();

  const today = startOfDay(new Date());
  const min = minDate ? startOfDay(new Date(`${minDate}T00:00:00`)) : today;

  const selected = useMemo(() => {
    if (!value) return null;
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? null : startOfDay(d);
  }, [value]);

  const [viewMonth, setViewMonth] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const year = viewMonth.getFullYear();
    const month = viewMonth.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (number | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(d);
    while (list.length % 7 !== 0) list.push(null);
    return list;
  }, [viewMonth]);

  const canGoPrev = (() => {
    const prev = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
    return min <= new Date(prev.getFullYear(), prev.getMonth(), 1) ? prev : null;
  })();

  const monthLabel = viewMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

  const handleSelect = (day: number) => {
    const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
    if (date < min) return;
    onChange(toDateKey(date));
  };

  return (
    <View style={styles.wrap}>
      {label && <AppText variant="label" style={{ color: colors.text }}>{label}</AppText>}
      <View
        style={[
          styles.calendar,
          {
            backgroundColor: colors.surface,
            borderColor: error ? colors.danger : colors.border,
            borderWidth: error ? 1.5 : 1,
          },
        ]}
      >
        <View style={styles.monthHeader}>
          <Pressable
            onPress={() => canGoPrev && setViewMonth(canGoPrev)}
            disabled={!canGoPrev}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="chevron-left" size={18} color={canGoPrev ? colors.text : colors.border} />
          </Pressable>
          <AppText variant="bodyMedium">{monthLabel}</AppText>
          <Pressable
            onPress={() => setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Next month"
            style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}
          >
            <Feather name="chevron-right" size={18} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((w) => (
            <View key={w} style={styles.dayCell}>
              <AppText variant="micro" color="muted">{w}</AppText>
            </View>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((day, i) => {
            if (day === null) {
              return <View key={`empty-${i}`} style={styles.dayCell} />;
            }
            const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
            const key = toDateKey(date);
            const isMin = date.getTime() === min.getTime();
            const isPast = date < min;
            const isToday = date.getTime() === today.getTime();
            const isSelected = selected?.getTime() === date.getTime();
            const disabled = isPast;

            return (
              <View key={key} style={styles.dayCell}>
                <Pressable
                  onPress={() => handleSelect(day)}
                  disabled={disabled}
                  accessibilityRole="button"
                  accessibilityLabel={key}
                  accessibilityState={{ disabled, selected: isSelected }}
                  style={[
                    styles.dayBtn,
                    isToday && { borderColor: colors.primary, borderWidth: 1 },
                    isSelected && { backgroundColor: colors.primary },
                    isMin && { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <AppText
                    variant="label"
                    style={{
                      color: disabled
                        ? colors.border
                        : isSelected
                          ? '#FFFFFF'
                          : isMin
                            ? colors.primary
                            : colors.text,
                    }}
                  >
                    {day}
                  </AppText>
                </Pressable>
              </View>
            );
          })}
        </View>
      </View>
      {error ? <AppText variant="small" style={{ color: colors.danger }}>{error}</AppText> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  calendar: { borderRadius: 12, padding: 12, gap: 8 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  navBtn: { padding: 4 },
  weekRow: { flexDirection: 'row' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});