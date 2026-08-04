import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from './types';

/**
 * Gateway của server khai `namespace: '/chat'`. Nối vào gốc sẽ bắt tay được nhưng
 * KHÔNG nhận được sự kiện nào — một lỗi rất khó nhìn ra.
 */
export function buildSocketUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/chat`;
}

/** Sự kiện server phát xuống. Đặt tên theo đúng chuỗi trong `chat.gateway.ts`. */
export interface ServerEvents {
  'message:project': (message: ChatMessage) => void;
  'message:project:updated': (message: ChatMessage) => void;
  'message:project:recalled': (message: ChatMessage) => void;
  'typing:project': (payload: { projectId: string; typing: boolean; userId: string }) => void;
  'presence:snapshot': (userIds: string[]) => void;
  'presence:online': (payload: { userId: string }) => void;
  'presence:offline': (payload: { userId: string }) => void;
}

export function createChatSocket(token: string): Socket {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  return io(buildSocketUrl(base), {
    // Server đọc `handshake.auth.token`. Truyền qua query sẽ bị từ chối.
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });
}
