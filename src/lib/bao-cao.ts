import { ApiError } from './api/client';

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  REPORT_TOO_LARGE:
    'Báo cáo có hơn 3.000 việc, quá lớn để xuất trên điện thoại. Hãy xuất trên máy tính và chọn khoảng thời gian ngắn hơn.',
  REPORT_BAD_RANGE: 'Khoảng thời gian của báo cáo không hợp lệ. Thử lại sau ít phút.',
  REPORT_LINK_INVALID: 'Link tải đã hết hạn. Bấm Xuất báo cáo lần nữa.',
};

export function cauLoiBaoCao(loi: unknown): string {
  if (loi instanceof ApiError) {
    if (loi.code && CAU_THEO_MA[loi.code]) return CAU_THEO_MA[loi.code];
    if (loi.status === 404) return 'Không tìm thấy dự án, hoặc bạn không còn trong dự án này.';
    if (loi.status === 429) return 'Bạn xuất báo cáo quá nhanh. Đợi một phút rồi thử lại.';
    // Mất mạng (status 0), máy chủ bận…: câu của apiRequest đã là tiếng Việt.
    return loi.message;
  }
  return 'Không mở được báo cáo. Thử lại sau ít phút.';
}
