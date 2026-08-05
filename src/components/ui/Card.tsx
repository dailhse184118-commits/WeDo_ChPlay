import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  /**
   * Số pixel thẻ chồng lên mép dưới của gradient header. Bộ thiết kế dùng −16
   * cho thẻ danh sách và −24 cho thẻ form đăng nhập.
   */
  overlap?: number;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Thẻ trắng nổi có bóng, thay cho các dòng phẳng ngăn bằng đường kẻ. */
export function Card({ children, overlap, onPress, style, testID }: CardProps) {
  const base = [
    styles.card,
    overlap ? { marginTop: -overlap } : null,
    style,
  ];

  if (!onPress) {
    return (
      <View testID={testID} style={base}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [...base, pressed ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.md,
    boxShadow: shadows.card,
  },
  pressed: { opacity: 0.9 },
});
