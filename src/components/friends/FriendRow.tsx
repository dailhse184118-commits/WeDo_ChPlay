import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TrangThaiKetBan } from '../../lib/friends/quan-he';
import type { UserSummary } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../theme/tokens';

interface FriendRowProps {
  nguoi: UserSummary;
  trangThai: TrangThaiKetBan;
  /** Đang gọi máy chủ cho chính dòng này. Khoá thao tác để không gửi trùng. */
  dangXuLy?: boolean;
  onNhanTin?: () => void;
  onGuiLoiMoi?: () => void;
  onDuyet?: () => void;
  onTuChoi?: () => void;
}

/**
 * Một dòng người trong màn Bạn bè, dùng cho cả bốn trạng thái quan hệ.
 *
 * Gộp làm một component thay vì bốn cái riêng vì phần bên trái — avatar, tên,
 * email — giống hệt nhau ở mọi trạng thái; chỉ phần hành động bên phải là khác.
 * Tách ra bốn thì bốn chỗ phải sửa mỗi lần đổi cách hiển thị tên.
 */
export function FriendRow({
  nguoi,
  trangThai,
  dangXuLy = false,
  onNhanTin,
  onGuiLoiMoi,
  onDuyet,
  onTuChoi,
}: FriendRowProps) {
  // Bọc mọi thao tác: chạm hai lần nhanh sẽ gửi hai lời mời, và máy chủ trả lỗi
  // "lời mời đang chờ phản hồi" cho lượt thứ hai — người dùng thấy báo đỏ vô cớ.
  const chay = (viec?: () => void) => () => {
    if (!dangXuLy) viec?.();
  };

  return (
    <View testID={`friend-row-${nguoi.id}`} style={styles.dong}>
      <View style={styles.avatar}>
        <Text style={styles.avatarChu}>{nguoi.fullName.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.than}>
        <Text style={styles.ten} numberOfLines={1}>
          {nguoi.fullName}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {nguoi.email}
        </Text>
      </View>

      {trangThai === 'la-ban' ? (
        <Pressable
          testID="friend-row-nhan-tin"
          accessibilityRole="button"
          onPress={chay(onNhanTin)}
          style={styles.nutChinh}
        >
          <Text style={styles.nutChinhChu}>Nhắn tin</Text>
        </Pressable>
      ) : null}

      {trangThai === 'chua-gi-ca' ? (
        <Pressable
          testID="friend-row-ket-ban"
          accessibilityRole="button"
          onPress={chay(onGuiLoiMoi)}
          style={styles.nutChinh}
        >
          <Text style={styles.nutChinhChu}>Kết bạn</Text>
        </Pressable>
      ) : null}

      {trangThai === 'da-gui-loi-moi' ? (
        <Text style={styles.dangCho}>Đã gửi lời mời</Text>
      ) : null}

      {trangThai === 'cho-minh-duyet' ? (
        <View style={styles.capNut}>
          <Pressable
            testID="friend-row-duyet"
            accessibilityRole="button"
            onPress={chay(onDuyet)}
            style={styles.nutChinh}
          >
            <Text style={styles.nutChinhChu}>Duyệt</Text>
          </Pressable>
          <Pressable
            testID="friend-row-tu-choi"
            accessibilityRole="button"
            onPress={chay(onTuChoi)}
            style={styles.nutPhu}
          >
            <Text style={styles.nutPhuChu}>Từ chối</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  avatar: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarChu: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  than: { flex: 1 },
  ten: { fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: '600', color: colors.text },
  email: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs },
  capNut: { alignItems: 'flex-end', gap: spacing.xs },
  nutChinh: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  nutChinhChu: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
  nutPhu: { paddingHorizontal: spacing.xs, paddingVertical: spacing.xxs },
  nutPhuChu: { color: colors.textMuted, fontSize: fontSize.xs },
  dangCho: { color: colors.textMuted, fontSize: fontSize.xs, fontStyle: 'italic' },
});
