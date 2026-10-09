import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienDongBoLich } from '../../i18n/tu-dien/dong-bo-lich';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { ApiError } from '../../lib/api/client';
import {
  cauLoiDongBoLich,
  layDongBoLich,
  taoLinkDongBoLich,
  tatDongBoLich,
  type TrangThaiDongBoLich,
} from '../../lib/api/dong-bo-lich';
import { hienThiHanMoi } from '../../lib/loi-moi';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

const KHOA_TRANG_THAI = ['calendar-feed'] as const;

/** Lịch Apple và Outlook trên máy tính mở `webcal:` thẳng vào hộp thoại đăng ký lịch. */
function linkWebcal(url: string): string {
  return url.replace(/^https?:/i, 'webcal:');
}

/**
 * Màn "Đồng bộ lịch" (Tài khoản → Đồng bộ lịch).
 *
 * Đặt ở `src/app/account/` chứ không trong nhóm `(tabs)`: màn KHÔNG gọi
 * `useWorkspace()` — link là của cả người, gộp mọi workspace — nên nằm trên
 * ngăn xếp gốc như Thông tin cá nhân hay Góp ý, và `router.back()` về đúng
 * màn Tài khoản.
 */
export default function ManDongBoLich() {
  /*
    App iPhone luôn tính là gói Miễn phí (Apple 3.1.1) nên tính năng ẩn hẳn
    trên iPhone. Hàng ở màn Tài khoản đã ẩn; lỡ vào bằng đường dẫn thì quay về
    Tài khoản ngay, không gọi máy chủ, không vẽ gì.
  */
  if (Platform.OS === 'ios') return <Redirect href="/account" />;
  return <NoiDungDongBoLich />;
}

function NoiDungDongBoLich() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const t = useTuDien(tuDienDongBoLich);
  const { ngonNgu } = useNgonNgu();
  /* Giữ lỗi gốc, dịch lúc vẽ: đổi ngôn ngữ giữa chừng thì băng đỏ đổi theo. */
  const [loi, setLoi] = useState<{ nguon: unknown } | null>(null);

  /*
    Link là "chìa khoá" đọc lịch: không ghi xuống máy, và rời màn là bỏ khỏi bộ
    nhớ (`gcTime: 0`). Nhờ vậy mở lại lúc mất mạng sẽ báo lỗi thay vì hiện một
    link cũ có thể đã bị đổi trên web.
  */
  const trangThai = useQuery({
    queryKey: KHOA_TRANG_THAI,
    queryFn: layDongBoLich,
    gcTime: 0,
    meta: { luuXuongMay: false },
  });

  const tao = useMutation({
    mutationFn: () => taoLinkDongBoLich(),
    onMutate: () => setLoi(null),
    onSuccess: (moi) => queryClient.setQueryData(KHOA_TRANG_THAI, moi),
    onError: (e) => {
      setLoi({ nguon: e });
      // Gói vừa hết hạn giữa chừng: nạp lại để màn chuyển sang câu giới thiệu gói, không kẹt ở nút Tạo link.
      if (e instanceof ApiError && e.status === 403) {
        void queryClient.invalidateQueries({ queryKey: KHOA_TRANG_THAI });
      }
    },
  });

  const tat = useMutation({
    mutationFn: () => tatDongBoLich(),
    onMutate: () => setLoi(null),
    onSuccess: () =>
      queryClient.setQueryData<TrangThaiDongBoLich>(KHOA_TRANG_THAI, (cu) => ({
        duocDung: cu?.duocDung ?? true,
        coLink: false,
      })),
    onError: (e) => setLoi({ nguon: e }),
  });

  const chiaSe = async (url: string) => {
    setLoi(null);
    try {
      // Android chỉ đọc `message`; `title` là tiêu đề của bảng chia sẻ.
      await Share.share({ title: t.linkCuaBan.tieuDeChiaSe, message: url });
    } catch (e) {
      setLoi({ nguon: e });
    }
  };

  const hoiTaoLinkMoi = () => {
    Alert.alert(t.hoiTaoLinkMoi.tieuDe, t.hoiTaoLinkMoi.noiDung, [
      { text: t.hoiTaoLinkMoi.huy, style: 'cancel' },
      { text: t.hoiTaoLinkMoi.xacNhan, style: 'destructive', onPress: () => tao.mutate() },
    ],
    );
  };

  const hoiTatDongBo = () => {
    Alert.alert(t.hoiTatDongBo.tieuDe, t.hoiTatDongBo.noiDung, [
      { text: t.hoiTatDongBo.huy, style: 'cancel' },
      { text: t.hoiTatDongBo.xacNhan, style: 'destructive', onPress: () => tat.mutate() },
    ],
    );
  };

  const duLieu = trangThai.data;
  const dangBan = tao.isPending || tat.isPending;

  return (
    <View style={styles.man}>
      <GradientHeader
        title={t.tieuDe}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      <ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>
        <Text style={styles.gioiThieu}>{t.gioiThieu}</Text>

        {loi ? <ErrorBanner message={cauLoiDongBoLich(loi.nguon, ngonNgu)} /> : null}

        {trangThai.isPending ? (
          <ActivityIndicator testID="dong-bo-lich-dang-tai" color={colors.primary} />
        ) : !duLieu ? (
          <>
            <ErrorBanner message={cauLoiDongBoLich(trangThai.error, ngonNgu)} />
            <Button
              label={t.thuLai}
              variant="secondary"
              onPress={() => void trangThai.refetch()}
              testID="nut-thu-lai-dong-bo-lich"
            />
          </>
        ) : !duLieu.duocDung ? (
          <>
            {/*
              Chỉ một câu chữ, KHÔNG có nút mua hay link sang trang giá: chính
              sách Google Play cấm dẫn người dùng ra ngoài để mua hàng hoá số
              (xem `src/lib/web-link.ts`).
            */}
            <View style={styles.the}>
              <Text style={styles.theChu}>{t.tinhNangGoiPro}</Text>
            </View>
            {/* Gói hết hạn khi link còn: vẫn cho tắt hẳn link. */}
            {duLieu.coLink ? (
              <Button
                label={t.tatDongBo}
                variant="danger"
                onPress={hoiTatDongBo}
                loading={tat.isPending}
                testID="nut-tat-dong-bo-lich"
              />
            ) : null}
          </>
        ) : !duLieu.coLink || !duLieu.url ? (
          <Button
            label={t.taoLinkDongBo}
            onPress={() => tao.mutate()}
            loading={tao.isPending}
            testID="nut-tao-link-dong-bo-lich"
          />
        ) : (
          <CoLink
            url={duLieu.url}
            layLanCuoi={duLieu.layLanCuoi ?? null}
            onChiaSe={() => void chiaSe(duLieu.url!)}
            onTaoLinkMoi={hoiTaoLinkMoi}
            onTat={hoiTatDongBo}
            dangTao={tao.isPending}
            dangTat={tat.isPending}
            dangBan={dangBan}
          />
        )}
      </ScrollView>
    </View>
  );
}

