import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { sizes } from '../../theme/tokens';

interface AppleButtonProps {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

/**
 * Nút "Tiếp tục với Apple" — chỉ vẽ trên iPhone đã hỏi `useCoDangNhapApple()`.
 *
 * Dùng đúng nút native của Apple (`ASAuthorizationAppleIDButton`) chứ không tự
 * vẽ: Apple tự dịch nhãn theo ngôn ngữ máy, tự đặt logo đúng tỉ lệ, và nút này
 * mặc nhiên hợp hướng dẫn thương hiệu — reviewer không có gì để bắt lỗi.
 *
 * Kiểu CONTINUE cho khớp "Tiếp tục với Google" đứng ngay dưới. Nền đen trên
 * thẻ trắng. Cao bằng `sizes.control` và bo tròn trọn nửa chiều cao, để đứng
 * cạnh nút Google và nút "Đăng nhập" không bị lệch. Nút native không nhận
 * `backgroundColor` hay `borderRadius` qua `style` — chỉ qua `buttonStyle` và
 * `cornerRadius`.
 */
export function AppleButton({ onPress, loading = false, disabled = false, testID }: AppleButtonProps) {
  const inactive = loading || disabled;

  return (
    <View
      style={[styles.khung, inactive ? styles.inactive : null]}
      accessibilityState={{ disabled: inactive, busy: loading }}
    >
      <AppleAuthentication.AppleAuthenticationButton
        testID={testID}
        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
        cornerRadius={sizes.control / 2}
        style={styles.nut}
        onPress={onPress}
      />
      {/*
        Đang đợi máy chủ thì phủ một lớp cùng màu, cùng dáng, xoay vòng — như
        nút Google. Lớp phủ nằm trên nên cũng chặn luôn cú bấm thứ hai.
      */}
      {loading ? (
        <View testID={testID ? `${testID}-dang-xu-ly` : undefined} style={styles.phu}>
          <ActivityIndicator color="#ffffff" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  khung: { width: '100%', height: sizes.control },
  // Bảng Apple đang mở hay đang đăng nhập đường khác thì không nhận bấm.
  inactive: { opacity: 0.6, pointerEvents: 'none' },
  nut: { width: '100%', height: sizes.control },
  phu: {
    ...StyleSheet.absoluteFill,
    borderRadius: sizes.control / 2,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
