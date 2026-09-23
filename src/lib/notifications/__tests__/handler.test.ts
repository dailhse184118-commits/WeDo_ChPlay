import * as Notifications from 'expo-notifications';
import {
  configureNotificationHandler,
  duongDanTuThongBao,
  taskIdFromResponse,
} from '../handler';

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

describe('duongDanTuThongBao', () => {
  /*
    Trước 23/09/2026 chạm vào thông báo "Cuộc họp dự án mới" không mở ra đâu
    cả — người dùng vừa được báo có cuộc họp, giờ phải tự đi tìm.
  */
  it('thông báo cuộc họp mở thẳng đúng cuộc họp', () => {
    expect(
      duongDanTuThongBao(
        makeResponse({ type: 'MEETING_SCHEDULED', actionUrl: '#/meeting?meetingId=m-1' }),
      ),
    ).toBe('/meetings/m-1');
  });

  it('thông báo cuộc họp cũ không kèm id thì mở danh sách cuộc họp', () => {
    expect(
      duongDanTuThongBao(makeResponse({ type: 'MEETING_SCHEDULED', actionUrl: '#/meeting' })),
    ).toBe('/meetings');
  });

  it('tin nhắn riêng mở thẳng đúng hội thoại, kèm tên trên tiêu đề', () => {
    expect(
      duongDanTuThongBao(
        makeResponse({ type: 'DIRECT_MESSAGE', conversationId: 'c1', tenNguoiGui: 'Lê Hữu Đại' }),
      ),
    ).toBe('/chat/dm/c1?ten=L%C3%AA%20H%E1%BB%AFu%20%C4%90%E1%BA%A1i');
  });

  it('thiếu tên người gửi vẫn mở được hội thoại', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'DIRECT_MESSAGE', conversationId: 'c1' }))).toBe(
      '/chat/dm/c1?ten=',
    );
  });

  it('tin nhắn dự án mở phòng chat của dự án', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'PROJECT_MESSAGE', projectId: 'p1' }))).toBe(
      '/chat/p1',
    );
  });

  it('lời mời kết bạn mở màn Bạn bè', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'FRIEND_REQUEST' }))).toBe('/chat/friends');
  });

  /*
    Được duyệt kết bạn thì việc muốn làm tiếp là NHẮN TIN, không phải xem lại
    danh sách. Nhưng lúc này chưa có hội thoại nào nên màn Bạn bè là đúng chỗ.
  */
  it('được duyệt kết bạn cũng mở màn Bạn bè', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'FRIEND_ACCEPTED' }))).toBe('/chat/friends');
  });

  /*
    Nhắc hạn công việc đi đường CŨ, qua `taskIdFromResponse`. Hàm này phải trả
    null cho chúng, nếu không hai đường cùng điều hướng và màn hình nhảy hai lần.
  */
  it('trả null cho thông báo công việc', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'TASK_ASSIGNED', taskId: 't1' }))).toBeNull();
  });

  it('trả null khi không có dữ liệu gì', () => {
    expect(duongDanTuThongBao(makeResponse(undefined))).toBeNull();
    expect(duongDanTuThongBao(null)).toBeNull();
  });

  it('trả null khi thiếu id cần thiết', () => {
    expect(duongDanTuThongBao(makeResponse({ type: 'DIRECT_MESSAGE' }))).toBeNull();
    expect(duongDanTuThongBao(makeResponse({ type: 'PROJECT_MESSAGE' }))).toBeNull();
  });
});
