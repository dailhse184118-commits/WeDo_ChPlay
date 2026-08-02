import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../lib/auth/auth-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
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
      await signUp({ email: email.trim(), password, fullName: fullName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tạo tài khoản WeDo</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          testID="fullName"
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          autoCapitalize="words"
        />
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

        <Button testID="submit" label="Đăng ký" onPress={handleSubmit} loading={submitting} />

        <Link href="/login" style={styles.link}>
          Đã có tài khoản? Đăng nhập
        </Link>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.primary, fontSize: fontSize.sm },
});
