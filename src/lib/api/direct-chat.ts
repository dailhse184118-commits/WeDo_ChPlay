import { apiRequest } from './client';
import { taiNhieuTepLen } from './chat-files';
import type { TepChon } from './tasks';
import type { DirectConversation, DirectMessage } from '../types';

/**
 * Mọi id đi vào đường dẫn đều phải mã hoá.
 *
 * Id là uuid nên trong thực tế không có ký tự lạ, nhưng một id hỏng đọc ra từ
 * cache cũ mà lọt vào đường dẫn sẽ sinh một URL khác hẳn ý định — lỗi rất khó
 * lần ra vì máy chủ chỉ trả 404 chứ không nói gì thêm.
 */
function duongDan(conversationId: string, duoi: string): string {
  return `/chat/direct/conversations/${encodeURIComponent(conversationId)}${duoi}`;
}

export function listConversations(): Promise<DirectConversation[]> {
  return apiRequest<DirectConversation[]>('/chat/direct/conversations');
}

/**
 * Tạo hội thoại, hoặc lấy lại cái đã có.
 *
 * Máy chủ tra theo `pairKey` trước khi tạo, nên gọi nhiều lần với cùng một người
 * không sinh hội thoại trùng — chỗ gọi không cần tự kiểm tra trước.
 */
export function startConversation(targetUserId: string): Promise<DirectConversation> {
  return apiRequest<DirectConversation>('/chat/direct/conversations', {
    method: 'POST',
    body: { targetUserId },
  });
}

/** Số tin `GET /messages` trả về — máy chủ cố định `take: 40`. Đủ số này thì có thể còn tin cũ hơn. */
export const SO_TIN_RIENG_MOI_NHAT = 40;

/**
 * Phần tin nhắn gần nhất của một hội thoại.
 *
 * LƯU Ý: máy chủ coi lượt gọi này là "đã đọc" (`markDirectRead`). Chỉ gọi khi
 * người dùng thật sự đang nhìn hội thoại — xem màn `dm/[conversationId]`.
 */
export function getDirectMessages(conversationId: string): Promise<DirectMessage[]> {
  return apiRequest<DirectMessage[]>(duongDan(conversationId, '/messages'));
}

export interface TrangTinRieng {
  /** Cũ trước, mới sau — như `getDirectMessages`. */
  items: DirectMessage[];
  /** `null` khi đã hết lịch sử. */
  nextCursor: string | null;
}

/**
 * Một trang tin CŨ HƠN tin có mã `truocTin`.
 *
 * Khác `getDirectMessages`: máy chủ KHÔNG đánh dấu đã đọc ở đây, nên cuộn lên
 * xem lại không làm đổi gì về huy hiệu.
 */
export function getDirectHistory(conversationId: string, truocTin: string): Promise<TrangTinRieng> {
  return apiRequest<TrangTinRieng>(
    duongDan(conversationId, `/history?before=${encodeURIComponent(truocTin)}`),
  );
}

export function sendDirectMessage(
  conversationId: string,
  content: string,
): Promise<DirectMessage> {
  return apiRequest<DirectMessage>(duongDan(conversationId, '/messages'), {
    method: 'POST',
    body: { content },
  });
}

/**
 * Gửi ảnh vào một hội thoại riêng, kèm chú thích nếu có.
 *
 * Mỗi ảnh thành một tin nhắn riêng, và chú thích chỉ gắn vào ảnh đầu tiên —
 * xem `taiNhieuTepLen`.
 */
export async function sendDirectFiles(
  conversationId: string,
  files: TepChon[],
  content: string,
): Promise<DirectMessage[]> {
  return taiNhieuTepLen<DirectMessage>(duongDan(conversationId, '/files'), files, content);
}

export function markConversationRead(conversationId: string): Promise<unknown> {
  return apiRequest(duongDan(conversationId, '/read'), { method: 'POST' });
}
