import { createTaskFromMessage, combineDueDateTime } from '../create-task-from-message';
import { createTask } from '../../api/tasks';
import { linkMessageTask } from '../../api/chat';

jest.mock('../../api/tasks');
jest.mock('../../api/chat');

const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedLink = linkMessageTask as jest.MockedFunction<typeof linkMessageTask>;

const task = { id: 't1', title: 'Nộp báo cáo' };
const message = { id: 'm1', content: 'Mai nộp báo cáo nhé' };

const baseInput = {
  projectId: 'p1',
  workspaceId: 'w1',
  messageId: 'm1',
  title: 'Nộp báo cáo',
};

describe('combineDueDateTime', () => {
  it('trả undefined khi không có ngày', () => {
    expect(combineDueDateTime(undefined, '09:00')).toBeUndefined();
  });

  it('mặc định 00:00 khi có ngày mà thiếu giờ', () => {
    const iso = combineDueDateTime('2026-08-10');
    expect(iso).toBe(new Date('2026-08-10T00:00:00').toISOString());
  });

  it('ghép ngày với giờ', () => {
    const iso = combineDueDateTime('2026-08-10', '09:30');
    expect(iso).toBe(new Date('2026-08-10T09:30:00').toISOString());
  });

  it('trả undefined khi ngày không hợp lệ', () => {
    expect(combineDueDateTime('khong-phai-ngay', '09:00')).toBeUndefined();
  });
});

describe('createTaskFromMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tạo rồi gắn thành công', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockResolvedValue(message as never);

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('created-and-linked');
    expect(mockedCreateTask).toHaveBeenCalledWith({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
    });
    expect(mockedLink).toHaveBeenCalledWith('p1', 'm1', 't1');
  });

  it('gửi kèm người phụ trách và hạn chót khi có', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockResolvedValue(message as never);

    await createTaskFromMessage({
      ...baseInput,
      assigneeId: 'u2',
      description: 'Từ tin nhắn',
      dueDate: '2026-08-10',
      dueTime: '09:00',
    });

    expect(mockedCreateTask).toHaveBeenCalledWith({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
      assigneeId: 'u2',
      description: 'Từ tin nhắn',
      dueDate: new Date('2026-08-10T09:00:00').toISOString(),
    });
  });

  it('báo created-not-linked khi tạo xong nhưng gắn hỏng', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockRejectedValue(new Error('Mạng lỗi'));

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('created-not-linked');
    if (result.outcome === 'created-not-linked') {
      expect(result.task.id).toBe('t1');
      expect(result.error.message).toBe('Mạng lỗi');
    }
  });

  it('báo failed khi ngay bước tạo đã hỏng', async () => {
    mockedCreateTask.mockRejectedValue(new Error('Không tạo được công việc'));

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('failed');
    expect(mockedLink).not.toHaveBeenCalled();
  });

  it('không tạo lại công việc khi được đưa sẵn existingTaskId', async () => {
    mockedLink.mockResolvedValue(message as never);

    const result = await createTaskFromMessage({ ...baseInput, existingTaskId: 't1' });

    expect(mockedCreateTask).not.toHaveBeenCalled();
    expect(mockedLink).toHaveBeenCalledWith('p1', 'm1', 't1');
    expect(result.outcome).toBe('created-and-linked');
  });
});
