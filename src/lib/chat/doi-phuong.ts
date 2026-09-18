import type { DirectConversation, UserSummary } from '../types';

/**
 * Người kia trong một hội thoại riêng.
 *
 * Máy chủ trả về cả hai người tham gia, còn mọi chỗ hiển thị đều chỉ cần "người
 * kia là ai" — tên nào lên tiêu đề, avatar nào lên danh sách, chấm online theo
 * ai. Để phép lọc này rải trong component thì lặp ba chỗ, và mỗi chỗ lại tự xử
 * lý trường hợp thiếu một kiểu.
 *
 * Trả `null` chứ không ném: hội thoại có thể thiếu người tham gia nếu tài khoản
 * kia vừa bị xoá, và một dòng danh sách hỏng không được phép làm sập cả màn.
 */
export function doiPhuong(
  conversation: DirectConversation,
  userId: string,
): UserSummary | null {
  const participants = conversation?.participants ?? [];

  // Kiểm mình có trong hội thoại trước. Thiếu bước này thì đưa vào một hội thoại
  // của người khác sẽ trả về một người lạ thay vì báo không hợp lệ.
  if (!participants.some((item) => item.userId === userId)) return null;

  const khac = participants.find((item) => item.userId !== userId);
  return khac?.user ?? null;
}
