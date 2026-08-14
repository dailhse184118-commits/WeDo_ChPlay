import { apiRequest, ApiError, onUnauthorized } from '../client';
import { loadRefreshToken, loadToken, saveRefreshToken, saveToken } from '../../auth/token-storage';

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => null),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(async () => undefined),
  saveRefreshToken: jest.fn(async () => undefined),
}));

const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;
const mockedLoadRefresh = loadRefreshToken as jest.MockedFunction<typeof loadRefreshToken>;
const mockedSaveToken = saveToken as jest.MockedFunction<typeof saveToken>;
const mockedSaveRefresh = saveRefreshToken as jest.MockedFunction<typeof saveRefreshToken>;

/** Mock fetch có kiểu rõ ràng, tránh phải kéo @types/node chỉ để dùng `global`. */
const mockFetch = jest.fn();

interface FetchInit {
  method: string;
  headers: Record<string, string>;
  body?: string | FormData;
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
    mockedLoadRefresh.mockResolvedValue(null);
    mockedSaveToken.mockClear();
    mockedSaveRefresh.mockClear();
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

  it('gửi thẳng FormData và để fetch tự đặt Content-Type', async () => {
    /*
      Upload tài liệu đi bằng multipart. JSON.stringify một FormData ra "{}",
      còn tự đặt Content-Type thì thiếu tham số `boundary` — máy chủ không tách
      nổi các phần và báo lỗi. Cả hai việc đó đều phải không xảy ra.
    */
    const form = new FormData();
    form.append('files', 'noi-dung-gia');
    mockFetchOnce({ ok: true });

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(lastInit().body).toBe(form);
    expect(lastInit().headers['Content-Type']).toBeUndefined();
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

describe('tự gia hạn phiên khi gặp 401', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockedLoadToken.mockResolvedValue('tok-cu');
    mockedLoadRefresh.mockResolvedValue('rt-cu');
    mockedSaveToken.mockClear();
    mockedSaveRefresh.mockClear();
  });

  it('làm mới token rồi thử lại, người dùng không thấy gì cả', async () => {
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    mockFetchOnce({ accessToken: 'tok-moi', refreshToken: 'rt-moi' });
    mockFetchOnce({ id: 'u-1' });

    await expect(apiRequest('/users/me')).resolves.toMatchObject({ id: 'u-1' });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(mockFetch.mock.calls[1][0]).toBe('https://api.test/auth/refresh');
  });

  it('lưu lại cả cặp token mới, vì token cũ đã bị máy chủ huỷ', async () => {
    // May chu xoay refresh token moi lan dung. Giu lai cai cu la lan sau hong.
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    mockFetchOnce({ accessToken: 'tok-moi', refreshToken: 'rt-moi' });
    mockFetchOnce({ id: 'u-1' });

    await apiRequest('/users/me');

    expect(mockedSaveToken).toHaveBeenCalledWith('tok-moi');
    expect(mockedSaveRefresh).toHaveBeenCalledWith('rt-moi');
  });

  it('gửi lại yêu cầu cũ với token mới chứ không phải token đã hết hạn', async () => {
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    mockFetchOnce({ accessToken: 'tok-moi', refreshToken: 'rt-moi' });
    mockFetchOnce({ id: 'u-1' });

    await apiRequest('/users/me');

    const lanCuoi = mockFetch.mock.calls[2][1] as FetchInit;
    expect(lanCuoi.headers.Authorization).toBe('Bearer tok-moi');
  });

  it('đá người dùng ra khi chính lượt gia hạn cũng bị từ chối', async () => {
    const handler = jest.fn();
    const huy = onUnauthorized(handler);
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    mockFetchOnce({ message: 'Phiên đăng nhập không hợp lệ' }, { status: 401 });

    await expect(apiRequest('/users/me')).rejects.toThrow(ApiError);
    expect(handler).toHaveBeenCalled();
    huy();
  });

  it('không thử gia hạn khi máy chưa có refresh token', async () => {
    // Ban cu dang nhap tu truoc khong co refresh token. Dung goi /auth/refresh vo ich.
    mockedLoadRefresh.mockResolvedValue(null);
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });

    await expect(apiRequest('/users/me')).rejects.toThrow(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('không tự gia hạn cho chính lượt đăng nhập, tránh vòng lặp', async () => {
    mockFetchOnce({ message: 'Email hoặc mật khẩu không đúng' }, { status: 401 });

    await expect(
      apiRequest('/auth/login', { method: 'POST', body: {}, skipAuth: true }),
    ).rejects.toThrow(ApiError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
