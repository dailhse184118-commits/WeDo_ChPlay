import {
  listConversations,
  startConversation,
  getDirectMessages,
  sendDirectMessage,
  markConversationRead,
} from '../direct-chat';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API tin nhắn riêng', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET danh sách hội thoại', async () => {
    await listConversations();
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations');
  });

  it('POST tạo hội thoại kèm id người nhận', async () => {
    await startConversation('u2');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations', {
      method: 'POST',
      body: { targetUserId: 'u2' },
    });
  });

  it('GET tin nhắn của một hội thoại', async () => {
    await getDirectMessages('c1');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/messages');
  });

  it('mã hoá id hội thoại có ký tự đặc biệt', async () => {
    await getDirectMessages('a b/c');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/a%20b%2Fc/messages');
  });

  it('POST gửi tin nhắn', async () => {
    await sendDirectMessage('c1', 'chào bạn');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/messages', {
      method: 'POST',
      body: { content: 'chào bạn' },
    });
  });

  it('POST đánh dấu đã đọc', async () => {
    await markConversationRead('c1');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/read', {
      method: 'POST',
    });
  });
});
