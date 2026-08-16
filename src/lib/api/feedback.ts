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

export function submitFeedback(rating: number, comment: string): Promise<DanhGiaCuaToi> {
  return apiRequest<DanhGiaCuaToi>('/feedback', {
    method: 'POST',
    body: { rating, comment },
  });
}
