import * as Notifications from 'expo-notifications';

/**
 * Cho thông báo hiện cả khi app đang mở.
 *
 * Mặc định expo-notifications NUỐT thông báo tới lúc app ở tiền cảnh. Nhắc hạn mà
 * người dùng đang mở app thì vẫn phải thấy — nếu không, việc đến hạn trong lúc họ
 * đang chat sẽ trôi qua im lặng.
 *
 * Không đặt `shouldSetBadge`: badge trên icon do máy chủ đếm, không phải lịch cục bộ.
 */
export function configureNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    // Thiếu module native. Không được làm sập app lúc khởi động.
  }
}

/** Lấy `taskId` mà `syncScheduledReminders` nhét vào phần `data` của lịch nhắc. */
export function taskIdFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const data = response?.notification?.request?.content?.data;
  if (!data || typeof data !== 'object') return null;

  const taskId = (data as Record<string, unknown>).taskId;
  return typeof taskId === 'string' && taskId.length > 0 ? taskId : null;
}
