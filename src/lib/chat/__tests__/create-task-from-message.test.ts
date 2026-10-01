import {
  combineDueDateTime,
  createTaskFromMessage,
  docHanChotAI,
} from '../create-task-from-message';
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

/*
  Ô "Ngày hết hạn" của trợ lý là ô chữ tự do. Trước đây chỉ đúng dạng
  yyyy-mm-dd và HH:mm mới qua; gõ "30/09/2026" hay "8:00" như mọi ô ngày khác
  trong app là hạn chót bị vứt đi trong im lặng, và màn vẫn báo "Đã tạo".
*/
describe('docHanChotAI', () => {
  const dia = (nam: number, thang: number, ngay: number, gio: number, phut: number) =>
    new Date(nam, thang - 1, ngay, gio, phut, 0, 0).toISOString();

  it('nhận ngày/tháng/năm như mọi ô ngày khác trong app', () => {
    expect(docHanChotAI('30/09/2026', '8:00')).toEqual({ iso: dia(2026, 9, 30, 8, 0), loi: null });
  });

  it('nhận dạng máy chủ trả về, kể cả không có số 0 đứng đầu', () => {
    expect(docHanChotAI('2026-09-30', '20:00').iso).toBe(dia(2026, 9, 30, 20, 0));
    expect(docHanChotAI('2026-9-3', '20:00').iso).toBe(dia(2026, 9, 3, 20, 0));
  });

  it('nhận giờ kiểu Việt Nam: 20h, 20h30, 8:05', () => {
    expect(docHanChotAI('30/09/2026', '20h').iso).toBe(dia(2026, 9, 30, 20, 0));
    expect(docHanChotAI('30/09/2026', '20h30').iso).toBe(dia(2026, 9, 30, 20, 30));
    expect(docHanChotAI('30/09/2026', '8:05').iso).toBe(dia(2026, 9, 30, 8, 5));
  });

  it('không có ngày thì không có hạn, cũng không có lỗi', () => {
    expect(docHanChotAI('', '23:59')).toEqual({ iso: null, loi: null });
    expect(docHanChotAI('   ')).toEqual({ iso: null, loi: null });
  });

  it('báo lỗi ngày không có thật thay vì cuộn sang tháng sau', () => {
    expect(docHanChotAI('31/02/2026', '09:00')).toEqual({
      iso: null,
      loi: expect.stringMatching(/Ngày hết hạn/),
    });
  });

  it('báo lỗi chuỗi không phải ngày', () => {
    expect(docHanChotAI('mai', '09:00').loi).toMatch(/Ngày hết hạn/);
  });

  it('báo lỗi giờ sai', () => {
    expect(docHanChotAI('30/09/2026', '25:00').loi).toMatch(/Giờ/);
    expect(docHanChotAI('30/09/2026', 'tối').loi).toMatch(/Giờ/);
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

  it('gửi đúng hạn chót khi người dùng gõ ngày/tháng/năm', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockResolvedValue(message as never);

    await createTaskFromMessage({ ...baseInput, dueDate: '30/09/2026', dueTime: '8:00' });

    expect(mockedCreateTask).toHaveBeenCalledWith(
      expect.objectContaining({ dueDate: new Date(2026, 8, 30, 8, 0, 0, 0).toISOString() }),
    );
  });

  it('có ngày mà không đọc được thì KHÔNG tạo việc thiếu hạn chót', async () => {
    const result = await createTaskFromMessage({ ...baseInput, dueDate: '31/02/2026' });

    expect(result.outcome).toBe('failed');
    if (result.outcome === 'failed') expect(result.error.message).toMatch(/Ngày hết hạn/);
    expect(mockedCreateTask).not.toHaveBeenCalled();
  });

  it('không tạo lại công việc khi được đưa sẵn existingTaskId', async () => {
    mockedLink.mockResolvedValue(message as never);

    const result = await createTaskFromMessage({ ...baseInput, existingTaskId: 't1' });

    expect(mockedCreateTask).not.toHaveBeenCalled();
    expect(mockedLink).toHaveBeenCalledWith('p1', 'm1', 't1');
    expect(result.outcome).toBe('created-and-linked');
  });
});
