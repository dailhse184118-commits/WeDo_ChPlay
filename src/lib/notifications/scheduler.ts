import type { Task } from '../types';

export interface ReminderPlan {
  taskId: string;
  title: string;
  body: string;
  fireAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Số lịch tối đa giữ cùng lúc. Android giới hạn số báo thức chờ của mỗi app. */
export const MAX_SCHEDULED = 60;

/**
 * Tính danh sách mốc nhắc. Hàm thuần, không gọi `expo-notifications`, nhận `now`
 * làm tham số để test được mà không cần giả lập đồng hồ.
 *
 * Mỗi việc sinh hai mốc: trước 24 giờ và đúng giờ hạn. Mốc đã qua bị bỏ.
 */
export function planReminders(
  tasks: Task[],
  userId: string,
  now: Date,
  limit: number = MAX_SCHEDULED,
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];

  for (const task of tasks) {
    if (task.assigneeId !== userId) continue;
    if (task.status === 'DONE') continue;
    if (task.assignmentStatus === 'REJECTED') continue;
    if (!task.dueDate) continue;

    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (due.getTime() <= now.getTime()) continue;

    const dayBefore = new Date(due.getTime() - DAY_MS);
    if (dayBefore.getTime() > now.getTime()) {
      plans.push({
        taskId: task.id,
        title: 'Sắp đến hạn',
        body: `"${task.title}" đến hạn sau 24 giờ nữa.`,
        fireAt: dayBefore,
      });
    }

    plans.push({
      taskId: task.id,
      title: 'Đến hạn hôm nay',
      body: `"${task.title}" đến hạn bây giờ.`,
      fireAt: due,
    });
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, limit);
}
