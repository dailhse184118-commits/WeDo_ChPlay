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

/** Đọc access token hiện hành. Truyền `loadToken` của token-storage vào đây. */
export type DocToken = () => Promise<string | null>;

export function createChatSocket(docToken: DocToken): Socket {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  return io(buildSocketUrl(base), {
    /*
      Server đọc `handshake.auth.token`. Truyền qua query sẽ bị từ chối.

      `auth` là HÀM chứ không phải object: socket.io gọi lại nó ở MỖI lần nối,
      kể cả lần tự nối lại. Bản cũ truyền object `{ token }`, chốt cứng token lúc
      mở app. Token ấy hết hạn là mọi lần nối lại sau đó bị máy chủ từ chối, và
      socket đứng im cho tới khi tắt hẳn app: tin nhắn không về nữa mà không báo
      lỗi gì. Đọc lại mỗi lần thì luôn cầm token mới nhất tầng API vừa gia hạn.
    */
    auth: (cb) => {
      docToken().then(
        (token) => cb({ token: token ?? '' }),
        () => cb({ token: '' }),
      );
    },
    transports: ['websocket', 'polling'],
    /*
      WebSocket hỏng (mạng trường, wifi quán cà phê, proxy chặn nâng cấp kết nối)
      thì chuyển sang polling. Mặc định của engine.io-client là KHÔNG chuyển: nó
      thử lại websocket mãi, và app không bao giờ có kết nối thời gian thực.
    */
    tryAllTransports: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });
}
