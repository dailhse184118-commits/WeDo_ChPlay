import { planReminders } from '../scheduler';
import type { Task } from '../../types';

const NOW = new Date('2026-08-04T10:00:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('planReminders', () => {
  it('trả rỗng khi không có việc nào', () => {
    expect(planReminders([], 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc của người khác', () => {
    const tasks = [makeTask({ assigneeId: 'u2', dueDate: '2026-08-10T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc đã xong', () => {
    const tasks = [makeTask({ status: 'DONE', dueDate: '2026-08-10T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc đã từ chối', () => {
    const tasks = [
      makeTask({ assignmentStatus: 'REJECTED', dueDate: '2026-08-10T10:00:00.000Z' }),
    ];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc không có hạn chót', () => {
    expect(planReminders([makeTask({ dueDate: null })], 'u1', NOW)).toEqual([]);
  });

  it('sinh hai mốc cho việc còn hạn xa', () => {
    const tasks = [makeTask({ dueDate: '2026-08-10T10:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans).toHaveLength(2);
    expect(plans[0].fireAt.toISOString()).toBe('2026-08-09T10:00:00.000Z');
    expect(plans[1].fireAt.toISOString()).toBe('2026-08-10T10:00:00.000Z');
  });

  it('bỏ mốc trước 24 giờ nếu mốc đó đã qua', () => {
    const tasks = [makeTask({ dueDate: '2026-08-04T20:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans).toHaveLength(1);
    expect(plans[0].fireAt.toISOString()).toBe('2026-08-04T20:00:00.000Z');
  });

  it('bỏ hẳn việc đã quá hạn', () => {
    const tasks = [makeTask({ dueDate: '2026-08-01T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ hạn chót không hợp lệ', () => {
    expect(planReminders([makeTask({ dueDate: 'sai-dinh-dang' })], 'u1', NOW)).toEqual([]);
  });

  it('sắp theo thời gian tăng dần', () => {
    const tasks = [
      makeTask({ id: 'xa', dueDate: '2026-08-20T10:00:00.000Z' }),
      makeTask({ id: 'gan', dueDate: '2026-08-06T10:00:00.000Z' }),
    ];
    const plans = planReminders(tasks, 'u1', NOW);
    expect(plans[0].taskId).toBe('gan');
  });

  it('cắt bớt khi vượt giới hạn', () => {
    const tasks = Array.from({ length: 50 }, (_, i) =>
      makeTask({
        id: `t${i}`,
        dueDate: `2026-09-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z`,
      }),
    );
    expect(planReminders(tasks, 'u1', NOW, 10)).toHaveLength(10);
  });

  it('nội dung thông báo bằng tiếng Việt và có tên việc', () => {
    const tasks = [makeTask({ title: 'Nộp báo cáo tuần', dueDate: '2026-08-10T10:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans[0].title).toBe('Sắp đến hạn');
    expect(plans[0].body).toContain('Nộp báo cáo tuần');
    expect(plans[1].title).toBe('Đến hạn hôm nay');
  });
});
