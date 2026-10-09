import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';

import { useDichLoi, useTuDien } from '../../../i18n/NgonNguProvider';
import { tuDienTaiKhoan } from '../../../i18n/tu-dien/tai-khoan';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../components/ui/GradientHeader';
import { XuatBaoCao } from '../../../components/dong-gop/XuatBaoCao';
import { getContributions, type DongGopThanhVien } from '../../../lib/api/tasks';
import { useQuayLai } from '../../../lib/use-quay-lai';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

function O({ so, nhan }: { so: number | string; nhan: string }) {
  return (
    <View style={styles.o}>
      <Text style={styles.oSo}>{so}</Text>
      <Text style={styles.oNhan}>{nhan}</Text>
    </View>
  );
}

function The({ nguoi, hang }: { nguoi: DongGopThanhVien; hang: number }) {
  const t = useTuDien(tuDienTaiKhoan).dongGop;
  const ten = nguoi.user?.fullName || nguoi.user?.email || t.khongRo;

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
          {nguoi.tyLeDungHanPhanTram === null ? '—' : t.tyLe(nguoi.tyLeDungHanPhanTram)}
        </Text>
      </View>

      <View style={styles.hangO}>
        <O so={nguoi.hoanThanh} nhan={t.hoanThanh} />
        <O so={nguoi.chuaXong} nhan={t.chuaXong} />
        <O so={nguoi.treHan} nhan={t.treHan} />
        <O so={nguoi.daNop} nhan={t.daNop} />
      </View>

      {nguoi.biTraLai > 0 ? (
        <Text style={styles.traLai}>{t.biTraLai(nguoi.biTraLai)}</Text>
      ) : null}
    </View>
  );
}

/**
 * Số người hiện sẵn trên mobile.
 *
 * Nhóm sinh viên thường 5–8 người, nhưng workspace lớn có thể vài chục. Đổ hết
 * ra một màn hình dọc thì thành danh sách dài lê thê mà chẳng ai đọc tới cuối —
 * ba người đầu đã trả lời xong câu hỏi "ai đang gánh".
 */
const SO_NGUOI_HIEN_SAN = 3;

export default function ManDongGop() {
  const router = useRouter();
  /* Lối vào duy nhất là màn Tài khoản — không dùng `router.back()`, xem `useQuayLai`. */
  const quayLai = useQuayLai(useCallback(() => router.navigate('/account'), [router]));
  const t = useTuDien(tuDienTaiKhoan).dongGop;
  const dichLoi = useDichLoi();
  const { active } = useWorkspace();
  const [xemHet, setXemHet] = useState(false);

  const bang = useQuery({
    queryKey: ['contributions', active?.id],
    queryFn: () => getContributions(active!.id),
    enabled: Boolean(active?.id),
  });

  return (
    <View style={styles.man}>
      <GradientHeader
        title={t.tieuDe}
        subtitle={active?.name}
        onBack={quayLai}
        dense
      />

      <ScrollView style={styles.than} contentContainerStyle={styles.thanNoiDung}>
        {/*
          Đặt trên cùng: bảng bên dưới là của cả không gian làm việc, còn báo
          cáo xuất theo từng dự án — người dùng chọn dự án ngay trong khối.
        */}
        {active?.id ? <XuatBaoCao workspaceId={active.id} /> : null}
        {/*
          Chỉ báo lỗi to khi KHÔNG có gì để xem. Còn dữ liệu cũ trong cache thì
          lần gọi hỏng không chặn đường.
        */}
        {bang.isError && !bang.data ? (
          <ErrorBanner message={dichLoi(bang.error, t.khongTaiDuoc)} />
        ) : null}

        {bang.isError && bang.data ? (
          <Text style={styles.ngoaiTuyen}>{t.ngoaiTuyen}</Text>
        ) : null}

        {bang.isLoading ? (
          <View style={styles.giua}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : bang.isError && !bang.data ? null : (bang.data?.thanhVien.length ?? 0) === 0 ? (
          /*
            Chỉ nói "chưa có việc nào" khi máy chủ THẬT SỰ trả về danh sách rỗng.
            Trước đây nhánh này còn nuốt cả trường hợp lỗi, nên mất mạng lại báo
            là nhóm chưa giao việc cho ai — sai hoàn toàn và làm người dùng hoang
            mang về dữ liệu của chính mình.
          */
          <Text style={styles.trong}>{t.trong}</Text>
        ) : (
          <>
            <Text style={styles.moDau}>{t.moDau}</Text>

            {(xemHet
              ? bang.data!.thanhVien
              : bang.data!.thanhVien.slice(0, SO_NGUOI_HIEN_SAN)
            ).map((nguoi, i) => (
              <The key={nguoi.userId} nguoi={nguoi} hang={i + 1} />
            ))}

            {!xemHet && bang.data!.thanhVien.length > SO_NGUOI_HIEN_SAN ? (
              <Pressable onPress={() => setXemHet(true)} style={styles.nutPhu}>
                <Text style={styles.nutPhuChu}>
                  {t.xemThem(bang.data!.thanhVien.length - SO_NGUOI_HIEN_SAN)}
                </Text>
              </Pressable>
            ) : null}

            {/*
              Từng có nút "Xem đầy đủ trên web" ở đây, mở #/contributions. Trang
              đó là màn Cài đặt của web: ngay cạnh tab Bảng đóng góp là tab "Quản
              lý gói và thanh toán", thanh bên có "Nâng cấp gói" — một lối dẫn
              ra trang mua ngoài Google Play Billing (nhánh ios đã ẩn vì đúng lý
              do này với App Store). Bỏ trên mọi nền tảng; `duongDanWeb` giờ chỉ
              cho mở các trang tĩnh trong danh sách cho phép.
            */}
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
  ngoaiTuyen: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
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
  nutPhu: { alignItems: 'center', paddingVertical: spacing.sm },
  nutPhuChu: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '500' },
});
