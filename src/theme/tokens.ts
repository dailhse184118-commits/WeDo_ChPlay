import { Dimensions, PixelRatio } from 'react-native';

import { buildTokens } from './build-tokens';

/*
  Số đo thiết bị đọc ĐÚNG MỘT LẦN lúc module nạp.

  Nhờ vậy mọi `StyleSheet.create` trong repo vẫn là hằng số tĩnh — không phải
  chuyển style vào thân hàm render ở khoảng 20 file, và không mất tối ưu của
  `StyleSheet`.

  Đánh đổi: token không đổi theo khi kích thước cửa sổ hay cỡ chữ thay đổi giữa
  lúc app đang chạy. Chấp nhận được vì `app.json` khoá `orientation: portrait`,
  còn đổi cỡ chữ hệ thống trên Android làm khởi động lại activity nên module
  được nạp lại.
*/
const { spacing, fontSize, lineHeight, sizes, scale, scaleWithFont } = buildTokens(
  Dimensions.get('window').width,
  PixelRatio.getFontScale(),
);

export { spacing, fontSize, lineHeight, sizes, scale, scaleWithFont };

export const colors = {
  primary: '#0055c7',
  primaryDark: '#00408f',
  primarySoft: '#e6eff9',
  background: '#ffffff',
  surface: '#f5f7fa',
  border: '#dfe4ec',
  text: '#111827',
  textMuted: '#6b7280',
  danger: '#c62828',
  success: '#1b7f4d',
  warning: '#b26a00',

  // --- Bổ sung theo bộ thiết kế "WeDo mobile app design system" ---

  /**
   * Bậc sáng của chính #0055c7, dùng làm điểm cuối gradient header.
   * Không sáng hơn mức này: chữ trắng đặc trên đầu sáng nhất vẫn phải đạt 4,5:1.
   */
  primaryLight: '#2071dc',

  /** Nền trang phía sau các thẻ trắng nổi. */
  page: '#eef2f7',

  /** Đường kẻ ngăn bên trong thẻ, nhạt hơn `border`. */
  divider: '#eef2f7',

  /**
   * Ba màu pha nhạt cho nền hộp và chip. Bản gốc chỉ có danger/success/warning
   * ở dạng đặc, đặt chữ lên là không đọc được.
   */
  dangerSoft: '#fdecec',
  successSoft: '#e8f4ed',
  warningSoft: '#fdf4e3',

  /** Chữ trên nền vàng nhạt. #b26a00 trên #fdf4e3 không đạt 4,5:1, màu này đạt. */
  warningText: '#8a5200',

  /**
   * Chữ và icon nằm TRÊN nền màu thương hiệu: header gradient, nút chính, chip.
   *
   * Trùng giá trị với `background` nhưng khác hẳn ý nghĩa — `background` là nền
   * trang, đổi nó sang màu tối thì `onPrimary` vẫn phải là trắng.
   */
  onPrimary: '#ffffff',
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Gradient header. React Native 0.86 nhận chuỗi CSS qua `experimental_backgroundImage`,
 * nên không cần `expo-linear-gradient` — tránh được một module native và một lần
 * build lại APK.
 */
export const gradients = {
  header: 'linear-gradient(160deg, #0055c7, #2071dc)',
} as const;

/** `boxShadow` của RN 0.86 nhận chuỗi CSS. */
export const shadows = {
  /** Thẻ trắng nổi trên nền #eef2f7. */
  card: '0 2px 12px rgba(0, 60, 140, 0.10)',
  /** Nút chính, bóng mang màu thương hiệu. */
  button: '0 6px 16px rgba(0, 85, 199, 0.32)',
  /** Bong bóng chat của người khác trên nền xám. */
  bubble: '0 1px 4px rgba(0, 60, 140, 0.06)',
} as const;

