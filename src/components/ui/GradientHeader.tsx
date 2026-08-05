import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  /** Nút hoặc avatar nằm bên phải tiêu đề. */
  right?: React.ReactNode;
  /** Nội dung phụ nằm dưới tiêu đề, ví dụ ô tìm kiếm hoặc ba ô đếm. */
  children?: React.ReactNode;
}

/**
 * Header gradient bo góc dưới 24, theo bộ thiết kế WeDo.
 *
 * Tự cộng inset thanh trạng thái vào phần đệm trên. Android 16 ép chế độ
 * edge-to-edge nên gradient phải chạy lên tận đỉnh màn hình, còn chữ thì
 * phải nằm dưới vùng thanh trạng thái.
 *
 * Mọi chữ trên header là #ffffff ĐẶC, không dùng trắng bán trong suốt — để
 * độ tương phản vẫn đạt 4,5:1 ở đầu sáng nhất của gradient.
 */
export function GradientHeader({ title, subtitle, right, children }: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + spacing.md, experimental_backgroundImage: gradients.header },
      ]}
    >
      <View style={styles.titleRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>

      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    // Dự phòng khi thiết bị không dựng được gradient.
    backgroundColor: colors.primary,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  titleBlock: { flex: 1 },
  title: { color: '#ffffff', fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: '#ffffff', fontSize: fontSize.xs, marginTop: 2 },
  right: { marginLeft: spacing.md },
  children: { marginTop: spacing.md },
});
