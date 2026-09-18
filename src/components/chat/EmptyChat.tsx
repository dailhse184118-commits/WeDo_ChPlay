import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

interface EmptyChatProps {
  title: string;
  body: string;
  /**
   * BẮT BUỘC nhận và dán lên khung ngoài cùng — xem khối ghi chú bên dưới.
   * `FlatList inverted` đưa style khử-lật vào đây; bỏ qua là chữ lộn ngược.
   */
  style?: StyleProp<ViewStyle>;
  /** `VirtualizedList` dùng để đo chiều cao phần trống. */
  onLayout?: React.ComponentProps<typeof View>['onLayout'];
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
 *
 * NHƯNG để trống thôi thì CHƯA ĐỦ, và đây là nửa còn lại của cùng câu chuyện —
 * lỗi báo lần thứ hai cũng trong ngày 18/09/2026, chữ quay đúng 180 độ.
 *
 * `_renderEmptyComponent` đưa style khử-lật vào **prop `style` của component**:
 *
 *     style: StyleSheet.compose(inversionStyle, element.props.style)
 *
 * Component tự viết mà không nhận `style` thì style ấy rơi vào hư không. Khung
 * danh sách vẫn lật `scale: -1`, không còn gì khử, và chữ lộn ngược hoàn toàn.
 * Nên `style` PHẢI được nhận và dán lên khung ngoài cùng.
 * ===========================================================================
 */
export function EmptyChat({ title, body, style, onLayout }: EmptyChatProps) {
  return (
    <View testID="empty-chat" onLayout={onLayout} style={[styles.khung, style]}>
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
