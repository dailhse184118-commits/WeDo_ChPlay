import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontSize, gradients, radius, spacing } from '../../theme/tokens';

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  /** Nút hoặc avatar nằm bên phải tiêu đề. */
  right?: React.ReactNode;
  /**
   * Có truyền thì hiện mũi tên quay lại bên trái tiêu đề. Màn hình mở chồng lên
   * BẮT BUỘC truyền — vào từ thông báo thì không còn đường nào lùi lại.
   */
  onBack?: () => void;
  /** Bớt đệm dưới, cho màn hình cần nhường chỗ như trò chuyện. */
  dense?: boolean;
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
export function GradientHeader({
  title,
  subtitle,
  right,
  onBack,
  dense,
  children,
}: GradientHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        dense ? styles.headerDense : null,
        { paddingTop: insets.top + spacing.md, experimental_backgroundImage: gradients.header },
      ]}
    >
      <View style={styles.titleRow}>
        {onBack ? (
          <Pressable
            testID="header-back"
            accessibilityRole="button"
            accessibilityLabel="Quay lại"
            onPress={onBack}
            hitSlop={12}
            style={({ pressed }) => [styles.back, pressed ? styles.backPressed : null]}
          >
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </Pressable>
        ) : null}

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
  headerDense: { paddingBottom: spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  back: { marginRight: spacing.sm, marginLeft: -spacing.xs },
  backPressed: { opacity: 0.6 },
  titleBlock: { flex: 1 },
  title: { color: '#ffffff', fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: '#ffffff', fontSize: fontSize.xs, marginTop: 2 },
  right: { marginLeft: spacing.md },
  children: { marginTop: spacing.md },
});
