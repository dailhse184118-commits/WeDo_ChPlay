import * as SecureStore from 'expo-secure-store';
import {
  saveToken,
  loadToken,
  clearToken,
  saveActiveWorkspaceId,
  loadActiveWorkspaceId,
} from '../token-storage';

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
