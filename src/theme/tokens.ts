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
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
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

/** Kích cỡ lặp lại nhiều lần trong bộ thiết kế. */
export const sizes = {
  /** Ô icon vuông bo góc, tô màu nhạt theo ý nghĩa. */
  iconTile: 40,
  /** Avatar dự án trong danh sách. */
  projectAvatar: 48,
  /** Avatar lớn trên thẻ danh tính màn Tài khoản. */
  profileAvatar: 80,
  /** Chiều cao ô nhập và nút. */
  control: 48,
  /** Icon Lucide/Ionicons mặc định. */
  icon: 24,
} as const;
