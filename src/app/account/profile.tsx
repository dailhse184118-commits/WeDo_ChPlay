import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';

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

  const [hoTen, setHoTen] = useState(user?.fullName ?? '');
  const [soDienThoai, setSoDienThoai] = useState(user?.phone ?? '');
  const [ngaySinh, setNgaySinh] = useState(() => hienThiNgaySinh(user?.dob));

  const [loiHoTen, setLoiHoTen] = useState<string | null>(null);
  const [loiNgaySinh, setLoiNgaySinh] = useState<string | null>(null);
  const [loiChung, setLoiChung] = useState<string | null>(null);
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
      setLoiChung(loi instanceof Error ? loi.message : 'Không lưu được thay đổi.');
    },
  });

  function bamLuu() {
    setLoiChung(null);
    setDaLuu(false);

    const ten = hoTen.trim();
    if (!ten) {
      setLoiHoTen('Họ và tên không được để trống.');
      return;
    }
    setLoiHoTen(null);

    const ngay = doiNgaySinhSangMayChu(ngaySinh);
    if (ngay.loi) {
      setLoiNgaySinh(ngay.loi);
      return;
    }
    setLoiNgaySinh(null);

    luu.mutate({ fullName: ten, phone: soDienThoai.trim(), dob: ngay.giaTri });
  }

  return (
    <View style={styles.screen}>
      <GradientHeader
        title="Thông tin cá nhân"
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/account'))}
        dense
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loiChung ? <ErrorBanner message={loiChung} /> : null}

        <Card style={styles.the}>
          {/*
            Email hiện ra nhưng không sửa được: nó là thứ dùng để đăng nhập và
            nhận mã đặt lại mật khẩu. Giấu hẳn đi thì người dùng không biết
            mình đang sửa hồ sơ của tài khoản nào.
          */}
          <Text style={styles.nhanEmail}>Email đăng nhập</Text>
          <Text testID="profile-email" style={styles.email}>
            {user?.email ?? ''}
          </Text>
          <Text style={styles.ghiChuEmail}>Không đổi được email.</Text>
        </Card>

        <Card style={styles.the}>
          <TextField
            testID="profile-fullname"
            label="Họ và tên"
            value={hoTen}
            onChangeText={(giaTri) => {
              setHoTen(giaTri);
              setLoiHoTen(null);
              setDaLuu(false);
            }}
            placeholder="Nguyễn Văn A"
            autoCapitalize="words"
            error={loiHoTen ?? undefined}
          />

          <TextField
            testID="profile-phone"
            label="Số điện thoại"
            value={soDienThoai}
            onChangeText={(giaTri) => {
              setSoDienThoai(giaTri);
              setDaLuu(false);
            }}
            placeholder="Không bắt buộc"
            keyboardType="phone-pad"
          />

          <TextField
            testID="profile-dob"
            label={`Ngày sinh (${DINH_DANG_NGAY})`}
            value={ngaySinh}
            /*
              Tự chèn dấu gạch trong lúc gõ. Bắt người dùng tự gõ dấu `/` trên
              bàn phím số là bắt họ chuyển bàn phím hai lần cho một ngày.
            */
            onChangeText={(giaTri) => {
              setNgaySinh(tuThemDauGach(giaTri));
              setLoiNgaySinh(null);
              setDaLuu(false);
            }}
            placeholder="14/08/2004"
            keyboardType="number-pad"
            error={loiNgaySinh ?? undefined}
          />

          <Text style={styles.ghiChu}>
            Để trống ngày sinh nếu bạn không muốn lưu.
          </Text>
        </Card>

        {daLuu ? (
          <Text testID="profile-saved" style={styles.daLuu}>
            Đã lưu thay đổi.
          </Text>
        ) : null}

        <Button
          testID="profile-save"
          label="Lưu thay đổi"
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
