import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';

/**
 * Android 16 (API 36) ép chế độ edge-to-edge và không cho opt-out.
 * Mọi màn hình PHẢI bọc bằng component này, nếu không nội dung sẽ chui
 * xuống dưới thanh trạng thái và thanh điều hướng.
 */
export function ScreenContainer({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  padded: { paddingHorizontal: spacing.md },
});
