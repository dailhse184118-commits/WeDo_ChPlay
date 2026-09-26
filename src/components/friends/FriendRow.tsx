import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../ui/Avatar';
import type { TrangThaiKetBan } from '../../lib/friends/quan-he';
import type { UserSummary } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../theme/tokens';

interface FriendRowProps {
  /** Email có thể vắng: kết quả tìm kiếm giấu email của người chưa là bạn. */
  nguoi: Omit<UserSummary, 'email'> & { email?: string | null };
  trangThai: TrangThaiKetBan;
  /** Đang gọi máy chủ cho chính dòng này. Khoá thao tác để không gửi trùng. */
  dangXuLy?: boolean;
  onNhanTin?: () => void;
  onGuiLoiMoi?: () => void;
  onDuyet?: () => void;
  onTuChoi?: () => void;
  /**
   * Mở bảng Báo cáo / Chặn cho người này. Có truyền thì hiện nút ba chấm ở cuối
   * dòng — kể cả dòng lời mời đến, vì lời mời quấy rối cũng phải báo cáo được.
   */
  onThem?: () => void;
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
  onThem,
}: FriendRowProps) {
  // Bọc mọi thao tác: chạm hai lần nhanh sẽ gửi hai lời mời, và máy chủ trả lỗi
  // "lời mời đang chờ phản hồi" cho lượt thứ hai — người dùng thấy báo đỏ vô cớ.
  const chay = (viec?: () => void) => () => {
    if (!dangXuLy) viec?.();
  };

  return (
    <View testID={`friend-row-${nguoi.id}`} style={styles.dong}>
      <Avatar hoTen={nguoi.fullName} anhUrl={nguoi.avatarUrl} co={sizes.projectAvatar} />

      <View style={styles.than}>
        <Text style={styles.ten} numberOfLines={1}>
          {nguoi.fullName}
        </Text>
        {/*
          Máy chủ chỉ trả email của người đã là bạn — người lạ tìm được thì
          email là `null`. Không có thì bỏ dòng, đừng để một dòng trống.
        */}
        {nguoi.email ? (
          <Text style={styles.email} numberOfLines={1}>
            {nguoi.email}
          </Text>
        ) : null}
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

      {onThem ? (
        <Pressable
          testID="friend-row-them"
          accessibilityRole="button"
          accessibilityLabel={`Thao tác khác với ${nguoi.fullName}`}
          onPress={chay(onThem)}
          hitSlop={8}
          style={styles.nutThem}
        >
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textMuted} />
        </Pressable>
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
  nutThem: { paddingVertical: spacing.xs, paddingLeft: spacing.xxs },
});
