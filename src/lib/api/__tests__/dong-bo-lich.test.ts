import { ApiError, MA_PHAN_HOI_LA, apiRequest } from '../client';
import { cauLoiDongBoLich, layDongBoLich, taoLinkDongBoLich, tatDongBoLich } from '../dong-bo-lich';

// Giữ `ApiError` thật: `cauLoiDongBoLich` phân loại bằng `instanceof`.
jest.mock('../client', () => ({
  ...jest.requireActual<typeof import('../client')>('../client'),
  apiRequest: jest.fn(),
}));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

const CO_LINK = {
  duocDung: true,
  coLink: true,
  url: 'https://wedofpt.com.vn/lich/AbCdEfGhIjKlMnOpQrStUvWxYz0123456789_-AbCd.ics',
  taoLuc: '2026-10-03T02:00:00.000Z',
  layLanCuoi: null,
};

describe('API đồng bộ lịch', () => {
  beforeEach(() => jest.clearAllMocks());

  it('GET trạng thái', async () => {
    mockedRequest.mockResolvedValueOnce(CO_LINK as never);

    await expect(layDongBoLich()).resolves.toEqual(CO_LINK);
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed');
  });

  it('POST tạo/đổi link luôn gửi tiếng Việt', async () => {
    mockedRequest.mockResolvedValueOnce(CO_LINK as never);

    await expect(taoLinkDongBoLich()).resolves.toEqual(CO_LINK);
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed', {
      method: 'POST',
      body: { lang: 'vi' },
    });
  });

  it('DELETE tắt đồng bộ; thân rỗng của 204 không làm hỏng gì', async () => {
    mockedRequest.mockResolvedValueOnce(undefined as never);

    await expect(tatDongBoLich()).resolves.toBeUndefined();
    expect(mockedRequest).toHaveBeenCalledWith('/calendar-feed', { method: 'DELETE' });
  });
});

describe('cauLoiDongBoLich', () => {
  it('403 ngoài gói: dịch theo mã, không theo câu của máy chủ', () => {
    expect(
      cauLoiDongBoLich(new ApiError('Đồng bộ lịch dành cho gói Pro và Team.', 403, 'CALENDAR_FEED_NOT_IN_PLAN')),
    ).toBe('Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.');
  });

  it('429 có câu riêng', () => {
    expect(cauLoiDongBoLich(new ApiError('ThrottlerException: Too Many Requests', 429))).toBe(
      'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.',
    );
  });

  it('mất mạng: giữ câu tiếng Việt của apiRequest', () => {
    expect(cauLoiDongBoLich(new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0))).toBe(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    );
  });

  it('5xx, trang lỗi của cổng, câu tiếng Anh của máy chủ: một câu Việt chung', () => {
    const chung = 'Chưa làm được lúc này. Thử lại sau ít phút.';
    expect(cauLoiDongBoLich(new ApiError('Internal server error', 500))).toBe(chung);
    expect(cauLoiDongBoLich(new ApiError('Máy chủ đang bận', 502, MA_PHAN_HOI_LA))).toBe(chung);
    expect(cauLoiDongBoLich(new ApiError('lang must be one of the following values: vi, en', 400))).toBe(chung);
    expect(cauLoiDongBoLich(new Error('Share failed'))).toBe(chung);
    expect(cauLoiDongBoLich(undefined)).toBe(chung);
  });

  it('mã trùng tên thuộc tính của Object.prototype không lọt thành hàm', () => {
    expect(cauLoiDongBoLich(new ApiError('x', 403, 'toString'))).toBe(
      'Chưa làm được lúc này. Thử lại sau ít phút.',
    );
    expect(cauLoiDongBoLich(new ApiError('x', 403, 'constructor'))).toBe(
      'Chưa làm được lúc này. Thử lại sau ít phút.',
    );
  });
});
