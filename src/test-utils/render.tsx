import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

/**
 * Số đo thật lấy từ máy ảo Pixel 7 chạy Android 17 bằng `dumpsys window`:
 *   thanh trạng thái   y = 0 → 136
 *   thanh điều hướng   y = 2337 → 2400
 *
 * Dùng số thật thay vì số 0 để test bắt được lỗi bố cục dưới chế độ edge-to-edge,
 * thứ mà Android 16 trở lên ép buộc và không cho tắt.
 */
export const TEST_SAFE_AREA = {
  frame: { x: 0, y: 0, width: 1080, height: 2400 },
  insets: { top: 136, left: 0, right: 0, bottom: 63 },
};

/**
 * Render một màn hình kèm SafeAreaProvider.
 *
 * Màn hình nào dùng `useSafeAreaInsets` hoặc `SafeAreaView` đều phải render qua
 * hàm này, nếu không sẽ ném "No safe area value available".
 */
export function renderScreen(ui: React.ReactElement) {
  return render(<SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>{ui}</SafeAreaProvider>);
}
