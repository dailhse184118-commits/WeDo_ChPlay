import { apiRequest } from './client';
import type { Project } from '../types';

export function listProjects(workspaceId?: string): Promise<Project[]> {
  const path = workspaceId
    ? `/projects?workspaceId=${encodeURIComponent(workspaceId)}`
    : '/projects';
  return apiRequest<Project[]>(path);
}
