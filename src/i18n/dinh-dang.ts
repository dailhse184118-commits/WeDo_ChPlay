import { MA_VUNG, type NgonNgu } from './ngon-ngu';

/**
 * Định dạng ngày giờ, số và tiền theo ngôn ngữ đang dùng.
 *
 * Ngày giờ LUÔN đọc theo giờ Việt Nam, kể cả khi xem bằng tiếng Anh hay máy đặt
 * múi giờ khác: hạn chót, cuộc họp, thanh toán đều chốt theo giờ Việt Nam (xem
 * lib/gio-viet-nam.ts). Chỉ cách viết đổi theo ngôn ngữ (30/09/2026 hay
 * Sep 30, 2026), thời điểm thì không.
 *
 * Tiền luôn là VND — WeDo chỉ bán bằng VND. Tiếng Việt giữ đúng đơn vị từng màn
 * đang ghi ("đ", "VNĐ"); tiếng Anh ghi "VND" sau số có dấu phẩy ngăn nghìn.
 */

export const MUI_GIO_HIEN_THI = 'Asia/Ho_Chi_Minh';

/** Đơn vị "VNĐ" mà bảng giá và trang thanh toán ghi ở bản tiếng Việt (nơi khác ghi "đ"). */
export const DON_VI_VND_VIET_HOA = 'VNĐ';

type MauThoiGian = Record<NgonNgu, Intl.DateTimeFormatOptions>;

export const MAU_THOI_GIAN = {
  /** 30/09/2026 · Sep 30, 2026 */
  ngay: {
    vi: { day: '2-digit', month: '2-digit', year: 'numeric' },
    en: { month: 'short', day: 'numeric', year: 'numeric' },
  },
  /** Mặc định của vi-VN (30/9/2026) · Sep 30, 2026 */
  ngayGon: {
    vi: {},
    en: { month: 'short', day: 'numeric', year: 'numeric' },
  },
  /** 14:05 30/09/2026 · Sep 30, 2026, 2:05 PM */
  ngayGio: {
    vi: { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' },
    en: { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' },
  },
  /** 14:05 · 2:05 PM */
  gio: {
    vi: { hour: '2-digit', minute: '2-digit' },
    en: { hour: 'numeric', minute: '2-digit' },
  },
} satisfies Record<string, MauThoiGian>;

export type TenMauThoiGian = keyof typeof MAU_THOI_GIAN;

/**
 * Viết một thời điểm theo ngôn ngữ, đọc theo giờ Việt Nam. Giá trị không đọc
 * được thì trả chuỗi rỗng thay vì "Invalid Date".
 */
export function dinhDangThoiGian(
  giaTri: Date | string | number,
  ngonNgu: NgonNgu,
  mau: TenMauThoiGian | Intl.DateTimeFormatOptions = 'ngay',
): string {
  const thoiDiem = new Date(giaTri);
  if (Number.isNaN(thoiDiem.getTime())) return '';
  const tuyChon = typeof mau === 'string' ? MAU_THOI_GIAN[mau][ngonNgu] : mau;
  try {
    return new Intl.DateTimeFormat(MA_VUNG[ngonNgu], { ...tuyChon, timeZone: MUI_GIO_HIEN_THI }).format(thoiDiem);
  } catch {
    // Hermes thiếu ICU đầy đủ có thể không nhận múi giờ có tên: dời sang UTC+7 (Việt Nam không có giờ mùa hè).
    const lech = new Date(thoiDiem.getTime() + 7 * 60 * 60 * 1000);
    return new Intl.DateTimeFormat(MA_VUNG[ngonNgu], { ...tuyChon, timeZone: 'UTC' }).format(lech);
  }
}

export function dinhDangNgay(giaTri: Date | string | number, ngonNgu: NgonNgu): string {
  return dinhDangThoiGian(giaTri, ngonNgu, 'ngay');
}

export function dinhDangNgayGio(giaTri: Date | string | number, ngonNgu: NgonNgu): string {
  return dinhDangThoiGian(giaTri, ngonNgu, 'ngayGio');
}

export function dinhDangGio(giaTri: Date | string | number, ngonNgu: NgonNgu): string {
  return dinhDangThoiGian(giaTri, ngonNgu, 'gio');
}

/** 1.290.000 · 1,290,000 */
export function dinhDangSo(so: number, ngonNgu: NgonNgu): string {
  return new Intl.NumberFormat(MA_VUNG[ngonNgu]).format(so);
}

/**
 * 39.000 đ (hay "39.000 VNĐ" khi màn đó vốn ghi VNĐ) · 39,000 VND.
 * `donViTiengViet` chỉ dùng cho tiếng Việt, để chữ tiếng Việt giữ nguyên như cũ.
 */
export function dinhDangTien(soTien: number, ngonNgu: NgonNgu, donViTiengViet = 'đ'): string {
  const so = dinhDangSo(soTien, ngonNgu);
  return ngonNgu === 'vi' ? `${so} ${donViTiengViet}` : `${so} VND`;
}
