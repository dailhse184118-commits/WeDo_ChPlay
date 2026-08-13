import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GoogleButton } from '../../components/ui/GoogleButton';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { useAuth } from '../../lib/auth/auth-context';
import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    // Khớp với ràng buộc MinLength(6) của RegisterDto phía máy chủ.
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleSubmitting(true);
    try {
      /*
        Người dùng đóng hộp thoại chọn tài khoản thì hàm này kết thúc êm, không
        ném lỗi — nên ở đây không có nhánh riêng cho việc huỷ, nút chỉ ngừng quay.
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
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
            <Text style={styles.tagline}>Nghĩ ít hơn, làm nhiều hơn</Text>
          </View>

          <View style={styles.body}>
            <Card overlap={spacing.lg} style={styles.form}>
              <Text style={styles.formTitle}>Đăng nhập</Text>

              {error ? <ErrorBanner message={error} /> : null}

              <TextField
                testID="email"
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="ban@example.com"
                keyboardType="email-address"
              />
              <TextField
                testID="password"
                label="Mật khẩu"
                value={password}
                onChangeText={setPassword}
                placeholder="Ít nhất 6 ký tự"
                secureTextEntry
              />

              <Button
                testID="submit"
                label="Đăng nhập"
                onPress={handleSubmit}
                loading={submitting}
                disabled={googleSubmitting}
              />

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
            </Card>

            <Link href="/register" style={styles.link}>
              Chưa có tài khoản? Đăng ký
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
