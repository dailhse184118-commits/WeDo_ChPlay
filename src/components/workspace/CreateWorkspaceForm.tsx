import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { ScreenContainer } from '../ui/ScreenContainer';
import { TextField } from '../ui/TextField';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

/**
 * Component, không phải route. Khung tab render trực tiếp khi status === 'empty',
 * vì lúc đó WorkspaceProvider chỉ tồn tại bên trong khung tab nên không điều hướng
 * sang route khác được.
 */
export function CreateWorkspaceForm() {
  const { create } = useWorkspace();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên không gian làm việc');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await create(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được không gian làm việc.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tạo không gian làm việc</Text>
        <Text style={styles.body}>
          Không gian làm việc là nơi chứa các dự án và công việc của nhóm bạn. Tạo một cái để bắt
          đầu.
        </Text>

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          testID="name"
          label="Tên không gian làm việc"
          value={name}
          onChangeText={setName}
          placeholder="Nhóm đồ án tốt nghiệp"
          autoCapitalize="sentences"
        />

        <Button testID="submit" label="Tạo" onPress={handleSubmit} loading={submitting} />
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
    marginBottom: spacing.sm,
  },
  body: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xl },
});
