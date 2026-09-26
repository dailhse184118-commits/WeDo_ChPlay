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
  if (status >= 500) return `Máy chủ đang gặp sự cố (mã ${status}). Thử lại sau ít phút.`;
  return `Máy chủ trả lỗi ${status}.`;
}

const LOI_MAT_MANG = 'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.';

function moTaLoi(loi: unknown): string {
  return loi instanceof Error ? `${loi.name}: ${loi.message}` : String(loi);
}

/**
 * Parse thân phản hồi. Thân rỗng hoặc không phải JSON đều cho `undefined`
 * thay vì ném lỗi.
 *
 * Máy chủ không phải lúc nào cũng trả JSON: lúc App Service khởi động lại hay
 * quá tải, gateway trả trang lỗi HTML (502, 503). `JSON.parse` trần ném
 * `JSON Parse error: Unexpected character: <` và câu đó hiện thẳng lên màn hình.
 */
export function docThanPhanHoi(raw: string): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return undefined;
  }
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

  let response: Response;
  try {
    response = await fetch(`${baseUrl()}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  } catch (loi) {
    /*
      Mất mạng giữa lúc gia hạn KHÔNG phải là hết phiên. Trước đây lỗi này lọt ra
      ngoài dưới dạng `TypeError` trần, auth-context không nhận ra là lỗi mạng nên
      xoá token và đá người dùng về màn đăng nhập.
    */
    throw new ApiError(LOI_MAT_MANG, 0, undefined, moTaLoi(loi));
  }

  // Máy chủ trục trặc cũng không phải là hết phiên: báo lỗi, giữ token cho lần sau.
  if (response.status >= 500) {
    throw new ApiError(extractMessage(undefined, response.status), response.status);
  }
  if (!response.ok) return null;

  // Đọc bằng `text()` rồi tự parse, giống hệt phần còn lại của tệp này.
  const payload = docThanPhanHoi(await response.text()) as
    | { accessToken?: string; refreshToken?: string }
    | undefined;
  if (!payload?.accessToken || !payload.refreshToken) return null;

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

export function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  return goiApi<T>(path, options);
}

/**
 * `tokenDaGiaHan`: có mặt nghĩa là đây là lượt gửi lại ngay sau khi gia hạn,
 * mang token vừa nhận. Lượt này không gia hạn thêm lần nữa.
 */
async function goiApi<T>(
  path: string,
  options: ApiRequestOptions,
  tokenDaGiaHan?: string,
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined && !laFormData(body)) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  // Yêu cầu này có mang access token hay không. Xem chỗ gọi `unauthorizedHandlers`.
  let coPhien = false;
  if (!skipAuth) {
    const token = tokenDaGiaHan ?? (await loadToken());
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
      coPhien = true;
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
    throw new ApiError(LOI_MAT_MANG, 0, undefined, moTaLoi(loi));
  }

  const raw = await response.text();
  const payload = docThanPhanHoi(raw);

  if (!response.ok) {
    /*
      401 với yêu cầu có xác thực: thử gia hạn phiên rồi gửi lại đúng một lần.
      Người dùng không thấy gì cả — trước đây họ bị đá về màn đăng nhập.

      `skipAuth` là các lượt đăng nhập, đăng ký, quên mật khẩu. 401 ở đó nghĩa
      là sai mật khẩu, gia hạn không giúp được gì mà còn dễ thành vòng lặp.
    */
    if (response.status === 401 && !skipAuth) {
      if (!tokenDaGiaHan) {
        const tokenMoi = await giaHanMotLuot();
        if (tokenMoi) return goiApi<T>(path, options, tokenMoi);
      }

      /*
        CHỈ báo hết phiên khi yêu cầu có mang token. Yêu cầu không token bị 401
        là chuyện đương nhiên của người chưa đăng nhập, không có phiên nào để hết.

        Trước đây mọi 401 đều gọi handler, kể cả sai mật khẩu. Handler là
        `signOut`, mà `signOut` lại gọi API gỡ push token — không token thì 401
        — lại gọi handler... Một lần nhập sai mật khẩu sinh ra chuỗi yêu cầu
        không bao giờ dừng: 56 lượt trong 300ms khi đo bằng test.
      */
      if (coPhien) {
        unauthorizedHandlers.forEach((handler) => handler());
      }
    }
    throw new ApiError(
      extractMessage(payload, response.status),
      response.status,
      extractCode(payload),
    );
  }

  // Thành công mà thân không đọc được thì báo lỗi, đừng trả `undefined` như thể không có gì.
  if (raw && payload === undefined) {
    throw new ApiError('Máy chủ trả về dữ liệu không đọc được. Thử lại sau.', response.status);
  }

  return payload as T;
}
