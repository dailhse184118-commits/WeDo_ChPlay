import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button } from '../ui/Button';
import { QuetMaQr } from './QuetMaQr';
import { useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChat } from '../../i18n/tu-dien/chat';
import { tuDienChung } from '../../i18n/tu-dien/chung';
import {
  thamGiaLoiMoi,
  xemTruocLoiMoi,
  type KetQuaThamGia,
  type XemTruocLoiMoi,
} from '../../lib/api/loi-moi';
import { cauLoiMoi, dinhDangOMaMoi, maGuiDi } from '../../lib/loi-moi';
import {
  colors,
  fontSize,
  lineHeight,
  radius,
  scaleWithFont,
  shadows,
  spacing,
} from '../../theme/tokens';

interface NhapMaMoiSheetProps {
  visible: boolean;
  onDismiss: () => void;
  onDaThamGia: (ketQua: KetQuaThamGia) => void;
}

/**
 * Vào nhóm bằng mã Leader gửi: gõ mã hoặc quét QR → xem trước dự án → Tham gia.
 * Quét được mã thì tự xem trước, nhưng người dùng vẫn phải tự bấm Tham gia.
 */
export function NhapMaMoiSheet({ visible, onDismiss, onDaThamGia }: NhapMaMoiSheetProps) {
  const [oNhap, setONhap] = useState('');
  const [xemTruoc, setXemTruoc] = useState<XemTruocLoiMoi | null>(null);
  const tc = useTuDien(tuDienChat);
  const t = tc.moi;
  const chung = useTuDien(tuDienChung);
  const { ngonNgu } = useNgonNgu();
  // Giữ lỗi gốc, dịch lúc vẽ.
  const [loi, setLoi] = useState<{ e: unknown } | null>(null);
  const [dang, setDang] = useState<'xem' | 'vao' | null>(null);
  const [dangQuet, setDangQuet] = useState(false);
  const ma = maGuiDi(oNhap);

  const datLai = () => {
    setONhap('');
    setXemTruoc(null);
    setLoi(null);
    setDang(null);
    setDangQuet(false);
  };

  const dong = () => {
    datLai();
    onDismiss();
  };

  const xem = async (maXem: string | null = ma) => {
    if (!maXem || dang) return;
    setDang('xem');
    setLoi(null);
    try {
      setXemTruoc(await xemTruocLoiMoi(maXem));
    } catch (e) {
      setLoi({ e });
    } finally {
      setDang(null);
    }
  };

  const daQuetDuoc = (maQuet: string) => {
    setDangQuet(false);
    setONhap(dinhDangOMaMoi(maQuet));
    setXemTruoc(null);
    void xem(maQuet);
  };

  const vao = async () => {
    if (!ma || dang) return;
    setDang('vao');
    setLoi(null);
    try {
      const ketQua = await thamGiaLoiMoi(ma);
      datLai();
      onDaThamGia(ketQua);
    } catch (e) {
      setLoi({ e });
      setDang(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dong}>
      <Pressable style={styles.nen} onPress={dong} accessibilityLabel={chung.dong} />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        <Text style={styles.tieuDe}>{tc.nhapMaMoi}</Text>
        <Text style={styles.moTa}>{t.moTaNhapMa}</Text>

        <View style={styles.hangNhap}>
          <TextInput
            testID="o-ma-moi"
            accessibilityLabel={t.maMoi}
            value={oNhap}
            onChangeText={(giaTri) => {
              setONhap(dinhDangOMaMoi(giaTri));
              setXemTruoc(null);
              setLoi(null);
            }}
            placeholder="XXXX-XXXX"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoCorrect={false}
            spellCheck={false}
            maxLength={9}
            style={styles.o}
          />
          <Pressable
            testID="nut-quet-qr"
            accessibilityRole="button"
            accessibilityLabel={t.quetMaQr}
            onPress={() => setDangQuet(true)}
            disabled={dang !== null}
            style={({ pressed }) => [styles.nutQuet, pressed ? styles.nutQuetNhan : null]}
          >
            <Ionicons name="qr-code-outline" size={22} color={colors.primary} />
            <Text style={styles.chuNutQuet}>{t.quetQr}</Text>
          </Pressable>
        </View>

        {loi ? (
          <Text testID="loi-ma-moi" style={styles.loi}>
            {cauLoiMoi(loi.e, ngonNgu)}
          </Text>
        ) : null}

        {xemTruoc ? (
          <View testID="xem-truoc-loi-moi" style={styles.theDuAn}>
            <Text style={styles.tenDuAn}>{xemTruoc.projectName}</Text>
            <Text style={styles.chiTiet}>
              {t.xemTruoc(xemTruoc.workspaceName, xemTruoc.leaderName, xemTruoc.memberCount)}
            </Text>
          </View>
        ) : null}

        {xemTruoc ? (
          <Button testID="nut-tham-gia" label={t.thamGia} onPress={() => void vao()} loading={dang === 'vao'} />
        ) : (
          <Button
            testID="nut-xem-loi-moi"
            label={t.xemLoiMoi}
            onPress={() => void xem()}
            loading={dang === 'xem'}
            disabled={!ma}
          />
        )}
      </View>

      {/* Lồng trong Modal của bảng: iOS không hiện được hai Modal anh em cùng lúc.
          Chỉ gắn khi đang quét: máy ảnh và hỏi quyền không chạy lúc chỉ gõ mã. */}
      {dangQuet ? <QuetMaQr onMa={daQuetDuoc} onDong={() => setDangQuet(false)} /> : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.sm + 4,
    boxShadow: shadows.card,
  },
  tay: {
    alignSelf: 'center',
    width: scaleWithFont(44),
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginTop: spacing.sm,
  },
  tieuDe: { fontSize: fontSize.lg, lineHeight: lineHeight.lg, fontWeight: '700', color: colors.text },
  moTa: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted },
  // Ô có chữ: `minHeight` để chữ phóng to thì ô cao theo.
  hangNhap: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  o: {
    flex: 1,
    minHeight: scaleWithFont(52),
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.text,
    textAlign: 'center',
  },
  nutQuet: {
    minWidth: scaleWithFont(64),
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  nutQuetNhan: { backgroundColor: colors.surface },
  chuNutQuet: { fontSize: fontSize.xs, lineHeight: lineHeight.xs, fontWeight: '700', color: colors.primary },
  loi: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.danger },
  theDuAn: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  tenDuAn: { fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: '700', color: colors.text },
  chiTiet: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted, marginTop: spacing.xxs },
});
