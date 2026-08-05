import * as Notifications from 'expo-notifications';
import { configureNotificationHandler, taskIdFromResponse } from '../handler';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
}));

const mockedSet = Notifications.setNotificationHandler as jest.MockedFunction<
  typeof Notifications.setNotificationHandler
>;

function makeResponse(data: unknown): Notifications.NotificationResponse {
  return {
    notification: { request: { content: { data } } },
  } as unknown as Notifications.NotificationResponse;
}

describe('configureNotificationHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('cho thông báo hiện khi app đang mở', async () => {
    configureNotificationHandler();

    const arg = mockedSet.mock.calls[0]?.[0];
    const behavior = await arg?.handleNotification?.({} as never);

    expect(behavior?.shouldShowBanner).toBe(true);
    expect(behavior?.shouldShowList).toBe(true);
  });

  it('không ném lỗi khi thiếu module native', () => {
    mockedSet.mockImplementation(() => {
      throw new Error('Cannot find native module');
    });
    expect(() => configureNotificationHandler()).not.toThrow();
  });
});

describe('taskIdFromResponse', () => {
  it('lấy được taskId', () => {
    expect(taskIdFromResponse(makeResponse({ taskId: 't1' }))).toBe('t1');
  });

  it('trả null khi không có phản hồi', () => {
    expect(taskIdFromResponse(null)).toBeNull();
  });

  it('trả null khi data thiếu taskId', () => {
    expect(taskIdFromResponse(makeResponse({ other: 1 }))).toBeNull();
  });

  it('trả null khi taskId rỗng hoặc sai kiểu', () => {
    expect(taskIdFromResponse(makeResponse({ taskId: '' }))).toBeNull();
    expect(taskIdFromResponse(makeResponse({ taskId: 42 }))).toBeNull();
  });
});
