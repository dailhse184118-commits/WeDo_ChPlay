import { ApiError } from '../lib/api/client';
import type { NgonNgu } from './ngon-ngu';

/**
 * Lỗi do chính app ném ra với câu ĐÃ đúng ngôn ngữ lúc ném (ví dụ lib/auth: "Đăng
 * nhập Apple không thành công…"). `dichThongBaoLoi` trả nguyên câu, không dịch lại
 * và không thay bằng câu dự phòng.
 */
export class LoiDaDich extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, LoiDaDich.prototype);
    this.name = 'LoiDaDich';
  }
}

/**
 * Câu báo lỗi theo ngôn ngữ đang dùng.
 *
 * Máy chủ WeDo trả câu lỗi tiếng Việt và KHÔNG đổi trong đợt này. Nên ở chế độ
 * tiếng Anh, app tự dịch những gì nó nhận ra:
 * 1. Mã lỗi máy đọc được (`code` của ApiError) — chắc chắn nhất.
 * 2. Một số câu cố định của máy chủ và của chính app, so khớp nguyên văn.
 * Câu lạ thì dùng câu dự phòng (đã đúng ngôn ngữ) của màn hình: một câu chung
 * chung bằng tiếng Anh vẫn hơn một câu tiếng Việt đoán mò.
 *
 * Chế độ tiếng Việt giữ nguyên hành vi cũ: câu của máy chủ, hoặc câu dự phòng.
 */
/** Nhãn trạng thái đơn mà máy chủ gửi kèm ORDER_NOT_PENDING (`currentStatus`). */
const TRANG_THAI_DON_TIENG_ANH: Record<string, string> = {
  PENDING: 'Awaiting payment',
  PAID: 'Paid',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  FAILED: 'Failed',
};

/** `cau` là câu tiếng Việt của máy chủ (đã NFC, bỏ khoảng trắng hai đầu). */
type DichTheoMa = (chiTiet: Record<string, unknown> | undefined, cau: string) => string;

/** BE moderation.constants.ts LOI_CHAN_KET_BAN — cùng mã BLOCKED với câu chặn nhắn tin. */
const CAU_CHAN_KET_BAN = 'Bạn không thể kết bạn với người này.';

