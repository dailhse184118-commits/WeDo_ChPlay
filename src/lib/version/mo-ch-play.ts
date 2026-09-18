import { Linking } from 'react-native';

const GOI = 'vn.wedo.app';
const DUONG_UNG_DUNG = `market://details?id=${GOI}`;
const DUONG_WEB = `https://play.google.com/store/apps/details?id=${GOI}`;

/**
 * Mở trang WeDo trên CH Play.
 *
 * Thử lược đồ `market://` trước vì nó mở thẳng ứng dụng CH Play. Máy không có
 * CH Play — máy ảo, ROM cọc cằn — sẽ ném lỗi ở bước đó, khi ấy mới rơi về
 * đường https để trình duyệt lo.
 *
 * Không dùng `canOpenURL`: trên Android nó đòi khai sẵn lược đồ trong phần
 * `queries` của manifest, thêm một chỗ nữa để quên. Thử rồi bắt lỗi đơn giản
 * hơn và cho kết quả y hệt.
 *
 * Nuốt mọi lỗi. Nút này là một lời mời, không phải một thao tác bắt buộc; hỏng
 * thì không đáng dội một hộp thoại lỗi lên mặt người dùng.
 */
export async function moChPlay(): Promise<void> {
  try {
    await Linking.openURL(DUONG_UNG_DUNG);
    return;
  } catch {
    // Không có CH Play. Thử đường web.
  }

  try {
    await Linking.openURL(DUONG_WEB);
  } catch {
    // Không có cả trình duyệt. Đành chịu.
  }
}
