import {
  listNotifications,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  markNotificationRead,
  markAllNotificationsRead,
} from '../notifications';
import { listTasks, getTask, acceptTask, rejectTask } from '../tasks';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API công việc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET /tasks kèm workspaceId', async () => {
    await listTasks('w1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks?workspaceId=w1');
  });

  it('GET /tasks kèm cả projectId', async () => {
    await listTasks('w1', 'p1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks?workspaceId=w1&projectId=p1');
  });

  it('GET /tasks không tham số khi thiếu workspaceId', async () => {
    await listTasks();
    expect(mockedRequest).toHaveBeenCalledWith('/tasks');
  });

  it('GET chi tiết công việc', async () => {
    await getTask('t1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1');
  });

  it('POST nhận việc', async () => {
    await acceptTask('t1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1/accept', { method: 'POST' });
  });

  it('POST từ chối việc kèm lý do đã cắt khoảng trắng', async () => {
    await rejectTask('t1', '  Bận thi cuối kỳ  ');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1/reject', {
      method: 'POST',
      body: { reason: 'Bận thi cuối kỳ' },
    });
  });

  it('chặn từ chối khi lý do ngắn hơn 3 ký tự', async () => {
    await expect(rejectTask('t1', 'ok')).rejects.toThrow(
      'Lý do từ chối phải có ít nhất 3 ký tự',
    );
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});

describe('API thông báo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET danh sách thông báo', async () => {
    await listNotifications();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications');
  });

  it('GET số chưa đọc', async () => {
    await getUnreadCount();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('GET tuỳ chọn thông báo', async () => {
    await getPreferences();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/preferences');
  });

  it('PATCH tuỳ chọn, chỉ gửi trường được đổi', async () => {
    await updatePreferences({ notifyDeadlineReminder: false });
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/preferences', {
      method: 'PATCH',
      body: { notifyDeadlineReminder: false },
    });
  });

  it('PATCH đánh dấu một thông báo đã đọc', async () => {
    await markNotificationRead('n1');
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/n1/read', { method: 'PATCH' });
  });

  it('POST đánh dấu tất cả đã đọc', async () => {
    await markAllNotificationsRead();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
  });
});
