import { ApiError, apiRequest } from './client';

/**
 * Trạng thái đồng bộ lịch của người đang đăng nhập (máy chủ: `src/lich-dong-bo`).
 *
 * Một link cho cả người, gộp mọi workspace người đó được dùng tính năng — nên
 * không gửi `workspaceId`.
 */
export interface TrangThaiDongBoLich {
  /** Máy chủ tự tính theo gói (Pro cá nhân, hoặc workspace có gói Team), app không tự đoán gói. */
  duocDung: boolean;
  coLink: boolean;
  /** `https://wedofpt.com.vn/lich/<mã>.ics`. Ai có link đều đọc được lịch. */
  url?: string;
  taoLuc?: string;
  /** Lần cuối một ứng dụng lịch lấy dữ liệu; `null` là chưa lần nào. */
  layLanCuoi?: string | null;
}

const DUONG_DAN = '/calendar-feed';

export function layDongBoLich(): Promise<TrangThaiDongBoLich> {
  return apiRequest<TrangThaiDongBoLich>(DUONG_DAN);
}

/**
 * Chưa có link thì tạo, có rồi thì đổi mã — link cũ chết ngay.
 *
 * Luôn `lang: 'vi'`: app chỉ có tiếng Việt, và ngôn ngữ của chữ trong lịch
 * ("Hạn: …", "Họp: …") chốt theo lúc tạo link.
 */
export function taoLinkDongBoLich(): Promise<TrangThaiDongBoLich> {
  return apiRequest<TrangThaiDongBoLich>(DUONG_DAN, { method: 'POST', body: { lang: 'vi' } });
}

/** Máy chủ trả 204 thân rỗng; gọi lại khi đã tắt cũng không lỗi. */
export async function tatDongBoLich(): Promise<void> {
  await apiRequest<unknown>(DUONG_DAN, { method: 'DELETE' });
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  CALENDAR_FEED_NOT_IN_PLAN:
    'Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.',
};

const CAU_CHUNG = 'Chưa làm được lúc này. Thử lại sau ít phút.';

export function cauLoiDongBoLich(loi: unknown): string {
  if (loi instanceof ApiError) {
    /*
      `Object.hasOwn`, không phải `CAU_THEO_MA[loi.code]`: mã lạ như `toString`
      hay `constructor` đọc trúng hàm của Object.prototype, và màn hình sẽ in
      ra mã nguồn của hàm thay vì một câu lỗi.
    */
    if (loi.code && Object.hasOwn(CAU_THEO_MA, loi.code)) return CAU_THEO_MA[loi.code];
    if (loi.status === 429) return 'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.';
    // Mất mạng: `apiRequest` đã viết sẵn câu tiếng Việt.
    if (loi.status === 0) return loi.message;
  }
  /*
    5xx, trang lỗi của cổng Azure, câu kiểm tra dữ liệu tiếng Anh của máy chủ,
    lỗi lúc mở bảng chia sẻ…: người dùng chỉ cần biết thử lại sau.
  */
  return CAU_CHUNG;
}
