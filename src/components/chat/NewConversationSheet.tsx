import React from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { WorkspaceChiTiet } from '../../lib/types';
import {
  colors,
  fontSize,
  lineHeight,
  radius,
  scaleWithFont,
  shadows,
  sizes,
  spacing,
} from '../../theme/tokens';

interface NewConversationSheetProps {
  visible: boolean;
  /** Không gian làm việc đang mở, kèm danh sách thành viên. Vắng thì sheet trống. */
  workspace?: WorkspaceChiTiet;
  currentUserId: string;
  /** Đang gọi máy chủ tạo hội thoại. Khoá danh sách để không tạo trùng. */
  dangTao: boolean;
  onChon: (userId: string, hoTen: string) => void;
  onDismiss: () => void;
}

/**
 * Chọn người để bắt đầu nhắn riêng.
 *
 * Liệt kê thành viên trong không gian làm việc chứ không phải bạn bè: máy chủ
 * cho phép nhắn thẳng với người chung không gian, không bắt kết bạn trước. Với
 * nhóm học tập thì đó đúng là những người họ cần nhắn.
 *
 * Lọc chính mình ra khỏi danh sách. Máy chủ cũng từ chối tự nhắn cho mình, nên
 * để dòng đó nằm đấy chỉ tổ dẫn người dùng vào một lỗi chắc chắn xảy ra.
 */
export function NewConversationSheet({
  visible,
  workspace,
  currentUserId,
  dangTao,
  onChon,
  onDismiss,
}: NewConversationSheetProps) {
  const nguoiKhac = (workspace?.members ?? []).filter(
    (thanhVien) => thanhVien.user.id !== currentUserId,
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.nen} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        <Text style={styles.tieuDe}>Nhắn tin cho ai</Text>

        {nguoiKhac.length === 0 ? (
          <Text style={styles.trong}>Không gian này chưa có thành viên nào khác</Text>
        ) : (
          <ScrollView style={styles.danhSach} showsVerticalScrollIndicator={false}>
            {nguoiKhac.map((thanhVien) => (
              <Pressable
                key={thanhVien.user.id}
                testID={`nguoi-nhan-${thanhVien.user.id}`}
                accessibilityRole="button"
                onPress={() => {
                  // Khoá trong lúc đang tạo: chạm hai lần nhanh sẽ tạo hai lượt
                  // gọi, và người dùng bị đẩy sang màn hình hai lần liên tiếp.
                  if (!dangTao) onChon(thanhVien.user.id, thanhVien.user.fullName);
                }}
                style={({ pressed }) => [styles.dong, pressed ? styles.dongNhan : null]}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarChu}>
                    {thanhVien.user.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.than}>
                  <Text style={styles.ten} numberOfLines={1}>
                    {thanhVien.user.fullName}
                  </Text>
                  <Text style={styles.email} numberOfLines={1}>
                    {thanhVien.user.email}
                  </Text>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {dangTao ? (
          <ActivityIndicator style={styles.cho} color={colors.primary} />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    boxShadow: shadows.card,
  },
  tay: {
    alignSelf: 'center',
    width: scaleWithFont(44),
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  tieuDe: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  /* Nhiều thành viên thì cuộn, không đẩy sheet cao quá nửa màn hình. */
  danhSach: { maxHeight: scaleWithFont(320) },
  dong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
  },
  dongNhan: { opacity: 0.6 },
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
  trong: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    paddingVertical: spacing.lg,
    textAlign: 'center',
  },
  cho: { marginTop: spacing.md },
});
