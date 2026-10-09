/**
 * Kiểm tra nội dung đánh giá trước khi gửi.
 *
 * Lặp lại đúng luật của máy chủ (`SubmitFeedbackDto`): sao chấm từ 1 đến 5, nội
 * dung từ 10 tới 1500 ký tự sau khi cắt khoảng trắng. Kiểm ở máy khách không
 * thay được kiểm ở máy chủ — nó chỉ để người dùng biết ngay mình thiếu gì, thay
 * vì gõ xong bấm gửi rồi mới nhận lỗi.
 */

import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienTaiKhoan } from '../../i18n/tu-dien/tai-khoan';

export const TOI_THIEU_KY_TU = 10;
export const TOI_DA_KY_TU = 1500;

/** Trả câu báo lỗi để hiện thẳng, hoặc `null` khi hợp lệ. */
export function kiemTraDanhGia(sao: number, noiDung: string, ngonNgu: NgonNgu = layNgonNgu()): string | null {
  const t = theoNgonNgu(tuDienTaiKhoan, ngonNgu).danhGia;
  if (sao < 1 || sao > 5) {
    return t.chonSao;
  }

  const chu = noiDung.trim();

  if (chu.length < TOI_THIEU_KY_TU) {
    /*
      Nói rõ CÒN THIẾU bao nhiêu chứ không chỉ nêu mức tối thiểu. Người dùng gõ
      được 6 ký tự mà đọc "cần ít nhất 10" thì vẫn phải tự trừ nhẩm.
    */
    return t.thieu(TOI_THIEU_KY_TU - chu.length);
  }

  if (chu.length > TOI_DA_KY_TU) {
    return t.daiQua(TOI_DA_KY_TU);
  }

  return null;
}

/** Số ký tự còn lại, để hiện dưới ô nhập. Âm nghĩa là đã quá giới hạn. */
export function soKyTuConLai(noiDung: string): number {
  return TOI_DA_KY_TU - noiDung.trim().length;
}
