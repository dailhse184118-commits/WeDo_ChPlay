import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

import { colors, scale } from '../../theme/tokens';

interface AvatarProps {
  hoTen: string;
  /** Ảnh đại diện. Người đăng nhập bằng Google có sẵn; đăng ký email thì vắng. */
  anhUrl?: string | null;
  /** Đường kính. Mặc định vừa cho một dòng tin nhắn. */
  co?: number;
  testID?: string;
}

/**
 * Ảnh đại diện tròn, có sẵn đường lùi khi người dùng chưa đặt ảnh.
 *
 * Phần lớn tài khoản WeDo đăng ký bằng email nên KHÔNG có ảnh — vòng tròn chữ
 * cái đầu là trạng thái thường gặp, không phải ngoại lệ. Thiếu đường lùi này
 * thì hầu hết tin nhắn nằm cạnh một ô trống.
 */
export function Avatar({ hoTen, anhUrl, co, testID }: AvatarProps) {
  const duongKinh = co ?? scale(32);
  const khung = {
    width: duongKinh,
    height: duongKinh,
    borderRadius: duongKinh / 2,
  };

  // Chuỗi rỗng cũng là "chưa có ảnh": đưa nó vào expo-image cho ra một ô trống.
  if (anhUrl) {
    return (
      <Image
        testID={testID ?? 'avatar-anh'}
        source={{ uri: anhUrl }}
        style={[styles.anh, khung]}
        contentFit="cover"
        accessibilityLabel={hoTen}
        transition={120}
      />
    );
  }

  return (
    <View testID={testID} style={[styles.chu, khung]}>
      <Text
        style={[styles.chuCai, { fontSize: Math.round(duongKinh * 0.42) }]}
        // Chữ trong vòng tròn không nới được: vòng tròn có kích cỡ cứng.
        maxFontSizeMultiplier={1}
      >
        {(hoTen.trim().charAt(0) || '?').toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  anh: { backgroundColor: colors.primarySoft },
  chu: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chuCai: { color: colors.primary, fontWeight: '700' },
});
