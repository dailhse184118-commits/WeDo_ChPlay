import { apiRequest } from './client';

export interface DanhGiaCuaToi {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Đánh giá người dùng đã gửi, hoặc `null` nếu chưa gửi lần nào.
 *
 * Máy chủ chỉ cho mỗi người một lượt: gửi rồi thì bị khoá, muốn sửa phải nhờ
 * quản trị mở lại. Nên màn hình cần biết trước để hiện bản đã gửi thay vì một
 * form trống rồi mới báo lỗi lúc bấm nút.
 */
export function getMyFeedback(): Promise<DanhGiaCuaToi | null> {
  return apiRequest<DanhGiaCuaToi | null>('/feedback/mine');
}

/** `GET /feedback/status` — phần app dùng tới. Máy chủ còn trả `prompt`, ở đây không cần. */
export interface TrangThaiDanhGia {
  feedback: DanhGiaCuaToi | null;
  /** Chưa gửi lần nào, hoặc quản trị đã mở khoá cho gửi lại. */
  canSubmit: boolean;
  locked: boolean;
}

/**
 * Đã gửi chưa, và còn bị khoá không.
 *
 * Khác `getMyFeedback`: lượt này biết quản trị đã MỞ KHOÁ cho gửi lại hay chưa
 * (`unlockedAt` phía máy chủ). Đọc `/mine` thì thấy bản cũ là tưởng còn khoá.
 */
export function getFeedbackStatus(): Promise<TrangThaiDanhGia> {
  return apiRequest<TrangThaiDanhGia>('/feedback/status');
}

export function submitFeedback(rating: number, comment: string): Promise<DanhGiaCuaToi> {
  return apiRequest<DanhGiaCuaToi>('/feedback', {
    method: 'POST',
    body: { rating, comment },
  });
}
