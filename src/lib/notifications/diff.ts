import type { ReminderPlan } from './scheduler';

/** Một lịch đã đặt, rút gọn còn đúng thứ cần để so sánh. */
export interface ScheduledReminder {
  id: string;
  taskId: string | null;
  fireAt: number;
}

export interface ReminderDiff {
  /** Định danh cần huỷ. */
  cancel: string[];
  /** Mốc cần đặt mới. */
  create: ReminderPlan[];
}

function keyOf(taskId: string | null, fireAt: number): string {
  return `${taskId ?? ''}@${fireAt}`;
}

/**
 * So lịch đang có với lịch mong muốn, chỉ đụng vào phần khác nhau.
 *
 * Trước đây `syncScheduledReminders` huỷ sạch rồi đặt lại. Cách đó có một lỗ hổng
 * im lặng: báo thức KHÔNG chính xác có cửa giao rộng tới một tiếng, nên một lời
 * nhắc đã tới giờ vẫn có thể còn nằm chờ Android giao. Người dùng mở app trong
 * cửa đó là lịch bị huỷ, mà `planReminders` thì đã loại việc quá hạn ra khỏi danh
 * sách mong muốn — lời nhắc biến mất, không bao giờ tới.
 *
 * Bắt được đúng tình huống này khi nghiệm thu ngày 05/08/2026.
 *
 * Quy tắc: lịch đã tới giờ mà chưa giao thì **để yên**, cứ để Android giao nốt.
 */
export function diffReminders(
  existing: ScheduledReminder[],
  desired: ReminderPlan[],
  now: Date,
): ReminderDiff {
  const nowMs = now.getTime();
  const desiredByKey = new Map<string, ReminderPlan>();

  for (const plan of desired) {
    desiredByKey.set(keyOf(plan.taskId, plan.fireAt.getTime()), plan);
  }

  const cancel: string[] = [];
  const kept = new Set<string>();

  for (const item of existing) {
    // Đang trên đường giao. Đụng vào là mất luôn.
    if (item.fireAt <= nowMs) continue;

    const key = keyOf(item.taskId, item.fireAt);
    if (desiredByKey.has(key)) {
      kept.add(key);
    } else {
      cancel.push(item.id);
    }
  }

  const create = desired.filter(
    (plan) => !kept.has(keyOf(plan.taskId, plan.fireAt.getTime())),
  );

  return { cancel, create };
}