/** Mã lỗi của máy chủ (BE: grep `code: '`) và của lib/loi-api.ts. */
const TIENG_ANH_THEO_MA: Record<string, DichTheoMa> = {
  AI_PROVIDER_UNAVAILABLE: () => 'The AI service is not responding right now. Please try again later.',
  AI_DETECTION_LIMIT_REACHED: (chiTiet) => {
    const gioiHan = typeof chiTiet?.limit === 'number' ? chiTiet.limit : undefined;
    return gioiHan === undefined
      ? 'You have used all of your AI credits for this month.'
      : `You have used all ${new Intl.NumberFormat('en-US').format(gioiHan)} AI credits for this month.`;
  },
  ACCOUNT_SUSPENDED: () =>
    'Your account has been suspended for violating the Terms of Use. Contact wedosupport6886@gmail.com if you think this is a mistake.',
  ORDER_NOT_PENDING: (chiTiet) => {
    const nhan = typeof chiTiet?.currentStatus === 'string' ? TRANG_THAI_DON_TIENG_ANH[chiTiet.currentStatus] : undefined;
    return nhan
      ? `This order is already “${nhan}”, so there is nothing to reconcile.`
      : 'This order is no longer pending, so there is nothing to reconcile.';
  },
  ORDER_RECONCILE_IN_PROGRESS: () => 'Another process is already reconciling this order.',
  // Một mã cho hai tình huống: nhắn tin (mặc định) và kết bạn (friends.service).
  BLOCKED: (_chiTiet, cau) =>
    cau === CAU_CHAN_KET_BAN ? 'You can’t add this person as a friend.' : 'You can’t message this person.',
  REPORT_LIMIT: () => 'You have sent too many reports in the last 24 hours. Please try again later.',
  REPORT_ALREADY_HANDLED: () => 'Someone else has already handled this report. Reload the list.',
  APPLE_TOKEN_INVALID: () => 'Sign in with Apple failed. Please try again.',
  // Lời mời vào nhóm (BE src/projects/loi-moi/loi-moi.errors.ts).
  INVITE_NOT_FOUND: () => 'This invite code is wrong or no longer valid.',
  INVITE_EXPIRED: () => 'This invite link has expired. Ask your Leader for a new one.',
  INVITE_REVOKED: () => 'This invite link has been turned off. Ask your Leader for a new one.',
  INVITE_PROJECT_CLOSED: () => 'This project is closed and is not taking new members.',
  // Báo cáo đóng góp (BE src/bao-cao-dong-gop/bao-cao.errors.ts).
  REPORT_BAD_RANGE: () => 'The date range is invalid. Use YYYY-MM-DD dates, with “From” no later than “To”.',
  REPORT_TOO_LARGE: () => 'This report has more than 3,000 tasks. Narrow the date range and export again.',
  REPORT_LINK_INVALID: () => 'This download link has expired or is invalid. Export the report again.',
  // Đồng bộ lịch (BE src/lich-dong-bo/lich-dong-bo.errors.ts).
  CALENDAR_FEED_NOT_IN_PLAN: () => 'Calendar sync is part of the Pro and Team plans. Upgrade your plan to turn it on.',
  // Mua gói qua Apple (BE src/thanh-toan-apple).
  SUBSCRIPTION_CONFLICT: () => 'You already have an active subscription. Manage it in your account before buying another plan.',
  TRANSACTION_OWNED_BY_OTHER_USER: () => 'This purchase is already linked to another WeDo account.',
  WORKSPACE_OWNER_REQUIRED: () => 'Only the workspace owner can buy or change a plan.',
  APPLE_IAP_DISABLED: () => 'Buying plans in the app is not available right now. Please try again later.',
  APPLE_TRANSACTION_INVALID: () => 'We couldn’t verify this purchase with Apple. If you were charged, contact wedosupport6886@gmail.com.',
  // Lớp truyền tải của app (src/lib/api/client.ts).
  PHAN_HOI_KHONG_PHAI_JSON: () => 'The WeDo server is busy or restarting. Please try again in a few minutes.',
};

/**
 * Câu tiếng Việt cố định (của máy chủ hay của web) → câu tiếng Anh. Khoá phải
 * trùng NGUYÊN VĂN câu tiếng Việt, kể cả dấu chấm cuối câu.
 */
const TIENG_ANH_THEO_CAU: Record<string, string> = {
  // Máy chủ: đăng nhập, đăng ký (BE src/auth).
  'Email hoặc mật khẩu không đúng': 'Incorrect email or password',
  'Email này đã được đăng ký': 'This email is already registered',
  'Email không hợp lệ': 'Invalid email address',
  'Mật khẩu phải có ít nhất 6 ký tự': 'Password must be at least 6 characters',
  'Mật khẩu không được để trống': 'Password is required',
  'Họ và tên không được để trống': 'Full name is required',
  'Họ và tên tối đa 100 ký tự': 'Full name can be at most 100 characters',
  'Ngày sinh không hợp lệ': 'Invalid date of birth',
  'Email Google chưa được xác minh': 'Your Google email address is not verified',
  'Google token không hợp lệ hoặc đã hết hạn': 'Google sign-in expired. Please try again.',
  'Không thể lấy thông tin tài khoản Google': 'Couldn’t read your Google account details',
  'Tài khoản Platform Admin phải đăng nhập tại trang quản trị': 'Platform Admin accounts must sign in on the admin page',
  'Tài khoản này chưa được cấp quyền Platform Admin': 'This account has not been granted Platform Admin access',
  'Tài khoản này không có quyền Platform Admin': 'This account does not have Platform Admin access',
  'Tài khoản này không có quyền Platform Admin.': 'This account does not have Platform Admin access.',
  'Phiên đăng nhập không hợp lệ': 'Your session is invalid',
  'Phiên đăng nhập đã hết hạn': 'Your session has expired',
  'Mật khẩu đã được đổi. Vui lòng đăng nhập lại.': 'Your password was changed. Please sign in again.',
  'Phiên đăng nhập đã kết thúc vì mật khẩu vừa được đổi. Vui lòng đăng nhập lại.':
    'You were signed out because your password was just changed. Please sign in again.',
  'Ảnh đại diện quá lớn. Hãy tải lại trang rồi chọn ảnh lần nữa — ứng dụng sẽ tự thu nhỏ ảnh giúp bạn.':
    'That profile photo is too large. Reload the page and choose it again — the app will shrink it for you.',
  'Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng. Liên hệ wedosupport6886@gmail.com nếu bạn cho rằng đây là nhầm lẫn.':
    'Your account has been suspended for violating the Terms of Use. Contact wedosupport6886@gmail.com if you think this is a mistake.',
  // Máy chủ: quên mật khẩu.
  'Nếu email này có tài khoản, WeDo đã gửi mã đặt lại mật khẩu tới hộp thư của bạn.':
    'If this email has an account, WeDo has sent a password reset code to your inbox.',
  'Mã không đúng hoặc đã hết hạn': 'The code is incorrect or has expired',
  'Bạn đã nhập sai quá nhiều lần. Hãy yêu cầu mã mới.': 'Too many incorrect attempts. Please request a new code.',
  'Mã đặt lại mật khẩu gồm 6 chữ số': 'The reset code has 6 digits',
  'Đặt lại mật khẩu thành công. Hãy đăng nhập bằng mật khẩu mới.': 'Your password has been reset. Sign in with your new password.',
  // Máy chủ: AI.
  // App: phiên đăng nhập và mạng (src/lib/api/client.ts).
  'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.': 'Your session has ended. Please sign in again.',
  'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.': 'Can’t reach the server. Check your connection and try again.',
  'Bạn thao tác quá nhanh. Vui lòng thử lại sau ít phút.': 'You’re going too fast. Please try again in a few minutes.',
  // Máy chủ: không thấy dự án (báo cáo đóng góp, chat, cuộc họp… cùng dùng một câu).
  'Không tìm thấy dự án': 'Project not found. It may have been deleted or you no longer have access.',
};

