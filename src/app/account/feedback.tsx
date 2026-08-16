import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { GradientHeader } from '../../components/ui/GradientHeader';
import { TextField } from '../../components/ui/TextField';
import { getMyFeedback, submitFeedback } from '../../lib/api/feedback';
import { kiemTraDanhGia, soKyTuConLai } from '../../lib/feedback/kiem-tra';
import { colors, fontSize, radius, scale, spacing } from '../../theme/tokens';

const NHAN_SAO = ['', 'Rất tệ', 'Tệ', 'Tạm được', 'Tốt', 'Rất tốt'];

function HangSao({
  sao,
  onChon,
  khoa,
}: {
  sao: number;
  onChon: (v: number) => void;
  khoa?: boolean;
}) {
  return (
    <View>
      <View style={styles.hangSao}>
        {[1, 2, 3, 4, 5].map((v) => (
          <Pressable
            key={v}
            onPress={() => !khoa && onChon(v)}
            disabled={khoa}
            accessibilityRole="button"
            accessibilityLabel={`${v} sao`}
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
      <Text style={styles.nhanSao}>{sao > 0 ? NHAN_SAO[sao] : 'Chạm để chọn sao'}</Text>
    </View>
  );
}

export default function ManGopY() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [sao, setSao] = useState(0);
  const [noiDung, setNoiDung] = useState('');
  const [loi, setLoi] = useState<string | null>(null);

  const daGui = useQuery({ queryKey: ['feedback-mine'], queryFn: getMyFeedback });

  const gui = useMutation({
    mutationFn: () => submitFeedback(sao, noiDung.trim()),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['feedback-mine'] });
      setLoi(null);
    },
    onError: (e) =>
      setLoi(e instanceof Error ? e.message : 'Không gửi được đánh giá.'),
  });

  const bam = () => {
    const loiKiemTra = kiemTraDanhGia(sao, noiDung);
    if (loiKiemTra) {
      setLoi(loiKiemTra);
      return;
    }
    setLoi(null);
    gui.mutate();
  };

  const conLai = soKyTuConLai(noiDung);
  const cu = daGui.data;

  return (
    <View style={styles.man}>
      <GradientHeader title="Góp ý cho WeDo" onBack={() => router.back()} dense />

      <ScrollView
        style={styles.than}
        contentContainerStyle={styles.thanNoiDung}
        keyboardShouldPersistTaps="handled"
      >
        {cu ? (
          /*
            Đã gửi rồi thì hiện lại bản cũ thay vì form trống. Máy chủ chỉ cho
            mỗi người một lượt; đưa form trống ra là mời người dùng gõ một đoạn
            dài rồi mới báo bị khoá.
          */
          <View style={styles.daGuiHop}>
            <Text style={styles.daGuiTieuDe}>Bạn đã gửi đánh giá</Text>
            <HangSao sao={cu.rating} onChon={() => {}} khoa />
            <Text style={styles.daGuiNoiDung}>{cu.comment}</Text>
            <Text style={styles.daGuiPhu}>
              Mỗi người gửi được một lần. Muốn sửa thì nhắn cho đội ngũ WeDo để mở lại giúp bạn.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.moiGoi}>
              Bạn thấy WeDo thế nào? Chê thoải mái — góp ý thật giúp chúng tôi sửa đúng chỗ hơn là
              lời khen.
            </Text>

            {loi ? <ErrorBanner message={loi} /> : null}

            <HangSao sao={sao} onChon={setSao} />

            <TextField
              label="Điều bạn muốn nói"
              value={noiDung}
              onChangeText={setNoiDung}
              placeholder="Chỗ nào khó dùng? Thiếu tính năng gì? Gặp lỗi ở đâu?"
              multiline
              testID="o-noi-dung"
            />
            <Text style={[styles.demChu, conLai < 0 && styles.demChuVuot]}>
              Còn {conLai} ký tự
            </Text>

            <Button
              label="Gửi góp ý"
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
