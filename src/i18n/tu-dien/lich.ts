import { khaiBaoTuDien } from '../dich';
import { dinhDangThoiGian } from '../dinh-dang';

/**
 * Ngày dương lịch (năm, tháng 1-12, ngày; theo giờ máy) → thời điểm 12:00 giờ
 * Việt Nam của đúng ngày đó, để `dinhDangThoiGian` (luôn đọc theo giờ Việt Nam)
 * không lệch ngày khi máy đặt múi giờ khác.
 */
function buoiTruaVietNam(nam: number, thang: number, ngay: number): Date {
  return new Date(Date.UTC(nam, thang - 1, ngay, 5));
}

/**
 * Chữ của màn Lịch: nhãn ngày, nhãn loại mục, khung trống và báo lỗi.
 *
 * Tiêu đề, mô tả của cuộc họp, hạn chót và sự kiện là dữ liệu của người dùng nên
 * không nằm ở đây. Thứ trong tuần và tên tháng tiếng Anh lấy từ `Intl`.
 */
export const tuDienLich = khaiBaoTuDien(
  {
    tieuDe: 'Lịch',

    // Nhãn ngày trên tiêu đề từng nhóm
    ngay: {
      homNay: 'Hôm nay',
      ngayMai: 'Ngày mai',
      homQua: 'Hôm qua',
      ngayXa: (nam: number, thang: number, ngay: number) =>
        `${['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][buoiTruaVietNam(nam, thang, ngay).getUTCDay()]}, ${ngay}/${thang}`,
    },

    // Huy hiệu loại mục (khoá là `kind` của máy chủ)
    loai: {
      MEETING: 'Họp',
      TASK_DEADLINE: 'Hạn chót',
      EVENT: 'Sự kiện',
    },

    moCuocHop: (ten: string) => `Mở cuộc họp ${ten}`,
    khongTaiDuoc: 'Không tải được lịch.',
    dangXemDuLieuDaLuu: 'Đang xem dữ liệu đã lưu. Kết nối lại để cập nhật.',
    trongTieuDe: 'Chưa có gì trong lịch',
    trongThan:
      'Cuộc họp, sự kiện và hạn chót công việc của nhóm sẽ hiện ở đây, gộp chung theo từng ngày.',
  },
  {
    tieuDe: 'Calendar',

    ngay: {
      homNay: 'Today',
      ngayMai: 'Tomorrow',
      homQua: 'Yesterday',
      // "Thursday, Aug 21"
      ngayXa: (nam: number, thang: number, ngay: number) =>
        dinhDangThoiGian(buoiTruaVietNam(nam, thang, ngay), 'en', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
        }),
    },

    loai: {
      MEETING: 'Meeting',
      TASK_DEADLINE: 'Due date',
      EVENT: 'Event',
    },

    moCuocHop: (ten: string) => `Open meeting ${ten}`,
    khongTaiDuoc: 'Couldn’t load your calendar.',
    dangXemDuLieuDaLuu: 'Showing saved data. Reconnect to refresh.',
    trongTieuDe: 'Nothing on your calendar yet',
    trongThan:
      'Your team’s meetings, events and task due dates will show up here, grouped by day.',
  },
);
