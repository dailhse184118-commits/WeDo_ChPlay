import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useDichLoi, useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TextField } from '../../components/ui/TextField';
import { getFeedbackStatus, submitFeedback } from '../../lib/api/feedback';
import { kiemTraDanhGia, soKyTuConLai } from '../../lib/feedback/kiem-tra';
import { colors, fontSize, radius, scale, spacing } from '../../theme/tokens';

function HangSao({
  sao,
  onChon,
  khoa,
}: {
  sao: number;
  onChon: (v: number) => void;
  khoa?: boolean;
}) {
  const t = useTuDien(tuDienTaiKhoan).gopYMan;
  return (
    <View>
      <View style={styles.hangSao}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable
            key={v}
            onPress={() => !khoa && onChon(v)}
            disabled={khoa}
            accessibilityRole="button"
            accessibilityLabel={t.sao(v)}
            testID={`sao-${v}`}
            hitSlop={6}
          >
            <Ionicons
              name={v <= sao ? 'star' : 'star-outline'}
              size={scale(32)}
              color={v <= sao ? colors.warning : colors.border}
            />
          </Pressable>
        ))}
      </View>
      {/* Chữ dưới sao: người dùng biết mình vừa chọn mức nào mà không phải đếm. */}
      <Text style={styles.nhanSao}>{sao > 0 ? t.nhanSao[sao - 1] : t.chamDeChon}</Text>
    </View>
  );
}

/**
 * Lỗi đang hiện, giữ ở dạng NGUỒN để dịch lúc vẽ. `kiem-tra` giữ lại đúng số sao và
 * nội dung vừa bị từ chối (người dùng sửa tiếp thì câu báo vẫn là của lần bấm đó).
 */
type LoiGopY = { kieu: 'kiem-tra'; sao: number; noiDung: string } | { kieu: 'gui'; loi: unknown };

export default function ManGopY() {
  const router = useRouter();
  const t = useTuDien(tuDienTaiKhoan).gopYMan;
  const dichLoi = useDichLoi();
  const { ngonNgu } = useNgonNgu();
  const queryClient = useQueryClient();

  const [sao, setSao] = useState(0);
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState<LoiGopY | null>(null);

  /*
    Đọc `/feedback/status`, không phải `/feedback/mine`: chỉ lượt này biết quản
    trị đã mở khoá cho gửi lại. Trước đây thấy bản cũ là hiện thẻ khoá và bảo
    người dùng nhắn đội ngũ — trong khi đội ngũ đã mở rồi.
  */
  const trangThai = useQuery({ queryKey: ['feedback-status'], queryFn: getFeedbackStatus });

  /*
    Được mở khoá để sửa thì điền sẵn bản cũ: người dùng thường chỉ muốn chỉnh
    vài chữ hay đổi số sao, không muốn gõ lại từ đầu.
  */
  const banCu = trangThai.data?.canSubmit ? trangThai.data.feedback : null;
  useEffect(() => {
    if (!banCu) return;
    setSao(banCu.rating);
    setNoiDung(banCu.comment);
    // react-query giữ nguyên tham chiếu khi dữ liệu không đổi, nên nạp lại không ghi đè chữ đang sửa.
  }, [banCu]);

  const gui = useMutation({
    mutationFn: () => submitFeedback(sao, noiDung.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback-status'] });
      void queryClient.invalidateQueries({ queryKey: ['feedback-mine'] });
      setLoi(null);
    },
    onError: (e) => setLoi({ kieu: 'gui', loi: e }),
  });

  const bam = () => {
    if (kiemTraDanhGia(sao, noiDung, ngonNgu)) {
      setLoi({ kieu: 'kiem-tra', sao, noiDung });
      return;
    }
    setLoi(null);
    gui.mutate();
  };

  const conLai = soKyTuConLai(noiDung);
  const loiChu = !loi
    ? ''
    : loi.kieu === 'kiem-tra'
      ? (kiemTraDanhGia(loi.sao, loi.noiDung, ngonNgu) ?? '')
      : dichLoi(loi.loi, t.khongGuiDuoc);
  // Thẻ "đã gửi" chỉ khi máy chủ nói CÒN KHOÁ.
  const cu = trangThai.data?.locked ? trangThai.data.feedback : null;

  return (
    <View style={styles.man}>
      <GradientHeader title={t.tieuDe} onBack={() => router.back()} dense />

      <ScrollView
        style={styles.than}
        contentContainerStyle={styles.thanNoiDung}
        keyboardShouldPersistTaps="handled"
      >
        {/*
          Chưa biết còn khoá hay không thì chờ — hiện form trước là để người dùng
          gõ dở rồi mới bị thay bằng thẻ khoá.
        */}
        {trangThai.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : cu ? (
          /*
            Đã gửi rồi thì hiện lại bản cũ thay vì form trống. Máy chủ chỉ cho
            mỗi người một lượt; đưa form trống ra là mời người dùng gõ một đoạn
            dài rồi mới báo bị khoá.
          */
          <View style={styles.daGuiHop}>
            <Text style={styles.daGuiTieuDe}>{t.daGuiTieuDe}</Text>
            <HangSao sao={cu.rating} onChon={() => {}} khoa />
            <Text style={styles.daGuiNoiDung}>{cu.comment}</Text>
            <Text style={styles.daGuiPhu}>{t.daGuiPhu}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.moiGoi}>{t.moiGoi}</Text>

            {loiChu ? <ErrorBanner message={loiChu} /> : null}

            <HangSao sao={sao} onChon={setSao} />

            <TextField
              label={t.dieuMuonNoi}
              value={noiDung}
              onChangeText={setNoiDung}
              placeholder={t.goiYNoiDung}
              multiline
              testID="o-noi-dung"
            />
            <Text style={[styles.demChu, conLai < 0 && styles.demChuVuot]}>
              {t.conLai(conLai)}
            </Text>

            <Button
              label={t.gui}
              onPress={bam}
              loading={gui.isPending}
              testID="nut-gui-gop-y"
            />
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
  moiGoi: { fontSize: fontSize.sm, color: colors.textMuted, lineHeight: fontSize.sm * 1.6 },
  hangSao: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  nhanSao: {
    textAlign: 'center',
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  demChu: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  demChuVuot: { color: colors.danger },
  daGuiHop: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  daGuiTieuDe: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  daGuiNoiDung: { fontSize: fontSize.sm, color: colors.text, lineHeight: fontSize.sm * 1.6 },
  daGuiPhu: { fontSize: fontSize.xs, color: colors.textMuted, lineHeight: fontSize.xs * 1.6 },
});
