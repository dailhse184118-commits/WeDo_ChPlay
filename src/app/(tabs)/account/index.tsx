import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/ui/Button';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

export default function AccountScreen() {
  const { user, signOut } = useAuth();
  const { active } = useWorkspace();

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Tài khoản</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName ?? '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.name}>{user?.fullName ?? 'Đang tải…'}</Text>
        <Text testID="account-email" style={styles.email}>
          {user?.email ?? ''}
        </Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.rowLabel}>Không gian làm việc</Text>
        <Text style={styles.rowValue}>{active?.name ?? '—'}</Text>
      </View>

      <View style={styles.spacer} />

      <Button
        testID="account-signout"
        label="Đăng xuất"
        variant="secondary"
        onPress={() => void signOut()}
      />

      <Text style={styles.note}>
        Cài đặt thông báo, chính sách bảo mật và xoá tài khoản sẽ được bổ sung ở bản tiếp theo.
      </Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  card: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.lg },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  email: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginTop: spacing.md,
  },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  spacer: { flex: 1 },
  note: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});
