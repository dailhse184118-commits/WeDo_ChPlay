import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { useAuth } from '../auth/auth-context';
import { loadToken } from '../auth/token-storage';
import { createChatSocket } from '../socket';

export interface SocketState {
  socket: Socket | null;
  connected: boolean;
  onlineUserIds: Set<string>;
}

const SocketContext = createContext<SocketState | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }

    let cancelled = false;
    let active: Socket | null = null;

    (async () => {
      const token = await loadToken();
      if (!token || cancelled) return;

      const next = createChatSocket(token);
      active = next;

      next.on('connect', () => setConnected(true));
      next.on('disconnect', () => setConnected(false));
      next.on('presence:snapshot', (ids: string[]) => setOnlineUserIds(new Set(ids)));
      next.on('presence:online', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => new Set(current).add(userId)),
      );
      next.on('presence:offline', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => {
          const copy = new Set(current);
          copy.delete(userId);
          return copy;
        }),
      );

      if (!cancelled) setSocket(next);
    })();

    return () => {
      cancelled = true;
      // Bắt buộc dọn. Bỏ qua sẽ khiến đăng nhập lại tạo kết nối chồng
      // và mỗi tin nhắn hiện hai lần.
      active?.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUserIds(new Set());
    };
  }, [status]);

  const value = useMemo<SocketState>(
    () => ({ socket, connected, onlineUserIds }),
    [socket, connected, onlineUserIds],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketState {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được dùng bên trong SocketProvider');
  }
  return context;
}
