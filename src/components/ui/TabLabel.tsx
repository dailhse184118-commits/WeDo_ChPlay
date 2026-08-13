import React from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ColorValue } from 'react-native';

import { GIOI_HAN_CO_CHU } from '../../theme/responsive';
import { fontSize, spacing } from '../../theme/tokens';

/**
 * Nhãn của một tab dưới thanh điều hướng.
 *
 * Tự dựng thay vì để `tabBarLabelStyle` lo, chỉ vì một lý do: phải chặn cỡ chữ
 * ở `GIOI_HAN_CO_CHU`. Thanh tab cũng chỉ nới tới đúng mức đó (`sizes.tabBar`),
 * thả chữ phóng hết 200% là nhãn tràn ra ngoài. Tuỳ chọn có sẵn
 * `tabBarAllowFontScaling` chỉ bật/tắt — tắt hẳn thì người mắt kém không được
 * gì thêm, còn `tabBarLabelStyle` là style nên không nhận `maxFontSizeMultiplier`.
 */
export function TabLabel({ color, children }: { color: ColorValue; children: string }) {
  return (
    <Text numberOfLines={1} maxFontSizeMultiplier={GIOI_HAN_CO_CHU} style={[styles.label, { color }]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.xxs, fontWeight: '600', marginTop: spacing.xxs },
});
