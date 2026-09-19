import { File } from 'expo-file-system';

import { apiRequest, ApiError } from '../client';
import { phanTepGuiLen, taiMotTepLen } from '../tai-tep';

jest.mock('expo-file-system', () => {
  const bytes = jest.fn(async () => new Uint8Array([1, 2, 3]));
  const upload = jest.fn();
  return {
    UploadType: { MULTIPART: 1, BINARY_CONTENT: 0 },
    File: jest.fn().mockImplementation((uri: string) => ({ uri, bytes, upload })),
    __bytes: bytes,
    __upload: upload,
  };
});

jest.mock('../client', () => {
  const thuc = jest.requireActual('../client');
  return { ApiError: thuc.ApiError, baseUrl: thuc.baseUrl, apiRequest: jest.fn() };
});

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => 'token-gia'),
}));

const gia = jest.requireMock('expo-file-system') as { __bytes: jest.Mock; __upload: jest.Mock };
const upload = gia.__upload;
const FileGia = File as unknown as jest.Mock;
const goi = apiRequest as jest.MockedFunction<typeof apiRequest>;

const TEP = { uri: 'file:///cache/ImagePicker/abc123.jpg', name: 'anh-nhom.jpg', mimeType: 'image/jpeg' };

beforeEach(() => {
  jest.clearAllMocks();
  process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  goi.mockResolvedValue({ id: 'm1' });
  upload.mockResolvedValue({ status: 201, body: '{"id":"m1"}' });
});

/*
  Bo chuyen FormData cua Expo (`expo/src/winter/fetch/convertFormData.ts`) chi
  nhan ba dang phan: chuoi, `Blob`, hoac object co `bytes()`. Bo ba
  `{ uri, name, type }` cua React Native khong khop dang nao nen no nem
  `Unsupported FormDataPart implementation` — day chinh la loi ngay 19/09/2026.
*/
describe('phanTepGuiLen', () => {
  it('dựng phần tệp có bytes(), đúng dạng bộ chuyển của Expo nhận', async () => {
    const phan = phanTepGuiLen(TEP);

    expect(typeof phan.bytes).toBe('function');
    expect(await phan.bytes()).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('không mang uri — đó là dạng đã làm hỏng mọi lượt tải tệp', () => {
    expect('uri' in phanTepGuiLen(TEP)).toBe(false);
  });

  /*
    `File.name` tra ten tep TAM trong cache, vi du `abc123.jpg`. Lay ten do thi
    nguoi nhan thay mot chuoi vo nghia thay cho ten tep that.
  */
  it('giữ tên gốc người dùng thấy, không lấy tên tệp tạm', () => {
    expect(phanTepGuiLen(TEP).name).toBe('anh-nhom.jpg');
    expect(FileGia).toHaveBeenCalledWith('file:///cache/ImagePicker/abc123.jpg');
  });

  it('đặt kiểu mặc định khi máy không nhận ra tệp', () => {
    expect(phanTepGuiLen({ uri: 'file:///a.dwg', name: 'a.dwg' }).type).toBe(
      'application/octet-stream',
    );
  });
});

describe('taiMotTepLen', () => {
  it('gửi qua fetch, đúng đường dẫn và phương thức POST', async () => {
    await taiMotTepLen('/projects/p1/chat/files', TEP, '');

    expect(goi.mock.calls[0][0]).toBe('/projects/p1/chat/files');
    expect(goi.mock.calls[0][1]?.method).toBe('POST');
  });

  it('gói tệp dưới tên trường "files" — đúng tên máy chủ khai', async () => {
    await taiMotTepLen('/projects/p1/chat/files', TEP, '');

    const form = goi.mock.calls[0][1]?.body as FormData;
    expect(form.getAll('files')).toHaveLength(1);
  });

  it('gửi kèm chú thích khi người dùng có gõ', async () => {
    await taiMotTepLen('/projects/p1/chat/files', TEP, '  bài nhóm mình  ');

    expect((goi.mock.calls[0][1]?.body as FormData).get('content')).toBe('bài nhóm mình');
  });

  it('không gửi phần chú thích khi để trống', async () => {
    await taiMotTepLen('/projects/p1/chat/files', TEP, '   ');

    expect((goi.mock.calls[0][1]?.body as FormData).has('content')).toBe(false);
  });

  it('trả về nguyên phản hồi của máy chủ', async () => {
    goi.mockResolvedValue({ id: 'm9' });

    expect(await taiMotTepLen('/p/files', TEP, '')).toEqual({ id: 'm9' });
  });

  /*
    May chu da TRA LOI roi ma bao loi thi dung luon. Thu tiep duong con lai chi
    tao ra tin nhan trung, vi yeu cau da toi noi.
  */
  it('dừng ngay khi máy chủ trả lỗi, không thử đường dự phòng', async () => {
    goi.mockRejectedValue(new ApiError('Tệp quá nặng.', 413));

    await expect(taiMotTepLen('/p/files', TEP, '')).rejects.toThrow('Tệp quá nặng.');
    expect(upload).not.toHaveBeenCalled();
  });

  it('chuyển sang đường native khi tầng fetch hỏng', async () => {
    goi.mockRejectedValue(new ApiError('Không thể kết nối máy chủ.', 0, undefined, 'TypeError: x'));

    expect(await taiMotTepLen('/p/files', TEP, '')).toEqual({ id: 'm1' });
    expect(upload.mock.calls[0][0]).toBe('https://api.test/p/files');
    expect(upload.mock.calls[0][1].fieldName).toBe('files');
  });

  /*
    Ca hai duong cung hong thi PHAI giu lai ca hai cau loi goc. Ngay 19/09 ca
    doi mat nhieu gio vi cau loi that bi vut sach.
  */
  it('giữ lại cả hai câu lỗi gốc khi cả hai đường đều hỏng', async () => {
    goi.mockRejectedValue(new ApiError('Không thể kết nối.', 0, undefined, 'TypeError: form hong'));
    upload.mockRejectedValue(new Error('native hong'));

    const loi = (await taiMotTepLen('/p/files', TEP, '').catch((e) => e)) as ApiError;

    expect(loi.status).toBe(0);
    expect(loi.nguyenNhan).toContain('TypeError: form hong');
    expect(loi.nguyenNhan).toContain('native hong');
  });

  it('báo lỗi khi máy chủ trả mã xấu ở đường native', async () => {
    goi.mockRejectedValue(new ApiError('Không thể kết nối.', 0));
    upload.mockResolvedValue({ status: 413, body: '{"message":"Tệp quá nặng."}' });

    await expect(taiMotTepLen('/p/files', TEP, '')).rejects.toThrow('Tệp quá nặng.');
  });
});
