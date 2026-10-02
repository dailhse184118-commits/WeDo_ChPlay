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

export function hienThiMaMoi(ma: string): string {
  return ma.length === DO_DAI_MA_MOI ? `${ma.slice(0, 4)}-${ma.slice(4)}` : ma;
}

/** Dịch theo mã lỗi chứ không theo câu chữ: máy chủ đổi câu thì app vẫn đúng. */
const CAU_THEO_MA: Record<string, string> = {
  INVITE_NOT_FOUND: 'Mã mời không đúng hoặc không còn dùng được.',
  INVITE_EXPIRED: 'Link mời đã hết hạn. Hãy xin Leader gửi link mới.',
  INVITE_REVOKED: 'Link mời đã bị tắt. Hãy xin Leader gửi link mới.',
  INVITE_PROJECT_CLOSED: 'Dự án này đã đóng, không nhận thêm thành viên.',
};

export function cauLoiMoi(loi: unknown): string {
  if (loi instanceof ApiError) {
    if (loi.code && CAU_THEO_MA[loi.code]) return CAU_THEO_MA[loi.code];
    if (loi.status === 429) return 'Bạn thử quá nhiều lần. Đợi một phút rồi thử lại.';
    return loi.message;
  }
  return 'Có lỗi xảy ra. Thử lại sau ít phút.';
}

/** Nội dung bảng chia sẻ của hệ điều hành (spec mục 3.4). */
export function noiDungChiaSe(tenDuAn: string, loiMoi: { url: string; code: string }): string {
  return `Tham gia dự án ${tenDuAn} trên WeDo: ${loiMoi.url}. Hoặc nhập mã ${hienThiMaMoi(loiMoi.code)} trong app.`;
}

const LECH_VN_MS = 7 * 60 * 60 * 1000;
const haiSo = (so: number) => String(so).padStart(2, '0');

/** `HH:mm dd/MM/yyyy` theo giờ Việt Nam (UTC+7 quanh năm), bất kể máy đặt múi giờ nào. */
export function hienThiHanMoi(iso: string): string {
  const luc = new Date(iso);
  if (Number.isNaN(luc.getTime())) return '';
  const vn = new Date(luc.getTime() + LECH_VN_MS);
  return `${haiSo(vn.getUTCHours())}:${haiSo(vn.getUTCMinutes())} ${haiSo(vn.getUTCDate())}/${haiSo(
    vn.getUTCMonth() + 1,
  )}/${vn.getUTCFullYear()}`;
}
