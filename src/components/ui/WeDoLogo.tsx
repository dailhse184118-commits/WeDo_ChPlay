import React from 'react';
import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

/** Tỉ lệ gốc của logo, lấy từ viewBox 813.24 × 387.15. */
const ASPECT = 813.24 / 387.15;

interface WeDoLogoProps {
  /** Chiều rộng mong muốn. Chiều cao tự tính theo tỉ lệ gốc. */
  width?: number;
  /**
   * Đổi màu toàn bộ logo. Dùng `#ffffff` khi đặt trên gradient — bản gốc màu
   * #0c5dc9, đặt trên nền xanh sẽ chìm mất.
   */
  tintColor?: string;
  testID?: string;
}

/**
 * Logo WeDo dạng vector.
 *
 * Dùng `expo-image` chứ không phải `react-native-svg`: expo-image có sẵn bộ giải mã
 * SVG cho Android và ĐÃ nằm trong APK development client. Thêm react-native-svg sẽ
 * là một module native mới, tức phải build lại APK — cái giá không đáng cho một logo.
 */
export function WeDoLogo({ width = 160, tintColor, testID }: WeDoLogoProps) {
  const height = Math.round(width / ASPECT);

  return (
    <View testID={testID} style={[styles.wrap, { width, height }]}>
      <Image
        source={require('../../../assets/images/wedo-logo.svg')}
        style={StyleSheet.absoluteFill}
        contentFit="contain"
        tintColor={tintColor}
        accessibilityLabel="WeDo"
        transition={0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
