import * as Notifications from 'expo-notifications';

import { donThongBaoKhiDangXuat } from '../don-khi-dang-xuat';

jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => undefined),
  dismissAllNotificationsAsync: jest.fn(async () => undefined),
  clearLastNotificationResponse: jest.fn(),
}));

const mocked = Notifications as jest.Mocked<typeof Notifications>;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('donThongBaoKhiDangXuat', () => {
  it('huỷ lịch nhắc đã hẹn, gỡ khay và quên lần chạm thông báo gần nhất', async () => {
    await donThongBaoKhiDangXuat();

    expect(mocked.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mocked.dismissAllNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mocked.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });

  it('một bước hỏng không chặn các bước sau và không ném lỗi', async () => {
    mocked.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error('native'));
    mocked.dismissAllNotificationsAsync.mockRejectedValueOnce(new Error('native'));
    mocked.clearLastNotificationResponse.mockImplementationOnce(() => {
      throw new Error('UnavailabilityError');
    });

    await expect(donThongBaoKhiDangXuat()).resolves.toBeUndefined();
    expect(mocked.clearLastNotificationResponse).toHaveBeenCalledTimes(1);
  });
});
