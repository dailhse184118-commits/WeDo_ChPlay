import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { getContributions, type DongGopThanhVien } from '../../lib/api/tasks';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

function O({ so, nhan }: { so: number | string; nhan: string }) {
  return (
    <View style={styles.o}>
      <Text style={styles.oSo}>{so}</Text>
      <Text style={styles.oNhan}>{nhan}</Text>
    </View>
  );
}

function The({ nguoi, hang }: { nguoi: DongGopThanhVien; hang: number }) {
  const ten = nguoi.user?.fullName || nguoi.user?.email || 'Không rõ';

  return (
    <View style={styles.the}>
      <View style={styles.theDau}>
        <Text style={styles.hang}>{hang}</Text>
        <Text style={styles.ten} numberOfLines={1}>
          {ten}
        </Text>
        {/*
          `null` là "chưa có việc nào có hạn để đo", khác hẳn 0%. Hiện dấu gạch
          để không ai tưởng người này đúng hạn 0 lần.
        */}
        <Text style={styles.tyLe}>
          {nguoi.tyLeDungHanPhanTram === null
            ? '—'
            : `${nguoi.tyLeDungHanPhanTram}% đúng hạn`}
        </Text>
      </View>

      <View style={styles.hangO}>
        <O so={nguoi.hoanThanh} nhan="Hoàn thành" />
        <O so={nguoi.chuaXong} nhan="Chưa xong" />
        <O so={nguoi.treHan} nhan="Trễ hạn" />
        <O so={nguoi.daNop} nhan="Bài đã nộp" />
      </View>

      {nguoi.biTraLai > 0 ? (
        <Text style={styles.traLai}>{nguoi.biTraLai} việc từng bị trả lại để sửa</Text>
      ) : null}
    </View>
  );
}

export default function ManDongGop() {
  const router = useRouter();
  const { active } = useWorkspace();

  const bang = useQuery({
    queryKey: ['contributions', active?.id],
    queryFn: () => getContributions(active!.id),
    enabled: Boolean(active?.id),
  });

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Bảng đóng góp"
        subtitle={active?.name}
        onBack={() => router.back()}
        dense
      />

      <ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>
        {bang.isError ? (
          <ErrorBanner
            message={
              bang.error instanceof Error
                ? bang.error.message
                : 'Không tải được bảng đóng góp.'
            }
          />
        ) : null}

        {bang.isLoading ? (
          <View style={styles.giua}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (bang.data?.thanhVien.length ?? 0) === 0 ? (
          <Text style={styles.trong}>
            Chưa có việc nào được giao cho ai trong không gian làm việc này.
          </Text>
        ) : (
          <>
            <Text style={styles.moDau}>
              Xếp theo số việc đã hoàn thành. Việc không đặt hạn không tính vào tỷ lệ đúng hạn.
            </Text>
            {bang.data!.thanhVien.map((nguoi, i) => (
              <The key={nguoi.userId} nguoi={nguoi} hang={i + 1} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.background },
  than: { flex: 1 },
  thanNoiDung: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  giua: { paddingTop: spacing.xl * 2, alignItems: 'center' },
  moDau: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
  trong: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingTop: spacing.xl,
    lineHeight: fontSize.sm * 1.6,
  },
  the: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  theDau: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  hang: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
    minWidth: 18,
  },
  ten: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  tyLe: { fontSize: fontSize.xs, color: colors.textMuted },
  hangO: { flexDirection: 'row', gap: spacing.sm },
  o: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  oSo: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  oNhan: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
  traLai: { fontSize: fontSize.xs, color: colors.warning },
});
