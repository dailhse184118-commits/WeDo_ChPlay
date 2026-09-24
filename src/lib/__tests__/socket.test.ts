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
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  });

  const layToken = () => Promise.resolve('tok-1');

  it('nối tới namespace /chat', () => {
    createChatSocket(layToken);
    expect(mockedIo).toHaveBeenCalledWith('https://api.test/chat', expect.anything());
  });

  it('gửi token qua auth chứ không qua query', async () => {
    createChatSocket(layToken);
    const options = mockedIo.mock.calls[0][1] as unknown as {
      auth: (cb: (duLieu: { token: string }) => void) => void;
      query?: unknown;
    };
    const cb = jest.fn();
    options.auth(cb);
    await Promise.resolve();

    expect(cb).toHaveBeenCalledWith({ token: 'tok-1' });
    expect(options.query).toBeUndefined();
  });

  /*
    Token truy cập hết hạn sau một thời gian; phần gọi API tự gia hạn và lưu token
    mới xuống máy. Socket trước đây giữ mãi token lúc đăng nhập, nên lần nối lại
    đầu tiên sau khi token hết hạn là bị máy chủ từ chối — realtime chết tới khi
    tắt app. Mỗi lần nối phải đọc lại token đang lưu.
  */
  it('đọc token MỚI NHẤT mỗi lần nối, không giữ token lúc tạo', async () => {
    const layTokenDoi = jest
      .fn<Promise<string | null>, []>()
      .mockResolvedValueOnce('tok-cu')
      .mockResolvedValueOnce('tok-moi');
    createChatSocket(layTokenDoi);
    const options = mockedIo.mock.calls[0][1] as unknown as {
      auth: (cb: (duLieu: { token: string }) => void) => void;
    };

    const lan1 = jest.fn();
    options.auth(lan1);
    await Promise.resolve();
    const lan2 = jest.fn();
    options.auth(lan2);
    await Promise.resolve();

    expect(lan1).toHaveBeenCalledWith({ token: 'tok-cu' });
    expect(lan2).toHaveBeenCalledWith({ token: 'tok-moi' });
  });

  it('dùng đúng transport như server cấu hình', () => {
    createChatSocket(layToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { transports: string[] };
    expect(options.transports).toEqual(['websocket', 'polling']);
  });

  it('bật tự kết nối lại', () => {
    createChatSocket(layToken);
    const options = mockedIo.mock.calls[0][1] as unknown as { reconnection: boolean };
    expect(options.reconnection).toBe(true);
  });

  it('ném lỗi rõ ràng khi thiếu biến môi trường', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => createChatSocket(layToken)).toThrow(
      'Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.',
    );
  });
});
