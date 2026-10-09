import React, { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ODongYDieuKhoan } from '../../components/auth/ODongYDieuKhoan';
import { AppleButton } from '../../components/ui/AppleButton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { KhungCuonBieuMau, khungCuonTuLoBanPhim } from '../../components/ui/KhungCuonBieuMau';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDangNhap } from '../../i18n/tu-dien/dang-nhap';
import { useCoDangNhapApple } from '../../lib/auth/apple-signin';
import { useAuth } from '../../lib/auth/auth-context';
import { coDangNhapGoogle } from '../../lib/auth/google-signin';
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

type KhoaLoi =
  | 'canDongYDieuKhoan'
  | 'thieuHoTen'
  | 'thieuEmail'
  | 'matKhauNgan'
  | 'dangKyThatBai'
  | 'dangNhapGoogleThatBai'
  | 'dangNhapAppleThatBai';

export default function RegisterScreen() {
  const t = useTuDien(tuDienDangNhap);
  const dichLoi = useDichLoi();
  const { signUp, signInWithGoogle, signInWithApple } = useAuth();
  const insets = useSafeAreaInsets();
  const coApple = useCoDangNhapApple();
  const coGoogle = coDangNhapGoogle();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /* Không đánh dấu sẵn — xem `ODongYDieuKhoan`. */
  const [dongY, setDongY] = useState(false);
  const [loi, setLoi] = useState<NguonLoi<KhoaLoi> | null>(null);
  const error = chuLoi(t, loi, dichLoi);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Nút đã tắt khi chưa đánh dấu; chốt thêm ở đây cho chắc.
    if (!dongY) {
      setLoi({ khoa: 'canDongYDieuKhoan' });
      return;
    }
    if (!fullName.trim()) {
      setLoi({ khoa: 'thieuHoTen' });
      return;
    }
    if (!email.trim()) {
      setLoi({ khoa: 'thieuEmail' });
      return;
    }
    if (password.length < 6) {
      setLoi({ khoa: 'matKhauNgan' });
      return;
    }

    setLoi(null);
    setSubmitting(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        acceptTerms: true,
        confirmAdult: true,
      });

      /*
        Đăng ký xong là vào thẳng app, không qua bước xác minh email nào. Không
        báo gì thì người dùng không chắc mình đã có tài khoản hay chưa — người
        kiểm thử phản ánh đúng điểm này ngày 11/08/2026.

        Dùng Alert của hệ thống vì nó nổi trên cả lần điều hướng ngay sau đó.
      */
      Alert.alert(t.dangKyThanhCong, t.chaoMung(fullName.trim()));
    } catch (err) {
      setLoi({ loi: err, duPhong: 'dangKyThatBai' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setLoi(null);
    setGoogleSubmitting(true);
    try {
      /*
        Không hiện hộp thoại chào mừng như đường đăng ký thường: `/auth/google`
        vừa tạo tài khoản mới vừa nhận lại tài khoản cũ, phía ứng dụng không biết
        được là cái nào, nên chúc mừng "đã tạo tài khoản" sẽ sai với người quay lại.
      */
      await signInWithGoogle();
    } catch (err) {
      setLoi({ loi: err, duPhong: 'dangNhapGoogleThatBai' });
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleApple = async () => {
    setLoi(null);
    setAppleSubmitting(true);
    try {
      /*
        Không hộp thoại chào mừng, cùng lý do như Google: `/auth/apple` vừa tạo
        tài khoản mới vừa nhận lại tài khoản cũ. Cũng không hỏi lại họ tên hay
        email — Apple đã đưa rồi (hoặc người dùng đã chọn không đưa).
      */
      await signInWithApple();
    } catch (err) {
      setLoi({ loi: err, duPhong: 'dangNhapAppleThatBai' });
    } finally {
      setAppleSubmitting(false);
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
              <Text style={styles.formTitle}>{t.taoTaiKhoan}</Text>

              {error ? <ErrorBanner message={error} /> : null}

              <TextField
                testID="fullName"
                label={t.hoTen}
                value={fullName}
                onChangeText={setFullName}
                placeholder={t.hoTenMau}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
              />
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
              <TextField
                testID="password"
                label={t.matKhau}
                value={password}
                onChangeText={setPassword}
                placeholder={t.matKhauGoiY}
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />

              <ODongYDieuKhoan daChon={dongY} onDoi={setDongY} disabled={submitting} />

              <Button
                testID="submit"
                label={t.dangKy}
                onPress={handleSubmit}
                loading={submitting}
                disabled={googleSubmitting || appleSubmitting || !dongY}
              />

              {/*
                Apple chỉ có trên iPhone; Google có trên Android, và trên iPhone
                khi đã khai client iOS — xem `coDangNhapGoogle`. Apple đứng trước
                và cùng cỡ với Google (Guideline 4.8).

                Hai nút này không đòi ô trên: người vào bằng Apple hay Google mà
                chưa đồng ý điều khoản sẽ gặp màn đồng ý một lần ngay sau khi vào
                (`CongDieuKhoan`), nên không ai lọt qua mà chưa đồng ý.
              */}
              {coApple || coGoogle ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>{t.hoac}</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <View style={styles.nutKhac}>
                    {coApple ? (
                      <AppleButton
                        testID="apple"
                        onPress={handleApple}
                        loading={appleSubmitting}
                        disabled={submitting || googleSubmitting}
                      />
                    ) : null}

                    {coGoogle ? (
                      <GoogleButton
                        testID="google"
                        onPress={handleGoogle}
                        loading={googleSubmitting}
                        disabled={submitting || appleSubmitting}
                      />
                    ) : null}
                  </View>
                </>
              ) : null}
            </Card>

            <Link href="/login" style={styles.link}>
              {t.daCoTaiKhoan}
            </Link>
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
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerLabel: { color: colors.textMuted, fontSize: fontSize.sm },
  nutKhac: { gap: spacing.sm },
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
