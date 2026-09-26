import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../components/ui/Avatar';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { useBoChan, useDanhSachChan } from '../../lib/moderation/use-kiem-duyet';
import { colors, fontSize, lineHeight, radius, scale, sizes, spacing } from '../../theme/tokens';

/**
 * Người đã chặn, kèm nút bỏ chặn.
 *
 * Nằm ngoài nhóm `(tabs)` vì không cần không gian làm việc nào — danh sách chặn
 * là của tài khoản. Nhờ vậy `router.back()` ở đây là quay lại ngăn xếp thật.
 */
export default function ManNguoiDaChan() {
  const router = useRouter();
  const danhSachQuery = useDanhSachChan();
  const boChan = useBoChan();

  /* Dòng đang bỏ chặn. Khoá đúng dòng đó, các dòng khác vẫn bấm được. */
  const [dangBo, setDangBo] = useState<string | null>(null);

  function bo(userId: string) {
    if (dangBo) return;
    setDangBo(userId);
    boChan.mutate(userId, { onSettled: () => setDangBo(null) });
  }

  const ds = danhSachQuery.data ?? [];

  const loi =
    boChan.error instanceof Error
      ? boChan.error.message
      : danhSachQuery.isError && !danhSachQuery.data
        ? 'Không tải được danh sách người đã chặn.'
        : '';

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Người đã chặn"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      {danhSachQuery.isLoading && !danhSachQuery.data ? (
        <View style={styles.giua}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={ds}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.danhSach}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {loi ? <ErrorBanner message={loi} /> : null}
              {ds.length > 0 ? (
                <Text style={styles.ghiChu}>
                  Bạn không thấy tin nhắn của những người này, và hai bên không thể nhắn tin riêng
                  hay kết bạn với nhau.
                </Text>
              ) : null}
            </>
          }
          refreshControl={
            <RefreshControl
              refreshing={danhSachQuery.isRefetching}
              onRefresh={() => danhSachQuery.refetch()}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => (
            <View testID={`nguoi-da-chan-${item.userId}`} style={styles.dong}>
              <Avatar hoTen={item.fullName} anhUrl={item.avatarUrl} co={sizes.projectAvatar} />
              <Text style={styles.ten} numberOfLines={2}>
                {item.fullName}
              </Text>
              <Pressable
                testID={`bo-chan-${item.userId}`}
                accessibilityRole="button"
                accessibilityLabel={`Bỏ chặn ${item.fullName}`}
                accessibilityState={{ disabled: dangBo !== null, busy: dangBo === item.userId }}
                disabled={dangBo !== null}
                onPress={() => bo(item.userId)}
                style={({ pressed }) => [styles.nut, pressed ? styles.nutNhan : null]}
              >
                {dangBo === item.userId ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.nutChu}>Bỏ chặn</Text>
                )}
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            danhSachQuery.isError ? null : (
              <View style={styles.trong}>
                <View style={styles.trongIcon}>
                  <Ionicons name="shield-checkmark-outline" size={28} color={colors.primary} />
                </View>
                <Text style={styles.trongTieuDe}>Bạn chưa chặn ai.</Text>
                <Text style={styles.trongThan}>
                  Muốn chặn ai, nhấn giữ tin nhắn của họ hoặc chạm dấu ba chấm cạnh tên họ trong
                  màn Bạn bè.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  danhSach: { padding: spacing.md, paddingBottom: spacing.xl },
  ghiChu: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: lineHeight.xs,
    marginBottom: spacing.sm,
  },
  dong: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  ten: { flex: 1, fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: '600', color: colors.text },
  nut: {
    minWidth: scale(84),
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
  },
  nutNhan: { backgroundColor: colors.primarySoft },
  nutChu: { color: colors.primary, fontSize: fontSize.xs, fontWeight: '700' },
  trong: { paddingTop: spacing.xl, alignItems: 'center', paddingHorizontal: spacing.md },
  trongIcon: {
    width: scale(64),
    height: scale(64),
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  trongTieuDe: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  trongThan: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.sm,
  },
});
