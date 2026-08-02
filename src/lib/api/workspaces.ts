import { apiRequest } from './client';
import type { Workspace } from '../types';

export function listWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('/workspaces');
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
