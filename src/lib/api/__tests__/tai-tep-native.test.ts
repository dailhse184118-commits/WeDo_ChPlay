import { File, UploadType } from 'expo-file-system';

import { taiMotTepLen } from '../tai-tep';

jest.mock('expo-file-system', () => {
  const upload = jest.fn();
  return {
    UploadType: { MULTIPART: 1, BINARY_CONTENT: 0 },
    File: jest.fn().mockImplementation((uri: string) => ({ uri, upload })),
    __upload: upload,
  };
});

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => 'token-gia'),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(async () => undefined),
  saveRefreshToken: jest.fn(async () => undefined),
}));

const upload = (jest.requireMock('expo-file-system') as { __upload: jest.Mock }).__upload;
const FileGia = File as unknown as jest.Mock;

const TEP = { uri: 'file:///cache/anh.jpg', name: 'anh.jpg', mimeType: 'image/jpeg' };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  upload.mockResolvedValue({ status: 201, body: '{"id":"m1"}', headers: {} });
});

describe('taiMotTepLen', () => {
  /*
    Ly do ton tai cua ca duong nay: dua thang duong dan tep cho tang native.

    Cach cu gom tep vao `FormData` cua React Native roi goi `fetch` hoac
    `XMLHttpRequest`. CA HAI deu hong tren Expo SDK 57 — nguoi kiem thu bao
    ngay 19/09/2026, ma trang thai tra ve la 0, tuc yeu cau chua bao gio hoan
    tat. Doi cach goi mang khong cuu duoc, vi hong nam o chinh doi tuong du lieu.
  */
  it('mở tệp từ đúng đường dẫn đã chọn', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '');

    expect(FileGia).toHaveBeenCalledWith('file:///cache/anh.jpg');
  });

  it('gửi tới URL đầy đủ, dạng multipart, đúng tên trường', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '');

    const [url, opts] = upload.mock.calls[0];
    expect(url).toBe('https://api.test/chat/direct/conversations/c1/files');
    expect(opts).toMatchObject({
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      // Máy chủ khai `FilesInterceptor('files', ...)`, sai tên là mất tệp.
      fieldName: 'files',
      mimeType: 'image/jpeg',
    });
  });

  it('kèm header xác thực', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '');

    expect(upload.mock.calls[0][1].headers.Authorization).toBe('Bearer token-gia');
  });

  /*
    Tu dat Content-Type la thieu tham so `boundary`; tang native tu dat lay.
  */
  it('không tự đặt Content-Type', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '');

    const headers = upload.mock.calls[0][1].headers as Record<string, string>;
    expect(Object.keys(headers).map((k) => k.toLowerCase())).not.toContain('content-type');
  });

  it('gửi kèm chú thích khi có', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '  bài tập nhóm  ');

    expect(upload.mock.calls[0][1].parameters).toEqual({ content: 'bài tập nhóm' });
  });

  it('không gửi phần chú thích khi để trống', async () => {
    await taiMotTepLen('/chat/direct/conversations/c1/files', TEP, '   ');

    expect(upload.mock.calls[0][1].parameters).toBeUndefined();
  });

  it('trả về dữ liệu máy chủ đã parse', async () => {
    await expect(taiMotTepLen('/c1/files', TEP, '')).resolves.toEqual({ id: 'm1' });
  });

  /*
    `upload` KHONG nem loi voi ma 4xx/5xx — no tra ve nguyen phan hoi. Khong tu
    kiem thi loi may chu bien thanh "thanh cong" va tin nhan bien mat.
  */
  it('máy chủ báo lỗi thì ném đúng câu của máy chủ', async () => {
    upload.mockResolvedValue({ status: 400, body: '{"message":"File không hợp lệ."}', headers: {} });

    await expect(taiMotTepLen('/c1/files', TEP, '')).rejects.toThrow('File không hợp lệ.');
  });

  it('tệp không đọc được thì giữ lại nguyên nhân', async () => {
    upload.mockRejectedValue(new Error('ENOENT: khong mo duoc tep'));

    await expect(taiMotTepLen('/c1/files', TEP, '')).rejects.toMatchObject({
      status: 0,
      nguyenNhan: expect.stringContaining('ENOENT'),
    });
  });

  it('thiếu kiểu tệp thì coi như nhị phân chung', async () => {
    await taiMotTepLen('/c1/files', { ...TEP, mimeType: null }, '');

    expect(upload.mock.calls[0][1].mimeType).toBe('application/octet-stream');
  });
});
