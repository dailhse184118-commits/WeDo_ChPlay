import { ApiError } from '../../lib/api/client';
import { dichThongBaoLoi } from '../loi';

const DU_PHONG_EN = 'Something went wrong.';
const DU_PHONG_VI = 'Đã có lỗi.';
const DAU_VIET = /[ạảãàáâấầẩẫậăắằẳẵặẹẻẽèéêếềểễệịỉĩìíọỏõòóôốồổỗộơớờởỡợụủũùúưứừửữựỳỷỹýđ]/i;

function loiApi(message: string, status: number, code?: string, chiTiet?: unknown) {
  const e = new ApiError(message, status, code);
  e.chiTiet = chiTiet;
  return e;
}

describe('tiếng Việt', () => {
  it('giữ nguyên câu của máy chủ', () => {
    expect(dichThongBaoLoi(loiApi('Email này đã được đăng ký', 409), DU_PHONG_VI, 'vi')).toBe('Email này đã được đăng ký');
  });
  it('không phải Error hoặc câu rỗng thì dùng câu dự phòng', () => {
    expect(dichThongBaoLoi('lạ', DU_PHONG_VI, 'vi')).toBe(DU_PHONG_VI);
    expect(dichThongBaoLoi(new Error('  '), DU_PHONG_VI, 'vi')).toBe(DU_PHONG_VI);
  });
});

describe('tiếng Anh', () => {
  it('mã lỗi đã biết → câu tiếng Anh, bất kể câu tiếng Việt', () => {
    expect(dichThongBaoLoi(loiApi('Hết lượt', 429, 'AI_DETECTION_LIMIT_REACHED', { limit: 300 }), DU_PHONG_EN, 'en')).toBe(
      'You have used all 300 AI credits for this month.',
    );
    expect(dichThongBaoLoi(loiApi('x', 409, 'INVITE_EXPIRED'), DU_PHONG_EN, 'en')).toMatch(/expired/);
  });
  it('mã BLOCKED phân biệt kết bạn với nhắn tin theo câu', () => {
    expect(dichThongBaoLoi(loiApi('Bạn không thể kết bạn với người này.', 403, 'BLOCKED'), DU_PHONG_EN, 'en')).toMatch(/friend/);
    expect(dichThongBaoLoi(loiApi('Bạn không thể nhắn tin.', 403, 'BLOCKED'), DU_PHONG_EN, 'en')).toMatch(/message/);
  });
  it.each([
    'SUBSCRIPTION_CONFLICT',
    'TRANSACTION_OWNED_BY_OTHER_USER',
    'WORKSPACE_OWNER_REQUIRED',
    'APPLE_IAP_DISABLED',
    'APPLE_TRANSACTION_INVALID',
  ])('mã thanh toán %s có câu tiếng Anh', (ma) => {
    const cau = dichThongBaoLoi(loiApi('Câu tiếng Việt', 400, ma), DU_PHONG_EN, 'en');
    expect(cau).not.toBe(DU_PHONG_EN);
    expect(cau).not.toMatch(DAU_VIET);
  });
  it('câu tiếng Việt cố định → câu tiếng Anh', () => {
    expect(dichThongBaoLoi(loiApi('Email hoặc mật khẩu không đúng', 401), DU_PHONG_EN, 'en')).toBe('Incorrect email or password');
    expect(dichThongBaoLoi(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0), DU_PHONG_EN, 'en')).toMatch(
      /connection/,
    );
  });
  it('câu theo mẫu có số mã', () => {
    expect(
      dichThongBaoLoi(new ApiError('Máy chủ đang bận hoặc đang khởi động lại (mã 502). Thử lại sau ít phút.', 502), DU_PHONG_EN, 'en'),
    ).toContain('502');
  });
  it('câu lạ → câu dự phòng; không phải Error → câu dự phòng', () => {
    expect(dichThongBaoLoi(loiApi('Một câu chưa ai dịch', 400), DU_PHONG_EN, 'en')).toBe(DU_PHONG_EN);
    expect(dichThongBaoLoi(undefined, DU_PHONG_EN, 'en')).toBe(DU_PHONG_EN);
    expect(dichThongBaoLoi('chuỗi', DU_PHONG_EN, 'en')).toBe(DU_PHONG_EN);
  });
});
