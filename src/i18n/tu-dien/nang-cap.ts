import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Chữ của màn Nâng cấp (mua gói qua App Store), dòng "gói hiện tại" ở tab Tài
 * khoản, quyền lợi từng gói và câu báo hạn mức AI.
 *
 * Tên gói "Personal Pro", "Team Growth" là tên thương hiệu, giữ nguyên ở cả hai
 * ngôn ngữ (không nằm trong từ điển). Giá lấy từ StoreKit nên không dịch.
 */
export const tuDienNangCap = khaiBaoTuDien(
  {
    tieuDe: 'Nâng cấp',

    // Lỗi mua gói (lib/payments/mua-goi.ts)
    loiMua: {
      xungDotCoNgay: (ngay: string) =>
        `Gói hiện tại mua trên web còn đến ${ngay}. Mua trên iPhone sau ngày đó nhé.`,
      xungDot: 'Bạn đang có gói khác còn hạn.',
      chuKhac: 'Đăng ký App Store này đang gắn với một tài khoản WeDo khác.',
      chuWorkspace:
        'Chỉ chủ workspace mới mua được gói Team. Chọn workspace bạn làm chủ ở trên rồi bấm Khôi phục mua hàng.',
      giaoDichKhongHopLe: 'Giao dịch App Store không hợp lệ. Bấm Khôi phục mua hàng để thử lại.',
      tamChuaMo: 'Thanh toán qua App Store tạm chưa mở. Bạn thử lại sau nhé.',
      chuaMua: 'Chưa mua được. Bạn thử lại sau nhé.',
    },

    // Câu báo của màn
    khongDocGiaoDich: 'Không đọc được giao dịch từ App Store.',
    daThanhToan: 'Đã thanh toán, đang kích hoạt gói… Mở lại màn Nâng cấp nếu chưa thấy gói.',
    chuaKhoiPhuc: 'Chưa khôi phục được. Bạn thử lại sau nhé.',
    chuaMoQuanLy: 'Chưa mở được trang quản lý đăng ký. Vào Cài đặt → [tên bạn] → Đăng ký nhé.',
    daKiemTra: 'Đã kiểm tra các gói đã mua.',
    khongThayGoi: 'Không tìm thấy gói nào.',
    layGia: 'Đang lấy giá từ App Store…',
    khongLayDuocGoi: 'Chưa lấy được gói từ App Store.',
    thuLai: 'Thử lại',
    muaTeamChoWorkspace: 'Mua Team Growth cho workspace',
    dangKichHoat: 'Đã thanh toán, đang kích hoạt gói…',
    dangKhoiPhuc: 'Đang khôi phục…',
    khoiPhuc: 'Khôi phục mua hàng',
    quanLy: 'Quản lý đăng ký',
    dieuKhoan: 'Điều khoản sử dụng',
    riengTu: 'Chính sách riêng tư',
    // Đoạn pháp lý tự gia hạn: Apple duyệt từng chữ (Guideline 3.1.2), giữ đủ ý khi dịch.
    phapLy:
      'Tiền được trừ vào Apple ID khi xác nhận mua. Gói tự gia hạn theo kỳ đã chọn và tính vào Apple ID của bạn, trừ khi bạn huỷ ít nhất 24 giờ trước khi hết kỳ. Quản lý và huỷ trong Cài đặt → [tên bạn] → Đăng ký.',
    taoWorkspaceTruoc: 'Tạo workspace rồi mới mua Team Growth.',
    dangMoAppStore: 'Đang mở App Store…',
    giaTheoKy: (gia: string, theoNam: boolean) => `${gia} / ${theoNam ? 'năm' : 'tháng'}`,

    // Quyền lợi từng gói (lib/payments/quyen-loi.ts)
    quyenLoi: {
      PERSONAL_PRO: [
        '300 lượt AI gợi ý việc mỗi tháng',
        'Nhắc hạn thông minh',
        'Xuất việc và lịch',
        '2 GB lưu trữ cá nhân',
      ] as string[],
      TEAM_GROWTH: [
        '1.000 lượt AI mỗi tháng cho cả nhóm',
        'Tới 4 thành viên, 3 workspace',
        'Bản đồ nhiệt hạn chót và báo cáo khối lượng',
        'Bình chọn lịch họp',
        '10 GB lưu trữ nhóm',
      ] as string[],
    },

    // Dòng "gói hiện tại" ở tab Tài khoản (lib/payments/goi-hien-tai.ts)
    mienPhi: 'Miễn phí',
    goiHienTai: (ten: string, ngay: string, nguon: string) => `${ten} · đến ${ngay} · qua ${nguon}`,
    nguonApple: 'App Store',
    nguonWeb: 'web',

    // Hạn mức AI (lib/ai/han-muc.ts)
    hetLuot: (gioiHan: number, ngayNapLai: string) =>
      `Đã dùng hết ${gioiHan} lượt AI của tháng này. Hạn mức đầy lại vào ngày ${ngayNapLai}. Bạn vẫn tạo công việc thủ công bằng nút cộng được như thường.`,
    sapHet: (conLai: number) => `Còn ${conLai} lượt AI trong tháng này.`,
  },
  {
    tieuDe: 'Upgrade',

    loiMua: {
      xungDotCoNgay: (ngay: string) =>
        `Your current web plan runs until ${ngay}. You can buy on iPhone after that date.`,
      xungDot: 'You already have another plan that’s still active.',
      chuKhac: 'This App Store subscription is linked to a different WeDo account.',
      chuWorkspace:
        'Only the workspace owner can buy the Team plan. Choose a workspace you own above, then tap Restore purchases.',
      giaoDichKhongHopLe: 'This App Store transaction isn’t valid. Tap Restore purchases to try again.',
      tamChuaMo: 'Paying through the App Store isn’t available right now. Please try again later.',
      chuaMua: 'We couldn’t complete the purchase. Please try again later.',
    },

    khongDocGiaoDich: 'Couldn’t read the transaction from the App Store.',
    daThanhToan: 'Payment received, activating your plan… Reopen the Upgrade screen if you don’t see it yet.',
    chuaKhoiPhuc: 'We couldn’t restore your purchases. Please try again later.',
    chuaMoQuanLy:
      'We couldn’t open subscription management. Go to Settings > [your name] > Subscriptions.',
    daKiemTra: 'Purchased plans checked.',
    khongThayGoi: 'No plans found.',
    layGia: 'Getting prices from the App Store…',
    khongLayDuocGoi: 'Couldn’t get plans from the App Store.',
    thuLai: 'Try again',
    muaTeamChoWorkspace: 'Buy Team Growth for workspace',
    dangKichHoat: 'Payment received, activating your plan…',
    dangKhoiPhuc: 'Restoring…',
    khoiPhuc: 'Restore purchases',
    quanLy: 'Manage subscription',
    dieuKhoan: 'Terms of Use',
    riengTu: 'Privacy Policy',
    phapLy:
      'Payment is charged to your Apple ID account when you confirm the purchase. Your subscription renews automatically for the period you chose, and renewal is charged to your Apple ID account, unless you cancel at least 24 hours before the end of the current period. Manage or cancel in Settings > [your name] > Subscriptions.',
    taoWorkspaceTruoc: 'Create a workspace first, then buy Team Growth.',
    dangMoAppStore: 'Opening the App Store…',
    giaTheoKy: (gia: string, theoNam: boolean) => `${gia} / ${theoNam ? 'year' : 'month'}`,

    quyenLoi: {
      PERSONAL_PRO: [
        '300 AI task suggestions per month',
        'Smart deadline reminders',
        'Export tasks and calendar',
        '2 GB personal storage',
      ],
      TEAM_GROWTH: [
        '1,000 AI task suggestions per month for the whole team',
        'Up to 4 members, 3 workspaces',
        'Deadline heatmap and workload reports',
        'Meeting time polls',
        '10 GB team storage',
      ],
    },

    mienPhi: 'Free',
    goiHienTai: (ten: string, ngay: string, nguon: string) => `${ten} · until ${ngay} · via ${nguon}`,
    nguonApple: 'App Store',
    nguonWeb: 'web',

    hetLuot: (gioiHan: number, ngayNapLai: string) =>
      `You’ve used all ${gioiHan} AI credits for this month. Your credits refill on ${ngayNapLai}. You can still create tasks manually with the plus button.`,
    sapHet: (conLai: number) =>
      soNhieu('en', conLai, {
        mot: '{so} AI credit left this month.',
        nhieu: '{so} AI credits left this month.',
      }),
  },
);
