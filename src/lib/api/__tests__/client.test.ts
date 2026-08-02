import { apiRequest, ApiError, onUnauthorized } from '../client';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => null),
}));

const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;

/** Mock fetch có kiểu rõ ràng, tránh phải kéo @types/node chỉ để dùng `global`. */
const mockFetch = jest.fn();

interface FetchInit {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function lastInit(): FetchInit {
  return mockFetch.mock.calls[0][1] as FetchInit;
}

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  const text = body === undefined ? '' : JSON.stringify(body);
  mockFetch.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockedLoadToken.mockResolvedValue(null);
  });

  it('ghép base URL với đường dẫn', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/health');
    expect(mockFetch).toHaveBeenCalledWith('https://api.test/health', expect.anything());
  });

  it('cắt dấu gạch chéo thừa ở cuối base URL', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test/';
    mockFetchOnce({ ok: true });
    await apiRequest('/health');
    expect(mockFetch).toHaveBeenCalledWith('https://api.test/health', expect.anything());
  });

  it('gắn header Bearer khi đã có token', async () => {
    mockedLoadToken.mockResolvedValue('tok-1');
    mockFetchOnce({ ok: true });
    await apiRequest('/users/me');

    expect(lastInit().headers.Authorization).toBe('Bearer tok-1');
  });

  it('không gắn header Bearer khi chưa đăng nhập', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c' } });

    expect(lastInit().headers.Authorization).toBeUndefined();
  });

  it('serialize body thành JSON và đặt Content-Type', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c' } });

    expect(lastInit().body).toBe('{"email":"a@b.c"}');
    expect(lastInit().headers['Content-Type']).toBe('application/json');
  });

  it('trả dữ liệu đã parse khi thành công', async () => {
    mockFetchOnce({ id: 'u1', fullName: 'Lê Hữu Đại' });
    await expect(apiRequest<{ id: string }>('/users/me')).resolves.toEqual({
      id: 'u1',
      fullName: 'Lê Hữu Đại',
    });
  });

  it('trả undefined khi body rỗng', async () => {
    mockFetchOnce(undefined, { status: 204 });
    await expect(apiRequest('/notifications/read-all', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('ném ApiError kèm thông báo tiếng Việt từ server', async () => {
    mockFetchOnce({ message: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });

    await expect(apiRequest('/auth/register', { method: 'POST', body: {} })).rejects.toThrow(
      'Mật khẩu phải có ít nhất 6 ký tự',
    );
  });

  it('ghép mảng message của NestJS thành một chuỗi', async () => {
    mockFetchOnce(
      { message: ['Email không hợp lệ', 'Họ và tên không được để trống'] },
      { status: 400 },
    );

    await expect(apiRequest('/auth/register', { method: 'POST', body: {} })).rejects.toThrow(
      'Email không hợp lệ. Họ và tên không được để trống',
    );
  });

  it('gắn status vào ApiError', async () => {
    mockFetchOnce({ message: 'Không tìm thấy' }, { status: 404 });

    await expect(apiRequest('/tasks/nope')).rejects.toMatchObject({ status: 404 });
    expect(new ApiError('x', 404)).toBeInstanceOf(ApiError);
  });

  it('gọi handler đã đăng ký khi gặp 401', async () => {
    const handler = jest.fn();
    const unsubscribe = onUnauthorized(handler);

    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    await expect(apiRequest('/users/me')).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('không gọi handler nữa sau khi huỷ đăng ký', async () => {
    const handler = jest.fn();
    onUnauthorized(handler)();

    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    await expect(apiRequest('/users/me')).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('báo lỗi tiếng Việt khi mất mạng', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiRequest('/users/me')).rejects.toThrow(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    );
  });

  it('báo lỗi rõ ràng khi thiếu biến môi trường', async () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;

    await expect(apiRequest('/users/me')).rejects.toThrow(
      'Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.',
    );
  });
});
