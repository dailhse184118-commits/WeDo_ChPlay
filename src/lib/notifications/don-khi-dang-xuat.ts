import * as Notifications from 'expo-notifications';

/**
 * Dọn mọi thứ về thông báo mà người vừa dùng để lại trên máy. Gọi lúc đăng xuất
 * (cả tự bấm, xoá tài khoản lẫn bị đá ra vì phiên hết hạn).
 *
 * - Lời nhắc hạn đã hẹn trên máy: hệ điều hành giữ và tự bắn kể cả khi app đã
 *   đăng xuất, mang tên công việc của người trước — và với tài khoản vừa xoá thì
 *   là nhắc cho một tài khoản không còn tồn tại.
 * - Thông báo đang nằm trên khay: chạm vào là mở màn của người trước.
 * - Lần chạm thông báo gần nhất: expo-notifications giữ nó suốt đời tiến trình.
 *   Đăng nhập lại (kể cả tài khoản khác) là layout (tabs) dựng mới, đọc lại nó
 *   và mở lại đúng màn cũ — của người khác.
 *
 * Từng bước bọc riêng và không bao giờ ném: thiếu module native hay một bước
 * hỏng không được giữ người dùng lại trong app, cũng không được chặn bước sau.
 */
export async function donThongBaoKhiDangXuat(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {
    // Không huỷ được lịch nhắc: bỏ qua, vẫn phải đăng xuất.
  }

  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch {
    // Không gỡ được khay thông báo: bỏ qua.
  }

  try {
    Notifications.clearLastNotificationResponse();
  } catch {
    // Bản native không có hàm này: bỏ qua.
  }
}
