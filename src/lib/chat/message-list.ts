import type { ChatMessage } from '../types';

/**
 * Gộp hai nguồn tin nhắn thành một danh sách đã sắp xếp và khử trùng.
 * Cùng một tin nhắn có thể đến từ cả REST lẫn socket, nên khử trùng theo id là bắt buộc.
 * Bản đến sau thắng vì nó mới hơn.
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Thay một tin nhắn bằng bản đã thu hồi. Trả nguyên danh sách nếu không tìm thấy. */
export function applyRecall(list: ChatMessage[], recalled: ChatMessage): ChatMessage[] {
  if (!list.some((message) => message.id === recalled.id)) {
    return list;
  }
  return list.map((message) => (message.id === recalled.id ? recalled : message));
}
