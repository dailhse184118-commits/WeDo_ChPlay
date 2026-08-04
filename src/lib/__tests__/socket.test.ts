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

  it('nối tới namespace /chat', () => {
    createChatSocket('tok-1');
    expect(mockedIo).toHaveBeenCalledWith('https://api.test/chat', expect.anything());
  });

  it('gửi token qua auth chứ không qua query', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as unknown as { auth: { token: string } };
    expect(options.auth).toEqual({ token: 'tok-1' });
  });

  it('dùng đúng transport như server cấu hình', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as unknown as { transports: string[] };
    expect(options.transports).toEqual(['websocket', 'polling']);
  });

  it('bật tự kết nối lại', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as unknown as { reconnection: boolean };
    expect(options.reconnection).toBe(true);
  });

  it('ném lỗi rõ ràng khi thiếu biến môi trường', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => createChatSocket('tok-1')).toThrow(
      'Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.',
    );
  });
});
