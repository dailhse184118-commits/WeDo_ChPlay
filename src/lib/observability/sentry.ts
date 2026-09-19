import Constants from 'expo-constants';
import * as Sentry from '@sentry/react-native';

interface DauVaoCauHinh {
  dsn?: string;
  dangPhatTrien?: boolean;
  phienBan?: string;
  maBuild?: number;
}

/** Đúng những trường `Sentry.init` cần, tách ra để test được mà không gọi Sentry thật. */
export interface CauHinhSentry {
  dsn: string;
  environment: string;
  release?: string;
  dist?: string;
  enabled: boolean;
  sendDefaultPii: boolean;
}

/**
 * Dựng cấu hình Sentry từ môi trường.
 *
 * Trả `null` khi chưa khai DSN — máy của lập trình viên, hay bản build trước
 * lúc ai đó tạo tài khoản. Bật giám sát lỗi mà lại làm app không mở được thì
 * đúng là tự bắn vào chân.
 */
export function cauHinhSentry(dauVao: DauVaoCauHinh): CauHinhSentry | null {
  const dsn = (dauVao.dsn ?? '').trim();
  if (!dsn) return null;

  const dangPhatTrien = dauVao.dangPhatTrien ?? false;

  return {
    dsn,
    environment: dangPhatTrien ? 'development' : 'production',
    release: dauVao.phienBan,
    // `dist` là mã build. Sentry cần cả hai để ghép đúng source map về sau.
    dist: dauVao.maBuild === undefined ? undefined : String(dauVao.maBuild),
    /*
      Lúc ngồi code thì mọi lỗi đã hiện đỏ trên màn hình rồi; gửi lên Sentry
      nữa chỉ tổ đốt hạn mức của gói miễn phí.
    */
    enabled: !dangPhatTrien,
    /*
      Mặc định Sentry kèm địa chỉ IP và dữ liệu thiết bị. WeDo giữ tin nhắn
      riêng của sinh viên; đẩy thêm dữ liệu cá nhân sang bên thứ ba là chuyện
      không ai đồng ý cả.
    */
    sendDefaultPii: false,
  };
}

/**
 * Bật giám sát lỗi. Gọi ở tầng module của layout gốc, trước mọi thứ khác.
 *
 * Nuốt mọi lỗi: thiếu module native hay DSN hỏng đều không được phép chặn app
 * khởi động. Giám sát là thứ phụ trợ.
 */
export function khoiDongSentry(): void {
  try {
    const cauHinh = cauHinhSentry({
      dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      dangPhatTrien: __DEV__,
      phienBan: Constants.expoConfig?.version,
      maBuild: Constants.expoConfig?.android?.versionCode,
    });

    if (cauHinh) Sentry.init(cauHinh);
  } catch {
    // Không có gì để làm: app vẫn phải chạy.
  }
}

/**
 * Gửi một lỗi kèm ghi chú về nơi nó xảy ra.
 *
 * Dùng cho chỗ đã tự bắt lỗi rồi — `ErrorBoundary` chẳng hạn. Sentry không tự
 * thấy những lỗi đã có người bắt.
 */
export function baoLoi(loi: unknown, o: string): void {
  try {
    Sentry.captureException(loi, { tags: { cho: o } });
  } catch {
    // Như trên.
  }
}
