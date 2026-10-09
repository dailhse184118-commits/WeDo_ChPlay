import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Chữ của khu vực Công việc: danh sách "Việc của tôi", chi tiết công việc, tạo
 * việc mới, phiếu từ chối / trả bài và bảng tài liệu đã nộp.
 *
 * Tên việc, mô tả, tên người và tên dự án là dữ liệu của người dùng nên không
 * bao giờ nằm ở đây.
 */
export const tuDienCongViec = khaiBaoTuDien(
  {
    // Trạng thái công việc (khoá là mã của máy chủ)
    trangThai: {
      TODO: 'Cần làm',
      IN_PROGRESS: 'Đang làm',
      REVIEW: 'Chờ duyệt',
      DONE: 'Xong',
    },
    daTuChoi: 'Đã từ chối',

    // Nhóm theo hạn (khoá là DeadlineBucket)
    nhom: {
      pending: 'Chờ bạn phản hồi',
      overdue: 'Quá hạn',
      today: 'Hôm nay',
      thisWeek: 'Tuần này',
      later: 'Sau đó',
      noDueDate: 'Không có hạn',
    },

    // Màn danh sách
    danhSach: {
      tieuDe: 'Việc của tôi',
      taoMoi: 'Tạo công việc mới',
      dangMo: 'Đang mở',
      choNhan: 'Chờ nhận',
      quaHan: 'Quá hạn',
      dangXemDuLieuDaLuu: 'Đang xem dữ liệu đã lưu. Kết nối lại để cập nhật.',
      trongTieuDe: 'Chưa có việc nào cho bạn',
      trongThan:
        'Bấm dấu cộng ở trên để thêm việc mới. Hoặc khi nhóm chốt việc trong chat, nhấn giữ tin nhắn đó để WeDo tạo công việc. Việc giao cho bạn sẽ xuất hiện ở đây.',
    },

    // Dòng công việc
    dong: {
      nhanViec: 'Nhận việc',
      tuChoi: 'Từ chối',
      xongLuc: (gio: string) => `Xong lúc ${gio}`,
      hanHomNay: (gio: string) => `Hạn hôm nay, ${gio}`,
      hanNgayMai: (gio: string) => `Hạn ngày mai, ${gio}`,
      quaHanNgay: (soNgay: number): string =>
        soNgay === 1 ? 'Quá hạn 1 ngày' : `Quá hạn ${soNgay} ngày`,
      hanNgay: (ngay: string, gio: string) => `Hạn ${ngay}, ${gio}`,
    },

    // Chi tiết công việc
    chiTiet: {
      tieuDe: 'Chi tiết công việc',
      trangThai: 'Trạng thái',
      phanCong: 'Phân công',
      hanChot: 'Hạn chót',
      nguoiPhuTrach: 'Người phụ trách',
      duAn: 'Dự án',
      chuaGiao: 'Chưa giao',
      nguoiDuocGiao: 'người được giao',
      choPhanHoi: (ten: string) => `Chờ ${ten} phản hồi`,
      dangChoPhanHoi: (ten: string) => `Đang chờ ${ten} phản hồi`,
      lyDoTuChoi: 'Lý do từ chối',
      nhanViec: 'Nhận việc',
      tuChoi: 'Từ chối',
      batDauLam: 'Bắt đầu làm',
      phanCongTrangThai: {
        PENDING: 'Chờ bạn phản hồi',
        ACCEPTED: 'Đã nhận',
        REJECTED: 'Đã từ chối',
      } as Record<string, string>,
      ngayGio: (ngay: string, gio: string) => `${ngay} lúc ${gio}`,
      hoiDuyetTieuDe: 'Duyệt bài này?',
      hoiDuyetNoiDung: 'Công việc sẽ chuyển sang Xong và cả nhóm được báo.',
      huy: 'Huỷ',
      duyet: 'Duyệt',
      traBai: {
        tieuDe: 'Trả bài lại',
        noiDung: 'Người phụ trách sẽ đọc lý do này và làm lại, nên nói rõ phần nào cần sửa.',
        nutGui: 'Gửi yêu cầu sửa',
        lyDoNhanh: ['Thiếu nội dung', 'Sai định dạng', 'Cần bổ sung số liệu'] as readonly string[],
      },
    },

    // Lỗi của thao tác (giữ ở dạng khoá trong state, dịch lúc vẽ)
    loi: {
      khongTaiDanhSach: 'Không tải được danh sách công việc.',
      khongTaiCongViec: 'Không tải được công việc.',
      khongNhan: 'Không nhận được việc này.',
      khongTuChoi: 'Không từ chối được việc này.',
      khongBatDau: 'Không bắt đầu được việc này.',
      khongNop: 'Không nộp được tài liệu.',
      khongGuiDuyet: 'Không gửi duyệt được.',
      khongDuyet: 'Không duyệt được bài.',
      khongTraBai: 'Không trả bài được.',
      khongChonTep: 'Không chọn được tệp.',
      khongTao: 'Không tạo được công việc.',
    },
    khongMoDuocTep: (ten: string) =>
      `Không mở được tệp "${ten}". Thử lại, hoặc mở trên web WeDo.`,

    // Tạo việc mới
    tao: {
      tieuDe: 'Công việc mới',
      tenViec: 'Tên công việc',
      tenViecViDu: 'Ví dụ: Dịch tài liệu chương 3',
      moTa: 'Mô tả',
      khongBatBuoc: 'Không bắt buộc',
      hanChot: 'Hạn chót',
      hanChotGoiY: 'ngày/tháng/năm — ví dụ 02/09/2026',
      duAn: 'Dự án',
      giaoCho: 'Giao cho',
      thanhVien: 'Thành viên',
      khongCoDuAn: 'Không gian làm việc này chưa có dự án nào.',
      duAnChuaCoThanhVien: 'Dự án này chưa có thành viên nào.',
      chuaTaiDuocThanhVien: 'Chưa tải được danh sách thành viên.',
      chiLeaderTaoDuoc:
        'Chỉ Leader của dự án này mới tạo được công việc trong dự án. Bỏ chọn dự án để tạo việc riêng cho bạn.',
      nutTao: 'Tạo công việc',
      loiForm: {
        thieuTen: 'Nhập tên công việc trước đã.',
        thieuKhongGian: 'Chưa chọn không gian làm việc.',
        hanChotSai: 'Hạn chót phải theo dạng ngày/tháng/năm, ví dụ 02/09/2026.',
      },
    },

    // Phiếu từ chối nhận việc / trả bài
    tuChoiPhieu: {
      tieuDe: 'Từ chối công việc',
      nutGui: 'Gửi từ chối',
      lyDoNhanh: ['Trùng deadline khác', 'Đang quá tải', 'Không đúng phần mình'] as readonly string[],
      noiDung: (nguoiGiao?: string): string =>
        `${
          nguoiGiao ? `${nguoiGiao} sẽ thấy lý do của bạn` : 'Người giao việc sẽ thấy lý do'
        }, nên viết ngắn gọn và cụ thể giúp nhóm sắp xếp lại.`,
      lyDoNganQua: 'Lý do từ chối phải có ít nhất 3 ký tự',
      nhan: 'Lý do từ chối',
      goiY: 'Ví dụ: tuần này mình thi giữa kỳ, không kịp làm.',
      batBuoc: 'Bắt buộc nhập',
      dangGui: 'Đang gửi…',
      huy: 'Huỷ',
    },

    // Bảng tài liệu đã nộp
    nop: {
      baiBiTraLai: 'Bài bị trả lại',
      taiLieuDaNop: 'Tài liệu đã nộp',
      chuaCoTepCanNop: 'Chưa có tệp nào. Nộp ít nhất một tệp rồi mới gửi duyệt được.',
      chuaCoTep: 'Chưa có tệp nào.',
      moTep: (ten: string) => `Mở tệp ${ten}`,
      nopTaiLieu: 'Nộp tài liệu',
      guiDuyet: 'Gửi duyệt',
      duyetBai: 'Duyệt bài',
      traLai: 'Trả lại',
    },
  },
  {
    trangThai: {
      TODO: 'To do',
      IN_PROGRESS: 'In progress',
      REVIEW: 'In review',
      DONE: 'Done',
    },
    daTuChoi: 'Declined',

    nhom: {
      pending: 'Waiting for your reply',
      overdue: 'Overdue',
      today: 'Today',
      thisWeek: 'This week',
      later: 'Later',
      noDueDate: 'No due date',
    },

    danhSach: {
      tieuDe: 'My tasks',
      taoMoi: 'Create a new task',
      dangMo: 'Open',
      choNhan: 'To accept',
      quaHan: 'Overdue',
      dangXemDuLieuDaLuu: 'Showing saved data. Reconnect to refresh.',
      trongTieuDe: 'No tasks for you yet',
      trongThan:
        'Tap the plus button above to add a task. Or when your team settles on a task in chat, press and hold that message and WeDo will create it. Tasks assigned to you will show up here.',
    },

    dong: {
      nhanViec: 'Accept task',
      tuChoi: 'Decline',
      xongLuc: (gio: string) => `Done at ${gio}`,
      hanHomNay: (gio: string) => `Due today, ${gio}`,
      hanNgayMai: (gio: string) => `Due tomorrow, ${gio}`,
      quaHanNgay: (soNgay: number): string =>
        soNhieu('en', soNgay, { mot: 'Overdue by {so} day', nhieu: 'Overdue by {so} days' }),
      hanNgay: (ngay: string, gio: string) => `Due ${ngay}, ${gio}`,
    },

    chiTiet: {
      tieuDe: 'Task details',
      trangThai: 'Status',
      phanCong: 'Assignment',
      hanChot: 'Due date',
      nguoiPhuTrach: 'Assignee',
      duAn: 'Project',
      chuaGiao: 'Unassigned',
      nguoiDuocGiao: 'the assignee',
      choPhanHoi: (ten: string) => `Waiting for ${ten} to reply`,
      dangChoPhanHoi: (ten: string) => `Waiting for ${ten} to reply`,
      lyDoTuChoi: 'Reason for declining',
      nhanViec: 'Accept task',
      tuChoi: 'Decline',
      batDauLam: 'Start working',
      phanCongTrangThai: {
        PENDING: 'Waiting for your reply',
        ACCEPTED: 'Accepted',
        REJECTED: 'Declined',
      },
      ngayGio: (ngay: string, gio: string) => `${ngay} at ${gio}`,
      hoiDuyetTieuDe: 'Approve this submission?',
      hoiDuyetNoiDung: 'The task will move to Done and the whole team will be notified.',
      huy: 'Cancel',
      duyet: 'Approve',
      traBai: {
        tieuDe: 'Return submission',
        noiDung: 'The assignee will read this reason and redo the work, so say clearly what needs to change.',
        nutGui: 'Request changes',
        lyDoNhanh: ['Missing content', 'Wrong format', 'Needs more data'],
      },
    },

    loi: {
      khongTaiDanhSach: 'Couldn’t load your tasks.',
      khongTaiCongViec: 'Couldn’t load this task.',
      khongNhan: 'Couldn’t accept this task.',
      khongTuChoi: 'Couldn’t decline this task.',
      khongBatDau: 'Couldn’t start this task.',
      khongNop: 'Couldn’t submit the files.',
      khongGuiDuyet: 'Couldn’t submit for review.',
      khongDuyet: 'Couldn’t approve this submission.',
      khongTraBai: 'Couldn’t return this submission.',
      khongChonTep: 'Couldn’t pick the files.',
      khongTao: 'Couldn’t create the task.',
    },
    khongMoDuocTep: (ten: string) =>
      `Couldn’t open the file "${ten}". Try again, or open it on the WeDo web app.`,

    tao: {
      tieuDe: 'New task',
      tenViec: 'Task name',
      tenViecViDu: 'For example: Translate chapter 3',
      moTa: 'Description',
      khongBatBuoc: 'Optional',
      hanChot: 'Due date',
      hanChotGoiY: 'day/month/year, for example 02/09/2026',
      duAn: 'Project',
      giaoCho: 'Assign to',
      thanhVien: 'Member',
      khongCoDuAn: 'This workspace has no projects yet.',
      duAnChuaCoThanhVien: 'This project has no members yet.',
      chuaTaiDuocThanhVien: 'Couldn’t load the member list.',
      chiLeaderTaoDuoc:
        'Only the Leader of this project can create tasks in it. Deselect the project to create a personal task.',
      nutTao: 'Create task',
      loiForm: {
        thieuTen: 'Enter a task name first.',
        thieuKhongGian: 'No workspace selected.',
        hanChotSai: 'The due date must be day/month/year, for example 02/09/2026.',
      },
    },

    tuChoiPhieu: {
      tieuDe: 'Decline task',
      nutGui: 'Send decline',
      lyDoNhanh: ['Clashes with another deadline', 'Too much on my plate', 'Not my part'],
      noiDung: (nguoiGiao?: string): string =>
        `${
          nguoiGiao ? `${nguoiGiao} will see your reason` : 'Whoever assigned this will see your reason'
        }, so keep it short and specific to help the team reassign.`,
      lyDoNganQua: 'The reason must be at least 3 characters',
      nhan: 'Reason for declining',
      goiY: 'For example: I have midterms this week and won’t have time.',
      batBuoc: 'Required',
      dangGui: 'Sending…',
      huy: 'Cancel',
    },

    nop: {
      baiBiTraLai: 'Returned for changes',
      taiLieuDaNop: 'Submitted files',
      chuaCoTepCanNop: 'No files yet. Submit at least one file before you can send for review.',
      chuaCoTep: 'No files yet.',
      moTep: (ten: string) => `Open file ${ten}`,
      nopTaiLieu: 'Submit files',
      guiDuyet: 'Submit for review',
      duyetBai: 'Approve submission',
      traLai: 'Return',
    },
  },
);