/** Câu tiếng Việt có chỗ trống (số mã lỗi…) → câu tiếng Anh. */
const TIENG_ANH_THEO_MAU: ReadonlyArray<[RegExp, (khop: RegExpMatchArray) => string]> = [
  [
    /^Máy chủ đang bận hoặc đang khởi động lại \(mã (\d+)\)\. Thử lại sau ít phút\.$/,
    (khop) => `The server is busy or restarting (code ${khop[1]}). Please try again in a few minutes.`,
  ],
  [/^Máy chủ trả lỗi (\d+)\.$/, (khop) => `The server returned an error (code ${khop[1]}).`],
  [/^Gia hạn phiên đăng nhập lỗi (\d+)\.$/, (khop) => `Couldn’t renew your session (code ${khop[1]}).`],
];

function cauTiengAnh(cau: string): string | undefined {
  if (TIENG_ANH_THEO_CAU[cau]) return TIENG_ANH_THEO_CAU[cau];
  for (const [mau, dich] of TIENG_ANH_THEO_MAU) {
    const khop = cau.match(mau);
    if (khop) return dich(khop);
  }
  return undefined;
}

function layChiTiet(loi: unknown): Record<string, unknown> | undefined {
  if (!(loi instanceof ApiError)) return undefined;
  const ct = loi.chiTiet;
  return ct && typeof ct === 'object' && !Array.isArray(ct) ? (ct as Record<string, unknown>) : undefined;
}

/**
 * Câu hiện cho người dùng từ một lỗi bất kỳ, theo ngôn ngữ. `duPhong` phải là
 * câu ĐÚNG ngôn ngữ đang dùng (lấy từ từ điển của màn hình).
 */
export function dichThongBaoLoi(loi: unknown, duPhong: string, ngonNgu: NgonNgu): string {
  if (loi instanceof LoiDaDich) return loi.message;
  const cau = loi instanceof Error ? loi.message.normalize('NFC').trim() : '';
  if (ngonNgu === 'vi') return cau || duPhong;
  const ma = loi instanceof ApiError ? loi.code : undefined;
  if (ma && TIENG_ANH_THEO_MA[ma]) return TIENG_ANH_THEO_MA[ma](layChiTiet(loi), cau);
  const tiengAnh = cau ? cauTiengAnh(cau) : undefined;
  return tiengAnh ?? duPhong;
}
