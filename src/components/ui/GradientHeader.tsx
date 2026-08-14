import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GIOI_HAN_CO_CHU } from '../../theme/responsive';
import { colors, fontSize, gradients, radius, sizes, spacing } from '../../theme/tokens';

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
  /**
   * Có truyền thì phụ đề thành nút, kèm mũi tên xuống. Dùng cho chỗ phụ đề là
   * thứ đổi được — ví dụ tên không gian làm việc đang mở.
   */
  onPressSubtitle?: () => void;
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
  onPressSubtitle,
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
            <Ionicons name="chevron-back" size={sizes.icon} color={colors.onPrimary} />
          </Pressable>
        ) : null}

        {/*
          Chặn cỡ chữ ở 130%: header cao cố định và không cuộn được, chữ phóng
          hết 200% là tràn ra ngoài vùng gradient. Nội dung bên trong màn hình
          thì không chặn gì.

          Tiêu đề cho xuống hai dòng — tên dự án dài gặp cỡ chữ lớn mà chỉ một
          dòng thì mất gần hết chữ.
        */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={2} maxFontSizeMultiplier={GIOI_HAN_CO_CHU}>
            {title}
          </Text>
          {subtitle && onPressSubtitle ? (
            <Pressable
              testID="header-subtitle-button"
              accessibilityRole="button"
              accessibilityLabel={`${subtitle}. Chạm để đổi`}
              onPress={onPressSubtitle}
              hitSlop={8}
              style={({ pressed }) => [styles.subtitleRow, pressed ? styles.backPressed : null]}
            >
              <Text
                style={styles.subtitle}
                numberOfLines={1}
                maxFontSizeMultiplier={GIOI_HAN_CO_CHU}
              >
                {subtitle}
              </Text>
              <Ionicons name="chevron-down" size={fontSize.sm} color={colors.onPrimary} />
            </Pressable>
          ) : subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1} maxFontSizeMultiplier={GIOI_HAN_CO_CHU}>
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
  /*
    Không đặt `lineHeight` cho hai dòng này. Token `lineHeight` nới theo cỡ chữ
    hệ thống THẬT, còn chữ ở đây bị chặn ở 130% — ghép hai thứ lại thì ở mức
    200% khoảng dòng rộng gấp rưỡi chữ, trông như bị hở. Để React Native tự
    tính khoảng dòng theo cỡ chữ nó thật sự dựng.
  */
  title: { color: colors.onPrimary, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.onPrimary, fontSize: fontSize.xs, marginTop: spacing.xxs },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  right: { marginLeft: spacing.md },
  children: { marginTop: spacing.md },
});
