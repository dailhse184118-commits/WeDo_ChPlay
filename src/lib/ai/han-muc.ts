import { Platform } from 'react-native';

import { theoNgonNgu } from '../../i18n/dich';
import { layNgonNgu, MA_VUNG, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienNangCap } from '../../i18n/tu-dien/nang-cap';
import type { HanMucAI } from '../api/entitlements';

/**
 * Quyết định hiện gì về hạn mức AI. Hàm thuần, không đụng mạng hay giao diện.
 *
 * Tính năng biến tin nhắn thành công việc là thứ người dùng trả tiền để có, và
 * cũng là thứ duy nhất bị tính lượt. Trước đây mobile không hề nhắc tới hạn mức:
 * người dùng chạm trần rồi nhận một băng đỏ khó hiểu, không biết mình vừa hết
 * lượt, không biết bao giờ có lại.
 */

/**
 * Còn từ ngần này lượt trở xuống thì bắt đầu nhắc.
 *
 * Nhắc quá sớm thì thành phiền và người dùng học cách phớt lờ; nhắc lúc đã hết
 * thì quá muộn, họ đang giữa việc và bị chặn đột ngột. Ba lượt là đủ để còn kịp
 * xoay xở mà chưa gây khó chịu.
 */
export const NGUONG_SAP_HET = 3;

export type MucCanhBao = 'du' | 'sap-het' | 'het';

export interface TrangThaiHanMuc {
  muc: MucCanhBao;
  conLai: number;
  tong: number;
  /** Câu hiện cho người dùng; `null` khi còn dư dả, không cần nói gì. */
  loiNhan: string | null;
  /** Hết lượt trên iPhone thì hiện nút sang màn Nâng cấp (mua qua App Store). */
  coNutNangCap: boolean;
}

/**
 * `31/12` — ngày hạn mức được nạp lại, viết ngắn cho vừa một dòng.
 *
 * Đọc theo GIỜ MÁY người dùng, cố ý chứ không phải sơ suất. Máy chủ trả mốc
 * cuối kỳ theo UTC: `31/08 23:59Z` rơi vào 06:59 sáng 01/09 giờ Việt Nam. Người
 * dùng cần biết ngày HỌ có lượt mới, không phải ngày theo đồng hồ máy chủ.
 */
export function ngayNapLai(periodEnd: string, ngonNgu: NgonNgu = layNgonNgu()): string {
  const d = new Date(periodEnd);
  if (Number.isNaN(d.getTime())) return '';
  // Tiếng Anh viết "Dec 31" (ngày/tháng đảo vị trí sẽ gây hiểu nhầm với người quen kiểu Mỹ).
  if (ngonNgu === 'en') return new Intl.DateTimeFormat(MA_VUNG.en, { month: 'short', day: 'numeric' }).format(d);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function trangThaiHanMuc(han: HanMucAI, ngonNgu: NgonNgu = layNgonNgu()): TrangThaiHanMuc {
  const t = theoNgonNgu(tuDienNangCap, ngonNgu);
  const conLai = Math.max(0, han.remaining);
  const chung = { conLai, tong: han.limit };

  if (conLai === 0) {
    return {
      ...chung,
      muc: 'het',
      coNutNangCap: Platform.OS === 'ios',
      /*
        Nói rõ BAO GIỜ có lại. "Hết lượt" mà không kèm mốc thời gian thì người
        dùng không biết nên chờ hay nên bỏ cuộc, và họ sẽ bấm lại nhiều lần vô
        ích.
      */
      loiNhan: t.hetLuot(han.limit, ngayNapLai(han.periodEnd, ngonNgu)),
    };
  }

  if (conLai <= NGUONG_SAP_HET) {
    return {
      ...chung,
      muc: 'sap-het',
      coNutNangCap: false,
      loiNhan: t.sapHet(conLai),
    };
  }

  return { ...chung, muc: 'du', loiNhan: null, coNutNangCap: false };
}

/**
 * Đường thoát khi hết lượt: tạo công việc thủ công.
 *
 * Nêu ra để người dùng không nghĩ mình bị chặn hoàn toàn — tính năng cốt lõi
 * vẫn dùng được, chỉ mất phần AI đọc hộ tin nhắn.
 */
export function conDungDuocThuCong(trangThai: TrangThaiHanMuc): boolean {
  return trangThai.muc === 'het';
}
