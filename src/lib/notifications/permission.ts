import * as Notifications from 'expo-notifications';

/**
 * Trạng thái quyền thông báo, gộp lại thành ba nhóm mà giao diện quan tâm.
 *
 * `blocked` nghĩa là đã bị từ chối và Android không cho hỏi lại nữa — lúc đó chỉ
 * còn cách hướng dẫn người dùng vào Cài đặt hệ thống.
 */
export type NotificationPermissionState = 'granted' | 'undetermined' | 'blocked';

/**
 * Đọc trạng thái quyền mà KHÔNG hiện hộp thoại hệ thống.
 *
 * Cần tách khỏi `ensureNotificationPermission` vì Android chỉ cho hỏi một lần:
 * phải biết trạng thái trước để giải thích lý do, rồi mới gọi hộp thoại.
 */
export async function checkNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') return 'granted';
    if (current.canAskAgain === false) return 'blocked';
    return 'undetermined';
  } catch {
    // Thiếu module native: coi như không xin được, đừng mời gọi vô ích.
    return 'blocked';
  }
}

/**
 * Xin quyền `POST_NOTIFICATIONS`. Android 13+ bắt buộc hỏi.
 *
 * Không bao giờ ném lỗi. Người dùng từ chối quyền là chuyện bình thường, và app
 * vẫn phải dùng được — chỉ mất phần nhắc hạn cục bộ.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch {
    // Thiếu module native, hoặc nền tảng không hỗ trợ.
    return false;
  }
}
