import { blockUser, listBlocks, reportContent, unblockUser } from '../moderation';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API báo cáo và chặn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('POST báo cáo tin nhắn kèm lý do và ghi chú đã cắt khoảng trắng', async () => {
    await reportContent({
      targetType: 'PROJECT_MESSAGE',
      targetId: 'm1',
      reason: 'HARASSMENT',
      note: '  nói lời khó nghe  ',
    });

    expect(mockedRequest).toHaveBeenCalledWith('/moderation/reports', {
      method: 'POST',
      body: {
        targetType: 'PROJECT_MESSAGE',
        targetId: 'm1',
        reason: 'HARASSMENT',
        note: 'nói lời khó nghe',
      },
    });
  });

  /* Máy chủ lưu nguyên văn: một ô ghi chú rỗng chỉ làm người xử lý mất công đọc. */
  it('ghi chú rỗng hoặc toàn khoảng trắng thì bỏ hẳn khoá note', async () => {
    await reportContent({ targetType: 'USER', targetId: 'u2', reason: 'SPAM', note: '   ' });
    await reportContent({ targetType: 'DIRECT_MESSAGE', targetId: 'd1', reason: 'OTHER' });

    expect(mockedRequest.mock.calls[0][1]).toEqual({
      method: 'POST',
      body: { targetType: 'USER', targetId: 'u2', reason: 'SPAM' },
    });
    expect(mockedRequest.mock.calls[1][1]).toEqual({
      method: 'POST',
      body: { targetType: 'DIRECT_MESSAGE', targetId: 'd1', reason: 'OTHER' },
    });
  });

  it('ghi chú dài hơn 500 ký tự bị cắt, không để máy chủ trả 400', async () => {
    await reportContent({
      targetType: 'USER',
      targetId: 'u2',
      reason: 'OTHER',
      note: 'a'.repeat(600),
    });

    const body = (mockedRequest.mock.calls[0][1] as { body: { note: string } }).body;
    expect(body.note).toHaveLength(500);
  });

  it('GET danh sách chặn bóc mảng ra khỏi { items }', async () => {
    const items = [
      { userId: 'u2', fullName: 'Tuấn', avatarUrl: null, blockedAt: '2026-09-26T00:00:00.000Z' },
    ];
    mockedRequest.mockResolvedValue({ items } as never);

    await expect(listBlocks()).resolves.toEqual(items);
    expect(mockedRequest).toHaveBeenCalledWith('/moderation/blocks');
  });

  /* Máy chủ cũ chưa có endpoint: coi như chưa chặn ai, không làm sập khung chat. */
  it('phản hồi thiếu items thì trả mảng rỗng', async () => {
    mockedRequest.mockResolvedValue(undefined as never);
    await expect(listBlocks()).resolves.toEqual([]);

    mockedRequest.mockResolvedValue({ items: null } as never);
    await expect(listBlocks()).resolves.toEqual([]);
  });

  it('POST chặn một người', async () => {
    await blockUser('u2');
    expect(mockedRequest).toHaveBeenCalledWith('/moderation/blocks', {
      method: 'POST',
      body: { userId: 'u2' },
    });
  });

  it('DELETE bỏ chặn, id đã mã hoá', async () => {
    await unblockUser('u 2/x');
    expect(mockedRequest).toHaveBeenCalledWith('/moderation/blocks/u%202%2Fx', {
      method: 'DELETE',
    });
  });
});
