import {
  listFriends,
  searchUsers,
  sendFriendRequest,
  respondToRequest,
} from '../friends';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API kết bạn', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET danh sách bạn bè', async () => {
    await listFriends();
    expect(mockedRequest).toHaveBeenCalledWith('/friends');
  });

  it('GET tìm người kèm từ khoá đã mã hoá', async () => {
    await searchUsers('lê hữu');
    expect(mockedRequest).toHaveBeenCalledWith('/friends/search?query=l%C3%AA%20h%E1%BB%AFu');
  });

  /*
    Máy chủ chặn từ khoá dưới 2 ký tự và trả mảng rỗng. Bắn lượt gọi chắc chắn
    rỗng chỉ tốn dữ liệu di động của người dùng.
  */
  it('không gọi máy chủ khi từ khoá quá ngắn', async () => {
    await expect(searchUsers('a')).resolves.toEqual([]);
    await expect(searchUsers('   ')).resolves.toEqual([]);

    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('cắt khoảng trắng thừa trước khi đếm độ dài', async () => {
    await searchUsers('  ab  ');
    expect(mockedRequest).toHaveBeenCalledWith('/friends/search?query=ab');
  });

  it('POST gửi lời mời kết bạn', async () => {
    await sendFriendRequest('u2');
    expect(mockedRequest).toHaveBeenCalledWith('/friends/requests', {
      method: 'POST',
      body: { targetUserId: 'u2' },
    });
  });

  it('POST duyệt lời mời', async () => {
    await respondToRequest('f1', true);
    expect(mockedRequest).toHaveBeenCalledWith('/friends/requests/f1/accept', {
      method: 'POST',
    });
  });

  it('POST từ chối lời mời', async () => {
    await respondToRequest('f1', false);
    expect(mockedRequest).toHaveBeenCalledWith('/friends/requests/f1/reject', {
      method: 'POST',
    });
  });
});
