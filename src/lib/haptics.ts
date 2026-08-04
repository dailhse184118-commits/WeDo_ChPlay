import * as Haptics from 'expo-haptics';

/**
 * Rung phản hồi kiểu "cố gắng hết sức".
 *
 * Không bao giờ ném lỗi. Có ba tình huống thật khiến nó thất bại:
 *   1. Bản development build được tạo trước khi cài expo-haptics → thiếu module native
 *   2. Thiết bị không có mô-tơ rung
 *   3. Người dùng đã tắt phản hồi xúc giác trong cài đặt hệ thống
 *
 * Rung chỉ là thứ tô điểm. Để nó làm hỏng luồng tạo công việc là sai hoàn toàn,
 * mà `void Haptics.impactAsync(...)` thì đúng là gây unhandled promise rejection.
 */
export async function tapFeedback(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    // Cố ý im lặng.
  }
}
