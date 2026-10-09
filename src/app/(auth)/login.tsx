import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppleButton } from '../../components/ui/AppleButton';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDangNhap } from '../../i18n/tu-dien/dang-nhap';
import { ApiError, MA_TAI_KHOAN_BI_KHOA, docLyDoHetPhien } from '../../lib/api/client';
import { useCoDangNhapApple } from '../../lib/auth/apple-signin';
import { useAuth } from '../../lib/auth/auth-context';
import { coDangNhapGoogle } from '../../lib/auth/google-signin';
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

type KhoaLoi = 'thieuEmail' | 'matKhauNgan' | 'dangNhapThatBai' | 'dangNhapGoogleThatBai' | 'dangNhapAppleThatBai';

export default function LoginScreen() {
  const t = useTuDien(tuDienDangNhap);
  const dichLoi = useDichLoi();
  const { signIn, signInWithGoogle, signInWithApple } = useAuth();
  const insets = useSafeAreaInsets();
  const coApple = useCoDangNhapApple();
  const coGoogle = coDangNhapGoogle();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /*
    Bị đưa ra khỏi app vì tài khoản bị khoá thì màn này là thứ đầu tiên người
    dùng thấy. Không nói lý do thì họ tưởng app lỗi rồi cứ đăng nhập lại mãi.
  */
  const [loi, setLoi] = useState<NguonLoi<KhoaLoi> | null>(() => {
    const lyDo = docLyDoHetPhien();
    // Lý do là câu tiếng Việt của máy chủ kèm mã ACCOUNT_SUSPENDED; dịch lúc vẽ theo mã.
    return lyDo ? { loi: new ApiError(lyDo, 403, MA_TAI_KHOAN_BI_KHOA), duPhong: 'dangNhapThatBai' } : null;
  });
  const error = chuLoi(t, loi, dichLoi);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [appleSubmitting, setAppleSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setLoi({ khoa: 'thieuEmail' });
      return;
    }
    // Khớp với ràng buộc MinLength(6) của RegisterDto phía máy chủ.
    if (password.length < 6) {
      setLoi({ khoa: 'matKhauNgan' });
      return;
    }

    setLoi(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setLoi({ loi: err, duPhong: 'dangNhapThatBai' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setLoi(null);
    setGoogleSubmitting(true);
    try {
      /*
        Người dùng đóng hộp thoại chọn tài khoản thì hàm này kết thúc êm, không
        ném lỗi — nên ở đây không có nhánh riêng cho việc huỷ, nút chỉ ngừng quay.
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
      // Người dùng đóng bảng Apple thì hàm này kết thúc êm — như Google.
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

        Nhờ vậy `behavior="padding"` dùng được cho cả Android, không phải tách
        theo nền tảng như trước.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding" automaticOffset>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Gradient chạy lên tận đỉnh, dưới thanh trạng thái. */}
          <View
            style={[
              styles.hero,
              {
                paddingTop: insets.top + spacing.xl * 2,
                experimental_backgroundImage: gradients.header,
              },
            ]}
          >
            {/* Logo đảo sang trắng để nổi trên gradient xanh. */}
            <WeDoLogo testID="wedo-logo" width={168} tintColor={colors.onPrimary} />
            <Text style={styles.tagline}>{t.khauHieu}</Text>
          </View>

          <View style={styles.body}>
            <Card overlap={spacing.lg} style={styles.form}>
              <Text style={styles.formTitle}>{t.dangNhap}</Text>

              {error ? <ErrorBanner message={error} /> : null}

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
                textContentType="password"
                autoComplete="current-password"
              />

              <Button
                testID="submit"
                label={t.dangNhap}
                onPress={handleSubmit}
                loading={submitting}
                disabled={googleSubmitting || appleSubmitting}
              />

              {/*
                Apple chỉ có trên iPhone; Google có trên Android, và trên iPhone
                khi đã khai client iOS — xem `coDangNhapGoogle`. Không còn nút
                nào thì không vẽ dòng "hoặc" treo lơ lửng.

                Apple đứng trước và cùng cỡ với Google: Apple đòi nút của họ nổi
                bật không kém các cách đăng nhập bên thứ ba khác (4.8).
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

            <Link href="/forgot-password" style={styles.link}>
              {t.quenMatKhauLink}
            </Link>

            <Link href="/register" style={styles.link}>
              {t.chuaCoTaiKhoan}
            </Link>
          </View>
        </ScrollView>
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
