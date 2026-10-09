import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { Button } from '../ui/Button';
import { useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChat } from '../../i18n/tu-dien/chat';
import { tuDienChung } from '../../i18n/tu-dien/chung';
import { layLoiMoi, taoLoiMoi, tatLoiMoi, type LoiMoiDuAn } from '../../lib/api/loi-moi';
import { cauLoiMoi, hienThiHanMoi, hienThiMaMoi, noiDungChiaSe } from '../../lib/loi-moi';
import { colors, fontSize, lineHeight, radius, scaleWithFont, shadows, spacing } from '../../theme/tokens';

interface MoiVaoNhomSheetProps {
  visible: boolean;
  projectId: string;
  projectName: string;
  onDismiss: () => void;
}

/**
 * Leader chia sẻ link mời qua bảng chia sẻ của hệ điều hành (Zalo, Messenger…),
 * cho bạn bè quét QR ngay trên máy mình, tạo link mới hay tắt link.
 */
export function MoiVaoNhomSheet({ visible, projectId, projectName, onDismiss }: MoiVaoNhomSheetProps) {
  const [loiMoi, setLoiMoi] = useState<LoiMoiDuAn | null>(null);
  const [dangTai, setDangTai] = useState(false);
  const [dang, setDang] = useState<'chia-se' | 'tao' | 'tat' | null>(null);
  const t = useTuDien(tuDienChat).moi;
  const chung = useTuDien(tuDienChung);
  const { ngonNgu } = useNgonNgu();
  // Giữ lỗi gốc, dịch lúc vẽ.
  const [loi, setLoi] = useState<{ e: unknown } | null>(null);

  useEffect(() => {
    if (!visible) return;
    let huy = false;
    setDangTai(true);
    // Xoá link của dự án trước: tải lỗi thì không được hiện hay chia sẻ nhầm link cũ.
    setLoiMoi(null);
    setLoi(null);
    layLoiMoi(projectId)
      .then(
        (ketQua) => {
          if (!huy) setLoiMoi(ketQua);
        },
        (e: unknown) => {
          if (!huy) setLoi({ e });
        },
      )
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [visible, projectId]);

  const chiaSe = async () => {
    setDang('chia-se');
    setLoi(null);
    try {
      // Chưa có link thì tạo luôn: Leader bấm "Chia sẻ" là muốn mời ngay.
      const hienCo = loiMoi ?? (await taoLoiMoi(projectId));
      setLoiMoi(hienCo);
      await Share.share({ message: noiDungChiaSe(projectName, hienCo, ngonNgu) });
    } catch (e) {
      setLoi({ e });
    } finally {
      setDang(null);
    }
  };

  const lamTaoMoi = async () => {
    setDang('tao');
    setLoi(null);
    try {
      setLoiMoi(await taoLoiMoi(projectId));
    } catch (e) {
      setLoi({ e });
    } finally {
      setDang(null);
    }
  };

  const taoMoi = () => {
    if (!loiMoi) {
      void lamTaoMoi();
      return;
    }
    Alert.alert(t.taoLinkMoiHoi, t.taoLinkMoiNoiDung, [
      { text: chung.huy, style: 'cancel' },
      { text: t.taoLinkMoi, style: 'destructive', onPress: () => void lamTaoMoi() },
    ]);
  };

  const lamTat = async () => {
    setDang('tat');
    setLoi(null);
    try {
      await tatLoiMoi(projectId);
      setLoiMoi(null);
    } catch (e) {
      setLoi({ e });
    } finally {
      setDang(null);
    }
  };

  const tat = () => {
    Alert.alert(t.tatLinkHoi, t.tatLinkNoiDung, [
      { text: chung.huy, style: 'cancel' },
      { text: t.tatLink, style: 'destructive', onPress: () => void lamTat() },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.nen} onPress={onDismiss} accessibilityLabel={chung.dong} />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        {/* Có QR thì bảng cao hơn: máy màn nhỏ hay chữ phóng to vẫn cuộn được. */}
        <ScrollView style={styles.cuon} contentContainerStyle={styles.noiDung} bounces={false}>
          <Text style={styles.tieuDe}>{t.moiVaoNhom}</Text>
          <Text style={styles.moTa}>{t.moTaChiaSe}</Text>

          {dangTai ? (
            <ActivityIndicator color={colors.primary} />
          ) : loiMoi ? (
            <View style={styles.theMa}>
              {/* Nền trắng, lề rộng: máy quét cần vùng yên lặng quanh mã. */}
              <View testID="qr-loi-moi" accessible accessibilityLabel={t.maQrLoiMoi} style={styles.nenQr}>
                <QRCode value={loiMoi.url} size={CANH_QR} color="#000000" backgroundColor="#ffffff" quietZone={12} />
              </View>
              <Text style={styles.huongDanQr}>{t.huongDanQr}</Text>
              <Text testID="ma-moi-hien-tai" style={styles.ma}>
                {hienThiMaMoi(loiMoi.code)}
              </Text>
              <Text style={styles.chiTiet}>
                {t.chiTiet(hienThiHanMoi(loiMoi.expiresAt, ngonNgu), loiMoi.useCount)}
              </Text>
            </View>
          ) : (
            <Text style={styles.chiTiet}>{t.chuaCoLink}</Text>
          )}

          {loi ? <Text style={styles.loi}>{cauLoiMoi(loi.e, ngonNgu)}</Text> : null}

          <Button
            testID="nut-chia-se-loi-moi"
            label={t.chiaSeLink}
            onPress={() => void chiaSe()}
            loading={dang === 'chia-se'}
            disabled={dangTai || dang !== null}
          />
          <Button
            testID="nut-tao-link-moi"
            label={t.taoLinkMoi}
            variant="secondary"
            onPress={taoMoi}
            loading={dang === 'tao'}
            disabled={dangTai || dang !== null}
          />
          {loiMoi ? (
            <Button
              testID="nut-tat-link"
              label={t.tatLink}
              variant="danger"
              onPress={tat}
              loading={dang === 'tat'}
              disabled={dang !== null}
            />
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

const CANH_QR = 200;

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '92%',
    boxShadow: shadows.card,
  },
  cuon: { flexGrow: 0 },
  noiDung: { gap: spacing.sm + 4, paddingTop: spacing.sm + 4 },
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
  theMa: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  nenQr: { backgroundColor: '#ffffff', borderRadius: radius.md, padding: spacing.xs },
  huongDanQr: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  ma: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: 3, color: colors.primary },
  chiTiet: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted, marginTop: spacing.xxs },
  loi: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.danger },
});
