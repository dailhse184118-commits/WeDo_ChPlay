import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { KhungCuonBieuMau, khungCuonTuLoBanPhim } from '../../components/ui/KhungCuonBieuMau';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDangNhap } from '../../i18n/tu-dien/dang-nhap';
import { forgotPassword, resetPassword } from '../../lib/api/auth';
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import { colors, fontSize, gradients, lineHeight, radius, spacing } from '../../theme/tokens';

type Buoc = 'email' | 'ma';

type KhoaLoi = 'thieuEmail' | 'khongGuiDuocMa' | 'maSauLoi' | 'matKhauNgan' | 'datLaiThatBai';

export default function ForgotPasswordScreen() {
  const t = useTuDien(tuDienDangNhap);
  const dichLoi = useDichLoi();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [buoc, setBuoc] = useState<Buoc>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loi, setLoi] = useState<NguonLoi<KhoaLoi> | null>(null);
  const error = chuLoi(t, loi, dichLoi);
  // Câu tiếng Việt của máy chủ; dịch lúc vẽ.
  const [thongBao, setThongBao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGuiMa = async () => {
    if (!email.trim()) {
      setLoi({ khoa: 'thieuEmail' });
      return;
    }

    setLoi(null);
    setSubmitting(true);
    try {
      /*
        Máy chủ cố ý trả cùng một câu dù email có tài khoản hay không, để không
        ai dò được danh sách người dùng. Nên ở đây cũng chuyển sang bước nhập mã
        trong mọi trường hợp — không tiết lộ gì thêm.
      */
      const ketQua = await forgotPassword(email.trim());
      setThongBao(ketQua.message);
      setBuoc('ma');
    } catch (err) {
      setLoi({ loi: err, duPhong: 'khongGuiDuocMa' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDatLai = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setLoi({ khoa: 'maSauLoi' });
      return;
    }
    // Khớp ràng buộc MinLength(6) của ResetPasswordDto phía máy chủ.
    if (newPassword.length < 6) {
      setLoi({ khoa: 'matKhauNgan' });
      return;
    }

    setLoi(null);
    setSubmitting(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert(t.daDoiMatKhau, t.dangNhapBangMatKhauMoi);
      router.replace('/login');
    } catch (err) {
      setLoi({ loi: err, duPhong: 'datLaiThatBai' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      {/*
        `KeyboardAvoidingView` này lấy từ `react-native-keyboard-controller`.

        Bản của React Native dựa vào sự kiện `keyboardDidShow` để biết bàn phím
        cao bao nhiêu; dưới edge-to-edge, bàn phím của mỗi hãng báo mỗi kiểu nên
        ô nhập bị che trên máy này mà không che trên máy khác. Bản này đọc thẳng
        `WindowInsetsAnimation` của hệ điều hành, không còn phụ thuộc máy.

        Nhờ vậy `behavior="padding"` dùng được cho Android.

        iPhone thì tắt nó đi: `KhungCuonBieuMau` trên iPhone tự cuộn ô đang gõ
        lên trên bàn phím, bật cả hai là bàn phím bị tính hai lần.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        automaticOffset
        enabled={!khungCuonTuLoBanPhim()}
      >
        <KhungCuonBieuMau
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.hero,
              {
                paddingTop: insets.top + spacing.xl,
                experimental_backgroundImage: gradients.header,
              },
            ]}
          >
            <WeDoLogo testID="wedo-logo" width={140} tintColor={colors.onPrimary} />
            <Text style={styles.tagline}>{t.khauHieu}</Text>
          </View>

          <View style={styles.body}>
            <Card overlap={spacing.lg} style={styles.form}>
              <Text style={styles.formTitle}>{t.quenMatKhau}</Text>

              {error ? <ErrorBanner message={error} /> : null}

              {buoc === 'email' ? (
                <>
                  <Text style={styles.huongDan}>
                    {t.huongDanNhapEmail}
                  </Text>

                  <TextField
                    testID="email"
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t.emailMau}
                    keyboardType="email-address"
                    textContentType="username"
                    autoComplete="email"
                  />

                  <Button
                    testID="send-code"
                    label={t.guiMa}
                    onPress={handleGuiMa}
                    loading={submitting}
                  />
                </>
              ) : (
                <>
                  {thongBao ? (
                    <Text style={styles.huongDan}>{dichLoi(new Error(thongBao), t.daGuiMaDuPhong)}</Text>
                  ) : null}
                  <Text style={styles.huongDan}>
                    {t.maHieuLuc}
                  </Text>

                  <TextField
                    testID="code"
                    label={t.maSau}
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    keyboardType="number-pad"
                    textContentType="oneTimeCode"
                    autoComplete="one-time-code"
                  />
                  <TextField
                    testID="new-password"
                    label={t.matKhauMoi}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t.matKhauGoiY}
                    secureTextEntry
                    textContentType="newPassword"
                    autoComplete="new-password"
                  />

                  <Button
                    testID="reset"
                    label={t.datLaiMatKhau}
                    onPress={handleDatLai}
                    loading={submitting}
                  />

                  <Pressable
                    testID="change-email"
                    accessibilityRole="button"
                    onPress={() => {
                      setBuoc('email');
                      setLoi(null);
                      setCode('');
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.link}>{t.nhapLaiEmail}</Text>
                  </Pressable>
                </>
              )}
            </Card>
          </View>
        </KhungCuonBieuMau>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  flex: { flex: 1 },
  scroll: { flexGrow: 1 },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl * 2,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  tagline: { color: colors.onPrimary, fontSize: fontSize.sm, marginTop: spacing.xs },
  body: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },
  form: { padding: spacing.lg },
  formTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  huongDan: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  link: {
    marginTop: spacing.md,
    textAlign: 'center',
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
