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
  /** Đổi sang workspace khác. Id không có trong danh sách thì không làm gì. */
  switchTo: (workspaceId: string) => Promise<void>;
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

  const switchTo = useCallback(
    async (workspaceId: string) => {
      /*
        Tìm trong danh sách đang có thay vì tin thẳng id gọi vào. Workspace có
        thể vừa bị xoá ở máy khác, hoặc người dùng vừa bị mời ra — khi đó đặt
        `active` thành null sẽ đá cả app về màn tạo workspace.
      */
      const chosen = workspaces.find((workspace) => workspace.id === workspaceId);
      if (!chosen || chosen.id === active?.id) return;

      setActive(chosen);
      await saveActiveWorkspaceId(chosen.id);
    },
    [workspaces, active],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkspaceState>(
    () => ({ status, active, workspaces, refresh, create, switchTo }),
    [status, active, workspaces, refresh, create, switchTo],
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
