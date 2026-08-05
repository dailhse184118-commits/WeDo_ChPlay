import * as Notifications from 'expo-notifications';

import { diffReminders, type ScheduledReminder } from './diff';
import type { ReminderPlan } from './scheduler';

/** Đọc lịch đang đặt, quy về dạng so sánh được. */
async function readScheduled(): Promise<ScheduledReminder[]> {
  const raw = await Notifications.getAllScheduledNotificationsAsync();
  const items: ScheduledReminder[] = [];

  for (const item of raw) {
    const trigger = item.trigger as { type?: string; value?: number } | null;
    // Chỉ quan tâm mốc hẹn theo ngày giờ; các loại khác không phải lịch nhắc hạn.
    if (!trigger || typeof trigger.value !== 'number') continue;

    const data = item.content?.data as Record<string, unknown> | undefined;
    const taskId = typeof data?.taskId === 'string' ? data.taskId : null;

    items.push({ id: item.identifier, taskId, fireAt: trigger.value });
  }

  return items;
}

/**
 * Đồng bộ lịch nhắc: chỉ đụng vào phần khác nhau giữa lịch đang có và lịch cần có.
 *
 * KHÔNG huỷ sạch rồi đặt lại. Xem `diff.ts` để biết vì sao — cách đó làm mất lời
 * nhắc khi người dùng mở app đúng lúc báo thức đang chờ được giao.
 *
 * Dùng báo thức KHÔNG CHÍNH XÁC, mặc định của expo-notifications. Google chỉ cho
 * app đồng hồ báo thức, hẹn giờ và lịch xin `USE_EXACT_ALARM`; WeDo là app quản lý
 * công việc nên xin quyền đó sẽ bị từ chối phát hành.
 *
 * Đánh đổi: dưới Doze mode thông báo có thể trễ vài phút đến vài giờ. Đây là hành
 * vi đã chấp nhận, và là lý do kỹ thuật cho Giai đoạn 2 dùng FCM.
 *
 * Trả về số lịch vừa đặt thêm.
 */
export async function syncScheduledReminders(
  plans: ReminderPlan[],
  now: Date = new Date(),
): Promise<number> {
  try {
    const existing = await readScheduled();
    const { cancel, create } = diffReminders(existing, plans, now);

    for (const id of cancel) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }

    for (const plan of create) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: plan.title,
          body: plan.body,
          data: { taskId: plan.taskId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.fireAt,
        },
      });
    }

    return create.length;
  } catch {
    // Thiếu module native hoặc bị hệ thống chặn. Không được làm hỏng luồng chính.
    return 0;
  }
}
