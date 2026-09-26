import * as Notifications from 'expo-notifications';

import { meetingIdTuActionUrl } from './cuoc-hop';
import { nenHienThongBao } from './man-dang-mo';
import { anTrenMayNay } from './thanh-toan';

/** Phần `data` của một thông báo đẩy, hoặc `null` khi không đọc được. */
function duLieu(
  response: Notifications.NotificationResponse | null,
): Record<string, unknown> | null {
  const data = response?.notification?.request?.content?.data;
  return data && typeof data === 'object' ? (data as Record<string, unknown>) : null;
}

/**
 * Cho thông báo hiện cả khi app đang mở.
 *
 * Mặc định expo-notifications NUỐT thông báo tới lúc app ở tiền cảnh. Nhắc hạn mà
 * người dùng đang mở app thì vẫn phải thấy — nếu không, việc đến hạn trong lúc họ
 * đang chat sẽ trôi qua im lặng.
 *
 * Ngoại lệ duy nhất: tin nhắn của đúng khung chat đang mở — xem `nenHienThongBao`.
 *
 * Không đặt `shouldSetBadge`: badge trên icon do máy chủ đếm, không phải lịch cục bộ.
 */
export function configureNotificationHandler(): void {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (thongBao) => {
        const data = thongBao?.request?.content?.data;
        // iPhone không hiện thông báo gói/thanh toán — xem `thanh-toan.ts`.
        const hien = nenHienThongBao(data) && !anTrenMayNay(data?.type);

        return {
          shouldShowBanner: hien,
          shouldShowList: hien,
          shouldPlaySound: hien,
          shouldSetBadge: false,
        };
      },
    });
  } catch {
    // Thiếu module native. Không được làm sập app lúc khởi động.
  }
}

/** Lấy `taskId` mà `syncScheduledReminders` nhét vào phần `data` của lịch nhắc. */
export function taskIdFromResponse(response: Notifications.NotificationResponse | null): string | null {
  const data = duLieu(response);
  if (!data || anTrenMayNay(data.type)) return null;

  const taskId = data.taskId;
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
 *
 * Thông báo gói/thanh toán trên iPhone không mở đâu cả: app iPhone là bản đồng
 * hành miễn phí, không được có lối nào sang chỗ mua (Guideline 3.1.3(f)).
 */
export function duongDanTuThongBao(
  response: Notifications.NotificationResponse | null,
): string | null {
  const kho = duLieu(response);
  if (!kho || anTrenMayNay(kho.type)) return null;

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

    case 'MEETING_SCHEDULED': {
      /*
        Mở thẳng cuộc họp. Thông báo tạo trước 23/09/2026 không kèm id — lúc đó
        mở danh sách cuộc họp, vẫn hơn là chạm vào không có gì xảy ra.
      */
      const meetingId = meetingIdTuActionUrl(chuoi(kho, 'actionUrl'));
      return meetingId ? `/meetings/${meetingId}` : '/meetings';
    }

    default:
      return null;
  }
}
