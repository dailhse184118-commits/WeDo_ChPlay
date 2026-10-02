import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { NhapMaMoiSheet } from '../chat/NhapMaMoiSheet';
import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { ScreenContainer } from '../ui/ScreenContainer';
import { TextField } from '../ui/TextField';
import type { KetQuaThamGia } from '../../lib/api/loi-moi';
import { saveActiveWorkspaceId } from '../../lib/auth/token-storage';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

/**
 * Component, không phải route. Khung tab render trực tiếp khi status === 'empty',
 * vì lúc đó WorkspaceProvider chỉ tồn tại bên trong khung tab nên không điều hướng
 * sang route khác được.
 */
interface CreateWorkspaceFormProps {
  /**
   * Gọi sau khi tạo xong. Màn onboarding không truyền: ở đó `status` đổi sang
   * `ready` và khung tab tự thay màn. Mở trong Modal thì phải có người đóng.
   */
  onDone?: () => void;
  /**
   * Hiện nút "Có mã mời? Nhập mã". Chỉ khung tab bật, ở màn tài khoản chưa có
   * không gian nào: sinh viên mới đăng ký để vào dự án Leader mời không được
   * bị ép tạo một không gian bỏ đi trước. Hộp thoại "tạo thêm không gian"
   * không bật — ở đó nút Nhập mã mời đã có sẵn trên tab Trò chuyện.
   */
  choNhapMaMoi?: boolean;
}

export function CreateWorkspaceForm({ onDone, choNhapMaMoi = false }: CreateWorkspaceFormProps = {}) {
  const { create, refresh } = useWorkspace();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nhapMaOpen, setNhapMaOpen] = useState(false);

  /*
    Vào nhóm xong: lưu id không gian chứa dự án TRƯỚC, rồi mới nạp lại —
    `refresh` đọc id đã lưu để chọn không gian hoạt động, và danh sách mới có
    không gian đó nên `status` rời 'empty', khung tab tự thay màn này.
  */
  const daThamGia = async (ketQua: KetQuaThamGia) => {
    setNhapMaOpen(false);
    await saveActiveWorkspaceId(ketQua.workspaceId);
    await refresh();
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên không gian làm việc');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await create(name.trim());
      onDone?.();
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

        {choNhapMaMoi ? (
          <View style={styles.coMa}>
            <Button
              testID="nut-co-ma-moi"
              variant="secondary"
              label="Có mã mời? Nhập mã"
              onPress={() => setNhapMaOpen(true)}
            />
          </View>
        ) : null}
      </ScrollView>

      {choNhapMaMoi ? (
        <NhapMaMoiSheet
          visible={nhapMaOpen}
          onDismiss={() => setNhapMaOpen(false)}
          onDaThamGia={(ketQua) => void daThamGia(ketQua)}
        />
      ) : null}
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
  coMa: { marginTop: spacing.md },
});
