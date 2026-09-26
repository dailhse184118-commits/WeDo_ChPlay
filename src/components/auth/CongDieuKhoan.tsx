import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { dongYDieuKhoan } from '../../lib/api/account';
import { useAuth } from '../../lib/auth/auth-context';
import type { UserProfile } from '../../lib/types';
import { colors, fontSize, lineHeight, scale, spacing } from '../../theme/tokens';
import { ODongYDieuKhoan } from './ODongYDieuKhoan';

/**
 * Người này phải đồng ý điều khoản rồi mới được vào app.
 *
 * So ĐÚNG `null`, không dùng `!termsAcceptedAt`: `null` là máy chủ nói "chưa
 * đồng ý", còn thiếu hẳn khoá là máy chủ bản cũ (chưa biết tới điều khoản) hoặc
 * hồ sơ lưu từ bản app cũ. Chặn cả trường hợp đó thì mọi người kẹt cứng ở màn
 * này, vì máy chủ cũ không có `POST /users/me/accept-terms` để bấm qua.
 */
export function canDongYDieuKhoan(user: UserProfile | null): boolean {
  return user !== null && user.termsAcceptedAt === null;
}

/**
 * Chắn cả app cho tới khi người đã đăng nhập đồng ý Điều khoản sử dụng và xác
 * nhận đủ 18 tuổi.
 *
 * Dành cho người không đi qua màn đăng ký của app: tài khoản tạo trước khi có
 * điều khoản, và người vào bằng Google (web, Android). Người đăng ký bằng app
 * đã đánh dấu ô lúc đăng ký nên không bao giờ thấy màn này.
 *
 * Đặt ở layout gốc, THAY CHỖ cả `<Stack>`, chứ không phải một màn trong nhóm
 * `(tabs)`: màn chi tiết mở từ thông báo hay đường dẫn cũng nằm dưới `<Stack>`,
 * nên không có đường nào đi vòng qua được. Đồng ý xong `<Stack>` dựng lại và
 * `app/index.tsx` đưa người dùng vào Trò chuyện như thường.
 */
export function CongDieuKhoan({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();

  if (status === 'signedIn' && canDongYDieuKhoan(user)) {
    return <ManDongYDieuKhoan />;
  }

  return <>{children}</>;
}

function ManDongYDieuKhoan() {
  const { user, capNhatHoSo, signOut } = useAuth();
  const insets = useSafeAreaInsets();

  /* Không đánh dấu sẵn — xem `ODongYDieuKhoan`. */
  const [dongY, setDongY] = useState(false);
  const [dangGui, setDangGui] = useState(false);
  const [loi, setLoi] = useState('');

  async function tiepTuc() {
    if (!dongY || !user) return;

    setLoi('');
    setDangGui(true);
    try {
      const dau = await dongYDieuKhoan();
      /*
        Máy chủ chỉ trả hai mốc thời gian — ghép vào hồ sơ đang giữ. Có mốc rồi
        thì `CongDieuKhoan` tự nhường chỗ cho app, không cần điều hướng gì.
      */
      capNhatHoSo({ ...user, ...dau });
    } catch (err) {
      setLoi(err instanceof Error ? err.message : 'Chưa lưu được. Vui lòng thử lại.');
      setDangGui(false);
    }
  }

  return (
    <ScrollView
      testID="cong-dieu-khoan"
      style={styles.man}
      contentContainerStyle={[
        styles.noiDung,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.icon}>
        <Ionicons name="document-text-outline" size={scale(44)} color={colors.primary} />
      </View>

      <Text style={styles.tieuDe} accessibilityRole="header">
        Điều khoản sử dụng
      </Text>

      <Text style={styles.than}>
        Trước khi tiếp tục dùng WeDo, bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử
        dụng.
      </Text>

      {/*
        Apple đòi điều khoản nói rõ không khoan nhượng nội dung phản cảm và người
        dùng biết cách báo cáo (Guideline 1.2). Nói ngắn ngay tại đây, bản đầy đủ
        nằm sau đường dẫn.
      */}
      <Text style={styles.than}>
        WeDo không chấp nhận nội dung phản cảm, quấy rối hay lạm dụng. Bạn có thể báo cáo tin
        nhắn hoặc chặn người vi phạm ngay trong app, và WeDo xem xét mọi báo cáo trong vòng 24
        giờ.
      </Text>

      {loi ? <ErrorBanner message={loi} /> : null}

      <View style={styles.o}>
        <ODongYDieuKhoan daChon={dongY} onDoi={setDongY} disabled={dangGui} />
      </View>

      <Button
        testID="cong-dieu-khoan-dong-y"
        label="Đồng ý và tiếp tục"
        onPress={() => void tiepTuc()}
        loading={dangGui}
        disabled={!dongY}
      />

      {/* Không muốn đồng ý thì phải có lối ra, đừng nhốt người dùng lại. */}
      <View style={styles.nutPhu}>
        <Button
          testID="cong-dieu-khoan-dang-xuat"
          label="Đăng xuất"
          variant="secondary"
          onPress={() => void signOut()}
          disabled={dangGui}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.background },
  noiDung: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  icon: { alignItems: 'center' },
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
  },
  o: { marginTop: spacing.sm },
  nutPhu: { marginTop: spacing.xs },
});
