import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, scale, spacing } from '../../theme/tokens';

interface ImageViewerProps {
  /** Ảnh đang xem. `null` là đóng. */
  url: string | null;
  /** Header xác thực, giống hệt bộ dùng cho ảnh trong bong bóng. */
  headers?: Record<string, string>;
  onDong: () => void;
}

/**
 * Xem một tấm ảnh chiếm hết màn hình.
 *
 * Ảnh trong bong bóng bị cắt vuông cho gọn dòng chat, nên ảnh chụp bảng hay
 * trang sách gần như không đọc được nếu không có chỗ xem lại nguyên khung.
 *
 * `contentFit="contain"` chứ không phải `cover`: ở đây mục đích là thấy đủ,
 * không phải lấp đầy.
 */
export function ImageViewer({ url, headers, onDong }: ImageViewerProps) {
  const insets = useSafeAreaInsets();

  if (!url) return null;

  return (
    <Modal
      testID="xem-anh"
      visible
      transparent
      animationType="fade"
      // Nút back cứng của Android. Không nối thì bấm back là thoát luôn màn chat.
      onRequestClose={onDong}
    >
      <View style={styles.nen}>
        <Pressable
          testID="xem-anh-dong"
          accessibilityRole="button"
          accessibilityLabel="Đóng ảnh"
          onPress={onDong}
          hitSlop={12}
          style={[styles.nutDong, { top: insets.top + spacing.md }]}
        >
          <Ionicons name="close" size={24} color={colors.onPrimary} />
        </Pressable>

        <Image
          source={{ uri: url, headers }}
          style={styles.anh}
          contentFit="contain"
          transition={120}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Nền đen đặc: ảnh sáng trên nền sáng thì không thấy được mép ảnh ở đâu.
  nen: { flex: 1, backgroundColor: '#000000', justifyContent: 'center' },
  anh: { flex: 1, width: '100%' },
  nutDong: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
    width: scale(40),
    height: scale(40),
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
