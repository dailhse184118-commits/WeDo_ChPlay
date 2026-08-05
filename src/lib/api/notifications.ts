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

export function markNotificationRead(id: string): Promise<unknown> {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiRequest('/notifications/read-all', { method: 'POST' });
}
