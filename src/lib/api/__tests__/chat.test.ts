import {
  getProjectMessages,
  getProjectHistory,
  sendProjectMessage,
  markProjectRead,
  requestTaskSuggestion,
  linkMessageTask,
} from '../chat';
import { listProjects } from '../projects';
import { createTask } from '../tasks';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API chat và dự án', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET /projects kèm workspaceId', async () => {
    await listProjects('w1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects?workspaceId=w1');
  });

  it('GET /projects không kèm tham số khi thiếu workspaceId', async () => {
    await listProjects();
    expect(mockedRequest).toHaveBeenCalledWith('/projects');
  });

  it('mã hoá workspaceId có ký tự đặc biệt', async () => {
    await listProjects('a b&c');
    expect(mockedRequest).toHaveBeenCalledWith('/projects?workspaceId=a%20b%26c');
  });

  it('GET danh sách tin nhắn ban đầu', async () => {
    await getProjectMessages('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat');
  });

  it('GET lịch sử kèm con trỏ before và limit', async () => {
    await getProjectHistory('p1', '2026-08-01T00:00:00.000Z', 30);
    expect(mockedRequest).toHaveBeenCalledWith(
      '/projects/p1/chat/history?before=2026-08-01T00%3A00%3A00.000Z&limit=30',
    );
  });

  it('GET lịch sử chỉ kèm limit khi chưa có con trỏ', async () => {
    await getProjectHistory('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/history?limit=30');
  });

  it('POST gửi tin nhắn', async () => {
    await sendProjectMessage('p1', 'Xin chào');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat', {
      method: 'POST',
      body: { content: 'Xin chào' },
    });
  });

  it('POST gửi tin nhắn kèm replyToId khi có', async () => {
    await sendProjectMessage('p1', 'Ừ', 'm9');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat', {
      method: 'POST',
      body: { content: 'Ừ', replyToId: 'm9' },
    });
  });

  it('POST đánh dấu đã đọc', async () => {
    await markProjectRead('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/read', { method: 'POST' });
  });

  it('POST xin đề xuất AI kèm header Idempotency-Key', async () => {
    await requestTaskSuggestion('p1', 'm1', 'key-abc');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/m1/ai-task-suggestion', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key-abc' },
    });
  });

  it('PATCH gắn công việc vào tin nhắn', async () => {
    await linkMessageTask('p1', 'm1', 't1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/m1/task', {
      method: 'PATCH',
      body: { taskId: 't1' },
    });
  });

  it('POST tạo công việc, bỏ trường rỗng', async () => {
    await createTask({ title: 'Nộp báo cáo', workspaceId: 'w1', projectId: 'p1' });
    expect(mockedRequest).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      body: { title: 'Nộp báo cáo', workspaceId: 'w1', projectId: 'p1' },
    });
  });

  it('POST tạo công việc kèm hạn chót và người phụ trách', async () => {
    await createTask({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
      assigneeId: 'u2',
      dueDate: '2026-08-10T09:00:00.000Z',
      description: 'Từ tin nhắn',
    });
    expect(mockedRequest).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      body: {
        title: 'Nộp báo cáo',
        workspaceId: 'w1',
        projectId: 'p1',
        assigneeId: 'u2',
        dueDate: '2026-08-10T09:00:00.000Z',
        description: 'Từ tin nhắn',
      },
    });
  });
});
