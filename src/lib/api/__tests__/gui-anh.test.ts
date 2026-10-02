import { sendProjectFiles } from '../chat';
import { sendDirectFiles } from '../direct-chat';
import { LoiGuiDoDang } from '../chat-files';
import { taiMotTepLen } from '../tai-tep';

jest.mock('../tai-tep', () => ({ taiMotTepLen: jest.fn() }));

const taiLen = taiMotTepLen as jest.MockedFunction<typeof taiMotTepLen>;

const ANH = { uri: 'file:///cache/a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' };
const ANH_2 = { uri: 'file:///cache/b.png', name: 'b.png', mimeType: 'image/png' };

beforeEach(() => {
  jest.clearAllMocks();
  taiLen.mockResolvedValue({} as never);
});

describe('gửi ảnh vào chat', () => {
  it('chat dự án đi đúng đường /files', async () => {
    await sendProjectFiles('p1', [ANH], '');

    expect(taiLen.mock.calls[0][0]).toBe('/projects/p1/chat/files');
  });

  it('tin nhắn riêng đi đúng đường /files', async () => {
    await sendDirectFiles('c1', [ANH], '');

    expect(taiLen.mock.calls[0][0]).toBe('/chat/direct/conversations/c1/files');
  });

  it('mã hoá id trước khi ghép vào đường dẫn', async () => {
    await sendDirectFiles('c 1', [ANH], '');

    expect(taiLen.mock.calls[0][0]).toBe('/chat/direct/conversations/c%201/files');
  });

  /*
    `FormData` cua React Native hong tren Expo SDK 57, nen khong gop duoc nhieu
    tep vao mot luot nua. Moi tep thanh mot tin nhan rieng — xem `tai-tep.ts`.
  */
  it('mỗi tệp một lượt gọi riêng', async () => {
    await sendDirectFiles('c1', [ANH, ANH_2], '');

    expect(taiLen).toHaveBeenCalledTimes(2);
    expect(taiLen.mock.calls[0][1]).toBe(ANH);
    expect(taiLen.mock.calls[1][1]).toBe(ANH_2);
  });

  /*
    Lap chu thich o moi anh thi nguoi nhan doc thay cung mot cau nam lan.
  */
  it('chú thích chỉ gắn vào tệp đầu tiên', async () => {
    await sendDirectFiles('c1', [ANH, ANH_2], 'bài tập nhóm nè');

    expect(taiLen.mock.calls[0][2]).toBe('bài tập nhóm nè');
    expect(taiLen.mock.calls[1][2]).toBe('');
  });

  it('từ chối khi không có ảnh nào', async () => {
    await expect(sendDirectFiles('c1', [], 'chào')).rejects.toThrow();
    expect(taiLen).not.toHaveBeenCalled();
  });

  /*
    Gui tuan tu chu khong song song: mang di dong nghen thi ban nam luot cung
    luc lam tat ca cung cham, va thu tu tin nhan hien ra se lon xon.
  */
  it('gửi tuần tự, chờ tệp trước xong mới tới tệp sau', async () => {
    const thuTu: string[] = [];
    taiLen.mockImplementation(async (_d, tep) => {
      thuTu.push(`bat-dau:${tep.name}`);
      await new Promise((r) => setTimeout(r, 0));
      thuTu.push(`xong:${tep.name}`);
      return {} as never;
    });

    await sendDirectFiles('c1', [ANH, ANH_2], '');

    expect(thuTu).toEqual([
      'bat-dau:a.jpg',
      'xong:a.jpg',
      'bat-dau:b.png',
      'xong:b.png',
    ]);
  });
});

/*
  Mỗi ảnh là một tin nhắn thật. Ảnh thứ hai hỏng mà chỉ ném lỗi thì màn hình
  không biết ảnh đầu đã tới, giữ nguyên cả lô — bấm Gửi lại là người nhận thấy
  ảnh đầu hai lần.
*/
describe('gửi dở dang', () => {
  const ANH_3 = { uri: 'file:///cache/c.jpg', name: 'c.jpg', mimeType: 'image/jpeg' };

  it('ảnh giữa lô hỏng thì báo kèm những tin đã gửi được', async () => {
    taiLen
      .mockResolvedValueOnce({ id: 'tin-1' } as never)
      .mockRejectedValueOnce(new Error('Không gửi được tệp. Kiểm tra mạng và thử lại.'));

    const loi = await sendDirectFiles('c1', [ANH, ANH_2, ANH_3], 'chú thích').catch((e) => e);

    expect(loi).toBeInstanceOf(LoiGuiDoDang);
    expect(loi.daGui).toEqual([{ id: 'tin-1' }]);
    expect(loi.tongSo).toBe(3);
    expect(loi.message).toMatch(/1\/3/);
    expect(loi.message).toMatch(/Kiểm tra mạng/);
    // Dừng ngay ở ảnh hỏng, không gửi tiếp ảnh thứ ba.
    expect(taiLen).toHaveBeenCalledTimes(2);
  });

  it('hỏng ngay ảnh đầu thì ném nguyên lỗi gốc — chưa có gì để giữ lại', async () => {
    const goc = new Error('Ảnh quá lớn');
    taiLen.mockRejectedValueOnce(goc);

    await expect(sendDirectFiles('c1', [ANH, ANH_2], '')).rejects.toBe(goc);
  });
});
