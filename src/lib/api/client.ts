import { loadRefreshToken, loadToken, saveRefreshToken, saveToken } from '../auth/token-storage';

export class ApiError extends Error {
  status: number;

  /**
   * Mã lỗi do máy chủ đặt tên, ví dụ `AI_DETECTION_LIMIT_REACHED`.
   *
   * Cần thiết vì mã HTTP không đủ để phân biệt: 429 có thể là hết hạn mức AI,
   * cũng có thể là chặn tần suất chung. Xử lý hai thứ đó giống nhau thì người
   * dùng bị bảo "hết lượt tháng này" trong khi thật ra chỉ cần bấm lại sau vài
   * giây.
   */
  code?: string;

  /**
   * Câu lỗi gốc của hệ điều hành, khi `fetch` hỏng ở tầng mạng.
   *
   * Người dùng chỉ cần biết "không kết nối được", nhưng người sửa lỗi thì cần
   * biết CHÍNH XÁC vì sao. Trước đây chỗ bắt lỗi viết `catch {` không hứng gì
   * cả, nên câu lỗi thật bị vứt sạch — và ngày 19/09 cả đội mất nhiều giờ
   * không lần ra được vì sao không tải tệp lên được.
   */
  nguyenNhan?: string;

  constructor(message: string, status: number, code?: string, nguyenNhan?: string) {
    super(message);
    // Cần thiết để `instanceof ApiError` vẫn đúng sau khi transpile.
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.nguyenNhan = nguyenNhan;
  }
}

