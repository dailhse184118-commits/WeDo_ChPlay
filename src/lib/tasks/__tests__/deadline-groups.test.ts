import { bucketOf, groupByDeadline, myTasks } from '../deadline-groups';
import type { Task } from '../../types';

/**
 * Mọi mốc thời gian dựng bằng constructor giờ ĐỊA PHƯƠNG, không dùng chuỗi UTC.
 * `bucketOf` so sánh "cùng ngày" theo giờ địa phương, nên test viết bằng chuỗi UTC
 * sẽ đúng ở múi giờ này và sai ở múi giờ khác.
 */
const NOW = new Date(2026, 7, 4, 10, 0, 0); // 04/08/2026 10:00 giờ địa phương

function iso(year: number, month: number, day: number, hour = 10): string {
  return new Date(year, month, day, hour, 0, 0).toISOString();
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: iso(2026, 7, 1),
    updatedAt: iso(2026, 7, 1),
    ...overrides,
  };
}

describe('myTasks', () => {
  it('chỉ giữ việc giao cho mình', () => {
    const list = [makeTask({ id: 'a', assigneeId: 'u1' }), makeTask({ id: 'b', assigneeId: 'u2' })];
    expect(myTasks(list, 'u1').map((t) => t.id)).toEqual(['a']);
  });

  it('loại việc chưa giao ai', () => {
    expect(myTasks([makeTask({ assigneeId: null })], 'u1')).toEqual([]);
  });

  it('loại việc đã hoàn thành', () => {
    const list = [makeTask({ id: 'a', status: 'DONE' }), makeTask({ id: 'b', status: 'TODO' })];
    expect(myTasks(list, 'u1').map((t) => t.id)).toEqual(['b']);
  });
});

describe('bucketOf', () => {
  it('việc chờ phản hồi luôn vào nhóm pending', () => {
    const task = makeTask({ assignmentStatus: 'PENDING', dueDate: iso(2027, 0, 1) });
    expect(bucketOf(task, NOW)).toBe('pending');
  });

  it('không có hạn chót', () => {
    expect(bucketOf(makeTask({ dueDate: null }), NOW)).toBe('noDueDate');
  });

  it('quá hạn', () => {
    expect(bucketOf(makeTask({ dueDate: iso(2026, 7, 3) }), NOW)).toBe('overdue');
  });

  it('hôm nay, giờ đã qua nhưng vẫn cùng ngày', () => {
    expect(bucketOf(makeTask({ dueDate: iso(2026, 7, 4, 8) }), NOW)).toBe('today');
  });

  it('hôm nay, giờ chưa tới', () => {
    expect(bucketOf(makeTask({ dueDate: iso(2026, 7, 4, 20) }), NOW)).toBe('today');
  });

  it('trong tuần này', () => {
    expect(bucketOf(makeTask({ dueDate: iso(2026, 7, 8) }), NOW)).toBe('thisWeek');
  });

  it('xa hơn một tuần', () => {
    expect(bucketOf(makeTask({ dueDate: iso(2026, 8, 1) }), NOW)).toBe('later');
  });

  it('hạn chót không hợp lệ coi như không có hạn', () => {
    expect(bucketOf(makeTask({ dueDate: 'khong-phai-ngay' }), NOW)).toBe('noDueDate');
  });
});

describe('groupByDeadline', () => {
  it('trả mảng rỗng khi không có việc nào', () => {
    expect(groupByDeadline([], NOW)).toEqual([]);
  });

  it('bỏ nhóm rỗng', () => {
    const groups = groupByDeadline([makeTask({ dueDate: null })], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].bucket).toBe('noDueDate');
  });

  it('sắp xếp nhóm theo đúng thứ tự ưu tiên', () => {
    const groups = groupByDeadline(
      [
        makeTask({ id: 'later', dueDate: iso(2026, 8, 1) }),
        makeTask({ id: 'overdue', dueDate: iso(2026, 7, 1) }),
        makeTask({ id: 'pending', assignmentStatus: 'PENDING' }),
        makeTask({ id: 'today', dueDate: iso(2026, 7, 4, 20) }),
      ],
      NOW,
    );
    expect(groups.map((g) => g.bucket)).toEqual(['pending', 'overdue', 'today', 'later']);
  });

  it('trong mỗi nhóm sắp theo hạn chót tăng dần', () => {
    const groups = groupByDeadline(
      [
        makeTask({ id: 'muon', dueDate: iso(2026, 7, 4, 22) }),
        makeTask({ id: 'som', dueDate: iso(2026, 7, 4, 12) }),
      ],
      NOW,
    );
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['som', 'muon']);
  });

  it('nhãn nhóm là tiếng Việt', () => {
    const groups = groupByDeadline([makeTask({ dueDate: iso(2026, 7, 1) })], NOW);
    expect(groups[0].label).toBe('Quá hạn');
  });
});
