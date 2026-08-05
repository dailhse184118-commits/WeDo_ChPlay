import { apiRequest } from './client';
import type { DeletionBlockers, Workspace } from '../types';

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
