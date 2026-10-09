import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
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
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import type { DeletionBlocker } from '../../lib/types';
import { colors, fontSize, lineHeight, radius, spacing } from '../../theme/tokens';

type KhoaLoiXoa = 'khongChuyenDuoc' | 'khongXoaDuoc';

function WhatGetsDeleted() {
  const t = useTuDien(tuDienTaiKhoan).xoa;
  const items = [
    t.muc[0],
    t.muc[1],
    // Máy chủ xoá cả tệp trên kho lưu trữ sau khi xoá tài khoản. Không nhắc gói
    // trả phí ở đây: app iPhone không được nói chuyện mua bán (3.1.3(f)).
    t.muc[2],
    t.muc[3],
    t.muc[4],
  ];

  return (
    <Card style={styles.block}>
      <Text style={styles.blockTitle}>{t.tieuDeKhoi}</Text>
      {items.map((item) => (
        <View key={item} style={styles.bullet}>
          <Ionicons name="remove-circle-outline" size={16} color={colors.danger} />
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
      <Text style={styles.blockNote}>{t.ghiChuKhoi}</Text>
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
  const t = useTuDien(tuDienTaiKhoan).xoa;
  return (
    <Card style={styles.blocker}>
      <Text style={styles.blockerTitle}>{blocker.workspaceName}</Text>
      <Text style={styles.blockerBody}>
        {t.chuSoHuu(blocker.otherMemberCount, blocker.projectCount, blocker.taskCount)}
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
  const { signOut, status } = useAuth();
  const t = useTuDien(tuDienTaiKhoan).xoa;
  const dichLoi = useDichLoi();
  /* Từ phải gõ để bật nút xoá, theo ngôn ngữ ('XOA' / 'DELETE'). Chặn cú chạm nhầm vào việc không hoàn tác được. */
  const confirmWord = t.tuXacNhan;

  const [confirmText, setConfirmText] = useState('');
  const [actionError, setActionError] = useState<NguonLoi<KhoaLoiXoa> | null>(null);

  const blockersQuery = useQuery({
    queryKey: ['deletion-blockers'],
    queryFn: getDeletionBlockers,
    /*
      Đăng xuất xoá sạch cache, và query đang gắn trên màn lập tức tự tải lại —
      bằng một phiên đã mất, nên màn hiện "Không tải được thông tin tài khoản"
      ngay sau khi xoá thành công. Tắt nó khi đã đăng xuất.
    */
    enabled: status !== 'signedOut',
  });

  const transferMutation = useMutation({
    mutationFn: ({ workspaceId, newOwnerId }: { workspaceId: string; newOwnerId: string }) =>
      transferWorkspaceOwner(workspaceId, newOwnerId),
    onSuccess: () => {
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['deletion-blockers'] });
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongChuyenDuoc' }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    /*
      Xoá xong thì token trỏ tới một tài khoản không còn tồn tại, phải đăng xuất
      ngay. `VeDangNhapKhiDangXuat` ở layout gốc đưa về màn Đăng nhập; báo một câu
      để người dùng — và người duyệt của Apple — thấy rõ việc xoá đã thành công.
    */
    onSuccess: async () => {
      await signOut();
      Alert.alert(t.daXoaTieuDe, t.daXoaNoiDung);
    },
    onError: (err) => setActionError({ loi: err, duPhong: 'khongXoaDuoc' }),
  });

  const handleTransfer = useCallback(
    (workspaceId: string, newOwnerId: string, name: string) => {
      Alert.alert(
        t.chuyenTieuDe,
        t.chuyenNoiDung(name),
        [
          { text: t.huy, style: 'cancel' },
          {
            text: t.chuyen,
            onPress: () => transferMutation.mutate({ workspaceId, newOwnerId }),
          },
        ],
      );
    },
    [transferMutation, t],
  );

  const handleDelete = useCallback(() => {
    Alert.alert(
      t.hoiXoaTieuDe,
      t.hoiXoaNoiDung,
      [
        { text: t.huy, style: 'cancel' },
        { text: t.tieuDe, style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  }, [deleteMutation, t]);

  const data = blockersQuery.data;
  const canDelete = data?.canDelete === true;
  const confirmed = confirmText.trim().toUpperCase() === confirmWord;

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={t.tieuDe}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      {blockersQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/*
            Hỏng thì phải có nút thử lại: thiếu dữ liệu này là không có nút xoá,
            và người dùng kẹt lại không có đường xoá tài khoản nào trong app.
          */}
          {blockersQuery.isError ? (
            <>
              <ErrorBanner message={t.khongTaiDuoc} />
              <View style={styles.thuLai}>
                <Button
                  testID="delete-retry"
                  label={t.thuLai}
                  variant="secondary"
                  loading={blockersQuery.isRefetching}
                  onPress={() => void blockersQuery.refetch()}
                />
              </View>
            </>
          ) : null}
          {actionError ? <ErrorBanner message={chuLoi(t, actionError, dichLoi)} /> : null}

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
              <Text style={styles.blockTitle}>{t.xacNhan}</Text>
              <Text style={styles.blockNote}>{t.goDeBat(confirmWord)}</Text>
              <View style={styles.confirmField}>
                <TextField
                  testID="delete-confirm"
                  label={t.nhanO(confirmWord)}
                  value={confirmText}
                  onChangeText={setConfirmText}
                  placeholder={confirmWord}
                  autoCapitalize="characters"
                />
              </View>
              <Button
                testID="delete-account"
                label={t.nutXoa}
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
    lineHeight: lineHeight.sm,
  },
  blockNote: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: lineHeight.xs,
    marginTop: spacing.xs,
  },
  blocker: { marginBottom: spacing.md, backgroundColor: colors.dangerSoft },
  blockerTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.danger },
  blockerBody: {
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: lineHeight.sm,
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
  candidateEmail: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs },
  confirmField: { marginTop: spacing.sm },
  thuLai: { marginBottom: spacing.md },
});
