/**
 * Quy tắc co giãn của bố cục, tách thành hàm thuần.
 *
 * Không import React, không đọc `Dimensions`. Nhận số, trả số — nhờ vậy kiểm
 * được mọi bề rộng máy và mọi mức cỡ chữ mà không cần máy thật.
 * `tokens.ts` mới là nơi đọc số đo thiết bị rồi gọi xuống đây.
 */

export type WidthStep = 'compact' | 'regular' | 'wide';

/**
 * Ngưỡng lấy theo bề rộng dp thật của máy Android phổ biến:
 * 360dp là máy 5 inch, 411dp là Pixel, 430dp là cỡ lớn nhất còn gọi là điện thoại.
 */
export function widthStep(width: number): WidthStep {
  if (width <= 360) return 'compact';
  if (width <= 430) return 'regular';
  return 'wide';
}

/**
 * Hệ số cố ý giữ trong khoảng hẹp. Lệch quá 10% thì bố cục trên máy nhỏ trông
 * như của một app khác chứ không còn là cùng một app co lại.
 */
export function scaleForWidth(step: WidthStep): number {
  switch (step) {
    case 'compact':
      return 0.92;
    case 'wide':
      return 1.06;
    default:
      return 1;
  }
}

/** Trần cỡ chữ áp cho phần khung không cuộn được: thanh tab, header, badge. */
export const GIOI_HAN_CO_CHU = 1.3;

/**
 * Chặn trên ở `GIOI_HAN_CO_CHU` và chặn dưới ở 1.
 *
 * Android cho hạ cỡ chữ xuống 0,85. Thu hộp chứa theo mức đó là ép bố cục nhỏ
 * hơn cả thứ người dùng chọn, nên chặn dưới luôn.
 */
export function cappedFontScale(systemScale: number): number {
  return Math.min(Math.max(systemScale, 1), GIOI_HAN_CO_CHU);
}

/**
 * Bề rộng nội dung tối đa. Rộng hơn thì kẹp lại và căn giữa, để trên tablet thẻ
 * không kéo thành dải ngang xa mắt.
 *
 * Phải lớn hơn mọi bề rộng điện thoại (430dp) để không kẹp nhầm điện thoại.
 */
export const CHIEU_RONG_NOI_DUNG_TOI_DA = 520;

/**
 * Chiều cao dòng tính từ cỡ chữ.
 *
 * React Native phóng `fontSize` theo cỡ chữ hệ thống nhưng KHÔNG phóng
 * `lineHeight` — nó là dp cố định. Để `lineHeight: 22` thì ở cỡ chữ 200% chữ cao
 * gấp đôi mà khoảng dòng đứng yên, chữ chồng lên nhau rồi bị cắt.
 *
 * Nhân với cỡ chữ hệ thống THẬT chứ không phải cỡ chữ đã chặn: `GIOI_HAN_CO_CHU`
 * chỉ để giữ hộp khung khỏi phình, còn chữ thì vẫn cao tới 200% nên khoảng dòng
 * phải theo hết.
 */
export function lineHeightFor(size: number, systemScale: number): number {
  return Math.round(size * 1.35 * Math.max(systemScale, 1));
}
