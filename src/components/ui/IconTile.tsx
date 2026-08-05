import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, sizes } from '../../theme/tokens';

/**
 * Ý nghĩa của ô icon, quyết định màu nền và màu icon.
 *
 * Theo bộ thiết kế, đây là chỗ màu sắc vào nhiều nhất mà không phá bảng màu:
 * xanh cho giao việc, vàng cho hạn chót, lục cho đã xong, đỏ cho từ chối.
 */
export type IconTileTone = 'info' | 'deadline' | 'done' | 'rejected';

const TONE: Record<IconTileTone, { bg: string; fg: string }> = {
  info: { bg: colors.primarySoft, fg: colors.primary },
  deadline: { bg: colors.warningSoft, fg: colors.warningText },
  done: { bg: colors.successSoft, fg: colors.success },
  rejected: { bg: colors.dangerSoft, fg: colors.danger },
};

interface IconTileProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  tone?: IconTileTone;
  size?: number;
  testID?: string;
}

/** Ô 40×40 bo 10, tô màu nhạt theo ý nghĩa. */
export function IconTile({ name, tone = 'info', size = sizes.iconTile, testID }: IconTileProps) {
  const palette = TONE[tone];

  return (
    <View
      testID={testID}
      style={[styles.tile, { width: size, height: size, backgroundColor: palette.bg }]}
    >
      <Ionicons name={name} size={Math.round(size * 0.55)} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
