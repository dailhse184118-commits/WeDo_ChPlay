import { phanTepGuiLen, type TepChon } from './tasks';

/**
 * Gói ảnh và chú thích thành `FormData` mà `FilesInterceptor` phía máy chủ hiểu.
 *
 * Dùng chung cho chat dự án và tin nhắn riêng: hai đường dẫn khác nhau nhưng
 * cùng một hình dạng thân yêu cầu.
 *
 * Chú thích đi CÙNG tin ảnh chứ không tách thành tin riêng — tách ra thì người
 * nhận thấy hai bong bóng và thứ tự có thể đảo.
 */
export function goiTepChat(files: TepChon[], content: string): FormData {
  if (files.length === 0) {
    throw new Error('Hãy chọn ít nhất một ảnh để gửi.');
  }

  const form = new FormData();
  for (const tep of files) {
    // `as never`: kiểu FormData của TS lấy từ chuẩn web, không biết dạng tệp của RN.
    form.append('files', phanTepGuiLen(tep) as never);
  }

  const chuThich = content.trim();
  if (chuThich) form.append('content', chuThich);

  return form;
}
