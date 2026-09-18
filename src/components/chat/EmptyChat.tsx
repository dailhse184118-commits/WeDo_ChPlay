import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

interface EmptyChatProps {
  title: string;
  body: string;
}

/**
 * Chỗ trống của một khung trò chuyện, dùng làm `ListEmptyComponent`.
 *
 * ===========================================================================
 * TUYỆT ĐỐI KHÔNG đặt `transform` ở đây.
 *
 * `FlatList inverted` lật cả khung danh sách, rồi tự lật ngược lại từng ô để
 * nội dung đứng thẳng. Với `ListEmptyComponent`, React Native ghép style bằng
 * `StyleSheet.compose(inversionStyle, style-cua-ban)` — style của mình nằm SAU
 * nên `transform` của mình ghi đè sạch `transform` của nó.
 *
 * Và trên Android phép lật ấy là `scale: -1`, tức lật CẢ HAI trục, chứ không
 * phải `scaleY: -1` như trên iOS. Nên tự viết `scaleY: -1` để "bù" sẽ khử đúng
 * trục dọc mà bỏ sót trục ngang — chữ hiện ra thành ảnh gương. Đó đúng là lỗi
 * người kiểm thử báo ngày 18/09/2026.
 *
 * Để trống phần transform là đúng: React Native đã lo, và nó biết mình đang
 * chạy trên nền tảng nào.
 * ===========================================================================
 */
export function EmptyChat({ title, body }: EmptyChatProps) {
  return (
    <View testID="empty-chat" style={styles.khung}>
      <Text style={styles.tieuDe}>{title}</Text>
      <Text style={styles.than}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  khung: { paddingTop: spacing.xl, paddingHorizontal: spacing.md, alignItems: 'center' },
  tieuDe: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  than: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
