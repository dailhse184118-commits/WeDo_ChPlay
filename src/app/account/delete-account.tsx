import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TextField } from '../../components/ui/TextField';
import {
  deleteAccount,
  getDeletionBlockers,
  transferWorkspaceOwner,
} from '../../lib/api/account';
import { useAuth } from '../../lib/auth/auth-context';
import type { DeletionBlocker } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

/** Gõ đúng từ này mới bật được nút xoá. Chặn cú chạm nhầm vào việc không hoàn tác được. */
const CONFIRM_WORD = 'XOA';

function WhatGetsDeleted() {
  const items = [
    'Hồ sơ, email và mật khẩu của bạn',
    'Tin nhắn bạn đã gửi trong mọi kênh chat dự án',
    'Việc bạn đang phụ trách sẽ trở thành chưa giao',
    'Không gian làm việc chỉ có mình bạn, cùng toàn bộ dự án và công việc bên trong',
  ];

  return (
    <Card style={styles.block}>
      <Text style={styles.blockTitle}>Xoá tài khoản sẽ xoá vĩnh viễn</Text>
      {items.map((item) => (
        <View key={item} style={styles.bullet}>
          <Ionicons name="remove-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
      <Text style={styles.blockNote}>
        Không có bước hoàn tác và không khôi phục lại được. Nếu chỉ muốn tạm ngừng nhận thông báo,
        bạn tắt trong phần Cài đặt thông báo là đủ.
      </Text>
    </Card>
  );
}

function BlockerCard({
  blocker,
  onTransfer,
  transferring,
}: {
  blocker: DeletionBlocker;
  onTransfer: (workspaceId: string, newOwnerId: string, name: string) => void;
  transferring: boolean;
}) {
  return (
    <Card style={styles.blocker}>
      <Text style={styles.blockerTitle}>{blocker.workspaceName}</Text>
      <Text style={styles.blockerBody}>
        Bạn là chủ sở hữu và còn {blocker.otherMemberCount} thành viên khác. Không gian này đang giữ{' '}
        {blocker.projectCount} dự án và {blocker.taskCount} công việc của cả nhóm — xoá tài khoản
        bạn sẽ xoá theo tất cả. Hãy chọn người nhận quyền sở hữu.
      </Text>

      {blocker.candidates.map((candidate) => (
        <Pressable
          key={candidate.id}
          testID={`transfer-${blocker.workspaceId}-${candidate.id}`}
          disabled={transferring}
          onPress={() => onTransfer(blocker.workspaceId, candidate.id, candidate.fullName)}
          style={({ pressed }) => [styles.candidate, pressed ? styles.candidatePressed : null]}
        >
          <View style={styles.candidateBody}>
            <Text style={styles.candidateName}>{candidate.fullName}</Text>
            <Text style={styles.candidateEmail}>{candidate.email}</Text>
          </View>
          <Ionicons name="swap-horizontal-outline" size={18} color={colors.primary} />
        </Pressable>
      ))}
    </Card>
  );
}

export default function DeleteAccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { signOut } = useAuth();

  const [confirmText, setConfirmText] = useState('');
  const [actionError, setActionError] = useState('');

  const blockersQuery = useQuery({
    queryKey: ['deletion-blockers'],
    queryFn: getDeletionBlockers,
  });

  const transferMutation = useMutation({
    mutationFn: ({ workspaceId, newOwnerId }: { workspaceId: string; newOwnerId: string }) =>
      transferWorkspaceOwner(workspaceId, newOwnerId),
    onSuccess: () => {
      setActionError('');
      void queryClient.invalidateQueries({ queryKey: ['deletion-blockers'] });
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không chuyển được quyền sở hữu.'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    // Xoá xong thì token trỏ tới một tài khoản không còn tồn tại, phải đăng xuất ngay.
    onSuccess: () => void signOut(),
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không xoá được tài khoản.'),
  });

  const handleTransfer = useCallback(
    (workspaceId: string, newOwnerId: string, name: string) => {
      Alert.alert(
        'Chuyển quyền sở hữu',
        `Giao không gian làm việc này cho ${name}? Bạn sẽ vẫn là thành viên nhưng không còn quyền chủ sở hữu.`,
        [
          { text: 'Huỷ', style: 'cancel' },
          {
            text: 'Chuyển',
            onPress: () => transferMutation.mutate({ workspaceId, newOwnerId }),
          },
        ],
      );
    },
    [transferMutation],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Xoá tài khoản vĩnh viễn?',
      'Hành động này không hoàn tác được.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Xoá tài khoản', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  }, [deleteMutation]);

  const data = blockersQuery.data;
  const canDelete = data?.canDelete === true;
  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Xoá tài khoản"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      {blockersQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {blockersQuery.isError ? <ErrorBanner message="Không tải được thông tin tài khoản." /> : null}
          {actionError ? <ErrorBanner message={actionError} /> : null}

          <WhatGetsDeleted />

          {data?.blockers.map((blocker) => (
            <BlockerCard
              key={blocker.workspaceId}
              blocker={blocker}
              onTransfer={handleTransfer}
              transferring={transferMutation.isPending}
            />
          ))}

          {canDelete ? (
            <Card style={styles.block}>
              <Text style={styles.blockTitle}>Xác nhận</Text>
              <Text style={styles.blockNote}>
                Gõ {CONFIRM_WORD} vào ô dưới để bật nút xoá.
              </Text>
              <View style={styles.confirmField}>
                <TextField
                  testID="delete-confirm"
                  label={`Gõ ${CONFIRM_WORD}`}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={CONFIRM_WORD}
                  autoCapitalize="characters"
                />
              </View>
              <Button
                testID="delete-account"
                label="Xoá tài khoản vĩnh viễn"
                variant="danger"
                disabled={!confirmed}
                loading={deleteMutation.isPending}
                onPress={handleDelete}
              />
            </Card>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  block: { marginBottom: spacing.md },
  blockTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
  blockNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  blocker: { marginBottom: spacing.md, backgroundColor: colors.dangerSoft },
  blockerTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
  blockerBody: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  candidate: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  candidatePressed: { opacity: 0.7 },
  candidateBody: { flex: 1 },
  candidateName: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  candidateEmail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  confirmField: { marginTop: spacing.sm },
});
