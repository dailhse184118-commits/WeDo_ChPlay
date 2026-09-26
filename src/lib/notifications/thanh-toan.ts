import { Platform } from 'react-native';

import type { NotificationItem } from '../types';

/*
  Thông báo về gói và thanh toán ("Gói sắp hết hạn", "Thanh toán thành công").

  App iPhone là bản đồng hành miễn phí của web (Guideline 3.1.3(f)): không bán
  gì, không mời mua gì, kể cả gián tiếp. Một dòng "Gói Pro sắp hết hạn" trong
  app là lời nhắc đi gia hạn — nên trên iPhone các thông báo này bị ẩn khỏi
  danh sách, không đếm vào huy hiệu, và chạm vào push cũng không mở đâu cả.
  Người dùng vẫn nhận chúng qua email và trên web.

  Android giữ nguyên như cũ.
*/

/** Các loại máy chủ đang có. */
const LOAI_THANH_TOAN = new Set<string>(['SUBSCRIPTION_RENEWAL_DUE', 'PAYMENT_CONFIRMED']);

/**
 * Loại thông báo này có dính tới gói hay thanh toán không.
 *
 * Bắt cả các loại máy chủ thêm sau theo tiền tố, để một bản máy chủ mới không
 * lặng lẽ đưa lời mời gia hạn vào app iPhone đang chạy.
 */
export function laThongBaoThanhToan(loai: unknown): boolean {
  if (typeof loai !== 'string') return false;
  return LOAI_THANH_TOAN.has(loai) || /^(SUBSCRIPTION|PAYMENT|BILLING)_/.test(loai);
}

/** Trên máy này, thông báo loại đó có phải giấu đi không. Chỉ iPhone giấu. */
export function anTrenMayNay(loai: unknown): boolean {
  return Platform.OS === 'ios' && laThongBaoThanhToan(loai);
}

/** Danh sách thông báo được phép hiện trên máy này. */
export function locThongBaoHienThi(danhSach: NotificationItem[]): NotificationItem[] {
  if (Platform.OS !== 'ios') return danhSach;
  return danhSach.filter((tb) => !laThongBaoThanhToan(tb.type));
}

/**
 * Số thông báo chưa đọc để hiện trên huy hiệu.
 *
 * Máy chủ đếm cả thông báo thanh toán. Trên iPhone chúng bị giấu, nên phải trừ
 * ra, nếu không huy hiệu báo "1" mà mở tab thì chẳng thấy gì. Chỉ tải danh sách
 * khi thật sự có thông báo chưa đọc; hỏng thì giữ nguyên con số của máy chủ.
 */
export async function demChuaDocHienThi(
  demTuMayChu: () => Promise<{ count: number }>,
  layDanhSach: () => Promise<NotificationItem[]>,
): Promise<{ count: number }> {
  const ketQua = await demTuMayChu();
  if (Platform.OS !== 'ios' || ketQua.count <= 0) return ketQua;

  try {
    const danhSach = await layDanhSach();
    const an = danhSach.filter((tb) => !tb.readAt && laThongBaoThanhToan(tb.type)).length;
    return { count: Math.max(0, ketQua.count - an) };
  } catch {
    return ketQua;
  }
}
