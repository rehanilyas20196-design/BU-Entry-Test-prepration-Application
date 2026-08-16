import React from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/theme';

interface ModalProps {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Modal({ visible, title, onClose, children, style }: ModalProps) {
  const { colors } = useTheme();

  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
        <View
          style={[
            styles.dialog,
            { backgroundColor: colors.surface, borderColor: colors.border },
            style,
          ]}
        >
          <View style={styles.header}>
            {title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : <View />}
            <Pressable onPress={onClose} hitSlop={8} accessibilityRole="button" accessibilityLabel="Close dialog">
              <Feather name="x" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
          {children}
        </View>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.4)' },
  dialog: {
    width: '100%',
    maxWidth: 480,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: { fontSize: 18, fontWeight: '500' },
});
