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

/**
 * `layToken` là HÀM, không phải chuỗi: socket.io gọi nó ở MỖI lần bắt tay, kể cả
 * khi tự nối lại. Trước đây truyền chuỗi token lúc đăng nhập, nên sau khi token
 * truy cập hết hạn — phần gọi API đã tự gia hạn và lưu token mới — lần nối lại
 * đầu tiên vẫn mang token cũ và bị máy chủ từ chối.
 */
export function createChatSocket(layToken: () => Promise<string | null>): Socket {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  return io(buildSocketUrl(base), {
    // Server đọc `handshake.auth.token`. Truyền qua query sẽ bị từ chối.
    auth: (cb) => {
      layToken().then(
        (token) => cb({ token: token ?? '' }),
        () => cb({ token: '' }),
      );
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });
}
