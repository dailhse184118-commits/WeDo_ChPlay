import React, { useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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
  const [loi, setLoi] = useState<string | null>(null);

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
      setLoi(cauLoiDongBoLich(e));
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
    onError: (e) => setLoi(cauLoiDongBoLich(e)),
  });

  const chiaSe = async (url: string) => {
    setLoi(null);
    try {
      // Android chỉ đọc `message`; `title` là tiêu đề của bảng chia sẻ.
      await Share.share({ title: 'Link lịch WeDo', message: url });
    } catch (e) {
      setLoi(cauLoiDongBoLich(e));
    }
  };

  const hoiTaoLinkMoi = () => {
    Alert.alert(
      'Tạo link mới?',
      'Link đang dùng sẽ ngừng chạy ngay. Lịch nào đã thêm link cũ sẽ không cập nhật nữa, bạn phải thêm lại bằng link mới.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Tạo link mới', style: 'destructive', onPress: () => tao.mutate() },
      ],
    );
  };

  const hoiTatDongBo = () => {
    Alert.alert(
      'Tắt đồng bộ lịch?',
      'Link sẽ ngừng chạy ngay. Lịch đã thêm không nhận thêm thay đổi nào từ WeDo; bạn có thể xoá lịch đó trong ứng dụng lịch.',
      [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Tắt đồng bộ', style: 'destructive', onPress: () => tat.mutate() },
      ],
    );
  };

  const duLieu = trangThai.data;
  const dangBan = tao.isPending || tat.isPending;

  return (
    <View style={styles.man}>
      <GradientHeader
        title="Đồng bộ lịch"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      <ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>
        <Text style={styles.gioiThieu}>
          Hạn chót việc bạn đã nhận, cuộc họp và sự kiện của bạn trên WeDo tự hiện trong Google
          Calendar, Lịch Apple hoặc Outlook, và tự cập nhật.
        </Text>

        {loi ? <ErrorBanner message={loi} /> : null}

        {trangThai.isPending ? (
          <ActivityIndicator testID="dong-bo-lich-dang-tai" color={colors.primary} />
        ) : !duLieu ? (
          <>
            <ErrorBanner message={cauLoiDongBoLich(trangThai.error)} />
            <Button
              label="Thử lại"
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
              <Text style={styles.theChu}>
                Tính năng của gói Pro và Team.
              </Text>
            </View>
            {/* Gói hết hạn khi link còn: vẫn cho tắt hẳn link. */}
            {duLieu.coLink ? (
              <Button
                label="Tắt đồng bộ"
                variant="danger"
                onPress={hoiTatDongBo}
                loading={tat.isPending}
                testID="nut-tat-dong-bo-lich"
              />
            ) : null}
          </>
        ) : !duLieu.coLink || !duLieu.url ? (
          <Button
            label="Tạo link đồng bộ"
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
  return (
    <>
      <View style={styles.the}>
        <Text style={styles.nhan}>Link của bạn</Text>
        <Text selectable style={styles.link} testID="link-dong-bo-lich">
          {url}
        </Text>
        <Button label="Chia sẻ link" onPress={onChiaSe} testID="nut-chia-se-link-lich" />
        <Text style={styles.canhBao}>
          Ai có link này đều xem được lịch của bạn. Chỉ gửi cho chính bạn; lỡ gửi nhầm thì bấm Tạo link
          mới.
        </Text>
      </View>

      <View style={styles.the}>
        <Text style={styles.nhan}>Thêm vào lịch</Text>

        <Text style={styles.buocTieuDe}>Google Calendar</Text>
        <Text style={styles.buoc}>
          Ứng dụng Google Calendar trên điện thoại không thêm được lịch bằng link. Chia sẻ link sang máy
          tính, mở calendar.google.com, chọn “Thêm lịch → Từ URL” rồi dán link. Sau đó lịch tự
          hiện cả trên điện thoại.
        </Text>

        <Text style={styles.buocTieuDe}>Lịch Apple (máy Mac, iPhone)</Text>
        <Text style={styles.buoc}>Gửi link sang máy đó rồi mở link webcal dưới đây, chọn Đăng ký:</Text>
        <Text selectable style={styles.link} testID="link-webcal">
          {linkWebcal(url)}
        </Text>

        <Text style={styles.buocTieuDe}>Outlook</Text>
        <Text style={styles.buoc}>
          Trên outlook.com, chọn “Thêm lịch → Đăng ký từ web” rồi dán link.
        </Text>

        <Text style={styles.phu}>
          Google cập nhật lịch vài giờ một lần; Lịch Apple và Outlook khoảng mỗi giờ.
        </Text>
      </View>

      <Text style={styles.phu} testID="lan-cuoi-lay-lich">
        {layLanCuoi
          ? `Lần cuối lịch của bạn lấy dữ liệu: ${hienThiHanMoi(layLanCuoi)}`
          : 'Chưa có ứng dụng lịch nào lấy dữ liệu từ link này.'}
      </Text>

      <Button
        label="Tạo link mới"
        variant="secondary"
        onPress={onTaoLinkMoi}
        loading={dangTao}
        disabled={dangBan}
        testID="nut-tao-link-moi-lich"
      />
      <Button
        label="Tắt đồng bộ"
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
