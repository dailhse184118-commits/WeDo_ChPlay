import { apiRequest } from '../client';
import {
  approveReview,
  phanTepGuiLen,
  rejectReview,
  submitForReview,
  uploadSubmissions,
} from '../tasks';

jest.mock('../client', () => ({ apiRequest: jest.fn(async () => ({ id: 't1' })) }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

function lastCall(): [string, { method?: string; body?: unknown }] {
  return mockedRequest.mock.calls[0] as never;
}

describe('phanTepGuiLen', () => {
  it('giữ nguyên uri, tên và kiểu của tệp', () => {
    expect(
      phanTepGuiLen({
        uri: 'file:///bao-cao.pdf',
        name: 'bao-cao.pdf',
        mimeType: 'application/pdf',
      }),
    ).toEqual({ uri: 'file:///bao-cao.pdf', name: 'bao-cao.pdf', type: 'application/pdf' });
  });

  it('đặt kiểu mặc định khi máy không nhận ra tệp', () => {
    /*
      Trình chọn tệp của Android trả `mimeType` rỗng với các đuôi lạ. Thiếu
      `type` thì React Native gửi phần đó không có Content-Type và multer phía
      máy chủ từ chối.
    */
    expect(
      phanTepGuiLen({ uri: 'file:///ban-ve.dwg', name: 'ban-ve.dwg' }).type,
    ).toBe('application/octet-stream');
  });
});

describe('uploadSubmissions', () => {
  beforeEach(() => mockedRequest.mockClear());

  it('gửi mọi tệp đã chọn trong cùng một lượt, dưới tên trường "files"', async () => {
    await uploadSubmissions('t1', [
      { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf' },
      { uri: 'file:///b.png', name: 'b.png', mimeType: 'image/png' },
    ]);

    const [path, options] = lastCall();
    expect(path).toBe('/tasks/t1/submissions');
    expect(options.method).toBe('POST');
    expect((options.body as FormData).getAll('files')).toHaveLength(2);
  });

  it('không gọi máy chủ khi người dùng không chọn tệp nào', async () => {
    // May chu tra 400 cho danh sach rong. Chan o day de bao loi ngay.
    await expect(uploadSubmissions('t1', [])).rejects.toThrow('ít nhất một tệp');
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});

describe('chuyển trạng thái duyệt bài', () => {
  beforeEach(() => mockedRequest.mockClear());

  it('gửi bài đi duyệt', async () => {
    await submitForReview('t1');
    expect(lastCall()[0]).toBe('/tasks/t1/submit-review');
    expect(lastCall()[1].method).toBe('POST');
  });

  it('duyệt bài', async () => {
    await approveReview('t1');
    expect(lastCall()[0]).toBe('/tasks/t1/approve-review');
    expect(lastCall()[1].method).toBe('POST');
  });

  it('trả bài lại kèm lý do đã cắt khoảng trắng', async () => {
    await rejectReview('t1', '  thiếu phần kết luận  ');
    expect(lastCall()[0]).toBe('/tasks/t1/reject-review');
    expect(lastCall()[1].body).toEqual({ reason: 'thiếu phần kết luận' });
  });

  it('chặn lý do quá ngắn ngay tại máy, không đợi một vòng mạng', async () => {
    // RejectReviewDto phia may chu doi toi thieu 3 ky tu.
    await expect(rejectReview('t1', 'ok')).rejects.toThrow('ít nhất 3 ký tự');
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});
