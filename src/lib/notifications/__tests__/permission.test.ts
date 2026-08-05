import * as Notifications from 'expo-notifications';
import { checkNotificationPermission, ensureNotificationPermission } from '../permission';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const mockedGet = Notifications.getPermissionsAsync as jest.MockedFunction<
  typeof Notifications.getPermissionsAsync
>;
const mockedRequest = Notifications.requestPermissionsAsync as jest.MockedFunction<
  typeof Notifications.requestPermissionsAsync
>;

describe('ensureNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trả true ngay khi đã được cấp quyền', async () => {
    mockedGet.mockResolvedValue({ status: 'granted' } as never);
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('xin quyền khi chưa được cấp', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined' } as never);
    mockedRequest.mockResolvedValue({ status: 'granted' } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(mockedRequest).toHaveBeenCalled();
  });

  it('trả false khi người dùng từ chối', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined' } as never);
    mockedRequest.mockResolvedValue({ status: 'denied' } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it('trả false thay vì ném lỗi khi thiếu module native', async () => {
    mockedGet.mockRejectedValue(new Error('Cannot find native module'));
    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });
});

describe('checkNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('không bao giờ hiện hộp thoại hệ thống', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined', canAskAgain: true } as never);

    await checkNotificationPermission();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('trả granted khi đã có quyền', async () => {
    mockedGet.mockResolvedValue({ status: 'granted', canAskAgain: false } as never);
    await expect(checkNotificationPermission()).resolves.toBe('granted');
  });

  it('trả undetermined khi chưa hỏi bao giờ', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined', canAskAgain: true } as never);
    await expect(checkNotificationPermission()).resolves.toBe('undetermined');
  });

  it('trả blocked khi bị từ chối và không được hỏi lại', async () => {
    mockedGet.mockResolvedValue({ status: 'denied', canAskAgain: false } as never);
    await expect(checkNotificationPermission()).resolves.toBe('blocked');
  });

  it('trả blocked thay vì ném lỗi khi thiếu module native', async () => {
    mockedGet.mockRejectedValue(new Error('Cannot find native module'));
    await expect(checkNotificationPermission()).resolves.toBe('blocked');
  });
});
