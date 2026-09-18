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

/** Đọc một trường chuỗi không rỗng trong phần `data` của thông báo. */
function chuoi(data: Record<string, unknown>, ten: string): string | null {
  const gia = data[ten];
  return typeof gia === 'string' && gia.length > 0 ? gia : null;
}

/**
 * Màn hình cần mở khi người dùng chạm vào một thông báo đẩy.
 *
 * Chạm vào thông báo mà chỉ mở màn hình chính là hỏng mất mục đích: người dùng
 * vừa được báo có tin nhắn, giờ phải tự đi tìm nó.
 *
 * Trả `null` cho thông báo công việc — chúng đi đường riêng qua
 * `taskIdFromResponse` đã có từ trước. Trả đường dẫn cho cả hai thì màn hình
 * nhảy hai lần.
 */
export function duongDanTuThongBao(
  response: Notifications.NotificationResponse | null,
): string | null {
  const data = response?.notification?.request?.content?.data;
  if (!data || typeof data !== 'object') return null;

  const kho = data as Record<string, unknown>;

  switch (kho.type) {
    case 'DIRECT_MESSAGE': {
      const conversationId = chuoi(kho, 'conversationId');
      if (!conversationId) return null;

      // Tiêu đề màn nhắn tin lấy tên từ tham số đường dẫn. Thiếu tên thì để
      // rỗng — màn hình tự lùi về chữ "Tin nhắn", vẫn hơn là không mở được.
      const ten = chuoi(kho, 'tenNguoiGui') ?? '';
      return `/chat/dm/${conversationId}?ten=${encodeURIComponent(ten)}`;
    }

    case 'PROJECT_MESSAGE': {
      const projectId = chuoi(kho, 'projectId');
      return projectId ? `/chat/${projectId}` : null;
    }

    case 'FRIEND_REQUEST':
    case 'FRIEND_ACCEPTED':
      return '/chat/friends';

    default:
      return null;
  }
}
