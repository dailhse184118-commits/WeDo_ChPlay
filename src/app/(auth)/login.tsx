import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../lib/auth/auth-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

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

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>WeDo</Text>
        <Text style={styles.tagline}>Nghĩ ít hơn, làm nhiều hơn</Text>

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

        <Button testID="submit" label="Đăng nhập" onPress={handleSubmit} loading={submitting} />

        <Link href="/register" style={styles.link}>
          Chưa có tài khoản? Đăng ký
        </Link>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  brand: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.primary, fontSize: fontSize.sm },
});
