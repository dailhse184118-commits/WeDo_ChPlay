import type { Friendship, NguoiTimDuoc, UserSummary } from '../types';

/**
 * Trạng thái quan hệ giữa mình và một người tìm được.
 *
 * `cho-minh-duyet` tách riêng khỏi `da-gui-loi-moi` vì hai bên phải thấy hai
 * giao diện khác hẳn: một bên chờ, một bên có nút duyệt.
 */
export type TrangThaiKetBan = 'chua-gi-ca' | 'da-gui-loi-moi' | 'cho-minh-duyet' | 'la-ban';

/**
 * Người kia trong một quan hệ bạn bè.
 *
 * Máy chủ trả về cả `requester` lẫn `addressee`, còn giao diện luôn chỉ cần
 * "người kia là ai". Mình có thể ở một trong hai vai tuỳ ai gửi lời mời trước,
 * nên không thể cứ lấy cứng một bên.
 *
 * Trả `null` khi mình không thuộc quan hệ này, hoặc khi máy chủ không kèm hồ sơ
 * người kia — một dòng hỏng thì bỏ dòng đó, không được làm sập cả danh sách.
 */
export function nguoiKiaTrongTinhBan(
  tinhBan: Friendship,
  userId: string,
): UserSummary | null {
  if (tinhBan.requesterId === userId) return tinhBan.addressee ?? null;
  if (tinhBan.addresseeId === userId) return tinhBan.requester ?? null;
  return null;
}

/**
 * Nên hiện nút gì cho một người tìm được.
 *
 * `REJECTED` cố ý coi như chưa có gì: máy chủ dùng `upsert` nên lời mời mới ghi
 * đè lên bản ghi bị từ chối, tức gửi lại được. Chặn ở giao diện là chặn nhầm.
 */
export function trangThaiKetBan(nguoi: NguoiTimDuoc, userId: string): TrangThaiKetBan {
  const tinhBan = nguoi.friendship;
  if (!tinhBan) return 'chua-gi-ca';

  if (tinhBan.status === 'ACCEPTED') return 'la-ban';

  if (tinhBan.status === 'PENDING') {
    return tinhBan.requesterId === userId ? 'da-gui-loi-moi' : 'cho-minh-duyet';
  }

  return 'chua-gi-ca';
}
