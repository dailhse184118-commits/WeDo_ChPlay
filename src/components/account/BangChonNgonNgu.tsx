import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useNgonNgu, useTuDien } from '../../i18n/NgonNguProvider';
import { TEN_NGON_NGU, type LuaChonNgonNgu } from '../../i18n/ngon-ngu';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
import { colors, fontSize, radius, scaleWithFont, spacing } from '../../theme/tokens';

interface BangChonNgonNguProps {
  visible: boolean;
  onDismiss: () => void;
}

/** Bảng chọn ngôn ngữ: Theo máy / Tiếng Việt / English. Hai tên ngôn ngữ giữ nguyên ở mọi ngôn ngữ. */
export function BangChonNgonNgu({ visible, onDismiss }: BangChonNgonNguProps) {
  const t = useTuDien(tuDienTaiKhoan);
  const { luaChon, datLuaChon } = useNgonNgu();

  const lua: { gia: LuaChonNgonNgu; nhan: string }[] = [
    { gia: 'he-thong', nhan: t.theoMay },
    { gia: 'vi', nhan: TEN_NGON_NGU.vi },
    { gia: 'en', nhan: TEN_NGON_NGU.en },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.heading}>{t.chonNgonNgu}</Text>
        {lua.map((l) => {
          const chon = luaChon === l.gia;
          return (
            <Pressable
              key={l.gia}
              testID={`ngon-ngu-${l.gia}`}
              accessibilityRole="button"
              accessibilityState={{ selected: chon }}
              onPress={() => {
                void datLuaChon(l.gia);
                onDismiss();
              }}
              style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
            >
              <Text style={[styles.rowText, chon ? styles.rowTextChon : null]}>{l.nhan}</Text>
              {chon ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
            </Pressable>
          );
        })}
        <Pressable testID="ngon-ngu-dong" onPress={onDismiss} style={styles.cancel}>
          <Text style={styles.cancelText}>{t.dong}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
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
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  row: {
    minHeight: scaleWithFont(48),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowPressed: { backgroundColor: colors.primarySoft },
  rowText: { fontSize: fontSize.md, color: colors.text },
  rowTextChon: { fontWeight: '700', color: colors.primary },
  cancel: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.sm },
  cancelText: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '600' },
});
