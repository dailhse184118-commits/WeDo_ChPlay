import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createWorkspace, listWorkspaces } from '../api/workspaces';
import { loadActiveWorkspaceId, saveActiveWorkspaceId } from '../auth/token-storage';
import type { Workspace } from '../types';
import { pickActiveWorkspace } from './active-workspace';

export type WorkspaceStatus = 'loading' | 'empty' | 'ready';

export interface WorkspaceState {
  status: WorkspaceStatus;
  active: Workspace | null;
  workspaces: Workspace[];
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WorkspaceStatus>('loading');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<Workspace | null>(null);

  const refresh = useCallback(async () => {
    const list = await listWorkspaces();
    setWorkspaces(list);

    const savedId = await loadActiveWorkspaceId();
    const chosen = pickActiveWorkspace(list, savedId);

    setActive(chosen);
    setStatus(chosen ? 'ready' : 'empty');

    if (chosen && chosen.id !== savedId) {
      await saveActiveWorkspaceId(chosen.id);
    }
  }, []);

  const create = useCallback(async (name: string) => {
    const workspace = await createWorkspace({ name });
    await saveActiveWorkspaceId(workspace.id);
    setWorkspaces((current) => [...current, workspace]);
    setActive(workspace);
    setStatus('ready');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkspaceState>(
    () => ({ status, active, workspaces, refresh, create }),
    [status, active, workspaces, refresh, create],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace phải được dùng bên trong WorkspaceProvider');
  }
  return context;
}
