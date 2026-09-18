import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export interface SegmentOption {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
}

/**
 * Thanh chuyển hai mục, đặt trên dải gradient của header.
 *
 * Nền trắng bán trong suốt chứ không phải một màu đặc: dải gradient chạy từ đậm
 * sang nhạt, màu đặc nào cũng sẽ hợp ở đầu này và chỏi ở đầu kia.
 *
 * Cố ý KHÔNG đặt `lineHeight` cho nhãn. Chữ ở đây nằm trong khung không cuộn
 * được nên đã bị chặn cỡ; ghép chặn cỡ với lineHeight nới theo cỡ chữ thật sẽ
 * làm khoảng dòng hở ra ở mức 200%.
 */
export function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  return (
    <View style={styles.thanh}>
      {options.map((option) => {
        const dangChon = option.key === value;

        return (
          <Pressable
            key={option.key}
            testID={`segment-${option.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: dangChon }}
            onPress={() => {
              // Chạm lại mục đang chọn không có gì để đổi. Báo ra ngoài chỉ tổ
              // khiến chỗ gọi dựng lại danh sách không vì lý do gì.
              if (!dangChon) onChange(option.key);
            }}
            style={[styles.muc, dangChon ? styles.mucChon : null]}
          >
            <Text style={[styles.chu, dangChon ? styles.chuChon : null]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  thanh: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  muc: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  mucChon: { backgroundColor: colors.background },
  chu: { fontSize: fontSize.sm, fontWeight: '600', color: colors.onPrimary },
  chuChon: { color: colors.primary },
});
