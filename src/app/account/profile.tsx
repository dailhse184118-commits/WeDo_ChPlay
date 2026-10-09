import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TextField } from '../../components/ui/TextField';
import { capNhatThongTinCaNhan } from '../../lib/api/account';
import { useAuth } from '../../lib/auth/auth-context';
import {
  DINH_DANG_NGAY,
  doiNgaySinhSangMayChu,
  hienThiNgaySinh,
  tuThemDauGach,
} from '../../lib/ngay-sinh';
import { colors, fontSize, lineHeight, spacing } from '../../theme/tokens';

/**
 * Sửa họ tên, số điện thoại và ngày sinh.
 *
 * Ảnh đại diện KHÔNG nằm ở đây — nó đổi bằng một cú chạm vào thẻ danh tính ở
 * màn Tài khoản, và đó là chỗ người dùng tìm tới. Kéo nó vào màn này là bắt
 * người ta đi thêm hai bước cho một việc vốn chỉ một bước.
 */
export default function ManThongTinCaNhan() {
  const router = useRouter();
  const { user, capNhatHoSo } = useAuth();
  const t = useTuDien(tuDienTaiKhoan).hoSo;
  const dichLoi = useDichLoi();
  const { ngonNgu } = useNgonNgu();

  const [hoTen, setHoTen] = useState(user?.fullName ?? '');
  const [soDienThoai, setSoDienThoai] = useState(user?.phone ?? '');
  const [ngaySinh, setNgaySinh] = useState(() => hienThiNgaySinh(user?.dob));

  /*
    Lỗi giữ ở dạng nguồn, dịch lúc vẽ để đổi ngôn ngữ giữa chừng thì câu báo đổi theo.
    Ô ngày sinh: cờ "đang lỗi" thôi, câu cụ thể tính lại từ chính nội dung ô (ô bị sửa
    thì cờ được xoá, nên nội dung vẫn là thứ vừa bị từ chối).
  */
  const [loiHoTen, setLoiHoTen] = useState(false);
  const [loiNgaySinh, setLoiNgaySinh] = useState(false);
  const [loiChung, setLoiChung] = useState<NguonLoi<'khongLuuDuoc'> | null>(null);
  const [daLuu, setDaLuu] = useState(false);

  /*
    Nút Lưu chỉ sáng khi thật sự có gì đó khác đi. Người dùng mở màn hình ra
    xem rồi bấm Lưu theo phản xạ là một lượt gọi máy chủ thừa, và tệ hơn: nó
    hiện "Đã lưu" cho một việc chẳng xảy ra.
  */
  const coThayDoi = useMemo(() => {
    return (
      hoTen.trim() !== (user?.fullName ?? '').trim() ||
      soDienThoai.trim() !== (user?.phone ?? '').trim() ||
      ngaySinh.trim() !== hienThiNgaySinh(user?.dob)
    );
  }, [hoTen, soDienThoai, ngaySinh, user]);

  const luu = useMutation({
    mutationFn: capNhatThongTinCaNhan,
    onSuccess: (hoSoMoi) => {
      capNhatHoSo(hoSoMoi);
      /*
        Nạp lại ô từ chính thứ máy chủ trả về, không giữ nguyên thứ người dùng
        vừa gõ. Nếu máy chủ chuẩn hoá khác đi — cắt khoảng trắng, đổi định dạng
        ngày — thì màn hình phải hiện ra sự thật đang được lưu.
      */
      setHoTen(hoSoMoi.fullName ?? '');
      setSoDienThoai(hoSoMoi.phone ?? '');
      setNgaySinh(hienThiNgaySinh(hoSoMoi.dob));
      setDaLuu(true);
    },
    onError: (loi: unknown) => {
      setDaLuu(false);
      setLoiChung({ loi, duPhong: 'khongLuuDuoc' });
    },
  });

  function bamLuu() {
    setLoiChung(null);
    setDaLuu(false);

    const ten = hoTen.trim();
    if (!ten) {
      setLoiHoTen(true);
      return;
    }
    setLoiHoTen(false);

    const ngay = doiNgaySinhSangMayChu(ngaySinh, ngonNgu);
    if (ngay.loi) {
      setLoiNgaySinh(true);
      return;
    }
    setLoiNgaySinh(false);

    luu.mutate({ fullName: ten, phone: soDienThoai.trim(), dob: ngay.giaTri });
  }

  return (
    <View style={styles.screen}>
      <GradientHeader
        title={t.tieuDe}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loiChung ? <ErrorBanner message={chuLoi(t, loiChung, dichLoi)} /> : null}

        <Card style={styles.the}>
          {/*
            Email hiện ra nhưng không sửa được: nó là thứ dùng để đăng nhập và
            nhận mã đặt lại mật khẩu. Giấu hẳn đi thì người dùng không biết
            mình đang sửa hồ sơ của tài khoản nào.
          */}
          <Text style={styles.nhanEmail}>{t.emailDangNhap}</Text>
          <Text testID="profile-email" style={styles.email}>
            {user?.email ?? ''}
          </Text>
          <Text style={styles.ghiChuEmail}>{t.khongDoiEmail}</Text>
        </Card>

        <Card style={styles.the}>
          <TextField
            testID="profile-fullname"
            label={t.hoTen}
            value={hoTen}
            onChangeText={(giaTri) => {
              setHoTen(giaTri);
              setLoiHoTen(false);
              setDaLuu(false);
            }}
            placeholder={t.hoTenMau}
            autoCapitalize="words"
            error={loiHoTen ? t.hoTenTrong : undefined}
          />

          <TextField
            testID="profile-phone"
            label={t.soDienThoai}
            value={soDienThoai}
            onChangeText={(giaTri) => {
              setSoDienThoai(giaTri);
              setDaLuu(false);
            }}
            placeholder={t.khongBatBuoc}
            keyboardType="phone-pad"
          />

          <TextField
            testID="profile-dob"
            label={t.ngaySinh(DINH_DANG_NGAY)}
            value={ngaySinh}
            /*
              Tự chèn dấu gạch trong lúc gõ. Bắt người dùng tự gõ dấu `/` trên
              bàn phím số là bắt họ chuyển bàn phím hai lần cho một ngày.
            */
            onChangeText={(giaTri) => {
              setNgaySinh(tuThemDauGach(giaTri));
              setLoiNgaySinh(false);
              setDaLuu(false);
            }}
            placeholder={t.ngaySinhMau}
            keyboardType="number-pad"
            error={loiNgaySinh ? (doiNgaySinhSangMayChu(ngaySinh, ngonNgu).loi ?? undefined) : undefined}
          />

          <Text style={styles.ghiChu}>{t.ghiChuNgaySinh}</Text>
        </Card>

        {daLuu ? (
          <Text testID="profile-saved" style={styles.daLuu}>
            {t.daLuu}
          </Text>
        ) : null}

        <Button
          testID="profile-save"
          label={t.luu}
          onPress={bamLuu}
          disabled={!coThayDoi}
          loading={luu.isPending}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.page },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  the: { marginBottom: spacing.md },
  nhanEmail: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  email: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  ghiChuEmail: {
    marginTop: spacing.xs,
    fontSize: fontSize.xs,
    color: colors.textMuted,
  },
  ghiChu: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    lineHeight: lineHeight.xs,
  },
  daLuu: {
    marginBottom: spacing.md,
    textAlign: 'center',
    fontSize: fontSize.sm,
    color: colors.success,
    fontWeight: '600',
  },
});
