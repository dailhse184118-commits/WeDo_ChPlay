import { ApiError } from '../api/client';
import { cauLoiBaoCao } from '../bao-cao';

describe('cauLoiBaoCao', () => {
  it('dịch theo mã lỗi chứ không theo câu chữ', () => {
    expect(cauLoiBaoCao(new ApiError('x', 413, 'REPORT_TOO_LARGE'))).toMatch(/hơn 3\.000 việc/);
    expect(cauLoiBaoCao(new ApiError('x', 400, 'REPORT_BAD_RANGE'))).toMatch(/Khoảng thời gian/);
    expect(cauLoiBaoCao(new ApiError('x', 401, 'REPORT_LINK_INVALID'))).toMatch(/Xuất báo cáo lần nữa/);
  });

  it('404 và 429 có câu riêng', () => {
    expect(cauLoiBaoCao(new ApiError('Project not found', 404))).toBe(
      'Không tìm thấy dự án, hoặc bạn không còn trong dự án này.',
    );
    expect(cauLoiBaoCao(new ApiError('x', 429))).toBe('Bạn xuất báo cáo quá nhanh. Đợi một phút rồi thử lại.');
  });

  it('mất mạng: giữ câu tiếng Việt của apiRequest', () => {
    expect(cauLoiBaoCao(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))).toBe(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    );
  });

  it('lỗi không phải ApiError (ví dụ không mở được trình duyệt)', () => {
    expect(cauLoiBaoCao(new Error('No browser'))).toBe('Không mở được báo cáo. Thử lại sau ít phút.');
  });
});
