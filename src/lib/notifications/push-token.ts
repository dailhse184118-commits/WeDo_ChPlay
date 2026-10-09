import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '../api/notifications';
import { checkNotificationPermission, ensureNotificationPermission } from './permission';

/**
 * Mã dự án EAS. `getExpoPushTokenAsync` bắt buộc phải có trong bản đóng gói
 * thật (không phải Expo Go), nếu không nó không biết xin token cho ứng dụng nào.
 */
const EAS_PROJECT_ID = '69dcbb1c-23f5-47ea-9f56-4a555d4f5a23';

/**
 * Tên kênh thông báo phía Android.
 *
 * Phải khớp với `channelId` mà máy chủ gửi kèm trong
 * `ExpoPushService.guiMotLo`. Android 8 trở lên bắt buộc thông báo thuộc về một
 * kênh; gửi tới kênh chưa tạo thì thông báo tới máy nhưng không kêu.
 */
const KENH_MAC_DINH = 'default';

async function layTokenCuaMay(): Promise<string> {
  const ket_qua = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });
  return ket_qua.data;
}

/**
 * Tạo kênh thông báo mặc định. Gọi lúc app khởi động.
 *
 * Không làm gì trên iOS — khái niệm kênh chỉ có ở Android.
 */
export async function taoKenhThongBaoAndroid(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync(KENH_MAC_DINH, {
      name: 'Thông báo chung',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // Thiếu module native. App vẫn chạy, chỉ mất phần thông báo.
  }
}

/**
 * Máy đã có quyền thông báo chưa, trước khi xin token.
 *
 * Android: hỏi luôn nếu chưa có, như trước giờ.
 *
 * iPhone: CHỈ đọc, không bao giờ bật hộp thoại hệ thống ở đây. iOS chỉ cho hỏi
 * đúng một lần; bật ra ngay sau đăng nhập, khi người dùng chưa biết thông báo
 * để làm gì, thì phần lớn bấm "Không cho phép" và mất luôn (Apple khuyên hỏi
 * đúng lúc, kèm lời giải thích). Việc hỏi để dành cho thẻ "Nhắc bạn trước khi
 * việc đến hạn" ở tab Thông báo; đồng ý xong ở đó thì thẻ gọi lại hàm này.
 */
async function coQuyenThongBao(): Promise<boolean> {
  if (Platform.OS === 'ios') return (await checkNotificationPermission()) === 'granted';
  return ensureNotificationPermission();
}

/**
 * Ghi nhận thiết bị này với máy chủ. Gọi ngay sau khi đăng nhập, và sau khi
 * người dùng vừa cho phép thông báo ở tab Thông báo.
 *
 * Không bao giờ ném lỗi: mất thông báo đẩy là chuyện khó chịu, còn để nó làm
 * hỏng lượt đăng nhập là chuyện nghiêm trọng. Chưa cấu hình FCM thì Expo ném
 * lỗi ngay ở bước lấy token, và đó là trạng thái bình thường cho tới khi khoá
 * FCM được nạp lên.
 */
export async function dongBoPushToken(): Promise<void> {
  try {
    // Không có quyền thì Expo cũng không cấp token — kiểm trước cho khỏi phí.
    if (!(await coQuyenThongBao())) return;

    const token = await layTokenCuaMay();
    await registerPushToken(token, Platform.OS as 'android' | 'ios');
  } catch {
    // Nuốt: xem chú thích trên.
  }
}

/**
 * Gỡ thiết bị khỏi tài khoản. Gọi lúc đăng xuất, TRƯỚC khi xoá access token —
 * gọi sau thì request thiếu header xác thực và máy chủ từ chối.
 *
 * Token được hỏi lại từ hệ thống chứ không lưu sẵn: nó gắn với thiết bị nên
 * luôn ra cùng một giá trị, khỏi phải giữ trạng thái qua các lần mở app.
 */
export async function huyDangKyPushToken(): Promise<void> {
  try {
    await unregisterPushToken(await layTokenCuaMay());
  } catch {
    // Đăng xuất mà ném lỗi thì người dùng mắc kẹt trong app.
  }
}
