import React from 'react';
import { Platform, ScrollView, type ScrollViewProps } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

import { spacing } from '../../theme/tokens';

/**
 * Khung cuộn cho màn biểu mẫu có ô nhập nằm thấp.
 *
 * iPhone: `KeyboardAwareScrollView` của `react-native-keyboard-controller` tự
 * cuộn ô đang gõ lên trên bàn phím. iOS không có chế độ co cửa sổ như
 * `softwareKeyboardLayoutMode: "resize"` của Android, nên thiếu nó là bàn phím
 * che mất ô nhập và nút xác nhận.
 *
 * Android: vẫn là `ScrollView` thường, y như trước. Cơ chế chống bàn phím của
 * Android đã chỉnh qua nhiều lần; hai cơ chế chạy cùng lúc từng tranh nhau, nên
 * không đụng vào khi chưa thử được trên máy thật.
 *
 * Màn nào bọc khung này trong `KeyboardAvoidingView` thì phải TẮT cái đó trên
 * iPhone (`enabled={Platform.OS !== 'ios'}`), không thì bàn phím bị tính hai lần.
 */
export function KhungCuonBieuMau(props: ScrollViewProps) {
  if (Platform.OS === 'ios') {
    return <KeyboardAwareScrollView bottomOffset={spacing.lg} {...props} />;
  }
  return <ScrollView {...props} />;
}

/** Có dùng `KhungCuonBieuMau` kiểu iPhone không — để tắt `KeyboardAvoidingView` bọc ngoài. */
export function khungCuonTuLoBanPhim(): boolean {
  return Platform.OS === 'ios';
}
