import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, shadows, sizes, spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
}: ButtonProps) {
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
        styles[variant],
        // Nút ở trạng thái chưa bật: nền phẳng, KHÔNG bóng — để phân biệt rõ với
        // nút đang bật. Giữ nguyên bóng mà chỉ giảm độ mờ trông như lỗi hiển thị.
        inactive ? styles.inactive : null,
        pressed && !inactive ? styles.pressed : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#ffffff'} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'secondary' ? styles.labelSecondary : null,
            inactive ? styles.labelInactive : null,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.control,
    // Bo tròn hoàn toàn theo bộ thiết kế.
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary, boxShadow: shadows.button },
  secondary: { backgroundColor: colors.primarySoft },
  danger: {
    backgroundColor: colors.danger,
    boxShadow: '0 6px 16px rgba(198, 40, 40, 0.32)',
  },
  pressed: { opacity: 0.9 },
  inactive: { backgroundColor: colors.primarySoft, boxShadow: 'none' },
  label: { color: '#ffffff', fontSize: fontSize.md, fontWeight: '700' },
  labelSecondary: { color: colors.primary },
  labelInactive: { color: colors.primary },
});
