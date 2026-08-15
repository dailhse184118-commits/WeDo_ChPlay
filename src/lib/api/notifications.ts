import { apiRequest } from './client';
import type { NotificationItem, NotificationPreferences } from '../types';

export function listNotifications(): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>('/notifications');
}

export function getUnreadCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notifications/unread-count');
}

export function getPreferences(): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/notifications/preferences');
}

/** Cả bốn trường đều tuỳ chọn phía server, nên chỉ gửi đúng thứ vừa đổi. */
export function updatePreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/notifications/preferences', {
    method: 'PATCH',
    body: patch,
  });
}

/** Ghi nhận thiết bị này để máy chủ đẩy thông báo xuống kể cả khi app đã tắt. */
export function registerPushToken(
  token: string,
  platform: 'android' | 'ios',
): Promise<unknown> {
  return apiRequest('/notifications/push-token', {
    method: 'POST',
    body: { token, platform },
  });
}

/**
 * Gỡ thiết bị lúc đăng xuất.
 *
 * Bỏ qua bước này thì người vừa đăng xuất vẫn nhận thông báo công việc trên
 * chiếc máy họ vừa trả lại — rò rỉ cả tiêu đề công việc lẫn tên dự án.
 */
export function unregisterPushToken(token: string): Promise<unknown> {
  return apiRequest('/notifications/push-token', {
    method: 'DELETE',
    body: { token },
  });
}

export function markNotificationRead(id: string): Promise<unknown> {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiRequest('/notifications/read-all', { method: 'POST' });
}
