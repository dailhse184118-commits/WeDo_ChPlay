import * as Notifications from 'expo-notifications';
import type { ReminderPlan } from './scheduler';

/**
 * Đặt lại toàn bộ lịch nhắc: huỷ hết rồi đặt mới.
 *
 * Đơn giản hơn so sánh từng cái, và số lịch nhỏ nên không tốn kém. Trả về số lịch
 * đã đặt được.
 *
 * Dùng báo thức KHÔNG CHÍNH XÁC, mặc định của expo-notifications. Google chỉ cho
 * app đồng hồ báo thức, hẹn giờ và lịch xin `USE_EXACT_ALARM`; WeDo là app quản lý
 * công việc nên xin quyền đó sẽ bị từ chối phát hành.
 *
 * Đánh đổi: dưới Doze mode thông báo có thể trễ vài phút đến vài giờ. Đây là hành
 * vi đã chấp nhận, và là lý do kỹ thuật cho Giai đoạn 2 dùng FCM.
 */
export async function syncScheduledReminders(plans: ReminderPlan[]): Promise<number> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    let scheduled = 0;
    for (const plan of plans) {
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
      scheduled += 1;
    }

    return scheduled;
  } catch {
    // Thiếu module native hoặc bị hệ thống chặn. Không được làm hỏng luồng chính.
    return 0;
  }
}
