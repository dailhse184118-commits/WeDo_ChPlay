import { apiRequest } from './client';
import type { Workspace, WorkspaceChiTiet } from '../types';

export function listWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('/workspaces');
}

/**
 * Chi tiết một workspace, kèm danh sách thành viên.
 *
 * Không có endpoint riêng cho thành viên: máy chủ trả họ kèm trong chi tiết
 * workspace. Đây là nguồn duy nhất để dựng ô chọn người phụ trách lúc tạo việc.
 */
export function getWorkspace(id: string): Promise<WorkspaceChiTiet> {
  return apiRequest<WorkspaceChiTiet>(`/workspaces/${encodeURIComponent(id)}`);
}

export function createWorkspace(input: {
  name: string;
  description?: string;
}): Promise<Workspace> {
  const body: Record<string, string> = { name: input.name };
  if (input.description) {
    body.description = input.description;
  }
  return apiRequest<Workspace>('/workspaces', { method: 'POST', body });
}
