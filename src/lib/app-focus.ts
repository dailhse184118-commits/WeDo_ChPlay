import { AppState, type AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

/**
 * Nối vòng đời app của React Native vào react-query.
 *
 * `refetchOnWindowFocus` sinh ra cho trình duyệt và **không tự chạy** trên React
 * Native — không có sự kiện `focus` của cửa sổ. Thiếu cầu nối này thì tuỳ chọn đó
 * bật hay tắt cũng như nhau.
 *
 * Có nó rồi thì quay lại app là dữ liệu tự tươi, không phải kéo làm mới. Vẫn tôn
 * trọng `staleTime`, nên chuyển qua chuyển lại liên tục cũng không nạp lại liên tục.
 */
export function bridgeAppStateToQueryFocus(): () => void {
  const subscription = AppState.addEventListener('change', (status: AppStateStatus) => {
    focusManager.setFocused(status === 'active');
  });

  return () => subscription.remove();
}
