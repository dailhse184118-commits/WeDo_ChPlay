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
