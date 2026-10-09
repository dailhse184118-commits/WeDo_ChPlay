import { theoNgonNgu } from '../../i18n/dich';
import { dichThongBaoLoi } from '../../i18n/loi';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienDongBoLich } from '../../i18n/tu-dien/dong-bo-lich';
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
 * `lang` là ngôn ngữ đang dùng của app: ngôn ngữ của chữ trong lịch ("Hạn: …",
 * "Họp: …") chốt theo lúc tạo link.
 */
export function taoLinkDongBoLich(ngonNgu: NgonNgu = layNgonNgu()): Promise<TrangThaiDongBoLich> {
  return apiRequest<TrangThaiDongBoLich>(DUONG_DAN, { method: 'POST', body: { lang: ngonNgu } });
}

/** Máy chủ trả 204 thân rỗng; gọi lại khi đã tắt cũng không lỗi. */
export async function tatDongBoLich(): Promise<void> {
  await apiRequest<unknown>(DUONG_DAN, { method: 'DELETE' });
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const KHOA_THEO_MA = {
  CALENDAR_FEED_NOT_IN_PLAN: 'khongCoTrongGoi',
} as const;

export function cauLoiDongBoLich(loi: unknown, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienDongBoLich, ngonNgu).loi;
  if (loi instanceof ApiError) {
    /*
      `Object.hasOwn`, không phải `CAU_THEO_MA[loi.code]`: mã lạ như `toString`
      hay `constructor` đọc trúng hàm của Object.prototype, và màn hình sẽ in
      ra mã nguồn của hàm thay vì một câu lỗi.
    */
    if (loi.code && Object.hasOwn(KHOA_THEO_MA, loi.code)) {
      return t[KHOA_THEO_MA[loi.code as keyof typeof KHOA_THEO_MA]];
    }
    if (loi.status === 429) return t.quaNhanh;
    // Mất mạng: `apiRequest` đã viết sẵn câu tiếng Việt; tiếng Anh nhờ `dichThongBaoLoi` dịch.
    if (loi.status === 0) return ngonNgu === 'vi' ? loi.message : dichThongBaoLoi(loi, t.chung, ngonNgu);
  }
  /*
    5xx, trang lỗi của cổng Azure, câu kiểm tra dữ liệu tiếng Anh của máy chủ,
    lỗi lúc mở bảng chia sẻ…: người dùng chỉ cần biết thử lại sau.
  */
  return t.chung;
}
