import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../ui/Button';
import { useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChat } from '../../i18n/tu-dien/chat';
import { tuDienChung } from '../../i18n/tu-dien/chung';
import { docMaTuQr } from '../../lib/loi-moi';
import { colors, fontSize, lineHeight, radius, spacing } from '../../theme/tokens';

interface QuetMaQrProps {
  visible: boolean;
  /** Mã mời đã chuẩn hoá (8 ký tự, không gạch). */
  onMa: (ma: string) => void;
  onDong: () => void;
}

/**
 * Màn quét QR mời vào nhóm, chiếm hết màn hình.
 *
 * Máy ảnh gọi `onBarcodeScanned` liên tục chừng nào mã còn trong khung, nên có
 * khoá: chỉ xử lý một lần. QR không phải lời mời thì báo rồi mở khoá để quét
 * tiếp, nhưng bỏ qua đúng nội dung vừa báo — không thì câu báo nháy liên tục.
 *
 * Không mở link trong QR: chỉ đọc mã bằng `docMaTuQr`.
 */
export function QuetMaQr({ visible, onMa, onDong }: QuetMaQrProps) {
  const [quyen, xinQuyen] = useCameraPermissions();
  const t = useTuDien(tuDienChat).moi;
  const chung = useTuDien(tuDienChung);
  const insets = useSafeAreaInsets();
  const [khongPhaiLoiMoi, setKhongPhaiLoiMoi] = useState(false);
  const khoa = useRef(false);
  const daBao = useRef<string | null>(null);
  const daXin = useRef(false);

  // Mỗi lần mở là một lượt quét mới.
  useEffect(() => {
    if (!visible) return;
    khoa.current = false;
    daBao.current = null;
    setKhongPhaiLoiMoi(false);
  }, [visible]);

  // Chưa hỏi bao giờ thì hỏi luôn: người dùng bấm "Quét" là đã muốn dùng máy ảnh.
  useEffect(() => {
    if (!visible || !quyen || daXin.current) return;
    if (quyen.status === 'undetermined' && quyen.canAskAgain) {
      daXin.current = true;
      void xinQuyen();
    }
  }, [visible, quyen, xinQuyen]);

  if (!visible) return null;

  const daQuet = ({ data }: BarcodeScanningResult) => {
    if (khoa.current || data === daBao.current) return;
    khoa.current = true;
    const ma = docMaTuQr(data);
    if (ma) {
      onMa(ma);
      return;
    }
    daBao.current = data;
    setKhongPhaiLoiMoi(true);
    khoa.current = false;
  };

  let noiDung: React.ReactNode;
  if (!quyen) {
    noiDung = <ActivityIndicator key="dang-tai" color={colors.onPrimary} style={styles.giua} />;
  } else if (quyen.granted) {
    noiDung = (
      <View key="may-anh" style={styles.lop}>
        <CameraView
          testID="may-anh-quet-qr"
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={daQuet}
        />
        <View style={styles.giua} pointerEvents="none">
          <View style={styles.khung} />
          <Text style={styles.huongDan}>{t.huongDanQuet}</Text>
          {khongPhaiLoiMoi ? (
            <Text testID="loi-quet-qr" style={styles.loi}>
              {t.qrKhongPhaiLoiMoi}
            </Text>
          ) : null}
        </View>
      </View>
    );
  } else {
    noiDung = (
      <View key="xin-quyen" style={[styles.giua, styles.xinQuyen]}>
        <Text testID="giai-thich-quyen-may-anh" style={styles.huongDan}>
          {quyen.canAskAgain ? t.canQuyenMayAnh : t.quyenMayAnhBiTat}
        </Text>
        {quyen.canAskAgain ? (
          <Button testID="nut-cho-phep-may-anh" label={t.choPhepMayAnh} onPress={() => void xinQuyen()} />
        ) : (
          <Button
            testID="nut-mo-cai-dat"
            label={t.moCaiDat}
            onPress={() => {
              Linking.openSettings().catch(() => undefined);
            }}
          />
        )}
      </View>
    );
  }

  return (
    <Modal visible transparent={false} animationType="slide" onRequestClose={onDong}>
      <View testID="man-quet-qr" style={styles.nen}>
        {noiDung}
        <Text style={[styles.tieuDe, { top: insets.top + spacing.md }]}>{t.quetMaQr}</Text>
        <Pressable
          testID="nut-dong-quet-qr"
          accessibilityRole="button"
          accessibilityLabel={chung.dong}
          onPress={onDong}
          hitSlop={12}
          style={[styles.nutDong, { top: insets.top + spacing.sm }]}
        >
          <Ionicons name="close" size={26} color={colors.onPrimary} />
        </Pressable>
      </View>
    </Modal>
  );
}

const CANH_KHUNG = 240;

const styles = StyleSheet.create({
  nen: { flex: 1, backgroundColor: '#000000' },
  lop: { flex: 1 },
  giua: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  xinQuyen: { alignItems: 'stretch' },
  khung: {
    width: CANH_KHUNG,
    height: CANH_KHUNG,
    borderWidth: 3,
    borderColor: colors.onPrimary,
    borderRadius: radius.lg,
  },
  tieuDe: {
    position: 'absolute',
    left: spacing.xl * 2,
    right: spacing.xl * 2,
    textAlign: 'center',
    fontSize: fontSize.lg,
    lineHeight: lineHeight.lg,
    fontWeight: '700',
    color: colors.onPrimary,
  },
  huongDan: {
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    color: colors.onPrimary,
    textAlign: 'center',
  },
  loi: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.sm,
    fontWeight: '700',
    color: colors.onPrimary,
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    overflow: 'hidden',
    textAlign: 'center',
  },
  nutDong: {
    position: 'absolute',
    right: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
});
