import { io } from 'socket.io-client';
import { buildSocketUrl, createChatSocket } from '../socket';

jest.mock('socket.io-client', () => ({ io: jest.fn(() => ({ on: jest.fn() })) }));

const mockedIo = io as jest.MockedFunction<typeof io>;

describe('buildSocketUrl', () => {
  it('gắn namespace /chat vào base URL', () => {
    expect(buildSocketUrl('https://api.test')).toBe('https://api.test/chat');
  });

  it('cắt dấu gạch chéo thừa ở cuối', () => {
    expect(buildSocketUrl('https://api.test/')).toBe('https://api.test/chat');
  });
});

describe('createChatSocket', () => {
  const docToken = jest.fn(async () => 'tok-1' as string | null);

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  });

  /** Gọi hàm `auth` như socket.io làm ở mỗi lần nối, trả về thứ nó gửi lên. */
  function authGuiLen(): Promise<unknown> {
    const options = mockedIo.mock.calls[0][1] as unknown as {
      auth: (cb: (data: object) => void) => void;
    };
    return new Promise((resolve) => options.auth(resolve));
  }

  it('nối tới namespace /chat', () => {
    createChatSocket(docToken);
    expect(mockedIo).toHaveBeenCalledWith('https://api.test/chat', expect.anything());
  });

  it('gửi token qua auth chứ không qua query', async () => {
    createChatSocket(docToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { query?: unknown };
    expect(options.query).toBeUndefined();
    await expect(authGuiLen()).resolves.toEqual({ token: 'tok-1' });
  });

  it('đọc lại token ở MỖI lần nối, không chốt cứng token lúc tạo socket', async () => {
    createChatSocket(docToken);
    await expect(authGuiLen()).resolves.toEqual({ token: 'tok-1' });

    // Tầng API vừa gia hạn phiên: lần nối lại kế tiếp phải cầm token mới.
    docToken.mockResolvedValueOnce('tok-2');
    await expect(authGuiLen()).resolves.toEqual({ token: 'tok-2' });
  });

  it('không đọc được token thì vẫn trả lời socket.io, để máy chủ từ chối cho rõ ràng', async () => {
    createChatSocket(docToken);
    docToken.mockRejectedValueOnce(new Error('SecureStore hỏng'));
    await expect(authGuiLen()).resolves.toEqual({ token: '' });

    docToken.mockResolvedValueOnce(null);
    await expect(authGuiLen()).resolves.toEqual({ token: '' });
  });

  it('dùng đúng transport như server cấu hình', () => {
    createChatSocket(docToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { transports: string[] };
    expect(options.transports).toEqual(['websocket', 'polling']);
  });

  it('websocket hỏng thì chuyển sang polling thay vì kẹt mãi', () => {
    createChatSocket(docToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { tryAllTransports: boolean };
    expect(options.tryAllTransports).toBe(true);
  });

  it('bật tự kết nối lại', () => {
    createChatSocket(docToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { reconnection: boolean };
    expect(options.reconnection).toBe(true);
  });

  it('ném lỗi rõ ràng khi thiếu biến môi trường', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => createChatSocket(docToken)).toThrow(
      'Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.',
    );
  });
});
