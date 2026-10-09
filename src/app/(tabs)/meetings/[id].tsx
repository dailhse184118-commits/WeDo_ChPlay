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
import { useDichLoi, useNgonNgu, useTuDien } from '../../../i18n/NgonNguProvider';
import { dinhDangThoiGian } from '../../../i18n/dinh-dang';
import type { NgonNgu } from '../../../i18n/ngon-ngu';
import { tuDienChung } from '../../../i18n/tu-dien/chung';
import { tuDienCuocHop } from '../../../i18n/tu-dien/cuoc-hop';
import { chuLoi, type NguonLoi } from '../../../lib/auth/nguon-loi';
import { ApiError } from '../../../lib/api/client';
import {
  chiTietCuocHop,
  moPhongHop,
  type CuocHop,
  type HangMucHanhDong,
} from '../../../lib/api/meetings';
import { choVaoPhong, khoangGio, tenTrangThai } from '../../../lib/meetings/sap-xep';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { colors, fontSize, lineHeight, radius, sizes, spacing } from '../../../theme/tokens';

/** `21/09/2026` — ngày đầy đủ, vì thẻ ở danh sách chỉ hiện giờ. Tiếng Anh: `Friday, Sep 25, 2026`. */
function ngayDayDu(iso: string, ngonNgu: NgonNgu): string {
  if (ngonNgu === 'en') {
    return dinhDangThoiGian(iso, 'en', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
  }
  return new Date(iso).toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function Khoi({ tieuDe, children }: { tieuDe: string; children: React.ReactNode }) {
  return (
    <Card style={styles.khoi}>
      <Text style={styles.khoiTieuDe}>{tieuDe}</Text>
      {children}
    </Card>
  );
}

function HangMuc({ muc }: { muc: HangMucHanhDong }) {
  const t = useTuDien(tuDienCuocHop).chiTiet;
  /* Cùng chữ với web và bản tóm tắt gửi vào chat. */
  const tenTrangThaiHangMuc = t.trangThaiHangMuc[muc.status];
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
          {muc.assignee?.fullName ?? t.chuaGiao}
          {/* Trạng thái lạ (máy chủ thêm giá trị mới) thì thôi không ghi, đừng đoán. */}
          {tenTrangThaiHangMuc ? ` · ${tenTrangThaiHangMuc}` : ''}
          {muc.task ? ` · ${t.daThanhCongViec}` : ''}
        </Text>
      </View>
    </View>
  );
}

export default function ManChiTietHop() {
  const router = useRouter();
  const tong = useTuDien(tuDienCuocHop);
  const t = tong.chiTiet;
  const chung = useTuDien(tuDienChung);
  const dichLoi = useDichLoi();
  const { ngonNgu } = useNgonNgu();
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
  const [loiMoPhong, setLoiMoPhong] = useState<NguonLoi<
    'chuaCoDuongVao' | 'khongMoDuocDuongDan' | 'khongMoDuocPhong'
  > | null>(null);

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
        setLoiMoPhong({ khoa: 'chuaCoDuongVao' });
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
        setLoiMoPhong({ khoa: 'khongMoDuocDuongDan' });
        return;
      }
      await Linking.openURL(hop.roomUrl);
    },
    onError: (loi: unknown) => {
      setLoiMoPhong({ loi, duPhong: 'khongMoDuocPhong' });
    },
  });

  if (hopQuery.isLoading) {
    return (
      <View style={styles.man}>
        <GradientHeader title={tong.tieuDe} onBack={quayLai} dense />
        <View style={styles.giua}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  const hop = hopQuery.data;

  if (!hop) {
    /*
      Chỉ 404/403 mới là "không tìm thấy / không có quyền". Mất mạng, hết giờ chờ,
      máy chủ lỗi 5xx thì nói đúng lỗi đó và cho thử lại — trước đây mọi lỗi đều
      thành "không có quyền xem", người dùng tưởng cuộc họp đã bị xoá.
    */
    const loi = hopQuery.error;
    const khongCo =
      !hopQuery.isError ||
      (loi instanceof ApiError && (loi.status === 404 || loi.status === 403));
    return (
      <View style={styles.man}>
        <GradientHeader title={tong.tieuDe} onBack={quayLai} dense />
        <View style={styles.giua}>
          {khongCo ? (
            <ErrorBanner message={t.khongTimThay} />
          ) : (
            <>
              <ErrorBanner message={dichLoi(loi, t.khongTaiDuoc)} />
              <View style={styles.nut}>
                <Button
                  testID="meeting-retry"
                  label={chung.thuLai}
                  variant="secondary"
                  onPress={() => void hopQuery.refetch()}
                  loading={hopQuery.isFetching}
                />
              </View>
            </>
          )}
        </View>
      </View>
    );
  }

  const vaoDuoc = choVaoPhong(hop);

  return (
    <View style={styles.man}>
      <GradientHeader
        title={tong.tieuDe}
        onBack={quayLai}
        dense
      />

      <ScrollView contentContainerStyle={styles.cuon} showsVerticalScrollIndicator={false}>
        {loiMoPhong ? <ErrorBanner message={chuLoi(t, loiMoPhong, dichLoi)} /> : null}

        <Card style={styles.khoi}>
          <Text testID="meeting-status" style={styles.trangThai}>
            {tenTrangThai(hop.status, ngonNgu)}
          </Text>
          <Text testID="meeting-title" style={styles.tieuDe}>
            {hop.title}
          </Text>

          <View style={styles.dong}>
            <Ionicons name="calendar-outline" size={16} color={colors.textMuted} />
            <Text style={styles.dongChu}>{ngayDayDu(hop.startTime, ngonNgu)}</Text>
          </View>
          <View style={styles.dong}>
            <Ionicons name="time-outline" size={16} color={colors.textMuted} />
            <Text style={styles.dongChu}>{khoangGio(hop, ngonNgu)}</Text>
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
                label={t.vaoPhong}
                onPress={() => {
                  setLoiMoPhong(null);
                  moPhong.mutate();
                }}
                loading={moPhong.isPending}
              />
              <Text style={styles.ghiChuNut}>{t.phongMoTrongTrinhDuyet}</Text>
            </View>
          ) : null}
        </Card>

        {hop.agenda ? (
          <Khoi tieuDe={t.noiDungDuKien}>
            <Text style={styles.doanVan}>{hop.agenda}</Text>
          </Khoi>
        ) : null}

        {hop.participants?.length ? (
          <Khoi tieuDe={t.nguoiThamDu(hop.participants.length)}>
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
          <Khoi tieuDe={t.tomTat}>
            <Text style={styles.doanVan}>{hop.summary}</Text>
          </Khoi>
        ) : null}

        {hop.decisions ? (
          <Khoi tieuDe={t.quyetDinh}>
            <Text style={styles.doanVan}>{hop.decisions}</Text>
          </Khoi>
        ) : null}

        {hop.actionItems?.length ? (
          <Khoi tieuDe={t.hangMucHanhDong(hop.actionItems.length)}>
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
          <Text style={styles.ghiChuCuoi}>{t.bienBanTrenWeb}</Text>
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
