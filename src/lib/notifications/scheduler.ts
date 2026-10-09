import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienThongBao } from '../../i18n/tu-dien/thong-bao';
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
 *
 * Chữ nhắc dựng theo `ngonNgu` LÚC ĐẶT LỊCH. Lịch đã đặt rồi (`diffReminders` giữ
 * nguyên lịch cùng việc cùng giờ) giữ ngôn ngữ cũ cho tới khi được đặt lại.
 */
export function planReminders(
  tasks: Task[],
  userId: string,
  now: Date,
  limit: number = MAX_SCHEDULED,
  ngonNgu: NgonNgu = layNgonNgu(),
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];
  const t = theoNgonNgu(tuDienThongBao, ngonNgu);

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
        title: t.sapDenHan,
        body: t.denHanSau24Gio(task.title),
        fireAt: dayBefore,
      });
    }

    plans.push({
      taskId: task.id,
      title: t.denHanHomNay,
      body: t.denHanBayGio(task.title),
      fireAt: due,
    });
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, limit);
}
