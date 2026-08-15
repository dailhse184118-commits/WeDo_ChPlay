import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '../../api/notifications';
import { ensureNotificationPermission } from '../permission';
import { dongBoPushToken, huyDangKyPushToken } from '../push-token';

jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('../permission', () => ({ ensureNotificationPermission: jest.fn() }));
jest.mock('../../api/notifications', () => ({
  registerPushToken: jest.fn(),
  unregisterPushToken: jest.fn(),
}));

const mockedQuyen = ensureNotificationPermission as jest.MockedFunction<
  typeof ensureNotificationPermission
>;
const mockedLayToken = Notifications.getExpoPushTokenAsync as jest.MockedFunction<
  typeof Notifications.getExpoPushTokenAsync
>;
const mockedDangKy = registerPushToken as jest.MockedFunction<typeof registerPushToken>;
const mockedHuy = unregisterPushToken as jest.MockedFunction<typeof unregisterPushToken>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('dongBoPushToken', () => {
  it('không gọi máy chủ khi người dùng từ chối quyền thông báo', async () => {
    mockedQuyen.mockResolvedValue(false);

    await dongBoPushToken();

    // Không có quyền thì Expo cũng không cấp token. Gọi tiếp chỉ tổ ném lỗi.
    expect(mockedLayToken).not.toHaveBeenCalled();
    expect(mockedDangKy).not.toHaveBeenCalled();
  });

  it('gửi token kèm nền tảng lên máy chủ khi đã có quyền', async () => {
    mockedQuyen.mockResolvedValue(true);
    mockedLayToken.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never);

    await dongBoPushToken();

    expect(mockedDangKy).toHaveBeenCalledWith('ExponentPushToken[abc]', Platform.OS);
  });

  it('nuốt lỗi để đăng nhập không hỏng theo', async () => {
    mockedQuyen.mockResolvedValue(true);
    mockedLayToken.mockRejectedValue(new Error('thiếu cấu hình FCM'));

    /*
      Chưa cấu hình FCM là Expo ném lỗi ngay tại đây. Nếu để lỗi thoát ra,
      người dùng đăng nhập đúng mật khẩu vẫn bị đá về màn đăng nhập — mất tính
      năng phụ không được phép làm hỏng tính năng chính.
    */
    await expect(dongBoPushToken()).resolves.toBeUndefined();
    expect(mockedDangKy).not.toHaveBeenCalled();
  });
});

describe('huyDangKyPushToken', () => {
  it('gỡ đúng token của máy này', async () => {
    mockedLayToken.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never);

    await huyDangKyPushToken();

    expect(mockedHuy).toHaveBeenCalledWith('ExponentPushToken[abc]');
  });

  it('nuốt lỗi để người dùng luôn ra khỏi app được', async () => {
    mockedLayToken.mockRejectedValue(new Error('mất mạng'));

    // Đăng xuất mà ném lỗi thì người dùng mắc kẹt trong app.
    await expect(huyDangKyPushToken()).resolves.toBeUndefined();
  });
});
