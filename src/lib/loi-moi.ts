import { theoNgonNgu } from '../i18n/dich';
import { dinhDangNgayGio } from '../i18n/dinh-dang';
import { dichThongBaoLoi } from '../i18n/loi';
import { layNgonNgu, type NgonNgu } from '../i18n/ngon-ngu';
import { tuDienChat } from '../i18n/tu-dien/chat';
import { ApiError } from './api/client';

/** Mã mời có 8 ký tự (máy chủ: src/projects/loi-moi/ma-moi.ts). */
export const DO_DAI_MA_MOI = 8;

/**
 * Định dạng ô "Nhập mã mời" ngay khi gõ: viết hoa, bỏ mọi ký tự không phải chữ
 * hay số, tối đa 8 ký tự, tự thêm gạch giữa (7K3M-9QXA).
 *
 * Không lọc 0/O/1/I: máy chủ trả "mã không đúng" — rõ ràng hơn một ô nuốt mất
 * phím người dùng vừa gõ.
 */
export function dinhDangOMaMoi(nhap: string): string {
  const gon = nhap.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, DO_DAI_MA_MOI);
  return gon.length > 4 ? `${gon.slice(0, 4)}-${gon.slice(4)}` : gon;
}

/** Mã gửi lên máy chủ. Chưa đủ 8 ký tự thì `null` — nút Xem lời mời còn tắt. */
export function maGuiDi(oNhap: string): string | null {
  const gon = oNhap.replace(/-/g, '');
  return gon.length === DO_DAI_MA_MOI ? gon : null;
}

const MA_TRONG_LINK = new RegExp(`^[A-Z0-9]{${DO_DAI_MA_MOI}}$`);
/** Bảng chữ của mã mời (máy chủ: bỏ 0/O/1/I cho khỏi nhầm). */
const MA_TRAN = new RegExp(`^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{${DO_DAI_MA_MOI}}$`);

/**
 * Lấy mã mời từ nội dung một mã QR. Nhận hai dạng:
 * - link có đoạn `/moi/<mã>` (sau `#` hay trong đường dẫn, tên miền nào cũng
 *   được — gốc link lấy từ `FRONTEND_URL` của máy chủ nên có thể đổi): mã là 8
 *   ký tự chữ/số;
 * - chuỗi chỉ là mã, có hay không có gạch, chữ thường hay hoa: phải đúng bảng
 *   chữ của mã mời, để QR tình cờ có 8 chữ số (vd. `12345678`) không bị nhận nhầm.
 *
 * Chỉ đọc chuỗi: không mở link, không gọi mạng. Không phải lời mời thì `null`.
 */
export function docMaTuQr(noiDung: string): string | null {
  const gon = noiDung.trim();
  const theoLink = /\/moi\/([^/?#&\s]+)/i.exec(gon);
  const chuan = (chuoi: string) => chuoi.toUpperCase().replace(/-/g, '');
  if (theoLink) {
    const ma = chuan(theoLink[1]);
    return MA_TRONG_LINK.test(ma) ? ma : null;
  }
  const ma = chuan(gon);
  return MA_TRAN.test(ma) ? ma : null;
}

export function hienThiMaMoi(ma: string): string {
  return ma.length === DO_DAI_MA_MOI ? `${ma.slice(0, 4)}-${ma.slice(4)}` : ma;
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const KHOA_THEO_MA = {
  INVITE_NOT_FOUND: 'maSai',
  INVITE_EXPIRED: 'hetHan',
  INVITE_REVOKED: 'daTat',
  INVITE_PROJECT_CLOSED: 'duAnDong',
} as const;

function laMaLoiMoi(ma: string): ma is keyof typeof KHOA_THEO_MA {
  return Object.prototype.hasOwnProperty.call(KHOA_THEO_MA, ma);
}

/**
 * Câu báo lỗi của lời mời. Mã lỗi biết trước và lỗi 429 dịch theo từ điển; câu
 * lạ của máy chủ giữ nguyên ở tiếng Việt, còn tiếng Anh nhờ `dichThongBaoLoi`
 * dịch những câu nó nhận ra (không nhận ra thì dùng câu dự phòng).
 */
export function cauLoiMoi(loi: unknown, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienChat, ngonNgu).moi;
  if (loi instanceof ApiError) {
    if (loi.code && laMaLoiMoi(loi.code)) return t[KHOA_THEO_MA[loi.code]];
    if (loi.status === 429) return t.quaNhieuLan;
    return ngonNgu === 'vi' ? loi.message : dichThongBaoLoi(loi, t.coLoi, ngonNgu);
  }
  return t.coLoi;
}

/** Nội dung bảng chia sẻ của hệ điều hành (spec mục 3.4). */
export function noiDungChiaSe(
  tenDuAn: string,
  loiMoi: { url: string; code: string },
  ngonNgu: NgonNgu = layNgonNgu(),
): string {
  return theoNgonNgu(tuDienChat, ngonNgu).moi.chiaSeNoiDung(tenDuAn, loiMoi.url, hienThiMaMoi(loiMoi.code));
}

const LECH_VN_MS = 7 * 60 * 60 * 1000;
const haiSo = (so: number) => String(so).padStart(2, '0');

/** `HH:mm dd/MM/yyyy` theo giờ Việt Nam (UTC+7 quanh năm), bất kể máy đặt múi giờ nào. */
export function hienThiHanMoi(iso: string, ngonNgu: NgonNgu = layNgonNgu()): string {
  const luc = new Date(iso);
  if (Number.isNaN(luc.getTime())) return '';
  // Tiếng Anh: "Sep 30, 2026, 2:05 PM" (vẫn giờ Việt Nam).
  if (ngonNgu === 'en') return dinhDangNgayGio(luc, 'en');
  const vn = new Date(luc.getTime() + LECH_VN_MS);
  return `${haiSo(vn.getUTCHours())}:${haiSo(vn.getUTCMinutes())} ${haiSo(vn.getUTCDate())}/${haiSo(
    vn.getUTCMonth() + 1,
  )}/${vn.getUTCFullYear()}`;
}
