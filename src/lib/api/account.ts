import { apiRequest } from './client';
import type { DeletionBlockers, UserProfile, Workspace } from '../types';

/**
 * Hỏi trước xem xoá được chưa.
 *
 * Máy chủ khai báo `Workspace.owner` với `onDelete: Cascade`, nên xoá một chủ sở
 * hữu là xoá theo cả không gian làm việc của nhóm. Endpoint này liệt kê chỗ vướng
 * để app giải thích cụ thể, thay vì để người dùng bấm xoá rồi nhận một lỗi cụt.
 */
export function getDeletionBlockers(): Promise<DeletionBlockers> {
  return apiRequest<DeletionBlockers>('/users/me/deletion-blockers');
}

/** Xoá vĩnh viễn tài khoản. Không hoàn tác được. */
export function deleteAccount(): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/users/me', { method: 'DELETE' });
}

/** Chuyển quyền sở hữu không gian làm việc cho một thành viên khác. */
export function transferWorkspaceOwner(
  workspaceId: string,
  newOwnerId: string,
): Promise<Workspace> {
  return apiRequest<Workspace>(`/workspaces/${workspaceId}/owner`, {
    method: 'PATCH',
    body: { newOwnerId },
  });
}

/**
 * Đổi ảnh đại diện.
 *
 * `avatarUrl` nhận chuỗi `data:` đã thu nhỏ — xem `chonAnhDaiDien`. Truyền
 * `null` để gỡ ảnh, lúc đó giao diện lùi về vòng tròn chữ cái đầu.
 *
 * Máy chủ trả về hồ sơ mới, nên chỗ gọi đẩy thẳng nó vào `capNhatHoSo` của
 * AuthContext thay vì tự ghép lại bằng tay.
 */
export function capNhatAnhDaiDien(avatarUrl: string | null): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me', {
    method: 'PATCH',
    body: { avatarUrl },
  });
}

export interface ThongTinCaNhan {
  fullName: string;
  /** Chuỗi rỗng nghĩa là gỡ số điện thoại đã lưu. */
  phone: string;
  /** `yyyy-mm-dd`, hoặc `null` để gỡ ngày sinh. Xem `../ngay-sinh`. */
  dob: string | null;
}

/**
 * Sửa họ tên, số điện thoại và ngày sinh.
 *
 * Tách riêng khỏi `capNhatAnhDaiDien` dù cùng gọi `PATCH /users/me`: hai việc
 * này xuất phát từ hai thao tác khác hẳn nhau — đổi ảnh là chạm một cái ở thẻ
 * danh tính, sửa thông tin là mở màn hình rồi bấm Lưu. Gộp làm một hàm thì mỗi
 * lần đổi ảnh lại phải kèm theo cả ba trường kia, và chỉ cần quên một trường
 * là máy chủ xoá mất giá trị cũ.
 *
 * Máy chủ trả hồ sơ mới, nên chỗ gọi đẩy thẳng nó vào `capNhatHoSo` của
 * AuthContext thay vì tự ghép lại bằng tay.
 */
export function capNhatThongTinCaNhan(thongTin: ThongTinCaNhan): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me', {
    method: 'PATCH',
    body: {
      fullName: thongTin.fullName,
      phone: thongTin.phone,
      /*
        Bỏ hẳn khoá khi không có ngày sinh, thay vì gửi `null`. DTO máy chủ khai
        `dob` là `@IsDateString()` — `null` sẽ bị bộ kiểm tra chặn lại, còn
        thiếu khoá thì `@IsOptional()` cho qua.
      */
      ...(thongTin.dob ? { dob: thongTin.dob } : {}),
    },
  });
}
