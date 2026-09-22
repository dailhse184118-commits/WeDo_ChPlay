import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CuocHop } from '../../lib/api/meetings';
import { khoangGio, tenTrangThai } from '../../lib/meetings/sap-xep';
import { colors, fontSize, lineHeight, radius, shadows, sizes, spacing } from '../../theme/tokens';

/** Màu vạch bên trái theo trạng thái — đọc được từ xa mà không cần đọc chữ. */
const MAU: Record<CuocHop['status'], string> = {
  SCHEDULED: colors.primary,
  IN_PROGRESS: colors.success,
  COMPLETED: colors.textMuted,
  CANCELLED: colors.danger,
};

interface Props {
  hop: CuocHop;
  onPress: () => void;
  testID?: string;
}

export function TheCuocHop({ hop, onPress, testID }: Props) {
  const mau = MAU[hop.status] ?? colors.primary;
  const daHuy = hop.status === 'CANCELLED';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${hop.title}, ${tenTrangThai(hop.status)}, ${khoangGio(hop)}`}
      onPress={onPress}
      style={({ pressed }) => [styles.the, pressed ? styles.nhan : null]}
    >
      <View style={[styles.vach, { backgroundColor: mau }]} />

      <View style={styles.than}>
        <View style={styles.dong}>
          <Text style={[styles.trangThai, { color: mau }]}>{tenTrangThai(hop.status)}</Text>
          <Text style={styles.gio}>{khoangGio(hop)}</Text>
        </View>

        <Text
          style={[styles.tieuDe, daHuy ? styles.gachNgang : null]}
          numberOfLines={2}
        >
          {hop.title}
        </Text>

        {hop.project?.name ? (
          <Text style={styles.duAn} numberOfLines={1}>
            {hop.project.name}
          </Text>
        ) : null}

        {/*
          Số người tham dự và số hạng mục hành động là hai thứ người dùng quyết
          định có mở cuộc họp này ra hay không. Chỉ hiện khi có — một dãy "0
          hạng mục" trên mọi thẻ là nhiễu.
        */}
        <View style={styles.chuThich}>
          {hop.participants?.length ? (
            <View style={styles.chiTiet}>
              <Ionicons name="people-outline" size={14} color={colors.textMuted} />
              <Text style={styles.chiTietChu}>{hop.participants.length}</Text>
            </View>
          ) : null}

          {hop.actionItems?.length ? (
            <View style={styles.chiTiet}>
              <Ionicons name="checkbox-outline" size={14} color={colors.textMuted} />
              <Text style={styles.chiTietChu}>{hop.actionItems.length} hạng mục</Text>
            </View>
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={sizes.icon} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  the: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    /* `colors.card` la chuoi BONG DO, khong phai mau nen — nen the la `background`. */
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    boxShadow: shadows.card,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nhan: { opacity: 0.6 },
  vach: { width: 4, alignSelf: 'stretch', borderRadius: 2 },
  than: { flex: 1, minWidth: 0 },
  dong: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  trangThai: { fontSize: fontSize.xs, fontWeight: '700' },
  gio: { fontSize: fontSize.xs, color: colors.textMuted },
  tieuDe: {
    marginTop: spacing.xs,
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    lineHeight: lineHeight.md,
  },
  gachNgang: { textDecorationLine: 'line-through', color: colors.textMuted },
  duAn: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  chuThich: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xs },
  chiTiet: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chiTietChu: { fontSize: fontSize.xs, color: colors.textMuted },
});
