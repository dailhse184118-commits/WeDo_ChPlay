import { ApiError, apiRequest } from '../client';

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => null),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(async () => undefined),
  saveRefreshToken: jest.fn(async () => undefined),
}));

describe('giữ lại câu lỗi gốc khi mạng hỏng', () => {
  // `globalThis` chứ không phải `global`: repo này cố ý không kéo @types/node.
  const fetchGoc = globalThis.fetch;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  });

  afterEach(() => {
    globalThis.fetch = fetchGoc;
  });

  /*
    Chốt chặn cho ngày 19/09/2026. Chỗ bắt lỗi từng viết `catch {` trơn, vứt
    sạch câu lỗi của hệ điều hành. Mọi sự cố mạng trông y hệt nhau, và không ai
    lần ra được vì sao không tải tệp lên được.
  */
  it('đính câu lỗi gốc vào `nguyenNhan`', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiRequest('/thu')).rejects.toMatchObject({
      status: 0,
      nguyenNhan: 'TypeError: Network request failed',
    });
  });

  it('người dùng vẫn thấy câu tiếng Việt, không phải câu kỹ thuật', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiRequest('/thu')).rejects.toThrow(/Không thể kết nối máy chủ/);
  });

  it('chịu được thứ bị ném ra không phải Error', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue('hong');

    await expect(apiRequest('/thu')).rejects.toMatchObject({ nguyenNhan: 'hong' });
  });

  it('không đính gì khi máy chủ trả lời bình thường', () => {
    expect(new ApiError('x', 500).nguyenNhan).toBeUndefined();
  });
});
