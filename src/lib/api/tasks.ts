import { apiRequest } from './client';
import type { Task, TaskStatus } from '../types';

export interface CreateTaskInput {
  title: string;
  workspaceId: string;
  description?: string;
  status?: TaskStatus;
  /** Chuỗi ISO 8601 đầy đủ. */
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  const body: Record<string, string> = {
    title: input.title,
    workspaceId: input.workspaceId,
  };
  if (input.description) body.description = input.description;
  if (input.status) body.status = input.status;
  if (input.dueDate) body.dueDate = input.dueDate;
  if (input.projectId) body.projectId = input.projectId;
  if (input.assigneeId) body.assigneeId = input.assigneeId;

  return apiRequest<Task>('/tasks', { method: 'POST', body });
}

export function listTasks(workspaceId?: string, projectId?: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (projectId) params.set('projectId', projectId);
  const query = params.toString();
  return apiRequest<Task[]>(query ? `/tasks?${query}` : '/tasks');
}

export function getTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`);
}

/** Chỉ chạy được khi assignmentStatus === 'PENDING' và mình là người phụ trách. */
export function acceptTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/accept`, { method: 'POST' });
}

/**
 * Từ chối việc được giao. `RejectTaskDto` phía server yêu cầu tối thiểu 3 ký tự,
 * nên chặn ngay ở client để người dùng thấy lỗi tức thì thay vì đợi một vòng mạng.
 */
export function rejectTask(id: string, reason: string): Promise<Task> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return Promise.reject(new Error('Lý do từ chối phải có ít nhất 3 ký tự'));
  }
  return apiRequest<Task>(`/tasks/${id}/reject`, {
    method: 'POST',
    body: { reason: trimmed },
  });
}
