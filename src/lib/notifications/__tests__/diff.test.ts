import { diffReminders, type ScheduledReminder } from '../diff';
import type { ReminderPlan } from '../scheduler';

const NOW = new Date('2026-08-05T12:00:00.000Z');

function plan(taskId: string, fireAt: string): ReminderPlan {
  return { taskId, title: 'Đến hạn hôm nay', body: 'x', fireAt: new Date(fireAt) };
}

function scheduled(id: string, taskId: string | null, fireAt: string): ScheduledReminder {
  return { id, taskId, fireAt: new Date(fireAt).getTime() };
}

describe('diffReminders', () => {
  it('không đụng gì khi lịch đang có khớp hoàn toàn', () => {
    const existing = [scheduled('s1', 't1', '2026-08-05T18:00:00.000Z')];
    const desired = [plan('t1', '2026-08-05T18:00:00.000Z')];

    expect(diffReminders(existing, desired, NOW)).toEqual({ cancel: [], create: [] });
  });

  /*
    Lỗi bắt được khi nghiệm thu: mốc nhắc đã tới giờ nhưng Android chưa giao (báo
    thức không chính xác có cửa tới một tiếng). Mở app lúc đó thì cách huỷ-sạch
    xoá mất nó vĩnh viễn.
  */
  it('để yên lịch đã tới giờ nhưng chưa được giao', () => {
    const existing = [scheduled('s1', 't1', '2026-08-05T11:57:00.000Z')];

    expect(diffReminders(existing, [], NOW)).toEqual({ cancel: [], create: [] });
  });

  it('huỷ lịch tương lai không còn nằm trong danh sách mong muốn', () => {
    const existing = [scheduled('s1', 't1', '2026-08-05T18:00:00.000Z')];

    expect(diffReminders(existing, [], NOW)).toEqual({ cancel: ['s1'], create: [] });
  });

  it('đặt mốc mới chưa từng có', () => {
    const desired = [plan('t2', '2026-08-06T09:00:00.000Z')];
    const result = diffReminders([], desired, NOW);

    expect(result.cancel).toEqual([]);
    expect(result.create).toEqual(desired);
  });

  it('đổi giờ hạn thì huỷ mốc cũ và đặt mốc mới', () => {
    const existing = [scheduled('s1', 't1', '2026-08-05T18:00:00.000Z')];
    const desired = [plan('t1', '2026-08-05T20:00:00.000Z')];
    const result = diffReminders(existing, desired, NOW);

    expect(result.cancel).toEqual(['s1']);
    expect(result.create).toEqual(desired);
  });

  it('phân biệt hai mốc cùng việc nhưng khác giờ', () => {
    const existing = [
      scheduled('s1', 't1', '2026-08-05T18:00:00.000Z'),
      scheduled('s2', 't1', '2026-08-06T18:00:00.000Z'),
    ];
    const desired = [plan('t1', '2026-08-06T18:00:00.000Z')];
    const result = diffReminders(existing, desired, NOW);

    expect(result.cancel).toEqual(['s1']);
    expect(result.create).toEqual([]);
  });

  it('huỷ lịch lạc không gắn với việc nào', () => {
    const existing = [scheduled('s9', null, '2026-08-05T18:00:00.000Z')];

    expect(diffReminders(existing, [], NOW).cancel).toEqual(['s9']);
  });
});
