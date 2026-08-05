import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';

/**
 * Nạp lại mỗi lần màn hình được đưa lên trước.
 *
 * Các màn trong thanh tab KHÔNG bị gỡ khi đổi tab, nên `refetchOnMount` của
 * react-query chỉ chạy đúng một lần trong cả phiên. Thiếu móc này thì đổi tab
 * xong dữ liệu vẫn là bản chụp từ lúc mở app.
 *
 * Vẫn tôn trọng `staleTime`, nên bấm qua bấm lại thanh tab không gọi API liên tục.
 */
export function useRefetchOnScreenFocus(refetch: () => unknown): void {
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );
}
