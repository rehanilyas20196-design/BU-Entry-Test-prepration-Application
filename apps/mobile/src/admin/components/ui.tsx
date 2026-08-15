import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

// Fixed light palette for the admin console (kept separate from the app theme).
export const adminColors = {
  bg: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceAlt: '#F9FAFB',
  border: '#E5E7EB',
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  primaryLight: '#EEF2FF',
  success: '#059669',
  successLight: '#D1FAE5',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  info: '#2563EB',
  infoLight: '#DBEAFE',
};

export function AdminCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function AdminTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function AdminSubtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function AdminStatCard({
  label,
  value,
  sub,
  icon,
  tone = 'primary',
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: keyof typeof Feather.glyphMap;
  tone?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
}) {
  const colors = {
    primary: { bg: adminColors.primaryLight, fg: adminColors.primary },
    success: { bg: adminColors.successLight, fg: adminColors.success },
    danger: { bg: adminColors.dangerLight, fg: adminColors.danger },
    warning: { bg: adminColors.warningLight, fg: adminColors.warning },
    info: { bg: adminColors.infoLight, fg: adminColors.info },
  }[tone];
  return (
    <View style={[styles.card, styles.statCard]}>
      <View style={[styles.statIcon, { backgroundColor: colors.bg }]}>
        <Feather name={icon} size={18} color={colors.fg} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

export function AdminBadge({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'success' | 'danger' | 'warning' | 'info' | 'neutral' | 'primary';
}) {
  const map = {
    success: { bg: adminColors.successLight, fg: adminColors.success },
    danger: { bg: adminColors.dangerLight, fg: adminColors.danger },
    warning: { bg: adminColors.warningLight, fg: adminColors.warning },
    info: { bg: adminColors.infoLight, fg: adminColors.info },
    neutral: { bg: '#F3F4F6', fg: adminColors.textSecondary },
    primary: { bg: adminColors.primaryLight, fg: adminColors.primary },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <Text style={[styles.badgeText, { color: map.fg }]}>{children}</Text>
    </View>
  );
}

export function AdminButton({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
  small = false,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
  small?: boolean;
}) {
  const bg =
    variant === 'primary'
      ? adminColors.primary
      : variant === 'danger'
        ? adminColors.danger
        : variant === 'success'
          ? adminColors.success
          : variant === 'secondary'
            ? '#111827'
            : 'transparent';
  const fg = variant === 'ghost' ? adminColors.textSecondary : '#FFFFFF';
  const border = variant === 'ghost' ? adminColors.border : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: bg, borderColor: border },
        variant === 'ghost' && { borderWidth: 1 },
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={16} color={fg} style={{ marginRight: 6 }} /> : null}
          <Text style={[styles.buttonText, { color: fg }]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function AdminInput({
  label,
  error,
  ...props
}: TextInputProps & { label?: string; error?: string }) {
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={adminColors.textMuted}
        style={[
          styles.input,
          props.multiline && styles.inputMultiline,
          error ? { borderColor: adminColors.danger } : null,
        ]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

export function AdminSelect({
  label,
  value,
  options,
  onChange,
  placeholder = 'Select...',
}: {
  label?: string;
  value: string | null;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <View style={styles.fieldWrap}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <Pressable style={styles.input} onPress={() => setOpen(true)}>
        <Text style={selected ? { color: adminColors.text } : { color: adminColors.textMuted }}>
          {selected ? selected.label : placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color={adminColors.textMuted} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <View style={styles.selectSheet}>
            <Text style={styles.selectSheetTitle}>{label ?? 'Select'}</Text>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <Pressable
                  key={o.value}
                  style={styles.selectRow}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[styles.selectRowText, active && { color: adminColors.primary, fontWeight: '600' }]}>
                    {o.label}
                  </Text>
                  {active ? <Feather name="check" size={16} color={adminColors.primary} /> : null}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function AdminModal({
  visible,
  title,
  onClose,
  children,
  width = 560,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          <View style={[styles.modalCard, { maxWidth: width }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <Feather name="x" size={20} color={adminColors.textSecondary} />
              </Pressable>
            </View>
            {children}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function AdminSearch({
  value,
  onChange,
  placeholder = 'Search...',
  style,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.searchWrap, style]}>
      <Feather name="search" size={16} color={adminColors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={adminColors.textMuted}
        style={styles.searchInput}
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={8}>
          <Feather name="x" size={14} color={adminColors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

export interface AdminColumn<T> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  width?: number;
  hideOnMobile?: boolean;
}

export function AdminDataTable<T extends { id: string }>({
  columns,
  rows,
  onRowPress,
  emptyText = 'No records found',
}: {
  columns: AdminColumn<T>[];
  rows: T[];
  onRowPress?: (row: T) => void;
  emptyText?: string;
}) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  if (rows.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Feather name="inbox" size={32} color={adminColors.textMuted} />
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }

  if (isMobile) {
    const visible = columns.filter((c) => !c.hideOnMobile);
    return (
      <View style={{ gap: 10 }}>
        {rows.map((row) => (
          <Pressable
            key={row.id}
            onPress={onRowPress ? () => onRowPress(row) : undefined}
            style={styles.mobileRow}
          >
            {visible.map((col) => (
              <View key={col.key} style={styles.mobileRowItem}>
                <Text style={styles.mobileRowLabel}>{col.title}</Text>
                <View style={{ flex: 1 }}>{col.render ? col.render(row) : <Text style={styles.cellText}>{String((row as any)[col.key] ?? '')}</Text>}</View>
              </View>
            ))}
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.tableWrap}>
      <View style={styles.tableHeader}>
        {columns.map((col) => (
          <Text
            key={col.key}
            style={[styles.tableHeaderCell, col.width ? { width: col.width } : { flex: 1 }]}
          >
            {col.title}
          </Text>
        ))}
      </View>
      {rows.map((row) => (
        <Pressable
          key={row.id}
          onPress={onRowPress ? () => onRowPress(row) : undefined}
          style={({ pressed }) => [styles.tableRow, pressed && { backgroundColor: adminColors.surfaceAlt }]}
        >
          {columns.map((col) => (
            <View key={col.key} style={[styles.tableCell, col.width ? { width: col.width } : { flex: 1 }]}>
              {col.render ? col.render(row) : <Text style={styles.cellText}>{String((row as any)[col.key] ?? '')}</Text>}
            </View>
          ))}
        </Pressable>
      ))}
    </View>
  );
}

export function AdminPagination({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <View style={styles.pagination}>
      <Text style={styles.paginationText}>
        {from}–{to} of {total}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AdminButton title="Prev" variant="ghost" small icon="chevron-left" disabled={page <= 1} onPress={() => onChange(page - 1)} />
        <Text style={[styles.paginationText, { alignSelf: 'center' }]}>
          Page {page} / {pages}
        </Text>
        <AdminButton title="Next" variant="ghost" small icon="chevron-right" disabled={page >= pages} onPress={() => onChange(page + 1)} />
      </View>
    </View>
  );
}

export function AdminEmpty({ title = 'No data', sub }: { title?: string; sub?: string }) {
  return (
    <View style={styles.emptyState}>
      <Feather name="inbox" size={32} color={adminColors.textMuted} />
      <Text style={styles.emptyText}>{title}</Text>
      {sub ? <Text style={styles.emptySub}>{sub}</Text> : null}
    </View>
  );
}

export function AdminLoader() {
  return (
    <View style={styles.loaderWrap}>
      <ActivityIndicator size="large" color={adminColors.primary} />
    </View>
  );
}

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function fmtDateShort(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: adminColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: adminColors.text,
  },
  subtitle: {
    fontSize: 14,
    color: adminColors.textSecondary,
    marginTop: 2,
  },
  statCard: {
    minWidth: 180,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    color: adminColors.text,
  },
  statLabel: {
    fontSize: 13,
    color: adminColors.textSecondary,
    marginTop: 2,
  },
  statSub: {
    fontSize: 12,
    color: adminColors.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  buttonSmall: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  fieldWrap: {
    marginBottom: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.text,
  },
  fieldError: {
    fontSize: 12,
    color: adminColors.danger,
  },
  input: {
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: adminColors.text,
    backgroundColor: adminColors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.55)',
    justifyContent: 'center',
    padding: 16,
  },
  modalScroll: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  modalCard: {
    backgroundColor: adminColors.surface,
    borderRadius: 16,
    padding: 20,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: adminColors.text,
  },
  selectSheet: {
    backgroundColor: adminColors.surface,
    borderRadius: 14,
    paddingVertical: 8,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  selectSheetTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: adminColors.textMuted,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectRowText: {
    fontSize: 15,
    color: adminColors.text,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: adminColors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: adminColors.surface,
    minHeight: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: adminColors.text,
    paddingVertical: 8,
  },
  tableWrap: {
    backgroundColor: adminColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: adminColors.border,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: adminColors.surfaceAlt,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: adminColors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: adminColors.border,
    alignItems: 'center',
  },
  tableCell: {
    paddingRight: 12,
  },
  cellText: {
    fontSize: 13,
    color: adminColors.text,
  },
  mobileRow: {
    backgroundColor: adminColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: adminColors.border,
    padding: 12,
    gap: 8,
  },
  mobileRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mobileRowLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: adminColors.textMuted,
    width: 110,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationText: {
    fontSize: 13,
    color: adminColors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: adminColors.textSecondary,
  },
  emptySub: {
    fontSize: 13,
    color: adminColors.textMuted,
  },
  loaderWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
});
