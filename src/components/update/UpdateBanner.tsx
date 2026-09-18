import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { daBoQua, ghiNhoBoQua } from '../../lib/version/bo-qua';
import { moChPlay } from '../../lib/version/mo-ch-play';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../theme/tokens';

interface UpdateBannerProps {
  /** Phiên bản mới nhất trên CH Play. Dùng làm khoá khi ghi nhớ việc tắt. */
  phienBanMoi: string;
  /** Câu mô tả bản mới do máy chủ gửi. Có thể rỗng. */
  notes: string;
}

const CAU_MAC_DINH = 'Đã có phiên bản mới của WeDo.';

/**
 * Dải băng nhắc cập nhật, tắt được.
 *
 * Tự lo phần nhớ việc đã tắt thay vì bắt màn hình gọi nó phải lo: chỗ nào cần
 * nhắc thì chỉ việc dựng component này lên, không phải chép lại logic đọc ghi.
 *
 * Bắt đầu ở trạng thái ẩn rồi mới hiện sau khi đọc xong bộ nhớ. Làm ngược lại
 * thì mỗi lần mở app dải băng sẽ chớp lên một nhịp trước khi biết là đã bị tắt.
 */
export function UpdateBanner({ phienBanMoi, notes }: UpdateBannerProps) {
  const [hien, setHien] = useState(false);

  useEffect(() => {
    let con = true;

    void daBoQua(phienBanMoi).then((daTat) => {
      if (con) setHien(!daTat);
    });

    return () => {
      con = false;
    };
  }, [phienBanMoi]);

  if (!hien) return null;

  const handleTat = () => {
    // Ẩn ngay, đừng chờ ghi xong. Người dùng bấm tắt thì nó phải biến mất tức
    // thì; việc ghi xuống đĩa là chuyện của lần mở app sau.
    setHien(false);
    void ghiNhoBoQua(phienBanMoi);
  };

  return (
    <View testID="update-banner" style={styles.bang}>
      <View style={styles.icon}>
        <Ionicons name="arrow-up-circle" size={sizes.icon} color={colors.primary} />
      </View>

      <View style={styles.than}>
        <Text style={styles.tieuDe}>Có bản cập nhật mới</Text>
        <Text style={styles.chu} numberOfLines={3}>
          {notes || CAU_MAC_DINH}
        </Text>
      </View>

      <View style={styles.nutDoc}>
        <Pressable
          testID="update-banner-cap-nhat"
          accessibilityRole="button"
          accessibilityLabel="Mở CH Play để cập nhật"
          onPress={() => void moChPlay()}
          style={({ pressed }) => [styles.nut, pressed ? styles.nutNhan : null]}
        >
          <Text style={styles.nutChu}>Cập nhật</Text>
        </Pressable>

        <Pressable
          testID="update-banner-tat"
          accessibilityRole="button"
          accessibilityLabel="Bỏ qua nhắc cập nhật này"
          onPress={handleTat}
          hitSlop={8}
          style={styles.tat}
        >
          <Text style={styles.tatChu}>Để sau</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bang: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  icon: { justifyContent: 'center' },
  than: { flex: 1 },
  tieuDe: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: '700',
    color: colors.primary,
  },
  chu: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    marginTop: spacing.xxs,
  },
  nutDoc: { alignItems: 'center', gap: spacing.xs },
  nut: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  nutNhan: { opacity: 0.7 },
  nutChu: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  tat: { paddingHorizontal: spacing.xs },
  tatChu: { color: colors.textMuted, fontSize: fontSize.xs },
});
