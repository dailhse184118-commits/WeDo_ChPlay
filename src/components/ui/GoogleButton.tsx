import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontSize, radius, sizes, spacing } from '../../theme/tokens';

interface GoogleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

/**
 * Nút "Tiếp tục với Google".
 *
 * Không dùng chung `Button` vì hướng dẫn thương hiệu của Google đòi nền trắng,
 * viền xám và chữ tối — ngược hẳn với nút chính màu #0055c7 của WeDo. Vẫn giữ
 * chiều cao `sizes.control` và bo tròn `radius.pill` để đứng cạnh nút "Đăng nhập"
 * không bị lệch.
 *
 * Nhãn cố định trong component: Google yêu cầu đúng chữ "Tiếp tục với Google"
 * hoặc "Đăng nhập bằng Google", không cho tự đặt.
 */
export function GoogleButton({ onPress, loading = false, disabled = false, testID }: GoogleButtonProps) {
  const inactive = loading || disabled;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        inactive ? styles.inactive : null,
        pressed && !inactive ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.textMuted} />
      ) : (
        <View style={styles.content}>
          <Ionicons name="logo-google" size={20} color={colors.text} />
          <Text style={[styles.label, inactive ? styles.labelInactive : null]}>
            Tiếp tục với Google
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { backgroundColor: colors.surface },
  inactive: { backgroundColor: colors.surface },
  label: { color: colors.text, fontSize: fontSize.md, fontWeight: '600' },
  labelInactive: { color: colors.textMuted },
});
