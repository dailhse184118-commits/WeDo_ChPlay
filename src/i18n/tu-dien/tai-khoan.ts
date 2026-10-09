import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Chữ của khu vực Tài khoản: tab Tài khoản, Thông tin cá nhân, Cài đặt thông
 * báo, Góp ý, Người đã chặn, Xoá tài khoản, Bảng đóng góp, cùng câu báo lỗi
 * ngày sinh và đánh giá.
 */
export const tuDienTaiKhoan = khaiBaoTuDien(
  {
    // Bảng chọn ngôn ngữ
    chonNgonNgu: 'Chọn ngôn ngữ',
    theoMay: 'Theo máy',
    dong: 'Đóng',

    // Tab Tài khoản
    tieuDe: 'Tài khoản',
    dangTai: 'Đang tải…',
    khongLuuDuocLuaChon: 'Không lưu được lựa chọn.',
    khongDoiDuocAnh: 'Không đổi được ảnh đại diện.',
    anhDaiDien: 'Ảnh đại diện',
    chonAnhKhac: 'Chọn ảnh khác',
    goAnh: 'Gỡ ảnh',
    thoi: 'Thôi',
    doiHoacGoAnh: 'Đổi hoặc gỡ ảnh đại diện',
    chonAnh: 'Chọn ảnh đại diện',
    thongTinCaNhan: 'Thông tin cá nhân',
    thongTinCaNhanGoiY: 'Họ tên, số điện thoại, ngày sinh',
    caiDatThongBao: 'Cài đặt thông báo',
    caiDatThongBaoGoiY: 'Chọn loại thông báo bạn muốn nhận',
    bangDongGop: 'Bảng đóng góp',
    bangDongGopGoiY: 'Ai làm bao nhiêu, ai đúng hạn',
    dongBoLich: 'Đồng bộ lịch',
    dongBoLichGoiY: 'Đưa hạn chót và cuộc họp sang Google Calendar, Lịch Apple',
    nangCapGoi: 'Nâng cấp gói',
    dangKiemTra: 'Đang kiểm tra…',
    xemCacGoi: 'Xem các gói',
    gopY: 'Góp ý cho WeDo',
    gopYGoiY: 'Nói cho chúng tôi biết chỗ nào khó dùng',
    nguoiDaChan: 'Người đã chặn',
    nguoiDaChanGoiY: 'Xem và bỏ chặn',
    choPhepAI: 'Cho phép dùng AI',
    choPhepAIGoiY:
      'Gợi ý công việc từ tin nhắn bạn chọn. Tắt thì app không gửi tin nhắn bạn chọn cho AI nữa.',
    dieuKhoan: 'Điều khoản sử dụng',
    moTrongTrinhDuyet: 'Mở trong trình duyệt',
    riengTu: 'Chính sách quyền riêng tư',
    hoTro: 'Hỗ trợ',
    hoTroGoiY: 'Câu hỏi thường gặp, cách báo cáo nội dung xấu',
    lienHe: (email: string) => `Liên hệ: ${email}`,
    guiThu: 'Gửi thư cho WeDo',
    xoaTaiKhoan: 'Xoá tài khoản',
    xoaTaiKhoanGoiY: 'Xoá vĩnh viễn dữ liệu của bạn',
    dangXuat: 'Đăng xuất',

    // Thông tin cá nhân
    hoSo: {
      tieuDe: 'Thông tin cá nhân',
      khongLuuDuoc: 'Không lưu được thay đổi.',
      hoTenTrong: 'Họ và tên không được để trống.',
      emailDangNhap: 'Email đăng nhập',
      khongDoiEmail: 'Không đổi được email.',
      hoTen: 'Họ và tên',
      hoTenMau: 'Nguyễn Văn A',
      soDienThoai: 'Số điện thoại',
      khongBatBuoc: 'Không bắt buộc',
      ngaySinh: (dinhDang: string) => `Ngày sinh (${dinhDang})`,
      ngaySinhMau: '14/08/2004',
      ghiChuNgaySinh: 'Để trống ngày sinh nếu bạn không muốn lưu.',
      daLuu: 'Đã lưu thay đổi.',
      luu: 'Lưu thay đổi',
    },

    // Báo lỗi ngày sinh (lib/ngay-sinh.ts)
    ngaySinh: {
      sai: (dinhDang: string) => `Ngày sinh cần viết theo dạng ${dinhDang}.`,
      khongCoTrenLich: 'Ngày sinh này không có trên lịch.',
      namSomNhat: (nam: number) => `Năm sinh phải từ ${nam} trở đi.`,
      tuongLai: 'Ngày sinh không thể ở tương lai.',
    },

    // Cài đặt thông báo
    thongBao: {
      tieuDe: 'Cài đặt thông báo',
      khongTaiDuoc: 'Không tải được cài đặt.',
      khongLuuDuoc: 'Không lưu được thay đổi.',
      giaoViec: 'Giao việc',
      giaoViecGoiY: 'Khi có người giao việc cho bạn, hoặc phản hồi việc bạn giao',
      duyetViec: 'Duyệt việc',
      duyetViecGoiY: 'Khi việc được nộp hoặc được duyệt',
      nhacHan: 'Nhắc hạn chót',
      nhacHanGoiY: 'Nhắc trước 24 giờ và đúng giờ hạn',
      cuocHop: 'Cuộc họp',
      cuocHopGoiY: 'Khi có cuộc họp mới được lên lịch',
      ghiChu:
        'Nhắc hạn chót hoạt động ngay trên máy nên có thể trễ vài phút khi điện thoại ở chế độ tiết kiệm pin.',
    },

    // Góp ý
    gopYMan: {
      tieuDe: 'Góp ý cho WeDo',
      /** Nhãn cho 1 đến 5 sao (vị trí 0 là 1 sao). */
      nhanSao: ['Rất tệ', 'Tệ', 'Tạm được', 'Tốt', 'Rất tốt'] as string[],
      sao: (v: number) => `${v} sao`,
      chamDeChon: 'Chạm để chọn sao',
      khongGuiDuoc: 'Không gửi được đánh giá.',
      daGuiTieuDe: 'Bạn đã gửi đánh giá',
      daGuiPhu: 'Mỗi người gửi được một lần. Muốn sửa thì nhắn cho đội ngũ WeDo để mở lại giúp bạn.',
      moiGoi:
        'Bạn thấy WeDo thế nào? Chê thoải mái — góp ý thật giúp chúng tôi sửa đúng chỗ hơn là lời khen.',
      dieuMuonNoi: 'Điều bạn muốn nói',
      goiYNoiDung: 'Chỗ nào khó dùng? Thiếu tính năng gì? Gặp lỗi ở đâu?',
      conLai: (n: number) => `Còn ${n} ký tự`,
      gui: 'Gửi góp ý',
    },

    // Báo lỗi đánh giá (lib/feedback/kiem-tra.ts)
    danhGia: {
      chonSao: 'Chọn số sao trước đã.',
      thieu: (n: number) => `Viết thêm ${n} ký tự nữa để chúng tôi hiểu ý bạn.`,
      daiQua: (n: number) => `Nội dung dài quá ${n} ký tự, bạn rút gọn giúp nhé.`,
    },

    // Người đã chặn
    chan: {
      tieuDe: 'Người đã chặn',
      khongTaiDuoc: 'Không tải được danh sách người đã chặn.',
      khongBoChanDuoc: 'Không bỏ chặn được.',
      ghiChu:
        'Bạn không thấy tin nhắn của những người này, và hai bên không thể nhắn tin riêng hay kết bạn với nhau.',
      boChan: 'Bỏ chặn',
      boChanTen: (ten: string) => `Bỏ chặn ${ten}`,
      trongTieuDe: 'Bạn chưa chặn ai.',
      trongThan:
        'Muốn chặn ai, nhấn giữ tin nhắn của họ hoặc chạm dấu ba chấm cạnh tên họ trong màn Bạn bè.',
    },

    // Xoá tài khoản
    xoa: {
      tieuDe: 'Xoá tài khoản',
      tuXacNhan: 'XOA',
      muc: [
        'Hồ sơ, email và mật khẩu của bạn',
        'Tin nhắn bạn đã gửi trong mọi kênh chat dự án',
        'Tin nhắn riêng, danh sách bạn bè, ảnh và tệp bạn đã tải lên',
        'Việc bạn đang phụ trách sẽ trở thành chưa giao',
        'Không gian làm việc chỉ có mình bạn, cùng toàn bộ dự án và công việc bên trong',
      ] as string[],
      tieuDeKhoi: 'Xoá tài khoản sẽ xoá vĩnh viễn',
      ghiChuKhoi:
        'Không có bước hoàn tác và không khôi phục lại được. Nếu chỉ muốn tạm ngừng nhận thông báo, bạn tắt trong phần Cài đặt thông báo là đủ.',
      chuSoHuu: (thanhVien: number, duAn: number, congViec: number) =>
        `Bạn là chủ sở hữu và còn ${thanhVien} thành viên khác. Không gian này đang giữ ${duAn} dự án và ${congViec} công việc của cả nhóm — xoá tài khoản bạn sẽ xoá theo tất cả. Hãy chọn người nhận quyền sở hữu.`,
      khongTaiDuoc: 'Không tải được thông tin tài khoản.',
      thuLai: 'Thử lại',
      khongChuyenDuoc: 'Không chuyển được quyền sở hữu.',
      khongXoaDuoc: 'Không xoá được tài khoản.',
      daXoaTieuDe: 'Đã xoá tài khoản',
      daXoaNoiDung: 'Tài khoản WeDo của bạn và dữ liệu đi kèm đã được xoá vĩnh viễn.',
      chuyenTieuDe: 'Chuyển quyền sở hữu',
      chuyenNoiDung: (ten: string) =>
        `Giao không gian làm việc này cho ${ten}? Bạn sẽ vẫn là thành viên nhưng không còn quyền chủ sở hữu.`,
      huy: 'Huỷ',
      chuyen: 'Chuyển',
      hoiXoaTieuDe: 'Xoá tài khoản vĩnh viễn?',
      hoiXoaNoiDung: 'Hành động này không hoàn tác được.',
      xacNhan: 'Xác nhận',
      goDeBat: (tu: string) => `Gõ ${tu} vào ô dưới để bật nút xoá.`,
      nhanO: (tu: string) => `Gõ ${tu}`,
      nutXoa: 'Xoá tài khoản vĩnh viễn',
    },

    // Bảng đóng góp
    dongGop: {
      tieuDe: 'Bảng đóng góp',
      khongRo: 'Không rõ',
      tyLe: (phanTram: number) => `${phanTram}% đúng hạn`,
      hoanThanh: 'Hoàn thành',
      chuaXong: 'Chưa xong',
      treHan: 'Trễ hạn',
      daNop: 'Bài đã nộp',
      biTraLai: (n: number) => `${n} việc từng bị trả lại để sửa`,
      khongTaiDuoc: 'Không tải được bảng đóng góp.',
      ngoaiTuyen: 'Đang xem dữ liệu đã lưu. Kết nối lại để cập nhật.',
      trong: 'Chưa có việc nào được giao cho ai trong không gian làm việc này.',
      moDau: 'Xếp theo số việc đã hoàn thành. Việc không đặt hạn không tính vào tỷ lệ đúng hạn.',
      xemThem: (n: number) => `Xem thêm ${n} người`,
    },
  },
  {
    chonNgonNgu: 'Choose language',
    theoMay: 'Use device language',
    dong: 'Close',

    tieuDe: 'Account',
    dangTai: 'Loading…',
    khongLuuDuocLuaChon: 'Couldn’t save your choice.',
    khongDoiDuocAnh: 'Couldn’t change your profile photo.',
    anhDaiDien: 'Profile photo',
    chonAnhKhac: 'Choose another photo',
    goAnh: 'Remove photo',
    thoi: 'Cancel',
    doiHoacGoAnh: 'Change or remove profile photo',
    chonAnh: 'Choose a profile photo',
    thongTinCaNhan: 'Personal info',
    thongTinCaNhanGoiY: 'Name, phone number, date of birth',
    caiDatThongBao: 'Notification settings',
    caiDatThongBaoGoiY: 'Choose which notifications you get',
    bangDongGop: 'Contribution board',
    bangDongGopGoiY: 'Who did how much, who was on time',
    dongBoLich: 'Calendar sync',
    dongBoLichGoiY: 'Send deadlines and meetings to Google Calendar or Apple Calendar',
    nangCapGoi: 'Upgrade plan',
    dangKiemTra: 'Checking…',
    xemCacGoi: 'See plans',
    gopY: 'Send feedback to WeDo',
    gopYGoiY: 'Tell us what’s hard to use',
    nguoiDaChan: 'Blocked people',
    nguoiDaChanGoiY: 'View and unblock',
    choPhepAI: 'Allow AI',
    choPhepAIGoiY:
      'Suggests tasks from messages you choose. If you turn this off, the app stops sending the messages you choose to AI.',
    dieuKhoan: 'Terms of Use',
    moTrongTrinhDuyet: 'Opens in your browser',
    riengTu: 'Privacy Policy',
    hoTro: 'Support',
    hoTroGoiY: 'FAQ and how to report harmful content',
    lienHe: (email: string) => `Contact: ${email}`,
    guiThu: 'Email WeDo',
    xoaTaiKhoan: 'Delete account',
    xoaTaiKhoanGoiY: 'Permanently delete your data',
    dangXuat: 'Sign out',

    hoSo: {
      tieuDe: 'Personal info',
      khongLuuDuoc: 'Couldn’t save your changes.',
      hoTenTrong: 'Full name is required.',
      emailDangNhap: 'Sign-in email',
      khongDoiEmail: 'Your email can’t be changed.',
      hoTen: 'Full name',
      hoTenMau: 'Alex Nguyen',
      soDienThoai: 'Phone number',
      khongBatBuoc: 'Optional',
      ngaySinh: (dinhDang: string) => `Date of birth (${dinhDang})`,
      ngaySinhMau: '14/08/2004',
      ghiChuNgaySinh: 'Leave your date of birth empty if you don’t want to save it.',
      daLuu: 'Changes saved.',
      luu: 'Save changes',
    },

    ngaySinh: {
      sai: (dinhDang: string) => `Enter your date of birth as ${dinhDang}.`,
      khongCoTrenLich: 'That date doesn’t exist on the calendar.',
      namSomNhat: (nam: number) => `Your birth year must be ${nam} or later.`,
      tuongLai: 'Your date of birth can’t be in the future.',
    },

    thongBao: {
      tieuDe: 'Notification settings',
      khongTaiDuoc: 'Couldn’t load your settings.',
      khongLuuDuoc: 'Couldn’t save your changes.',
      giaoViec: 'Task assignments',
      giaoViecGoiY: 'When someone assigns you a task, or responds to one you assigned',
      duyetViec: 'Task reviews',
      duyetViecGoiY: 'When a task is submitted or approved',
      nhacHan: 'Deadline reminders',
      nhacHanGoiY: 'A reminder 24 hours before and at the deadline',
      cuocHop: 'Meetings',
      cuocHopGoiY: 'When a new meeting is scheduled',
      ghiChu:
        'Deadline reminders run on your phone, so they can be a few minutes late when battery saver is on.',
    },

    gopYMan: {
      tieuDe: 'Send feedback to WeDo',
      nhanSao: ['Very poor', 'Poor', 'Okay', 'Good', 'Very good'],
      sao: (v: number) => soNhieu('en', v, { mot: '{so} star', nhieu: '{so} stars' }),
      chamDeChon: 'Tap to choose a rating',
      khongGuiDuoc: 'Couldn’t send your feedback.',
      daGuiTieuDe: 'You’ve sent your feedback',
      daGuiPhu:
        'Each person can send feedback once. To change it, message the WeDo team and we’ll reopen it for you.',
      moiGoi:
        'How do you like WeDo? Be as critical as you like — honest feedback helps us fix the right things more than praise does.',
      dieuMuonNoi: 'What you’d like to say',
      goiYNoiDung: 'What’s hard to use? What’s missing? Where did you hit a bug?',
      conLai: (n: number) => soNhieu('en', n, { mot: '{so} character left', nhieu: '{so} characters left' }),
      gui: 'Send feedback',
    },

    danhGia: {
      chonSao: 'Choose a star rating first.',
      thieu: (n: number) =>
        soNhieu('en', n, {
          mot: 'Write {so} more character so we can understand what you mean.',
          nhieu: 'Write {so} more characters so we can understand what you mean.',
        }),
      daiQua: (n: number) => `That’s over ${n} characters. Please shorten it a little.`,
    },

    chan: {
      tieuDe: 'Blocked people',
      khongTaiDuoc: 'Couldn’t load your blocked list.',
      khongBoChanDuoc: 'Couldn’t unblock this person.',
      ghiChu:
        'You won’t see messages from these people, and neither of you can send direct messages or friend requests.',
      boChan: 'Unblock',
      boChanTen: (ten: string) => `Unblock ${ten}`,
      trongTieuDe: 'You haven’t blocked anyone.',
      trongThan:
        'To block someone, press and hold their message, or tap the three dots next to their name on the Friends screen.',
    },

    xoa: {
      tieuDe: 'Delete account',
      tuXacNhan: 'DELETE',
      muc: [
        'Your profile, email and password',
        'Messages you sent in every project chat',
        'Direct messages, your friends list, and photos and files you uploaded',
        'Tasks assigned to you will become unassigned',
        'Any workspace where you are the only member, with all its projects and tasks',
      ],
      tieuDeKhoi: 'Deleting your account permanently removes',
      ghiChuKhoi:
        'This can’t be undone or recovered. If you only want a break from notifications, turn them off in Notification settings.',
      chuSoHuu: (thanhVien: number, duAn: number, congViec: number) =>
        `You are the owner of this workspace, and it has ${soNhieu('en', thanhVien, { mot: '{so} other member', nhieu: '{so} other members' })}. It holds ${soNhieu('en', duAn, { mot: '{so} project', nhieu: '{so} projects' })} and ${soNhieu('en', congViec, { mot: '{so} task', nhieu: '{so} tasks' })} for your whole team, and deleting your account would delete all of it. Choose who takes over ownership.`,
      khongTaiDuoc: 'Couldn’t load your account info.',
      thuLai: 'Try again',
      khongChuyenDuoc: 'Couldn’t transfer ownership.',
      khongXoaDuoc: 'Couldn’t delete your account.',
      daXoaTieuDe: 'Account deleted',
      daXoaNoiDung: 'Your WeDo account and its data have been permanently deleted.',
      chuyenTieuDe: 'Transfer ownership',
      chuyenNoiDung: (ten: string) =>
        `Hand this workspace over to ${ten}? You’ll stay a member but will no longer be the owner.`,
      huy: 'Cancel',
      chuyen: 'Transfer',
      hoiXoaTieuDe: 'Delete your account permanently?',
      hoiXoaNoiDung: 'This can’t be undone.',
      xacNhan: 'Confirm',
      goDeBat: (tu: string) => `Type ${tu} in the box below to turn on the delete button.`,
      nhanO: (tu: string) => `Type ${tu}`,
      nutXoa: 'Delete account permanently',
    },

    dongGop: {
      tieuDe: 'Contribution board',
      khongRo: 'Unknown',
      tyLe: (phanTram: number) => `${phanTram}% on time`,
      hoanThanh: 'Completed',
      chuaXong: 'Open',
      treHan: 'Overdue',
      daNop: 'Submitted',
      biTraLai: (n: number) =>
        soNhieu('en', n, {
          mot: '{so} task was returned for changes',
          nhieu: '{so} tasks were returned for changes',
        }),
      khongTaiDuoc: 'Couldn’t load the contribution board.',
      ngoaiTuyen: 'Showing saved data. Reconnect to update.',
      trong: 'No tasks have been assigned to anyone in this workspace yet.',
      moDau: 'Ranked by tasks completed. Tasks without a deadline don’t count toward the on-time rate.',
      xemThem: (n: number) =>
        soNhieu('en', n, { mot: 'See {so} more person', nhieu: 'See {so} more people' }),
    },
  },
);
