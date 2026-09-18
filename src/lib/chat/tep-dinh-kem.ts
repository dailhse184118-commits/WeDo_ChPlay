import type { ChatAttachment } from '../types';

/** Đúng bộ kiểu ảnh mà `validateChatFiles` phía máy chủ cho qua. */
const KIEU_ANH = /^image\/(jpeg|png|webp|gif)$/i;

/** Dự phòng khi máy chủ không có kiểu: vài nguồn trên Android trả kiểu rỗng. */
const DUOI_ANH = /\.(jpe?g|png|webp|gif)$/i;

/**
 * Tệp này có dựng ra ảnh được không.
 *
 * Ảnh thì hiện thẳng trong bong bóng; thứ khác thành một thẻ có tên tệp. Đoán
 * nhầm một tấm ảnh thành tài liệu chỉ tổ bắt người dùng chạm thêm một lần mới
 * xem được thứ họ vừa gửi.
 */
export function laAnh(tep: ChatAttachment): boolean {
  if (tep.mimeType && KIEU_ANH.test(tep.mimeType)) return true;
  if (tep.mimeType) return false;

  return DUOI_ANH.test(tep.originalName || '');
}

/**
 * Đường dẫn đầy đủ để tải một tệp đính kèm.
 *
 * Máy chủ trả `url` tương đối (`/chat/attachments/<id>`). Riêng ảnh đại diện
 * lấy từ Google đã là URL tuyệt đối — ghép thêm gốc máy chủ WeDo vào đó cho ra
 * một đường dẫn không tồn tại, nên phải để nguyên.
 */
export function duongDanTepDinhKem(tep: ChatAttachment, goc: string): string {
  if (/^https?:\/\//i.test(tep.url)) return tep.url;

  return `${goc.replace(/\/+$/, '')}${tep.url}`;
}
