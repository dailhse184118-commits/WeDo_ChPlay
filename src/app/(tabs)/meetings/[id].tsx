import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import {
  chiTietCuocHop,
  moPhongHop,
  type CuocHop,
  type HangMucHanhDong,
} from '../../../lib/api/meetings';
import { choVaoPhong, khoangGio, tenTrangThai } from '../../../lib/meetings/sap-xep';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../../theme/tokens';

/** `21/09/2026` — ngày đầy đủ, vì thẻ ở danh sách chỉ hiện giờ. */
function ngayDayDu(iso: string): string {
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

const TEN_TRANG_THAI_HANG_MUC: Record<HangMucHanhDong['status'], string> = {
  PENDING: 'Chờ nhận',
  ACCEPTED: 'Đã nhận',
  REJECTED: 'Đã từ chối',
};

function Khoi({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <Card style={styles.khoi}>
      <Text style={styles.khoiTieuDe}>{tieuDe}</Text>
      {children}
    </Card>
  );
}

function HangMuc({ muc }: { muc: HangMucHanhDong }) {
  return (
    <View style={styles.muc}>
      <Ionicons
        name={muc.task ? 'checkbox' : 'ellipse-outline'}
        size={18}
        color={muc.task ? colors.success : colors.textMuted}
        style={styles.mucDau}
      />
      <View style={styles.mucThan}>
        <Text style={styles.mucTieuDe}>{muc.title}</Text>
        <Text style={styles.mucPhu}>
          {muc.assignee?.fullName ?? 'Chưa giao'}
          {' · '}
          {TEN_TRANG_THAI_HANG_MUC[muc.status] ?? 'Chờ nhận'}
          {muc.task ? ' · đã thành công việc' : ''}
        </Text>
      </View>
    </View>
  );
}

export default function ManChiTietHop() {
  const router = useRouter();
  const { id, tu } = useLocalSearchParams<{ id: string; tu?: string }>();

  /*
    Mở từ Lịch thì về Lịch, từ Thông báo thì về Thông báo, còn lại về danh sách.
    Không dựa vào lịch sử tab — xem `useQuayLai`.
  */
  const quayLai = useQuayLai(
    useCallback(() => {
      if (tu === 'lich') router.navigate('/calendar');
      else if (tu === 'thong-bao') router.navigate('/notifications');
      else router.navigate('/meetings');
    }, [router, tu]),
  );
  const queryClient = useQueryClient();
  const [loiMoPhong, setLoiMoPhong] = useState<string | null>(null);

  const hopQuery = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => chiTietCuocHop(id!),
    enabled: Boolean(id),
  });

  const moPhong = useMutation({
    mutationFn: () => moPhongHop(id!),
    onSuccess: async (hop: CuocHop) => {
      queryClient.setQueryData(['meeting', id], hop);
      void queryClient.invalidateQueries({ queryKey: ['meetings'] });

      if (!hop.roomUrl) {
        setLoiMoPhong('Máy chủ chưa trả về đường vào phòng. Thử lại sau ít phút nhé.');
        return;
      }

      /*
        Mở bằng trình duyệt của máy, KHÔNG nhúng phòng gọi vào app.
        Daily.co có thư viện gốc cho React Native, mà thêm thư viện gốc là phải
        dựng lại bản cài đặt và nộp lại Play — còn màn hình thuần JavaScript
        thì đẩy thẳng qua bản cập nhật. Trình duyệt Android xin quyền micro và
        camera bằng hộp thoại hệ thống quen thuộc, nên cách này chạy được ngay
        mà không phải khai thêm quyền trong bản cài đặt.
      */
      const moDuoc = await Linking.canOpenURL(hop.roomUrl);
      if (!moDuoc) {
        setLoiMoPhong('Máy không mở được đường dẫn phòng họp.');
        return;
      }
      await Linking.openURL(hop.roomUrl);
    },
    onError: (loi: unknown) => {
      setLoiMoPhong(loi instanceof Error ? loi.message : 'Không mở được phòng họp.');
    },
  });

  if (hopQuery.isLoading) {
    return (
      <View style={styles.man}>
        <GradientHeader title="Cuộc họp" onBack={quayLai} dense />
        <View style={styles.giua}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const hop = hopQuery.data;

  if (!hop) {
    return (
      <View style={styles.man}>
        <GradientHeader title="Cuộc họp" onBack={quayLai} dense />
        <View style={styles.giua}>
          <ErrorBanner message="Không tìm thấy cuộc họp này, hoặc bạn không có quyền xem." />
        </View>
      </View>
    );
  }

  const vaoDuoc = choVaoPhong(hop);

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Cuộc họp"
        onBack={quayLai}
        dense
      />

      <ScrollView contentContainerStyle={styles.cuon} showsVerticalScrollIndicator={false}>
        {loiMoPhong ? <ErrorBanner message={loiMoPhong} /> : null}

        <Card style={styles.khoi}>
          <Text testID="meeting-status" style={styles.trangThai}>
            {tenTrangThai(hop.status)}
          </Text>
          <Text testID="meeting-title" style={styles.tieuDe}>
            {hop.title}
          </Text>

          <View style={styles.dong}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.dongChu}>{ngayDayDu(hop.startTime)}</Text>
          </View>
          <View style={styles.dong}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.dongChu}>{khoangGio(hop)}</Text>
          </View>
          {hop.project?.name ? (
            <View style={styles.dong}>
              <Ionicons name="folder-outline" size={16} color={colors.textMuted} />
              <Text style={styles.dongChu}>{hop.project.name}</Text>
            </View>
          ) : null}

          {vaoDuoc ? (
            <View style={styles.nut}>
              <Button
                testID="meeting-join"
                label="Vào phòng họp"
                onPress={() => {
                  setLoiMoPhong(null);
                  moPhong.mutate();
                }}
                loading={moPhong.isPending}
              />
              <Text style={styles.ghiChuNut}>
                Phòng họp mở trong trình duyệt của máy.
              </Text>
            </View>
          ) : null}
        </Card>

        {hop.agenda ? (
          <Khoi tieuDe="Nội dung dự kiến">
            <Text style={styles.doanVan}>{hop.agenda}</Text>
          </Khoi>
        ) : null}

        {hop.participants?.length ? (
          <Khoi tieuDe={`Người tham dự (${hop.participants.length})`}>
            {hop.participants.map((nguoi) => (
              <View key={nguoi.id} style={styles.nguoi}>
                <Avatar
                  hoTen={nguoi.user.fullName ?? nguoi.user.email ?? ''}
                  anhUrl={nguoi.user.avatarUrl}
                  co={32}
                />
                <Text style={styles.nguoiTen} numberOfLines={1}>
                  {nguoi.user.fullName ?? nguoi.user.email}
                </Text>
              </View>
            ))}
          </Khoi>
        ) : null}

        {hop.summary ? (
          <Khoi tieuDe="Tóm tắt">
            <Text style={styles.doanVan}>{hop.summary}</Text>
          </Khoi>
        ) : null}

        {hop.decisions ? (
          <Khoi tieuDe="Quyết định">
            <Text style={styles.doanVan}>{hop.decisions}</Text>
          </Khoi>
        ) : null}

        {hop.actionItems?.length ? (
          <Khoi tieuDe={`Hạng mục hành động (${hop.actionItems.length})`}>
            {hop.actionItems.map((muc) => (
              <HangMuc key={muc.id} muc={muc} />
            ))}
          </Khoi>
        ) : null}

        {/*
          Nói thẳng chỗ nào phải dùng web, thay vì để người dùng đi tìm một nút
          không tồn tại. Sinh tóm tắt AI và duyệt hạng mục thành công việc là
          hai thao tác của Leader, làm trên máy tính tiện hơn hẳn.
        */}
        {hop.status === 'COMPLETED' && !hop.summary ? (
          <Text style={styles.ghiChuCuoi}>
            Biên bản và tóm tắt được tạo trên bản web tại wedofpt.com.vn.
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.md },
  cuon: { padding: spacing.md, paddingBottom: spacing.xl },
  khoi: { marginBottom: spacing.md },
  khoiTieuDe: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  trangThai: { fontSize: fontSize.xs, fontWeight: '700', color: colors.primary },
  tieuDe: {
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    lineHeight: lineHeight.lg,
  },
  dong: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
  dongChu: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  nut: { marginTop: spacing.md },
  ghiChuNut: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  doanVan: { fontSize: fontSize.sm, color: colors.text, lineHeight: lineHeight.sm },
  nguoi: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  nguoiTen: { flex: 1, fontSize: fontSize.sm, color: colors.text },
  muc: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  mucDau: { marginTop: 2 },
  mucThan: { flex: 1, minWidth: 0 },
  mucTieuDe: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  mucPhu: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  ghiChuCuoi: {
    marginTop: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: lineHeight.xs,
  },
});
