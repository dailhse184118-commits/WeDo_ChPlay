import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, unregisterPushToken } from '../../api/notifications';
import { checkNotificationPermission, ensureNotificationPermission } from '../permission';
import { dongBoPushToken, huyDangKyPushToken } from '../push-token';

jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
jest.mock('../permission', () => ({
  checkNotificationPermission: jest.fn(),
  ensureNotificationPermission: jest.fn(),
}));
jest.mock('../../api/notifications', () => ({
  registerPushToken: jest.fn(),
  unregisterPushToken: jest.fn(),
}));

const mockedQuyen = ensureNotificationPermission as jest.MockedFunction<
  typeof ensureNotificationPermission
>;
const mockedDocQuyen = checkNotificationPermission as jest.MockedFunction<
  typeof checkNotificationPermission
>;
const mockedLayToken = Notifications.getExpoPushTokenAsync as jest.MockedFunction<
  typeof Notifications.getExpoPushTokenAsync
>;
const mockedDangKy = registerPushToken as jest.MockedFunction<typeof registerPushToken>;
const mockedHuy = unregisterPushToken as jest.MockedFunction<typeof unregisterPushToken>;

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

/*
  iOS chỉ cho hỏi quyền thông báo đúng một lần. Bật hộp thoại ngay sau đăng
  nhập — khi người dùng chưa biết để làm gì — là phí mất lần hỏi đó. Trên
  iPhone, đăng nhập chỉ ghi token nếu ĐÃ có quyền; việc hỏi để cho thẻ giải
  thích ở tab Thông báo.
*/
describe('dongBoPushToken trên iPhone', () => {
  beforeEach(() => {
    heDieuHanh?.restore();
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mockedLayToken.mockResolvedValue({ data: 'ExponentPushToken[ios]' } as never);
  });

  it('chưa có quyền: không bật hộp thoại hệ thống, không ghi token', async () => {
    mockedDocQuyen.mockResolvedValue('undetermined');

    await dongBoPushToken();

    expect(mockedQuyen).not.toHaveBeenCalled();
    expect(mockedLayToken).not.toHaveBeenCalled();
    expect(mockedDangKy).not.toHaveBeenCalled();
  });

  it('đã có quyền từ trước: ghi token với nền tảng ios, vẫn không hỏi', async () => {
    mockedDocQuyen.mockResolvedValue('granted');

    await dongBoPushToken();

    expect(mockedQuyen).not.toHaveBeenCalled();
    expect(mockedDangKy).toHaveBeenCalledWith('ExponentPushToken[ios]', 'ios');
  });

  it('đã từ chối: im lặng', async () => {
    mockedDocQuyen.mockResolvedValue('blocked');

    await expect(dongBoPushToken()).resolves.toBeUndefined();
    expect(mockedDangKy).not.toHaveBeenCalled();
  });
});

describe('dongBoPushToken trên Android — giữ nguyên như cũ', () => {
  it('hỏi quyền ngay như trước, không chỉ đọc', async () => {
    mockedQuyen.mockResolvedValue(true);
    mockedLayToken.mockResolvedValue({ data: 'ExponentPushToken[abc]' } as never);

    await dongBoPushToken();

    expect(mockedQuyen).toHaveBeenCalledTimes(1);
    expect(mockedDocQuyen).not.toHaveBeenCalled();
  });
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
