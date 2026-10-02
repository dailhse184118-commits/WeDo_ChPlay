import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '../ui/Button';
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
 * Vào nhóm bằng mã Leader gửi (bản này chưa mở được link hay quét QR — phần đó
 * chờ bản build mới). Gõ mã → xem trước dự án → Tham gia.
 */
export function NhapMaMoiSheet({ visible, onDismiss, onDaThamGia }: NhapMaMoiSheetProps) {
  const [oNhap, setONhap] = useState('');
  const [xemTruoc, setXemTruoc] = useState<XemTruocLoiMoi | null>(null);
  const [loi, setLoi] = useState<string | null>(null);
  const [dang, setDang] = useState<'xem' | 'vao' | null>(null);
  const ma = maGuiDi(oNhap);

  const datLai = () => {
    setONhap('');
    setXemTruoc(null);
    setLoi(null);
    setDang(null);
  };

  const dong = () => {
    datLai();
    onDismiss();
  };

  const xem = async () => {
    if (!ma || dang) return;
    setDang('xem');
    setLoi(null);
    try {
      setXemTruoc(await xemTruocLoiMoi(ma));
    } catch (e) {
      setLoi(cauLoiMoi(e));
    } finally {
      setDang(null);
    }
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
      setLoi(cauLoiMoi(e));
      setDang(null);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={dong}>
      <Pressable style={styles.nen} onPress={dong} accessibilityLabel="Đóng" />

      <View style={styles.sheet}>
        <View style={styles.tay} />
        <Text style={styles.tieuDe}>Nhập mã mời</Text>
        <Text style={styles.moTa}>Mã gồm 8 ký tự Leader gửi kèm link mời, ví dụ 7K3M-9QXA.</Text>

        <TextInput
          testID="o-ma-moi"
          accessibilityLabel="Mã mời"
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

        {loi ? (
          <Text testID="loi-ma-moi" style={styles.loi}>
            {loi}
          </Text>
        ) : null}

        {xemTruoc ? (
          <View testID="xem-truoc-loi-moi" style={styles.theDuAn}>
            <Text style={styles.tenDuAn}>{xemTruoc.projectName}</Text>
            <Text style={styles.chiTiet}>
              {`Không gian ${xemTruoc.workspaceName} · Leader ${xemTruoc.leaderName} · ${xemTruoc.memberCount} thành viên`}
            </Text>
          </View>
        ) : null}

        {xemTruoc ? (
          <Button testID="nut-tham-gia" label="Tham gia" onPress={() => void vao()} loading={dang === 'vao'} />
        ) : (
          <Button
            testID="nut-xem-loi-moi"
            label="Xem lời mời"
            onPress={() => void xem()}
            loading={dang === 'xem'}
            disabled={!ma}
          />
        )}
      </View>
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
  o: {
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
  loi: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.danger },
  theDuAn: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  tenDuAn: { fontSize: fontSize.md, lineHeight: lineHeight.md, fontWeight: '700', color: colors.text },
  chiTiet: { fontSize: fontSize.sm, lineHeight: lineHeight.sm, color: colors.textMuted, marginTop: spacing.xxs },
});
