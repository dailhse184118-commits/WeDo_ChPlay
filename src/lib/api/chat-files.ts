import { taiMotTepLen } from './tai-tep';
import type { TepChon } from './tasks';

/**
 * Tải cả lô tệp lên, mỗi tệp một lượt gọi.
 *
 * Trước đây gói tất cả vào một `FormData` rồi gửi một lượt, nên máy chủ dựng
 * đúng MỘT tin nhắn mang nhiều ảnh. Cách đó không dùng được nữa: `FormData` của
 * React Native hỏng trên Expo SDK 57 — xem khối ghi chú trong `tai-tep.ts`.
 *
 * Đổi lại, mỗi tệp thành một tin nhắn riêng. Chấp nhận được: phần lớn người
 * dùng gửi một ảnh, và một ảnh gửi được vẫn hơn hẳn nhiều ảnh gửi không được.
 *
 * Gửi TUẦN TỰ chứ không song song: mạng di động nghẽn thì bắn năm lượt cùng
 * lúc làm tất cả cùng chậm, và thứ tự tin nhắn hiện ra sẽ lộn xộn.
 *
 * Chú thích chỉ gắn vào tệp ĐẦU TIÊN — lặp lại ở mọi ảnh thì người nhận đọc
 * thấy cùng một câu năm lần.
 */
export async function taiNhieuTepLen<T>(
  duongDan: string,
  files: TepChon[],
  content: string,
): Promise<T[]> {
  if (files.length === 0) {
    throw new Error('Hãy chọn ít nhất một ảnh để gửi.');
  }

  const ketQua: T[] = [];
  for (const [viTri, tep] of files.entries()) {
    ketQua.push(await taiMotTepLen<T>(duongDan, tep, viTri === 0 ? content : ''));
  }

  return ketQua;
}
