import { Platform } from 'react-native';

import { apiRequest } from './client';

export interface ThongTinPhienBan {
  /**
   * Phiên bản mới nhất trên cửa hàng của nền tảng này. Rỗng hoặc `null` nghĩa là
   * máy chủ chưa khai — iOS chưa khai thì máy chủ trả `null`.
   */
  latest: string | null;
  /** Phiên bản thấp nhất còn dùng được. Thấp hơn nó là bị chặn hẳn. */
  minimum: string | null;
  /** Một câu mô tả bản mới. Có thể rỗng. */
  notes: string;
  /**
   * Trang của WeDo trên cửa hàng. Máy chủ cũ chưa gửi trường này, nên tuỳ chọn.
   * iPhone chỉ mở trang này; Android vẫn đi đường CH Play cũ.
   */
  storeUrl?: string | null;
}

/** Tham số `platform` gửi máy chủ. Máy chủ coi thiếu tham số là Android. */
function nenTang(): 'ios' | 'android' {
  return Platform.OS === 'ios' ? 'ios' : 'android';
}

/**
 * `skipAuth` là bắt buộc, không phải tối ưu.
 *
 * App quá cũ phải biết điều đó trước cả màn đăng nhập — nếu API đã đổi kiểu phá
 * vỡ thì chính lượt đăng nhập cũng hỏng, và bắt xác thực trước khi được biết
 * "app của bạn quá cũ" là một vòng luẩn quẩn.
 *
 * Gửi kèm nền tảng: App Store duyệt chậm hơn CH Play nhiều ngày, nên iPhone có
 * bộ số phiên bản riêng. Dùng chung là bắt người dùng iPhone cập nhật một bản
 * chưa có trên App Store.
 */
export function getAppVersionInfo(): Promise<ThongTinPhienBan> {
  return apiRequest<ThongTinPhienBan>(`/app-version?platform=${nenTang()}`, { skipAuth: true });
}
