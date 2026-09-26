import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ODongYDieuKhoan } from '../../components/auth/ODongYDieuKhoan';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { useAuth } from '../../lib/auth/auth-context';
import { coDangNhapGoogle } from '../../lib/auth/google-signin';
import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

export default function RegisterScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  /* Không đánh dấu sẵn — xem `ODongYDieuKhoan`. */
  const [dongY, setDongY] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Nút đã tắt khi chưa đánh dấu; chốt thêm ở đây cho chắc.
    if (!dongY) {
      setError('Bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng để tạo tài khoản.');
      return;
    }
    if (!fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError('');
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
      Alert.alert(
        'Đăng ký thành công',
        `Chào ${fullName.trim()}, tài khoản của bạn đã sẵn sàng. Tạo dự án đầu tiên để bắt đầu nhé.`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      /*
        Không hiện hộp thoại chào mừng như đường đăng ký thường: `/auth/google`
        vừa tạo tài khoản mới vừa nhận lại tài khoản cũ, phía ứng dụng không biết
        được là cái nào, nên chúc mừng "đã tạo tài khoản" sẽ sai với người quay lại.
      */
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.');
    } finally {
      setGoogleSubmitting(false);
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
            <Text style={styles.tagline}>Nghĩ ít hơn, làm nhiều hơn</Text>
          </View>

          <View style={styles.body}>
            <Card overlap={spacing.lg} style={styles.form}>
              <Text style={styles.formTitle}>Tạo tài khoản</Text>

              {error ? <ErrorBanner message={error} /> : null}

              <TextField
                testID="fullName"
                label="Họ và tên"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nguyễn Văn A"
                autoCapitalize="words"
                textContentType="name"
                autoComplete="name"
              />
              <TextField
                testID="email"
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="ban@example.com"
                keyboardType="email-address"
                textContentType="username"
                autoComplete="email"
              />
              <TextField
                testID="password"
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="Ít nhất 6 ký tự"
                secureTextEntry
                textContentType="newPassword"
                autoComplete="new-password"
              />

              <ODongYDieuKhoan daChon={dongY} onDoi={setDongY} disabled={submitting} />

              <Button
                testID="submit"
                label="Đăng ký"
                onPress={handleSubmit}
                loading={submitting}
                disabled={googleSubmitting || !dongY}
              />

              {/*
                iPhone chỉ có email và mật khẩu — xem `coDangNhapGoogle`.

                Nút Google không đòi ô trên: người vào bằng Google chưa đồng ý
                điều khoản sẽ gặp màn đồng ý một lần ngay sau khi vào
                (`CongDieuKhoan`), nên không ai lọt qua mà chưa đồng ý.
              */}
              {coDangNhapGoogle() ? (
                <>
                  <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerLabel}>hoặc</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <GoogleButton
                    testID="google"
                    onPress={handleGoogle}
                    loading={googleSubmitting}
                    disabled={submitting}
                  />
                </>
              ) : null}
            </Card>

            <Link href="/login" style={styles.link}>
              Đã có tài khoản? Đăng nhập
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
  link: {
    marginTop: spacing.lg,
    textAlign: 'center',
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
