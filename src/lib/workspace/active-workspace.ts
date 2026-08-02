import type { Workspace } from '../types';

/**
 * Chọn workspace sẽ dùng. Hàm thuần để test được không cần I/O.
 * Workspace đã lưu có thể đã bị xoá hoặc người dùng bị mời ra — khi đó quay về cái đầu tiên.
 */
export function pickActiveWorkspace(
  workspaces: Workspace[],
  savedId: string | null,
): Workspace | null {
  if (workspaces.length === 0) {
    return null;
  }
  if (savedId) {
    const saved = workspaces.find((workspace) => workspace.id === savedId);
    if (saved) {
      return saved;
    }
  }
  return workspaces[0];
}
