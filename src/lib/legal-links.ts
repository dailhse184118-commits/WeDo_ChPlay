import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

/*
  Đường dẫn pháp lý và hỗ trợ, gom một chỗ.

  Màn đăng ký, màn đồng ý điều khoản và tab Tài khoản cùng trỏ tới đây. Để rải
  trong từng màn thì sớm muộn hai màn trỏ hai địa chỉ khác nhau — mà reviewer
  của Apple bấm thử từng đường một.
*/

/**
 * Chính sách quyền riêng tư.
 *
 * Vẫn đọc `EXPO_PUBLIC_PRIVACY_URL` trước để bản build cũ và bản thử nghiệm
 * trỏ đi đâu thì vẫn trỏ đó. Chưa khai thì dùng trang chính thức — trước đây
 * thiếu biến là dòng "Chính sách bảo mật" biến mất khỏi app, mà Apple bắt buộc
 * phải có đường tới chính sách ngay trong app (Guideline 5.1.1).
 *
 * `process.env.EXPO_PUBLIC_*` được thay lúc build, nên phải viết nguyên biểu thức.
 */
export const PRIVACY_URL =
  process.env.EXPO_PUBLIC_PRIVACY_URL?.trim() || 'https://wedofpt.com.vn/privacy.html';

/** Điều khoản sử dụng — người dùng đồng ý lúc đăng ký hoặc ở màn đồng ý một lần. */
export const TERMS_URL = 'https://wedofpt.com.vn/dieu-khoan.html';

/** Trang hỗ trợ: cách liên hệ, cách báo cáo nội dung xấu, cách xoá tài khoản. */
export const SUPPORT_URL = 'https://wedofpt.com.vn/ho-tro.html';

/** Hộp thư hỗ trợ, cùng địa chỉ in trên chính sách và trang xoá tài khoản. */
export const SUPPORT_EMAIL = 'wedosupport6886@gmail.com';

/**
 * Mở một trang pháp lý ngay trong app, bằng trình duyệt nhúng.
 *
 * Trình duyệt nhúng giữ người dùng lại trong WeDo: đọc xong đóng là về đúng
 * chỗ đang đứng — quan trọng ở màn đăng ký, nơi họ đã gõ dở cả biểu mẫu.
 *
 * Máy không mở được trình duyệt nhúng thì lùi về trình duyệt ngoài. Nuốt lỗi
 * cuối cùng: không mở được trang thì cũng không được làm sập màn hình đang gõ.
 */
export async function openLegalLink(url: string): Promise<void> {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    try {
      await Linking.openURL(url);
    } catch {
      // Không có trình duyệt nào mở được. Không còn gì để làm.
    }
  }
}
