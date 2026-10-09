import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { chuNutCapNhat, coNutCapNhat, moCuaHang } from '../../lib/version/mo-cua-hang';
import { colors, fontSize, lineHeight, radius, scale, spacing } from '../../theme/tokens';

interface UpdateGateProps {
  /** Câu mô tả bản mới do máy chủ gửi. Có thể rỗng. */
  notes: string;
  /** Trang WeDo trên cửa hàng, do máy chủ gửi. iPhone chỉ mở được trang này. */
  storeUrl?: string | null;
}

/**
 * Màn chặn khi app quá cũ so với máy chủ.
 *
 * KHÔNG có đường thoát, và đó là chủ ý. Màn này chỉ dựng lên khi backend đã đổi
 * kiểu phá vỡ khiến app cũ không chạy nổi — cho đi tiếp thì người dùng sẽ gặp
 * lỗi giữa chừng rồi báo "app hỏng" chứ không phải "app cũ".
 *
 * Nói rõ lý do thay vì chỉ ra lệnh. Người bị chặn mà không hiểu vì sao sẽ gỡ
 * app chứ không cập nhật.
 *
 * Nút cập nhật theo nền tảng: iPhone mở App Store và không bao giờ nhắc CH Play
 * (Guideline 2.3.10). `usePhienBan` đã không dựng màn này trên iPhone khi máy
 * chủ thiếu trang App Store; ẩn nút ở đây chỉ là chốt thứ hai.
 */
export function UpdateGate({ notes, storeUrl }: UpdateGateProps) {
  return (
    <View testID="update-gate" style={styles.man}>
      <View style={styles.icon}>
        <Ionicons name="arrow-up-circle" size={scale(48)} color={colors.primary} />
      </View>

      <Text style={styles.tieuDe}>Cần cập nhật WeDo</Text>

      <Text style={styles.than}>
        Phiên bản bạn đang dùng đã quá cũ so với máy chủ nên một số chức năng sẽ không chạy
        đúng. Cập nhật xong là dùng lại được bình thường.
      </Text>

      {notes ? <Text style={styles.ghiChu}>{notes}</Text> : null}

      {coNutCapNhat(storeUrl) ? (
        <View style={styles.nut}>
          <Button
            testID="update-gate-cap-nhat"
            label={chuNutCapNhat()}
            onPress={() => void moCuaHang(storeUrl)}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  man: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  icon: { marginBottom: spacing.sm },
  tieuDe: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  than: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  ghiChu: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.text,
    textAlign: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.xs,
  },
  nut: { alignSelf: 'stretch', marginTop: spacing.lg },
});
