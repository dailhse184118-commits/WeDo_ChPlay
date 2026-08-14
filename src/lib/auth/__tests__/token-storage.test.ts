import * as SecureStore from 'expo-secure-store';
import { clearToken, loadActiveWorkspaceId, loadRefreshToken, loadToken, saveActiveWorkspaceId, saveRefreshToken, saveToken } from '../token-storage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockedStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('token-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ghi token vào SecureStore', async () => {
    await saveToken('abc123');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('wedo.accessToken', 'abc123');
  });

  it('đọc token đã lưu', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce('abc123');
    await expect(loadToken()).resolves.toBe('abc123');
  });

  it('trả null khi chưa có token', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce(null);
    await expect(loadToken()).resolves.toBeNull();
  });

  it('xoá cả token lẫn workspace đang hoạt động khi đăng xuất', async () => {
    await clearToken();
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('wedo.accessToken');
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('wedo.activeWorkspaceId');
  });

  it('ghi và đọc workspace đang hoạt động', async () => {
    await saveActiveWorkspaceId('ws-1');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('wedo.activeWorkspaceId', 'ws-1');

    mockedStore.getItemAsync.mockResolvedValueOnce('ws-1');
    await expect(loadActiveWorkspaceId()).resolves.toBe('ws-1');
  });

  it('trả null thay vì ném lỗi khi SecureStore hỏng', async () => {
    mockedStore.getItemAsync.mockRejectedValueOnce(new Error('keystore unavailable'));
    await expect(loadToken()).resolves.toBeNull();
  });
});

describe('refresh token', () => {
  it('ghi refresh token vào khoá riêng, không đè lên access token', async () => {
    await saveRefreshToken('rt-abc');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('wedo.refreshToken', 'rt-abc');
  });

  it('đọc refresh token đã lưu', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce('rt-abc');
    await expect(loadRefreshToken()).resolves.toBe('rt-abc');
  });

  it('xoá token là xoá cả refresh token, không để sót phiên cũ', async () => {
    /*
      Sót refresh token sau khi đăng xuất là chuyện nguy hiểm: ai cầm máy sau đó
      vẫn gia hạn được phiên của người trước.
    */
    await clearToken();

    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('wedo.refreshToken');
  });
});
