import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CHIEU_RONG_NOI_DUNG_TOI_DA } from '../../theme/responsive';
import { colors, spacing } from '../../theme/tokens';

/**
 * Android 16 (API 36) ép chế độ edge-to-edge và không cho opt-out.
 * Mọi màn hình PHẢI bọc bằng component này, nếu không nội dung sẽ chui
 * xuống dưới thanh trạng thái và thanh điều hướng.
 *
 * Trên máy rộng hơn `CHIEU_RONG_NOI_DUNG_TOI_DA` thì kẹp nội dung lại và căn
 * giữa: trên tablet, thẻ kéo hết bề ngang thành dải chữ dài, mắt phải quét
 * ngang quá xa mới đọc hết một dòng.
 *
 * Đây là chỗ DUY NHẤT trong app dùng `useWindowDimensions`. Phần còn lại đi qua
 * token tính sẵn lúc nạp, xem `src/theme/tokens.ts`.
 */
export function ScreenContainer({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  const { width } = useWindowDimensions();
  const quaRong = width > CHIEU_RONG_NOI_DUNG_TOI_DA;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View
        testID="screen-content"
        style={[styles.content, padded ? styles.padded : null, quaRong ? styles.kep : null]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  padded: { paddingHorizontal: spacing.md },
  kep: { maxWidth: CHIEU_RONG_NOI_DUNG_TOI_DA, alignSelf: 'center', width: '100%' },
});