/** Đọc `code` do máy chủ gắn kèm, nếu có. */
function extractCode(payload: unknown): string | undefined {
  if (payload && typeof payload === 'object' && 'code' in payload) {
    const code = (payload as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return undefined;
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  /** Object thường sẽ được serialize thành JSON; `FormData` thì gửi nguyên. */
  body?: unknown;
  headers?: Record<string, string>;
  /** Bỏ qua header Authorization. Dùng cho đăng nhập và đăng ký. */
  skipAuth?: boolean;
}

/**
 * Body này là multipart, phải để nguyên.
 *
 * `JSON.stringify` một FormData cho ra `"{}"` — mất sạch tệp. Và tự đặt
 * `Content-Type: multipart/form-data` cũng hỏng: chuỗi đó thiếu tham số
 * `boundary` mà chỉ tầng fetch mới sinh ra được, nên máy chủ không tách nổi các
 * phần. Cách duy nhất đúng là không đụng vào cả hai.
 */
function laFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

const unauthorizedHandlers = new Set<() => void>();

/** Đăng ký handler chạy khi API trả 401. Trả về hàm huỷ đăng ký. */
export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

/**
 * Địa chỉ máy chủ, đã cắt gạch chéo thừa ở cuối.
 *
 * Xuất ra ngoài để MỌI đường gọi mạng dùng chung đúng một chỗ — kể cả đường
 * tải tệp đi thẳng xuống native. Mỗi nơi tự ghép một kiểu là sớm muộn cũng
 * lệch nhau.
 */
export function baseUrl(): string {
  /*
    GỌT SẠCH hai đầu trước khi làm gì khác, kể cả ký tự điều khiển và BOM.

    Ngày 19/09/2026 biến trên EAS mang một byte 0x16 (ký tự điều khiển SYN)
    hoàn toàn vô hình, chen ngay trước `https://`. Bộ phân tích URL chuẩn web
    mà `fetch` dùng lặng lẽ bỏ qua nó, nên mọi lượt gọi thường vẫn chạy và
    không ai nghi ngờ cấu hình. Nhưng OkHttp ở tầng native đòi ký tự đầu phải
    là chữ cái, nên đường tải tệp chết với câu "no colon was found" — và chốt
    chặn `https://` bên dưới cũng trượt, chặn luôn đăng nhập của mọi người.

    Gọt: khoảng trắng, ký tự điều khiển C0/DEL (U+0000–U+001F, U+007F), BOM
    (U+FEFF) và các ký tự không chiều rộng (U+200B–U+200D).
  */
  const url = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(
    /^[\s\u0000-\u001F\u007F\uFEFF\u200B-\u200D]+|[\s\u0000-\u001F\u007F\uFEFF\u200B-\u200D]+$/g,
    '',
  );
  if (!url) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  /*
    Thiếu `https://` thì tầng native ném
    `IllegalArgumentException: Expected URL scheme 'http' or 'https'` — câu đó
    không hề chỉ ra rằng CẤU HÌNH mới là thứ sai, và ngày 19/09/2026 nó làm cả
    đội mất nhiều giờ. Chặn ngay từ đây, bằng câu nói thẳng chỗ phải sửa.
  */
  if (!/^https?:\/\//.test(url)) {
    throw new Error(
      `EXPO_PUBLIC_API_BASE_URL phải bắt đầu bằng http:// hoặc https://, đang là "${url}".`,
    );
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

/**
 * Phiên đang được đăng xuất — từ lúc `ketThucPhien` tới lần đăng nhập sau.
 *
 * Đăng xuất gửi /auth/logout với refresh token hiện tại. Một lượt gia hạn chạy
 * cùng lúc (socket bị ngắt đúng lúc đó chẳng hạn) cầm CÙNG token đó: máy chủ huỷ
 * trước rồi mới xoay thì coi là đánh cắp và đăng xuất MỌI thiết bị; xoay trước
 * thì phiên mới còn sống và token mới bị ghi lại xuống máy sau khi đã xoá — người
 * vừa đăng xuất mở app lại vào thẳng tài khoản.
 */
let dangDangXuat = false;

/**
 * Gọi ĐẦU TIÊN khi đăng xuất, trước khi đọc refresh token để gửi /auth/logout.
 *
 * Chặn mọi lượt gia hạn MỚI, và đợi lượt đang bay (nếu có) ghi xong token của nó.
 * Để nó ghi là cố ý: /auth/logout sau đó mang đúng refresh token mới nhất nên máy
 * chủ huỷ sạch phiên. Bỏ không ghi thì token cũ đã bị xoay mất — logout thành vô
 * hiệu, phiên mới nằm lại trên máy chủ. Và vì đăng xuất đợi ở đây TRƯỚC khi xoá
 * token, không lượt ghi nào rơi vào sau lúc đã xoá.
 */
export async function ketThucPhien(): Promise<void> {
  dangDangXuat = true;
  await dangGiaHan?.catch(() => null);
}

/** Gọi khi vừa đăng nhập xong — cho phép gia hạn trở lại. */
export function batDauPhien(): void {
  dangDangXuat = false;
}

async function giaHanPhien(): Promise<string | null> {
  const refreshToken = await loadRefreshToken();
  if (!refreshToken) return null;

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (loi) {
    // Mất mạng giữa chừng là "mất mạng" (trạng thái 0) như mọi lượt gọi khác — không phải hết phiên.
    throw new ApiError(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
      0,
      undefined,
      loi instanceof Error ? loi.message : String(loi),
    );
  }

  /*
    Chỉ 400/401/403 mới nghĩa là phiên đã hết. Lỗi khác — máy chủ quá tải, đang
    khởi động lại (5xx), chặn tần suất (429) — là tạm thời: ném lỗi để người gọi
    thử lại sau. Trước đây mọi lỗi đều thành "hết phiên", nên máy chủ trục trặc
    vài giây là người dùng bị đá ra màn đăng nhập.
  */
  if (response.status === 400 || response.status === 401 || response.status === 403) return null;
  if (!response.ok) {
    throw new ApiError(`Gia hạn phiên đăng nhập lỗi ${response.status}.`, response.status);
  }

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

/**
 * Gia hạn phiên, dùng CHUNG một lượt cho cả app. Socket cũng gọi qua đây khi bị
 * máy chủ ngắt: tự gọi `/auth/refresh` riêng là hai lượt gia hạn đua nhau, và vì
 * máy chủ xoay refresh token nên lượt thua bị coi là đánh cắp, cắt cả phiên.
 */
export function giaHanMotLuot(): Promise<string | null> {
  if (dangDangXuat) return Promise.resolve(null);
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
  if (body !== undefined && !laFormData(body)) {
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

  let response: Response;
  try {
    /*
      `FormData` PHẢI đi qua `fetch`. Bộ chuyển của Expo — chỗ duy nhất hiểu
      phần tệp có `bytes()` — nằm trong `fetch`, không có trong XMLHttpRequest.
    */
    response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: laFormData(body) ? body : body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (loi) {
    /*
      PHẢI hứng lấy lỗi. `catch {` trơn vứt sạch câu lỗi của hệ điều hành, và
      mọi sự cố mạng đều trông y hệt nhau từ phía người sửa.
    */
    throw new ApiError(
      'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
      0,
      undefined,
      loi instanceof Error ? `${loi.name}: ${loi.message}` : String(loi),
    );
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
    throw new ApiError(
      extractMessage(payload, response.status),
      response.status,
      extractCode(payload),
    );
  }

  return payload as T;
}
