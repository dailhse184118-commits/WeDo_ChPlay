import { Linking, Platform } from 'react-native';

import { moChPlay } from './mo-ch-play';

/**
 * Đường dẫn máy chủ gửi có đúng là trang App Store không.
 *
 * Máy chủ đọc `MOBILE_IOS_STORE_URL` từ biến môi trường, nên một lần gõ nhầm
 * (dán link CH Play vào ô của iOS chẳng hạn) là iPhone mở Google Play — đúng
 * thứ Guideline 2.3.10 cấm. Chỉ nhận `itms-apps://` và trang https của Apple.
 */
export function laDuongAppStore(url: string | null | undefined): url is string {
  if (!url) return false;
  const gon = url.trim();
  if (gon.startsWith('itms-apps://')) return true;
  return /^https:\/\/(apps|itunes)\.apple\.com\//i.test(gon);
}

/**
 * Máy này có nút cập nhật dùng được không.
 *
 * Android luôn có: CH Play là đường cũ, không cần máy chủ gửi gì. iPhone chỉ
 * có khi máy chủ gửi đúng trang App Store — thiếu thì KHÔNG hiện màn chặn hay
 * nút cập nhật nào, vì bắt người dùng cập nhật mà không chỉ được chỗ cập nhật
 * là khoá họ ngoài app.
 */
export function coNutCapNhat(storeUrl: string | null | undefined): boolean {
  return Platform.OS === 'ios' ? laDuongAppStore(storeUrl) : true;
}

/** Chữ trên nút cập nhật. iPhone không bao giờ được nhắc tới CH Play (2.3.10). */
export function chuNutCapNhat(): string {
  return Platform.OS === 'ios' ? 'Mở App Store để cập nhật' : 'Mở CH Play để cập nhật';
}

/**
 * Mở cửa hàng ứng dụng của máy này tới trang WeDo.
 *
 * Android đi đường cũ `moChPlay`, không đổi gì — kể cả khi máy chủ có gửi
 * `storeUrl`. iPhone mở đúng `storeUrl` máy chủ gửi, sau khi kiểm là trang của
 * Apple; không có thì không làm gì cả.
 *
 * Nuốt mọi lỗi, cùng lý do với `moChPlay`: nút này là lời mời, hỏng thì không
 * đáng dội hộp thoại lỗi lên mặt người dùng.
 */
export async function moCuaHang(storeUrl: string | null | undefined): Promise<void> {
  if (Platform.OS !== 'ios') {
    await moChPlay();
    return;
  }

  if (!laDuongAppStore(storeUrl)) return;

  try {
    await Linking.openURL(storeUrl.trim());
  } catch {
    // Không mở được App Store. Đành chịu.
  }
}
