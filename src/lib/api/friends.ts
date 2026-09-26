import { apiRequest } from './client';
import type { FriendsList, Friendship, NguoiTimDuoc } from '../types';

/**
 * Máy chủ chặn từ khoá dưới 3 ký tự, khớp luôn ở đây cho khỏi bắn lượt gọi thừa.
 *
 * Từng là 2. Nâng lên 3 cùng lúc máy chủ thôi cho dò email và số điện thoại
 * theo từng mẩu (giờ phải khớp đúng cả chuỗi): từ khoá hai ký tự chỉ còn dò
 * được tên, và kết quả rộng tới mức chẳng giúp gì.
 */
export const DO_DAI_TU_KHOA_TOI_THIEU = 3;

/**
 * Bạn bè, lời mời đến và lời mời đã gửi — cả ba trong một lượt gọi.
 *
 * Máy chủ đã gom sẵn, tách thành ba truy vấn chỉ tốn thêm hai vòng mạng mà
 * không được gì.
 */
export function listFriends(): Promise<FriendsList> {
  return apiRequest<FriendsList>('/friends');
}

/**
 * Tìm người theo tên, email hoặc số điện thoại.
 *
 * Trả mảng rỗng ngay khi từ khoá quá ngắn, không gọi máy chủ: dưới 3 ký tự thì
 * máy chủ cũng trả rỗng, nên gọi chỉ tổ tốn dữ liệu di động của người dùng.
 */
export function searchUsers(query: string): Promise<NguoiTimDuoc[]> {
  const tuKhoa = query.trim();
  if (tuKhoa.length < DO_DAI_TU_KHOA_TOI_THIEU) return Promise.resolve([]);

  return apiRequest<NguoiTimDuoc[]>(`/friends/search?query=${encodeURIComponent(tuKhoa)}`);
}

export function sendFriendRequest(targetUserId: string): Promise<Friendship> {
  return apiRequest<Friendship>('/friends/requests', {
    method: 'POST',
    body: { targetUserId },
  });
}

/** Duyệt hoặc từ chối một lời mời đã nhận. */
export function respondToRequest(friendshipId: string, accept: boolean): Promise<Friendship> {
  const duoi = accept ? 'accept' : 'reject';
  return apiRequest<Friendship>(
    `/friends/requests/${encodeURIComponent(friendshipId)}/${duoi}`,
    { method: 'POST' },
  );
}