interface CoLinkProps {
  url: string;
  layLanCuoi: string | null;
  onChiaSe: () => void;
  onTaoLinkMoi: () => void;
  onTat: () => void;
  dangTao: boolean;
  dangTat: boolean;
  dangBan: boolean;
}

function CoLink({ url, layLanCuoi, onChiaSe, onTaoLinkMoi, onTat, dangTao, dangTat, dangBan }: CoLinkProps) {
  const t = useTuDien(tuDienDongBoLich);
  const { ngonNgu } = useNgonNgu();
  return (
    <>
      <View style={styles.the}>
        <Text style={styles.nhan}>{t.linkCuaBan.tieuDe}</Text>
        <Text selectable style={styles.link} testID="link-dong-bo-lich">
          {url}
        </Text>
        <Button label={t.linkCuaBan.chiaSe} onPress={onChiaSe} testID="nut-chia-se-link-lich" />
        <Text style={styles.canhBao}>{t.linkCuaBan.canhBao}</Text>
      </View>

      <View style={styles.the}>
        <Text style={styles.nhan}>{t.themVaoLich.tieuDe}</Text>

        <Text style={styles.buocTieuDe}>{t.themVaoLich.googleTieuDe}</Text>
        <Text style={styles.buoc}>{t.themVaoLich.googleBuoc}</Text>

        <Text style={styles.buocTieuDe}>{t.themVaoLich.appleTieuDe}</Text>
        <Text style={styles.buoc}>{t.themVaoLich.appleBuoc}</Text>
        <Text selectable style={styles.link} testID="link-webcal">
          {linkWebcal(url)}
        </Text>

        <Text style={styles.buocTieuDe}>{t.themVaoLich.outlookTieuDe}</Text>
        <Text style={styles.buoc}>{t.themVaoLich.outlookBuoc}</Text>

        <Text style={styles.phu}>{t.themVaoLich.tanSuat}</Text>
      </View>

      <Text style={styles.phu} testID="lan-cuoi-lay-lich">
        {layLanCuoi
          ? t.lanCuoi(hienThiHanMoi(layLanCuoi, ngonNgu))
          : t.chuaLayLanNao}
      </Text>

      <Button
        label={t.taoLinkMoi}
        variant="secondary"
        onPress={onTaoLinkMoi}
        loading={dangTao}
        disabled={dangBan}
        testID="nut-tao-link-moi-lich"
      />
      <Button
        label={t.tatDongBo}
        variant="danger"
        onPress={onTat}
        loading={dangTat}
        disabled={dangBan}
        testID="nut-tat-dong-bo-lich"
      />
    </>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.background },
  than: { flex: 1 },
  thanNoiDung: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  gioiThieu: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.6 },
  the: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  theChu: { fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.6 },
  nhan: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  link: {
    fontSize: fontSize.xs,
    color: colors.primary,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  canhBao: { fontSize: fontSize.xs, color: colors.warningText, lineHeight: fontSize.xs * 1.6 },
  buocTieuDe: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text, marginTop: spacing.xs },
  buoc: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
  phu: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
});
