import React, { useCallback, useState } from 'react';
import { ActionSheetIOS, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, scaleWithFont, spacing } from '../../theme/tokens';

/** Một dòng trong bảng hành động. */
export interface ThaoTac {
  /** Dùng làm `testID` (`thao-tac-<khoa>`) và làm key. */
  khoa: string;
  nhan: string;
  /** Tô đỏ: chặn, xoá — những thứ khó quay lại. */
  nguyHiem?: boolean;
  onChon: () => void;
}

interface BangThaoTacProps {
  visible: boolean;
  tieuDe?: string;
  thaoTac: ThaoTac[];
  onDong: () => void;
}

/**
 * Bảng hành động trượt từ dưới lên — bản Android.
 *
 * Không dùng `Alert` nhiều nút: Android chỉ hiện tối đa ba nút, và nút thứ tư
 * trở đi mất hẳn mà không báo gì.
 */
export function BangThaoTac({ visible, tieuDe, thaoTac, onDong }: BangThaoTacProps) {
  /*
    Đóng TRƯỚC rồi mới chạy thao tác — cùng lý do với `WorkspaceSwitcher`: hai
    Modal chồng nhau trên Android làm cái mở sau không nhận được chạm, mà thao
    tác ở đây thường mở tiếp một phiếu khác (báo cáo, đề xuất AI).
  */
  const chon = (viec: ThaoTac) => {
    onDong();
    viec.onChon();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDong}>
      <Pressable style={styles.backdrop} onPress={onDong} />

      <View testID="bang-thao-tac" style={styles.sheet}>
        <View style={styles.handle} />
        {tieuDe ? (
          <Text style={styles.tieuDe} numberOfLines={2}>
            {tieuDe}
          </Text>
        ) : null}

        {thaoTac.map((viec) => (
          <Pressable
            key={viec.khoa}
            testID={`thao-tac-${viec.khoa}`}
            accessibilityRole="button"
            onPress={() => chon(viec)}
            style={({ pressed }) => [styles.dong, pressed ? styles.dongNhan : null]}
          >
            <Text style={[styles.nhan, viec.nguyHiem ? styles.nhanNguyHiem : null]}>
              {viec.nhan}
            </Text>
          </Pressable>
        ))}

        <Pressable
          testID="thao-tac-huy"
          accessibilityRole="button"
          onPress={onDong}
          style={({ pressed }) => [styles.dong, styles.huy, pressed ? styles.dongNhan : null]}
        >
          <Text style={styles.huyChu}>Huỷ</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

interface YeuCauMo {
  tieuDe?: string;
  thaoTac: ThaoTac[];
}

/**
 * Mở bảng hành động đúng kiểu của từng hệ điều hành.
 *
 * iOS dùng `ActionSheetIOS` gốc của hệ thống. Không chỉ vì trông quen mắt: iOS
 * không mở được Modal thứ hai khi Modal thứ nhất còn đang trượt xuống, mà chọn
 * "Báo cáo" là phải mở tiếp phiếu báo cáo. Bảng gốc tự đóng xong rồi mới gọi lại,
 * nên phiếu sau luôn hiện ra.
 *
 * Android dùng `BangThaoTac` ở trên. Màn gọi phải dựng `bang` ở đâu đó trong cây.
 */
export function useBangThaoTac() {
  const [yeuCau, setYeuCau] = useState<YeuCauMo | null>(null);

  const moBang = useCallback((moi: YeuCauMo) => {
    if (moi.thaoTac.length === 0) return;

    if (Platform.OS === 'ios') {
      const nhan = [...moi.thaoTac.map((viec) => viec.nhan), 'Huỷ'];
      const nguyHiem = moi.thaoTac
        .map((viec, viTri) => (viec.nguyHiem ? viTri : -1))
        .filter((viTri) => viTri >= 0);

      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: nhan,
          cancelButtonIndex: nhan.length - 1,
          destructiveButtonIndex: nguyHiem.length > 0 ? nguyHiem : undefined,
          title: moi.tieuDe,
        },
        (viTri) => moi.thaoTac[viTri]?.onChon(),
      );
      return;
    }

    setYeuCau(moi);
  }, []);

  const bang = (
    <BangThaoTac
      visible={yeuCau !== null}
      tieuDe={yeuCau?.tieuDe}
      thaoTac={yeuCau?.thaoTac ?? []}
      onDong={() => setYeuCau(null)}
    />
  );

  return { moBang, bang };
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0, 20, 50, 0.35)' },
  sheet: {
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
  tieuDe: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  // `minHeight` theo cỡ chữ: chữ phóng to thì dòng cao theo, vẫn đủ chỗ để chạm.
  dong: {
    minHeight: scaleWithFont(48),
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  dongNhan: { backgroundColor: colors.surface },
  nhan: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  nhanNguyHiem: { color: colors.danger },
  huy: { marginTop: spacing.xs, alignItems: 'center' },
  huyChu: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600' },
});
