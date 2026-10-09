import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { useDichLoi, useTuDien } from '../../i18n/NgonNguProvider';
import { tuDienChung } from '../../i18n/tu-dien/chung';
import { tuDienKiemDuyet } from '../../i18n/tu-dien/kiem-duyet';
import { chuLoi, type NguonLoi } from '../../lib/auth/nguon-loi';
import { ApiError } from '../../lib/api/client';
import {
  DO_DAI_GHI_CHU_TOI_DA,
  MA_QUA_NHIEU_BAO_CAO,
  reportContent,
  type LoaiDoiTuongBaoCao,
  type LyDoBaoCao,
} from '../../lib/api/moderation';
import { MA_LY_DO_BAO_CAO } from '../../lib/moderation/noi-dung';
import { colors, fontSize, lineHeight, radius, scaleWithFont, spacing } from '../../theme/tokens';

/** Thứ đang bị báo cáo. `null` là phiếu đang đóng. */
export interface DoiTuongBaoCao {
  targetType: LoaiDoiTuongBaoCao;
  targetId: string;
  /** Tên người bị báo cáo, để tiêu đề nói rõ đang báo cáo ai. */
  tenNguoi?: string;
}

interface PhieuBaoCaoProps {
  doiTuong: DoiTuongBaoCao | null;
  onDong: () => void;
}

type TuDienKD = typeof tuDienKiemDuyet.vi;

function cauHoi(doiTuong: DoiTuongBaoCao, t: TuDienKD): { tieuDe: string; cauHoi: string } {
  if (doiTuong.targetType === 'USER') {
    return {
      tieuDe: doiTuong.tenNguoi ? t.baoCaoTen(doiTuong.tenNguoi) : t.baoCaoNguoiDung,
      cauHoi: t.cauHoiNguoi,
    };
  }
  return { tieuDe: t.baoCaoTin, cauHoi: t.cauHoiTin };
}

/** Lỗi của phiếu giữ ở dạng nguồn, dịch lúc vẽ. */
type KhoaLoiPhieu = 'quaNhieuBaoCao' | 'chuaGuiDuoc';

/**
 * Phiếu báo cáo tin nhắn hoặc người dùng.
 *
 * Báo xong thì cảm ơn NGAY TRONG PHIẾU, không đóng phiếu rồi bật `Alert`: trên
 * iOS, hộp thoại gọi lúc Modal còn đang trượt xuống sẽ không bao giờ hiện, và
 * người dùng không biết báo cáo đã tới chưa.
 */
