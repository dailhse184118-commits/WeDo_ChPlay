import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { TextField } from '../../components/ui/TextField';
import { WeDoLogo } from '../../components/ui/WeDoLogo';
import { forgotPassword, resetPassword } from '../../lib/api/auth';
import { colors, fontSize, gradients, lineHeight, radius, spacing } from '../../theme/tokens';

type Buoc = 'email' | 'ma';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [buoc, setBuoc] = useState<Buoc>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [thongBao, setThongBao] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleGuiMa = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }

    setError('');
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
      setError(err instanceof Error ? err.message : 'Không gửi được mã. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDatLai = async () => {
    if (!/^\d{6}$/.test(code.trim())) {
      setError('Mã gồm 6 chữ số');
      return;
    }
    // Khớp ràng buộc MinLength(6) của ResetPasswordDto phía máy chủ.
    if (newPassword.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await resetPassword(email.trim(), code.trim(), newPassword);
      Alert.alert('Đã đổi mật khẩu', 'Hãy đăng nhập bằng mật khẩu mới.');
      router.replace('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
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
              <Text style={styles.formTitle}>Quên mật khẩu</Text>

              {error ? <ErrorBanner message={error} /> : null}

              {buoc === 'email' ? (
                <>
                  <Text style={styles.huongDan}>
                    Nhập email bạn dùng để đăng ký. WeDo sẽ gửi cho bạn một mã gồm 6 chữ số.
                  </Text>

                  <TextField
                    testID="email"
                    label="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="ban@example.com"
                    keyboardType="email-address"
                  />

                  <Button
                    testID="send-code"
                    label="Gửi mã"
                    onPress={handleGuiMa}
                    loading={submitting}
                  />
                </>
              ) : (
                <>
                  {thongBao ? <Text style={styles.huongDan}>{thongBao}</Text> : null}
                  <Text style={styles.huongDan}>
                    Mã có hiệu lực trong 10 phút. Nhớ xem cả hộp thư rác.
                  </Text>

                  <TextField
                    testID="code"
                    label="Mã 6 số"
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    keyboardType="number-pad"
                  />
                  <TextField
                    testID="new-password"
                    label="Mật khẩu mới"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Ít nhất 6 ký tự"
                    secureTextEntry
                  />

                  <Button
                    testID="reset"
                    label="Đặt lại mật khẩu"
                    onPress={handleDatLai}
                    loading={submitting}
                  />

                  <Pressable
                    testID="change-email"
                    accessibilityRole="button"
                    onPress={() => {
                      setBuoc('email');
                      setError('');
                      setCode('');
                    }}
                    hitSlop={8}
                  >
                    <Text style={styles.link}>Gõ nhầm email? Nhập lại</Text>
                  </Pressable>
                </>
              )}
            </Card>
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
