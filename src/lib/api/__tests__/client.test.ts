import {
  apiRequest,
  ApiError,
  batDauPhien,
  giaHanMotLuot,
  ketThucPhien,
  onUnauthorized,
} from '../client';
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

  /*
    `FormData` PHAI di qua `fetch`. Bo chuyen cua Expo — cho duy nhat hieu phan
    tep co `bytes()` — nam trong `fetch`, khong co trong XMLHttpRequest.

    Da tung thu day qua XMLHttpRequest de tranh `fetch`, va van hong: cai hong
    nam o HINH DANG phan tep, khong phai o cach gui. Chi tiet o
    `tai-tep-native.test.ts`.
  */
  it('gửi nguyên FormData qua fetch, không bọc thành JSON', async () => {
    const form = new FormData();
    form.append('files', 'noi-dung-gia');
    mockFetchOnce({ ok: true });

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(mockFetch.mock.calls[0][1].body).toBe(form);
  });

  /*
    Tu dat `multipart/form-data` la hong: chuoi do thieu tham so `boundary` ma
    chi tang fetch moi sinh ra duoc, nen may chu khong tach noi cac phan.
  */
  it('không tự đặt Content-Type cho FormData', async () => {
    const form = new FormData();
    form.append('files', 'noi-dung-gia');
    mockFetchOnce({ ok: true });

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(mockFetch.mock.calls[0][1].headers['Content-Type']).toBeUndefined();
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

  /*
    Ngay 19/09/2026 duong tai tep nem
    `IllegalArgumentException: Expected URL scheme 'http' or 'https'`
    tu tang native — mot cau loi khong he chi ra rang cau hinh moi la thu sai.
    Chan tu day thi lan sau doc mot cai la biet ngay.
  */
  /*
    Ngay 19/09/2026 bien tren EAS mang mot byte 0x16 (ky tu dieu khien SYN) vo
    hinh chen truoc `https://`. `fetch` lang le bo qua nen moi thu van chay,
    con OkHttp o tang native thi tu choi — va chot chan `https://` cua chinh
    ta cung truot, chan luon dang nhap cua moi nguoi. Phai got sach truoc khi
    kiem.
  */
  it('gọt ký tự điều khiển vô hình chen trước địa chỉ', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = '\u0016https://api.test';
    mockFetchOnce({ ok: true });

    await apiRequest('/health');

    expect(mockFetch).toHaveBeenCalledWith('https://api.test/health', expect.anything());
  });

  it('gọt BOM và khoảng trắng hai đầu địa chỉ', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = ' \uFEFFhttps://api.test/ \n';
    mockFetchOnce({ ok: true });

    await apiRequest('/health');

    expect(mockFetch).toHaveBeenCalledWith('https://api.test/health', expect.anything());
  });

  it('báo lỗi rõ ràng khi base URL thiếu https://', async () => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'api-wedo.azurewebsites.net';

    await expect(apiRequest('/users/me')).rejects.toThrow(
      'EXPO_PUBLIC_API_BASE_URL phải bắt đầu bằng http:// hoặc https://',
    );
    expect(mockFetch).not.toHaveBeenCalled();
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
    batDauPhien();
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

  /*
    Máy chủ quá tải hay đang khởi động lại (5xx) lúc gia hạn KHÔNG có nghĩa phiên
    đã hết. Trước đây mọi lỗi đều thành "hết phiên": người dùng bị đá ra màn đăng
    nhập chỉ vì máy chủ trục trặc vài giây, và socket thôi hẳn không nối lại.
  */
  it('máy chủ trục trặc (5xx) lúc gia hạn thì không đá người dùng ra', async () => {
    const handler = jest.fn();
    const huy = onUnauthorized(handler);
    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    mockFetchOnce({ message: 'Service Unavailable' }, { status: 503 });

    await expect(apiRequest('/users/me')).rejects.toMatchObject({ status: 503 });
    expect(handler).not.toHaveBeenCalled();
    huy();
  });

  it('gia hạn gặp 5xx thì ném lỗi (để thử lại sau), không trả null như phiên đã hết', async () => {
    mockFetchOnce({ message: 'Bad Gateway' }, { status: 502 });

    await expect(giaHanMotLuot()).rejects.toMatchObject({ status: 502 });
  });
});

/*
  Đăng xuất gửi /auth/logout với refresh token hiện tại. Nếu cùng lúc có một lượt
  gia hạn (socket bị ngắt đúng lúc đó chẳng hạn) cầm CÙNG refresh token đó:
  - máy chủ huỷ trước rồi mới xoay → coi là đánh cắp, đăng xuất MỌI thiết bị;
  - máy chủ xoay trước → phiên mới còn sống và token mới được ghi lại xuống máy
    SAU khi đã xoá — người vừa đăng xuất mở app lại vào thẳng tài khoản.
*/
describe('gia hạn trong lúc đăng xuất', () => {
  beforeEach(() => {
    batDauPhien();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    mockFetch.mockReset();
    globalThis.fetch = mockFetch as unknown as typeof fetch;
    mockedLoadToken.mockResolvedValue('tok-cu');
    mockedLoadRefresh.mockResolvedValue('rt-cu');
    mockedSaveToken.mockClear();
    mockedSaveRefresh.mockClear();
  });

  it('đã bắt đầu đăng xuất thì không gia hạn nữa', async () => {
    await ketThucPhien();

    await expect(giaHanMotLuot()).resolves.toBeNull();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  /*
    Lượt đang bay thì ĐỢI nó ghi xong rồi mới cho đăng xuất đi tiếp: /auth/logout
    phải mang refresh token mới nhất, không thì máy chủ không huỷ được phiên. Đợi
    ở đây cũng bảo đảm không lượt ghi nào rơi vào SAU lúc đã xoá token.
  */
  it('lượt gia hạn đang bay lúc đăng xuất: đợi nó ghi xong rồi mới đi tiếp', async () => {
    let traVe: (giaTri: unknown) => void = () => undefined;
    mockFetch.mockReturnValueOnce(new Promise((xong) => (traVe = xong)));
    const dangGiaHan = giaHanMotLuot();

    let daXongDangXuat = false;
    const dangXuat = ketThucPhien().then(() => {
      daXongDangXuat = true;
    });
    await Promise.resolve();
    expect(daXongDangXuat).toBe(false);

    traVe({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ accessToken: 'tok-moi', refreshToken: 'rt-moi' }),
    });
    await dangXuat;

    await expect(dangGiaHan).resolves.toBe('tok-moi');
    expect(mockedSaveRefresh).toHaveBeenCalledWith('rt-moi');
    // Sau đó thì không lượt nào được bắt đầu nữa.
    await expect(giaHanMotLuot()).resolves.toBeNull();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('đăng nhập lại thì gia hạn chạy bình thường', async () => {
    await ketThucPhien();
    batDauPhien();
    mockFetchOnce({ accessToken: 'tok-moi', refreshToken: 'rt-moi' });

    await expect(giaHanMotLuot()).resolves.toBe('tok-moi');
  });

  /* Mất mạng giữa chừng lúc gia hạn là "mất mạng", không phải một lỗi lạ. */
  it('mất mạng lúc gia hạn thì ném ApiError trạng thái 0', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(giaHanMotLuot()).rejects.toMatchObject({ status: 0 });
  });
});
