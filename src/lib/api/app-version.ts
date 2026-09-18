import { apiRequest } from './client';

export interface ThongTinPhienBan {
  /** Phiên bản mới nhất trên CH Play. Rỗng nghĩa là máy chủ chưa khai. */
  latest: string;
  /** Phiên bản thấp nhất còn dùng được. Thấp hơn nó là bị chặn hẳn. */
  minimum: string;
  /** Một câu mô tả bản mới. Có thể rỗng. */
  notes: string;
}

/**
 * `skipAuth` là bắt buộc, không phải tối ưu.
 *
 * App quá cũ phải biết điều đó trước cả màn đăng nhập — nếu API đã đổi kiểu phá
 * vỡ thì chính lượt đăng nhập cũng hỏng, và bắt xác thực trước khi được biết
 * "app của bạn quá cũ" là một vòng luẩn quẩn.
 */
export function getAppVersionInfo(): Promise<ThongTinPhienBan> {
  return apiRequest<ThongTinPhienBan>('/app-version', { skipAuth: true });
}
