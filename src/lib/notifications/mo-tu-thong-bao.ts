import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';

import { duongDanTuThongBao, taskIdFromResponse } from './handler';

/**
 * Chạm vào thông báo thì mở thẳng thứ được báo.
 *
 * Gọi từ layout (tabs) chứ không ở layout gốc vì layout đó chỉ dựng khi đã đăng
 * nhập — điều hướng tới `/tasks/:id` lúc còn ở màn đăng nhập sẽ đưa người dùng
 * vào màn hình họ không có quyền xem.
 *
 * Xử lý cả hai đường: app đang chạy sẵn, và app bị đánh thức từ trạng thái tắt hẳn.
 */
export function useOpenTaskFromNotification() {
  const router = useRouter();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    function open(response: Notifications.NotificationResponse | null) {
      const key = response?.notification?.request?.identifier ?? null;
      if (!key || handled.current === key) return;

      /*
        Quên lần chạm này ngay khi đã đọc, kể cả khi nó không dẫn tới màn nào.
        expo-notifications giữ nó suốt đời tiến trình, còn `handled` mất theo
        layout này: đăng xuất rồi đăng nhập lại (kể cả tài khoản khác) là layout
        dựng mới, đọc lại đúng lần chạm cũ và mở lại màn của người trước.
      */
      try {
        Notifications.clearLastNotificationResponse();
      } catch {
        // Bản native không có hàm này: `handled` vẫn chặn được trong phiên này.
      }

      /*
        Tin nhắn và kết bạn đi trước, vì chúng nói rõ mình muốn mở màn nào.
        Nhắc hạn công việc chỉ kèm `taskId` nên xét sau.
      */
      const duongDan = duongDanTuThongBao(response);
      if (duongDan) {
        handled.current = key;
        router.push(duongDan as never);
        return;
      }

      const taskId = taskIdFromResponse(response);
      if (!taskId) return;

      handled.current = key;
      router.push(`/tasks/${taskId}`);
    }

    try {
      void Notifications.getLastNotificationResponseAsync().then(open);
      const subscription = Notifications.addNotificationResponseReceivedListener(open);
      return () => subscription.remove();
    } catch {
      // Thiếu module native: bỏ qua, phần còn lại của app vẫn chạy.
      return undefined;
    }
  }, [router]);
}
