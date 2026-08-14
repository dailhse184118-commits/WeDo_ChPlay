import { loadRefreshToken, loadToken, saveRefreshToken, saveToken } from '../auth/token-storage';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    // Cần thiết để `instanceof ApiError` vẫn đúng sau khi transpile.
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Bỏ qua header Authorization. Dùng cho đăng nhập và đăng ký. */
  skipAuth?: boolean;
}

const unauthorizedHandlers = new Set<() => void>();

/** Đăng ký handler chạy khi API trả 401. Trả về hàm huỷ đăng ký. */
export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }
  return url.replace(/\/+$/, '');
}

/** NestJS trả message dạng chuỗi hoặc mảng chuỗi. Cả hai đều đã là tiếng Việt. */
function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message.length) return message.join('. ');
  }
  return `Máy chủ trả lỗi ${status}.`;
}

/**
 * Một lượt gia hạn đang chạy, nếu có.
 *
 * Màn hình thường bắn nhiều yêu cầu cùng lúc. Token hết hạn thì tất cả cùng
 * nhận 401 và cùng đòi gia hạn — mà máy chủ xoay refresh token mỗi lần dùng,
 * nên lượt thứ hai sẽ cầm token đã bị huỷ và bị coi là đánh cắp, cắt sạch phiên.
 * Gom chung về một lời hứa để chỉ có đúng một lượt gia hạn chạy.
 */
let dangGiaHan: Promise<string | null> | null = null;

async function giaHanPhien(): Promise<string | null> {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) return null;

  const response = await fetch(`${baseUrl()}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) return null;

  // Đọc bằng `text()` rồi tự parse, giống hệt phần còn lại của tệp này.
  const raw = await response.text();
  const payload = (raw ? JSON.parse(raw) : {}) as {
    accessToken?: string;
    refreshToken?: string;
  };
  if (!payload.accessToken || !payload.refreshToken) return null;

  // Lưu cả cặp: token cũ đã bị máy chủ huỷ ngay khi đổi.
  await saveToken(payload.accessToken);
  await saveRefreshToken(payload.refreshToken);

  return payload.accessToken;
}

function giaHanMotLuot(): Promise<string | null> {
  dangGiaHan ??= giaHanPhien().finally(() => {
    dangGiaHan = null;
  });
  return dangGiaHan;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (!skipAuth) {
    const token = await loadToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  // Dựng URL NGOÀI khối try. Nếu để bên trong, lỗi thiếu cấu hình sẽ bị catch
  // nuốt mất và báo nhầm thành lỗi mạng.
  const url = `${baseUrl()}${path}`;

  let response: { ok: boolean; status: number; text: () => Promise<string> };
  try {
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0);
  }

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as unknown) : undefined;

  if (!response.ok) {
    /*
      401 với yêu cầu có xác thực: thử gia hạn phiên rồi gửi lại đúng một lần.
      Người dùng không thấy gì cả — trước đây họ bị đá về màn đăng nhập.

      `skipAuth` là các lượt đăng nhập, đăng ký, quên mật khẩu. 401 ở đó nghĩa
      là sai mật khẩu, gia hạn không giúp được gì mà còn dễ thành vòng lặp.
    */
    if (response.status === 401 && !skipAuth) {
      const tokenMoi = await giaHanMotLuot();

      if (tokenMoi) {
        return apiRequest<T>(path, { ...options, skipAuth: true, headers: {
          ...headers,
          Authorization: `Bearer ${tokenMoi}`,
        } });
      }
    }

    if (response.status === 401) {
      unauthorizedHandlers.forEach((handler) => handler());
    }
    throw new ApiError(extractMessage(payload, response.status), response.status);
  }

  return payload as T;
}