export function PhieuBaoCao({ doiTuong, onDong }: PhieuBaoCaoProps) {
  const [lyDo, setLyDo] = useState<LyDoBaoCao | null>(null);
  const [ghiChu, setGhiChu] = useState('');
  const t = useTuDien(tuDienKiemDuyet);
  const chung = useTuDien(tuDienChung);
  const dichLoi = useDichLoi();
  const [loi, setLoi] = useState<NguonLoi<KhoaLoiPhieu> | null>(null);
  const [daGui, setDaGui] = useState(false);

  /*
    Mở phiếu cho thứ khác thì xoá sạch lựa chọn cũ ngay trong lượt dựng. Lý do
    của tin trước nằm sẵn ở tin sau là gửi nhầm báo cáo.

    Lỗi giữ ở trạng thái riêng chứ không đọc từ `mutation.error`, vì không được
    gọi `reset()` của react-query giữa lúc đang dựng.
  */
  const khoa = doiTuong ? `${doiTuong.targetType}:${doiTuong.targetId}` : null;
  const [khoaDangMo, setKhoaDangMo] = useState(khoa);
  if (khoa !== khoaDangMo) {
    setKhoaDangMo(khoa);
    setLyDo(null);
    setGhiChu('');
    setLoi(null);
    setDaGui(false);
  }

  const guiMutation = useMutation({ mutationFn: reportContent });

  async function gui() {
    if (!doiTuong || !lyDo || guiMutation.isPending) return;

    setLoi(null);
    try {
      await guiMutation.mutateAsync({
        targetType: doiTuong.targetType,
        targetId: doiTuong.targetId,
        reason: lyDo,
        note: ghiChu,
      });
      setDaGui(true);
    } catch (err) {
      /*
        Chỉ mã `REPORT_LIMIT` mới là hạn mức 30 báo cáo mỗi ngày. 429 không mã là
        bộ chặn tần suất chung của máy chủ ("thao tác quá nhanh") — bảo người
        dùng đợi tới mai trong khi chỉ cần bấm lại sau vài giây là nói sai.
      */
      if (err instanceof ApiError && err.code === MA_QUA_NHIEU_BAO_CAO) {
        setLoi({ khoa: 'quaNhieuBaoCao' });
      } else {
        setLoi({ loi: err, duPhong: 'chuaGuiDuoc' });
      }
    }
  }

  const chu = doiTuong ? cauHoi(doiTuong, t) : null;

  return (
    <Modal
      visible={doiTuong !== null}
      transparent
      animationType="slide"
      onRequestClose={onDong}
    >
      {/*
        Chỉ đẩy phiếu lên trên iOS. Android tự co cửa sổ Modal khi bàn phím mở;
        đệm thêm ở đây là phiếu nhảy lên gấp đôi.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdrop} onPress={onDong} />

        <View testID="phieu-bao-cao" style={styles.sheet}>
          <View style={styles.handle} />

          {daGui ? (
            <View style={styles.xong}>
              <Ionicons name="checkmark-circle" size={48} color={colors.success} />
              <Text testID="bao-cao-da-gui" style={styles.xongChu}>
                {t.daGui}
              </Text>
              <View style={styles.nutDay}>
                <Button testID="bao-cao-dong" label={chung.dong} onPress={onDong} />
              </View>
            </View>
          ) : (
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.tieuDe}>{chu?.tieuDe}</Text>
              <Text style={styles.cauHoi}>{chu?.cauHoi}</Text>

              {loi ? <ErrorBanner message={chuLoi(t, loi, dichLoi)} /> : null}

              {MA_LY_DO_BAO_CAO.map((ma) => {
                const dangChon = lyDo === ma;
                return (
                  <Pressable
                    key={ma}
                    testID={`ly-do-${ma}`}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: dangChon }}
                    onPress={() => {
                      setLyDo(ma);
                      setLoi(null);
                    }}
                    style={({ pressed }) => [styles.lyDo, pressed ? styles.lyDoNhan : null]}
                  >
                    <Ionicons
                      name={dangChon ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={dangChon ? colors.primary : colors.textMuted}
                    />
                    <Text style={styles.lyDoChu}>{t.lyDo[ma]}</Text>
                  </Pressable>
                );
              })}

              <Text style={styles.nhanO}>{t.ghiChuThem}</Text>
              <TextInput
                testID="bao-cao-ghi-chu"
                accessibilityLabel={t.ghiChuNhan}
                value={ghiChu}
                onChangeText={setGhiChu}
                placeholder={t.moTaNgan}
                placeholderTextColor={colors.textMuted}
                style={styles.o}
                multiline
                maxLength={DO_DAI_GHI_CHU_TOI_DA}
                // Từ điển tiếng Anh của Android gạch đỏ toàn bộ tiếng Việt.
                spellCheck={false}
                autoCorrect={false}
              />
              <Text style={styles.demKyTu}>
                {ghiChu.length}/{DO_DAI_GHI_CHU_TOI_DA}
              </Text>

              <Button
                testID="bao-cao-gui"
                label={t.guiBaoCao}
                variant="danger"
                loading={guiMutation.isPending}
                disabled={!lyDo}
                onPress={() => void gui()}
              />

              <Pressable testID="bao-cao-huy" onPress={onDong} style={styles.huy}>
                <Text style={styles.huyChu}>{chung.huy}</Text>
              </Pressable>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
    maxHeight: '90%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  tieuDe: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  cauHoi: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    lineHeight: lineHeight.sm,
  },
  lyDo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    minHeight: scaleWithFont(44),
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
  },
  lyDoNhan: { backgroundColor: colors.surface },
  lyDoChu: { flex: 1, fontSize: fontSize.md, color: colors.text },
  nhanO: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  o: {
    minHeight: 88,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    textAlignVertical: 'top',
  },
  demKyTu: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  huy: { marginTop: spacing.md, alignItems: 'center' },
  huyChu: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  xong: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.md },
  xongChu: {
    fontSize: fontSize.md,
    color: colors.text,
    textAlign: 'center',
    lineHeight: lineHeight.md,
  },
  nutDay: { alignSelf: 'stretch' },
});
