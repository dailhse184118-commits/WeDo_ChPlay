import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Chữ của khu vực Cuộc họp: danh sách, tạo cuộc họp, chi tiết cuộc họp và thẻ
 * cuộc họp.
 *
 * Tiêu đề, nội dung dự kiến, tóm tắt, quyết định, hạng mục hành động, tên người
 * và tên dự án là dữ liệu của người dùng (hoặc do AI viết) nên không bao giờ
 * nằm ở đây.
 */
export const tuDienCuocHop = khaiBaoTuDien(
  {
    tieuDe: 'Cuộc họp',

    // Trạng thái cuộc họp (khoá là mã của máy chủ)
    trangThai: {
      SCHEDULED: 'Đã lên lịch',
      IN_PROGRESS: 'Đang họp',
      COMPLETED: 'Đã xong',
      CANCELLED: 'Đã huỷ',
    },

    // Danh sách
    danhSach: {
      lich: 'Lịch',
      lichGoiY: 'Hạn chót và sự kiện',
      taoCuocHop: 'Tạo cuộc họp',
      sapToi: 'Sắp tới',
      daQua: 'Đã qua',
      khongTaiDuoc: 'Không tải được danh sách cuộc họp.',
      trongTieuDe: 'Chưa có cuộc họp nào',
      trongMoTa:
        'Leader của dự án là người lên lịch họp. Cuộc họp được tạo sẽ hiện ở đây và trên tab Lịch.',
    },

    // Thẻ cuộc họp
    the: {
      hangMuc: (so: number) => `${so} hạng mục`,
    },

    // Tạo cuộc họp
    tao: {
      duAn: 'Dự án',
      khongCoDuAn: 'Không gian này chưa có dự án nào. Cuộc họp phải thuộc về một dự án.',
      tieuDe: 'Tiêu đề',
      tieuDeMau: 'Họp chốt nội dung chương 2',
      noiDung: 'Nội dung dự kiến',
      khongBatBuoc: 'Không bắt buộc',
      ngayHop: (dinhDang: string) => `Ngày họp (${dinhDang})`,
      ngayMau: '25/09/2026',
      gioHop: 'Giờ họp (hh:mm)',
      gioMau: '20:00',
      ghiChuCuoi:
        'Chỉ Leader của dự án mới tạo được cuộc họp. Mọi thành viên dự án sẽ được thêm vào và nhận thông báo.',
      tieuDeTrong: 'Tiêu đề không được để trống.',
      chonDuAn: 'Hãy chọn dự án cho cuộc họp.',
      khongTaoDuoc: 'Không tạo được cuộc họp.',
    },

    /*
      Báo lỗi ngày giờ họp (lib/meetings/thoi-diem.ts). `ngaySai` và `ngayKhongCo` trước đây mượn câu
      của ô ngày sinh nên nhắc nhầm "Ngày sinh"; nay đã sửa thành "Ngày họp".
    */
    thoiDiem: {
      ngayTrong: 'Ngày họp chưa hợp lệ.',
      ngaySai: (dinhDang: string) => `Ngày họp cần viết theo dạng ${dinhDang}.`,
      ngayKhongCo: 'Ngày họp này không có trên lịch.',
      gioSai: 'Giờ họp cần viết theo dạng hh:mm, ví dụ 20:00.',
      gioNgoai: 'Giờ họp phải trong khoảng 00:00 đến 23:59.',
    },

    // Chi tiết
    chiTiet: {
      vaoPhong: 'Vào phòng họp',
      phongMoTrongTrinhDuyet: 'Phòng họp mở trong trình duyệt của máy.',
      noiDungDuKien: 'Nội dung dự kiến',
      nguoiThamDu: (so: number) => `Người tham dự (${so})`,
      tomTat: 'Tóm tắt',
      quyetDinh: 'Quyết định',
      hangMucHanhDong: (so: number) => `Hạng mục hành động (${so})`,
      chuaGiao: 'Chưa giao',
      daThanhCongViec: 'đã thành công việc',
      trangThaiHangMuc: {
        PENDING: 'Chờ Leader duyệt',
        APPROVED: 'Đã duyệt',
        REJECTED: 'Đã từ chối',
      },
      bienBanTrenWeb: 'Biên bản và tóm tắt được tạo trên bản web tại wedofpt.com.vn.',
      khongTimThay: 'Không tìm thấy cuộc họp này, hoặc bạn không có quyền xem.',
      khongTaiDuoc: 'Không tải được cuộc họp.',
      chuaCoDuongVao: 'Máy chủ chưa trả về đường vào phòng. Thử lại sau ít phút nhé.',
      khongMoDuocDuongDan: 'Máy không mở được đường dẫn phòng họp.',
      khongMoDuocPhong: 'Không mở được phòng họp.',
    },
  },
  {
    tieuDe: 'Meetings',

    trangThai: {
      SCHEDULED: 'Scheduled',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
      CANCELLED: 'Cancelled',
    },

    danhSach: {
      lich: 'Calendar',
      lichGoiY: 'Deadlines and events',
      taoCuocHop: 'Schedule a meeting',
      sapToi: 'Upcoming',
      daQua: 'Past',
      khongTaiDuoc: 'Couldn’t load your meetings.',
      trongTieuDe: 'No meetings yet',
      trongMoTa:
        'A project’s Leader schedules its meetings. Meetings you schedule will show up here and in the Calendar.',
    },

    the: {
      hangMuc: (so: number) =>
        soNhieu('en', so, { mot: '{so} action item', nhieu: '{so} action items' }),
    },

    tao: {
      duAn: 'Project',
      khongCoDuAn: 'This workspace has no projects yet. A meeting has to belong to a project.',
      tieuDe: 'Title',
      tieuDeMau: 'Meeting to finalize chapter 2',
      noiDung: 'Agenda',
      khongBatBuoc: 'Optional',
      ngayHop: (dinhDang: string) => `Meeting date (${dinhDang})`,
      ngayMau: '25/09/2026',
      gioHop: 'Meeting time (hh:mm)',
      gioMau: '20:00',
      ghiChuCuoi:
        'Only the project’s Leader can schedule a meeting. All project members are added and notified.',
      tieuDeTrong: 'The title can’t be empty.',
      chonDuAn: 'Choose a project for the meeting.',
      khongTaoDuoc: 'Couldn’t schedule the meeting.',
    },

    thoiDiem: {
      ngayTrong: 'Enter a valid meeting date.',
      ngaySai: (dinhDang: string) => `Enter the meeting date as ${dinhDang}.`,
      ngayKhongCo: 'That date doesn’t exist on the calendar.',
      gioSai: 'Enter the meeting time as hh:mm, for example 20:00.',
      gioNgoai: 'The meeting time must be between 00:00 and 23:59.',
    },

    chiTiet: {
      vaoPhong: 'Join the meeting',
      phongMoTrongTrinhDuyet: 'The meeting room opens in your phone’s browser.',
      noiDungDuKien: 'Agenda',
      nguoiThamDu: (so: number) => `Attendees (${so})`,
      tomTat: 'Summary',
      quyetDinh: 'Decisions',
      hangMucHanhDong: (so: number) => `Action items (${so})`,
      chuaGiao: 'Unassigned',
      daThanhCongViec: 'turned into a task',
      trangThaiHangMuc: {
        PENDING: 'Waiting for Leader approval',
        APPROVED: 'Approved',
        REJECTED: 'Declined',
      },
      bienBanTrenWeb: 'Minutes and summaries are created on the web version at wedofpt.com.vn.',
      khongTimThay: 'We couldn’t find this meeting, or you don’t have access to it.',
      khongTaiDuoc: 'Couldn’t load the meeting.',
      chuaCoDuongVao: 'The server didn’t return a link to the room. Please try again in a few minutes.',
      khongMoDuocDuongDan: 'Your phone couldn’t open the meeting link.',
      khongMoDuocPhong: 'Couldn’t open the meeting room.',
    },
  },
);
