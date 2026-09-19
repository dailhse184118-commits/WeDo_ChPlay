import { apiRequest } from '../client';

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => 'token-gia'),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(async () => undefined),
  saveRefreshToken: jest.fn(async () => undefined),
}));

/** XHR giả, đủ dùng cho đường tải tệp. */
class XhrGia {
  static lanCuoi: XhrGia | null = null;

  static ketQua: { status: number; body: string } | 'loi' = { status: 200, body: '{"ok":true}' };

  method = '';
  url = '';
  headers: Record<string, string> = {};
  daGui: unknown = null;
  status = 0;
  responseText = '';
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;

  constructor() {
    XhrGia.lanCuoi = this;
  }

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(ten: string, gia: string) {
    this.headers[ten] = gia;
  }

  send(than: unknown) {
    this.daGui = than;
    // Gọi bất đồng bộ cho giống thật.
    setTimeout(() => {
      if (XhrGia.ketQua === 'loi') {
        this.onerror?.();
        return;
      }
      this.status = XhrGia.ketQua.status;
      this.responseText = XhrGia.ketQua.body;
      this.onload?.();
    }, 0);
  }
}

describe('tải tệp đi bằng XMLHttpRequest', () => {
  const fetchGia = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    XhrGia.lanCuoi = null;
    XhrGia.ketQua = { status: 200, body: '{"ok":true}' };
    (globalThis as { XMLHttpRequest?: unknown }).XMLHttpRequest = XhrGia;
    globalThis.fetch = fetchGia as never;
  });

  /*
    Ly do ton tai cua ca duong nay.

    Expo SDK 57 thay `fetch` toan cuc bang ban cua no, ma ban do KHONG ho tro
    cach React Native dinh tep bang `{uri, name, type}` — xem chu thich trong
    `expo/src/winter/fetch/convertFormData.ts`: "`uri` is not supported for
    React Native's FormData".

    Hau qua: MOI lan tai tep deu hong, va `fetch` nem loi tang mang nen trong
    y het mat song. Do dung la loi nguoi kiem thu bao ngay 19/09/2026.
  */
  it('không dùng fetch cho FormData', async () => {
    const form = new FormData();
    form.append('files', 'gia');

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(fetchGia).not.toHaveBeenCalled();
    expect(XhrGia.lanCuoi?.daGui).toBe(form);
  });

  it('vẫn dùng fetch cho thân JSON', async () => {
    fetchGia.mockResolvedValue({ ok: true, status: 200, text: async () => '{}' });

    await apiRequest('/thu', { method: 'POST', body: { a: 1 } });

    expect(fetchGia).toHaveBeenCalled();
    expect(XhrGia.lanCuoi).toBeNull();
  });

  it('gửi đúng phương thức và đường dẫn đầy đủ', async () => {
    const form = new FormData();

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(XhrGia.lanCuoi?.method).toBe('POST');
    expect(XhrGia.lanCuoi?.url).toBe('https://api.test/tasks/t1/submissions');
  });

  it('kèm header xác thực', async () => {
    const form = new FormData();

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(XhrGia.lanCuoi?.headers.Authorization).toBe('Bearer token-gia');
  });

  /*
    Tu dat Content-Type la thieu tham so `boundary` ma chi tang duoi moi sinh
    ra duoc, may chu khong tach noi cac phan.
  */
  it('TUYỆT ĐỐI không tự đặt Content-Type', async () => {
    const form = new FormData();

    await apiRequest('/tasks/t1/submissions', { method: 'POST', body: form });

    expect(XhrGia.lanCuoi?.headers['Content-Type']).toBeUndefined();
  });

  it('trả dữ liệu đã parse khi thành công', async () => {
    XhrGia.ketQua = { status: 201, body: '{"id":"m1"}' };
    const form = new FormData();

    await expect(apiRequest('/tasks/t1/submissions', { method: 'POST', body: form })).resolves.toEqual(
      { id: 'm1' },
    );
  });

  it('máy chủ báo lỗi thì giữ nguyên câu của máy chủ', async () => {
    XhrGia.ketQua = { status: 400, body: '{"message":"File không hợp lệ."}' };
    const form = new FormData();

    await expect(
      apiRequest('/tasks/t1/submissions', { method: 'POST', body: form }),
    ).rejects.toThrow('File không hợp lệ.');
  });

  it('mạng hỏng thì giữ lại nguyên nhân như đường fetch', async () => {
    XhrGia.ketQua = 'loi';
    const form = new FormData();

    await expect(
      apiRequest('/tasks/t1/submissions', { method: 'POST', body: form }),
    ).rejects.toMatchObject({ status: 0, nguyenNhan: expect.stringContaining('XMLHttpRequest') });
  });
});
