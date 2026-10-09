import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienNangCap } from '../../i18n/tu-dien/nang-cap';

/**
 * Quyền lợi hiển thị trên màn Nâng cấp, theo ngôn ngữ. Chữ nằm trong `tu-dien/nang-cap.ts`.
 * Số liệu chép từ máy chủ `subscription-entitlements.ts`; đổi bên đó thì đổi cả đây.
 */
export function quyenLoiTheoNgonNgu(ngonNgu: NgonNgu = layNgonNgu()) {
  return theoNgonNgu(tuDienNangCap, ngonNgu).quyenLoi;
}
