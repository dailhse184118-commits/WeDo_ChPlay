import { apiRequest } from '../client';
import {
  approveReview,
  rejectReview,
  submitForReview,
  uploadSubmissions,
} from '../tasks';
import { taiMotTepLen } from '../tai-tep';

jest.mock('../client', () => ({ apiRequest: jest.fn(async () => ({ id: 't1' })) }));
jest.mock('../tai-tep', () => ({ taiMotTepLen: jest.fn(async () => ({ id: 't1' })) }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const taiLen = taiMotTepLen as jest.MockedFunction<typeof taiMotTepLen>;

function lastCall(): [string, { method?: string; body?: unknown }] {
  return mockedRequest.mock.calls[0] as never;
}

describe('uploadSubmissions', () => {
  beforeEach(() => {
    mockedRequest.mockClear();
    taiLen.mockClear();
  });

  /*
    KHONG dung `apiRequest` + `FormData` nua: `FormData` cua React Native hong
    tren Expo SDK 57 nen khong tep nao len duoc. Xem `tai-tep.ts`.
  */
  it('đi qua đường tải tệp native, không qua apiRequest', async () => {
    await uploadSubmissions('t1', [{ uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf' }]);

    expect(mockedRequest).not.toHaveBeenCalled();
    expect(taiLen.mock.calls[0][0]).toBe('/tasks/t1/submissions');
  });

  it('mã hoá id trước khi ghép vào đường dẫn', async () => {
    await uploadSubmissions('t 1', [{ uri: 'file:///a.pdf', name: 'a.pdf' }]);

    expect(taiLen.mock.calls[0][0]).toBe('/tasks/t%201/submissions');
  });

  it('mỗi tệp một lượt gọi riêng', async () => {
    await uploadSubmissions('t1', [
      { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf' },
      { uri: 'file:///b.png', name: 'b.png', mimeType: 'image/png' },
    ]);

    expect(taiLen).toHaveBeenCalledTimes(2);
    expect(taiLen.mock.calls[1][1].name).toBe('b.png');
  });

  /*
    May chu tra ve nguyen cong viec sau moi lan nop. Ban cuoi cung moi day du
    danh sach tep; tra ban dau thi giao dien thieu mat nhung tep nop sau.
  */
  it('trả về công việc từ lượt gửi cuối', async () => {
    taiLen.mockResolvedValueOnce({ id: 't1', submissions: ['a'] } as never);
    taiLen.mockResolvedValueOnce({ id: 't1', submissions: ['a', 'b'] } as never);

    const task = await uploadSubmissions('t1', [
      { uri: 'file:///a.pdf', name: 'a.pdf' },
      { uri: 'file:///b.png', name: 'b.png' },
    ]);

    expect((task as never as { submissions: string[] }).submissions).toEqual(['a', 'b']);
  });

  it('gửi tuần tự, chờ tệp trước xong mới tới tệp sau', async () => {
    const thuTu: string[] = [];
    taiLen.mockImplementation(async (_d, tep) => {
      thuTu.push(`bat-dau:${tep.name}`);
      await new Promise((r) => setTimeout(r, 0));
      thuTu.push(`xong:${tep.name}`);
      return { id: 't1' } as never;
    });

    await uploadSubmissions('t1', [
      { uri: 'file:///a.pdf', name: 'a.pdf' },
      { uri: 'file:///b.png', name: 'b.png' },
    ]);

    expect(thuTu).toEqual(['bat-dau:a.pdf', 'xong:a.pdf', 'bat-dau:b.png', 'xong:b.png']);
  });

  it('không gọi máy chủ khi người dùng không chọn tệp nào', async () => {
    // May chu tra 400 cho danh sach rong. Chan o day de bao loi ngay.
    await expect(uploadSubmissions('t1', [])).rejects.toThrow('ít nhất một tệp');
    expect(taiLen).not.toHaveBeenCalled();
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
