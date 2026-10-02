import { ApiError } from '../api/client';
import {
  cauLoiMoi,
  dinhDangOMaMoi,
  hienThiHanMoi,
  maGuiDi,
  noiDungChiaSe,
} from '../loi-moi';

describe('dinhDangOMaMoi', () => {
  it('tự viết hoa và tự thêm gạch giữa khi gõ', () => {
    expect(dinhDangOMaMoi('7k3')).toBe('7K3');
    expect(dinhDangOMaMoi('7k3m')).toBe('7K3M');
    expect(dinhDangOMaMoi('7k3m9')).toBe('7K3M-9');
    expect(dinhDangOMaMoi('7k3m9qxa')).toBe('7K3M-9QXA');
  });

  it('dán mã có khoảng trắng hay gạch vẫn ra đúng dạng, cắt ở 8 ký tự', () => {
    expect(dinhDangOMaMoi(' 7k3m - 9qxa ')).toBe('7K3M-9QXA');
    expect(dinhDangOMaMoi('7K3M-9QXA-THUA')).toBe('7K3M-9QXA');
  });

  it('xoá lùi qua dấu gạch không bị kẹt', () => {
    expect(dinhDangOMaMoi('7K3M-')).toBe('7K3M');
  });
});

describe('maGuiDi', () => {
  it('bỏ gạch; chưa đủ 8 ký tự thì chưa gửi', () => {
    expect(maGuiDi('7K3M-9QXA')).toBe('7K3M9QXA');
    expect(maGuiDi('7K3M-9Q')).toBeNull();
  });
});

describe('cauLoiMoi', () => {
  it.each([
    ['INVITE_NOT_FOUND', 404, 'Mã mời không đúng hoặc không còn dùng được.'],
    ['INVITE_EXPIRED', 410, 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.'],
    ['INVITE_REVOKED', 410, 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.'],
    ['INVITE_PROJECT_CLOSED', 410, 'Dự án này đã đóng, không nhận thêm thành viên.'],
  ])('dịch theo mã %s, không theo câu máy chủ gửi', (ma, status, cau) => {
    expect(cauLoiMoi(new ApiError('Not Found', status, ma))).toBe(cau);
  });

  it('thử quá nhanh (429) thì bảo đợi', () => {
    expect(cauLoiMoi(new ApiError('Bạn thao tác quá nhanh.', 429))).toBe(
      'Bạn thử quá nhiều lần. Đợi một phút rồi thử lại.',
    );
  });

  it('lỗi khác giữ câu của lớp gọi mạng; lỗi lạ có câu chung', () => {
    expect(cauLoiMoi(new ApiError('Không thể kết nối máy chủ.', 0))).toBe('Không thể kết nối máy chủ.');
    expect(cauLoiMoi(new Error('x'))).toBe('Có lỗi xảy ra. Thử lại sau ít phút.');
  });
});

describe('noiDungChiaSe', () => {
  it('đúng câu của spec, mã chia đôi bằng gạch', () => {
    expect(
      noiDungChiaSe('Đồ án EXE', { url: 'https://wedofpt.com.vn/#/moi/7K3M9QXA', code: '7K3M9QXA' }),
    ).toBe(
      'Tham gia dự án Đồ án EXE trên WeDo: https://wedofpt.com.vn/#/moi/7K3M9QXA. Hoặc nhập mã 7K3M-9QXA trong app.',
    );
  });
});

describe('hienThiHanMoi', () => {
  it('giờ Việt Nam, không phụ thuộc múi giờ của máy', () => {
    expect(hienThiHanMoi('2026-10-09T03:30:00.000Z')).toBe('10:30 09/10/2026');
    expect(hienThiHanMoi('khong-phai-ngay')).toBe('');
  });
});
