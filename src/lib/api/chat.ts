import { apiRequest } from './client';
import { taiNhieuTepLen } from './chat-files';
import type { TepChon } from './tasks';
import type { ChatHistoryPage, ChatMessage, ChatTaskSuggestion } from '../types';

/** Số tin nhắn tải mỗi lần cuộn lên. */
export const HISTORY_PAGE_SIZE = 30;

export function getProjectMessages(projectId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/projects/${projectId}/chat`);
}

export function getProjectHistory(
  projectId: string,
  before?: string,
  limit: number = HISTORY_PAGE_SIZE,
): Promise<ChatHistoryPage> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  params.set('limit', String(limit));
  return apiRequest<ChatHistoryPage>(`/projects/${projectId}/chat/history?${params.toString()}`);
}

export function sendProjectMessage(
  projectId: string,
  content: string,
  replyToId?: string,
): Promise<ChatMessage> {
  const body: Record<string, string> = { content };
  if (replyToId) body.replyToId = replyToId;
  return apiRequest<ChatMessage>(`/projects/${projectId}/chat`, { method: 'POST', body });
}

/**
 * Gửi ảnh vào chat dự án, kèm chú thích nếu có.
 *
 * Mỗi ảnh thành một tin nhắn riêng, và chú thích chỉ gắn vào ảnh đầu tiên —
 * xem `taiNhieuTepLen`.
 */
export async function sendProjectFiles(
  projectId: string,
  files: TepChon[],
  content: string,
): Promise<ChatMessage[]> {
  return taiNhieuTepLen<ChatMessage>(
    `/projects/${encodeURIComponent(projectId)}/chat/files`,
    files,
    content,
  );
}

export function getProjectUnreadCount(projectId: string): Promise<{ count: number }> {
  return apiRequest<{ count: number }>(`/projects/${projectId}/chat/unread-count`);
}

export function markProjectRead(projectId: string): Promise<unknown> {
  return apiRequest(`/projects/${projectId}/chat/read`, { method: 'POST' });
}

/**
 * Xin AI phân tích tin nhắn.
 * `idempotencyKey` phải được sinh MỘT LẦN cho mỗi tin nhắn và giữ nguyên khi thử lại,
 * nếu không mạng chập chờn sẽ khiến server gọi AI nhiều lần.
 */
export function requestTaskSuggestion(
  projectId: string,
  messageId: string,
  idempotencyKey: string,
): Promise<ChatTaskSuggestion> {
  return apiRequest<ChatTaskSuggestion>(
    `/projects/${projectId}/chat/${messageId}/ai-task-suggestion`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
  );
}

/** Gắn một công việc ĐÃ TỒN TẠI vào tin nhắn. Không tạo công việc mới. */
export function linkMessageTask(
  projectId: string,
  messageId: string,
  taskId: string,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/projects/${projectId}/chat/${messageId}/task`, {
    method: 'PATCH',
    body: { taskId },
  });
}
