import { theoNgonNgu } from '../i18n/dich';
import { dichThongBaoLoi } from '../i18n/loi';
import { layNgonNgu, type NgonNgu } from '../i18n/ngon-ngu';
import { tuDienBaoCao } from '../i18n/tu-dien/bao-cao';
import { ApiError } from './api/client';

/**
 * Câu báo lỗi xuất báo cáo, theo ngôn ngữ đang dùng.
 *
 * Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng.
 */
export function cauLoiBaoCao(loi: unknown, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienBaoCao, ngonNgu);
  if (loi instanceof ApiError) {
    if (loi.code === 'REPORT_TOO_LARGE') return t.loiQuaLon;
    if (loi.code === 'REPORT_BAD_RANGE') return t.loiKhoangThoiGian;
    if (loi.code === 'REPORT_LINK_INVALID') return t.loiLinkHetHan;
    if (loi.status === 404) return t.loiKhongThayDuAn;
    if (loi.status === 429) return t.loiQuaNhanh;
    // Mất mạng (status 0), máy chủ bận…: câu của apiRequest là tiếng Việt, tiếng Anh thì dịch ở loi.ts.
    return dichThongBaoLoi(loi, t.loiKhongMo, ngonNgu);
  }
  return t.loiKhongMo;
}
