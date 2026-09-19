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
 * thấy những lỗi đã có người bắt, nên chỗ nào bắt lỗi rồi hiện câu tiếng Việt
 * cho người dùng thì PHẢI gọi hàm này, nếu không câu lỗi thật biến mất.
 *
 * `chiTiet` đi vào phần "extra" của báo cáo. Tuyệt đối không đưa nội dung của
 * người dùng vào đây — tên tệp, kích cỡ, loại tệp thì được; nội dung tin nhắn
 * hay ảnh thì không.
 */
/**
 * Ép một câu lỗi về dạng Sentry chịu nhận làm `tag`.
 *
 * Sentry từ chối tag có xuống dòng hoặc dài quá 200 ký tự, và hiện `<invalid>`
 * thay cho giá trị. Lỗi native của Expo thường kèm cả khối "Call stack" nhiều
 * dòng, nên ngày 19/09 nguyên nhân bị vứt mất đúng lúc cần nhất.
 */
export function dongMotHang(cau: string): string {
  const gon = cau.replace(/\s+/g, ' ').trim();
  return gon.length > 180 ? `${gon.slice(0, 179)}…` : gon;
}

export function baoLoi(
  loi: unknown,
  o: string,
  chiTiet?: Record<string, unknown>,
): void {
  try {
    /*
      `nguyenNhan` là câu lỗi gốc của hệ điều hành mà `ApiError` giữ lại. Đưa
      hẳn lên `tags` chứ không chỉ `extra`: tag hiện ngay đầu trang lỗi và lọc
      được, còn extra phải kéo xuống mới thấy.
    */
    const nguyenNhan =
      loi && typeof loi === 'object' && 'nguyenNhan' in loi
        ? String((loi as { nguyenNhan?: unknown }).nguyenNhan ?? '')
        : '';

    const tag = dongMotHang(nguyenNhan);

    Sentry.captureException(loi, {
      tags: tag ? { cho: o, nguyenNhan: tag } : { cho: o },
      /*
        Gửi thêm bản ĐẦY ĐỦ xuống `extra`: tag đã bị cắt còn 180 ký tự, mà phần
        bị cắt đôi khi mới là phần nói rõ hỏng ở đâu. `extra` không giới hạn
        như tag nên giữ được nguyên văn.
      */
      extra: nguyenNhan ? { ...chiTiet, nguyenNhanDayDu: nguyenNhan } : chiTiet,
    });
  } catch {
    // Như trên.
  }
}

/**
 * Mô tả một tệp đủ để lần ra lỗi, mà không lộ nội dung.
 *
 * Gửi ảnh hỏng thì thứ cần biết là đường dẫn thuộc loại nào, tên ra sao, khai
 * kiểu gì — chứ không phải bản thân tấm ảnh.
 */
export function moTaTep(tep: { uri: string; name: string; mimeType?: string | null }) {
  const uri = tep.uri ?? '';

  return {
    // Chỉ lấy phần giao thức: `file:`, `content:`, `ph:`… Đây là thứ hay sai.
    giaoThuc: uri.split(':')[0] || '(rong)',
    doDaiUri: uri.length,
    duoiTen: tep.name?.split('.').pop() ?? '(khong co)',
    kieu: tep.mimeType ?? '(khong khai)',
  };
}
