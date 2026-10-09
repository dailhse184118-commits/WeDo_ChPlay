import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienKiemDuyet } from '../../i18n/tu-dien/kiem-duyet';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';
import type { LyDoBaoCao } from '../api/moderation';

/*
  Chữ trên giao diện của báo cáo và chặn nằm ở i18n/tu-dien/kiem-duyet.ts; tệp
  này chỉ giữ thứ tự lý do và các hàm ghép câu theo ngôn ngữ.

  Điều khoản sử dụng hứa với người dùng đúng những lời này, và reviewer của
  Apple đọc chúng khi thử luồng báo cáo. Để rải trong từng màn thì sớm muộn hai
  màn sẽ nói hai kiểu.
*/

/** Thứ tự hiện trên phiếu báo cáo. "Lý do khác" luôn nằm cuối. */
export const MA_LY_DO_BAO_CAO: ReadonlyArray<LyDoBaoCao> = [
  'SPAM',
  'HARASSMENT',
  'HATE',
  'SEXUAL',
  'VIOLENCE',
  'OTHER',
];

export function lyDoBaoCao(ngonNgu: NgonNgu = layNgonNgu()): ReadonlyArray<{ ma: LyDoBaoCao; nhan: string }> {
  const t = theoNgonNgu(tuDienKiemDuyet, ngonNgu);
  return MA_LY_DO_BAO_CAO.map((ma) => ({ ma, nhan: t.lyDo[ma] }));
}

export function tieuDeXacNhanChan(ten: string, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienKiemDuyet, ngonNgu);
  return t.tieuDeChan(ten.trim() || t.nguoiNay);
}

/**
 * Đường dẫn để bỏ chặn, ghép từ tên tab Tài khoản và tên màn Người đã chặn của
 * từ điển Tài khoản: "Tài khoản → Người đã chặn" / "Account → Blocked people".
 */
export function duongBoChan(ngonNgu: NgonNgu = layNgonNgu()): string {
  const tk = theoNgonNgu(tuDienTaiKhoan, ngonNgu);
  return `${tk.tieuDe} → ${tk.chan.tieuDe}`;
}

export function noiDungXacNhanChan(ngonNgu: NgonNgu = layNgonNgu()): string {
  return theoNgonNgu(tuDienKiemDuyet, ngonNgu).noiDungChan(duongBoChan(ngonNgu));
}
