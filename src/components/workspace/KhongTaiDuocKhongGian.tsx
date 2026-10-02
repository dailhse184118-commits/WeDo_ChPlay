import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

/**
 * Khung tab hiện màn này khi `status === 'error'`: lần nạp không gian làm việc
 * đầu tiên hỏng và máy chưa có danh sách nào lưu từ trước.
 *
 * Trước đây chỗ này là vòng quay không có chữ, không có nút, chạy mãi mãi —
 * mở app lúc mất mạng hay lúc máy chủ khởi động lại là kẹt cho tới khi tắt app.
 * Provider vẫn tự thử lại (và thử ngay khi socket nối lại được); nút ở đây để
 * người dùng không phải ngồi chờ.
 */
export function KhongTaiDuocKhongGian() {
  const { refresh } = useWorkspace();
  const [dangThu, setDangThu] = useState(false);

  async function thuLai() {
    setDangThu(true);
    try {
      await refresh();
    } finally {
      setDangThu(false);
    }
  }

  return (
    <View style={styles.man} testID="workspace-error">
      <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
      <Text style={styles.tieuDe}>Chưa kết nối được máy chủ</Text>
      <Text style={styles.noiDung}>
        Kiểm tra Wi-Fi hoặc dữ liệu di động. Máy chủ cũng có thể đang khởi động lại — WeDo sẽ tự
        thử lại sau ít giây.
      </Text>
      <View style={styles.nut}>
        <Button
          testID="workspace-retry"
          label="Thử lại"
          loading={dangThu}
          onPress={() => void thuLai()}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  man: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.page,
  },
  tieuDe: {
    marginTop: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  noiDung: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  nut: { marginTop: spacing.lg, alignSelf: 'stretch' },
});
