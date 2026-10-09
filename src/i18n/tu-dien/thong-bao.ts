import { khaiBaoTuDien, soNhieu } from '../dich';

/**
 * Tab Thông báo, dòng thông báo và lời nhắc đặt lịch cục bộ.
 *
 * Tiêu đề và nội dung thông báo do MÁY CHỦ gửi đã đúng ngôn ngữ người nhận
 * (máy chủ lo), app hiện nguyên văn. Ở đây chỉ có phần chữ của app.
 */
export const tuDienThongBao = khaiBaoTuDien(
  {
    tieuDe: 'Thông báo',
    chuaDoc: (so: number) => `${so} thông báo chưa đọc`,
    daDocHet: 'Bạn đã đọc hết',
    docHet: 'Đọc hết',
    khongTai: 'Không tải được thông báo.',
    nhacTieuDe: 'Nhắc bạn trước khi việc đến hạn',
    nhacNoiDung:
      'Cho phép WeDo gửi thông báo để nhắc trước hạn chót 24 giờ và đúng lúc đến hạn. Bạn tắt lại bất cứ lúc nào trong phần Cài đặt thông báo.',
    deSau: 'Để sau',
    batThongBao: 'Bật thông báo',
    trongTieuDe: 'Chưa có thông báo nào',
    trongNoiDung:
      'Bạn sẽ nhận thông báo khi có người giao việc, khi việc được nhận hoặc bị từ chối, và khi việc sắp đến hạn.',

    // Dòng thông báo
    vuaXong: 'Vừa xong',
    phutTruoc: (so: number) => `${so} phút trước`,
    gioTruoc: (so: number) => `${so} giờ trước`,
    homQua: 'Hôm qua',

    // Lời nhắc đặt lịch trên máy (scheduler)
    sapDenHan: 'Sắp đến hạn',
    denHanSau24Gio: (ten: string) => `"${ten}" đến hạn sau 24 giờ nữa.`,
    denHanHomNay: 'Đến hạn hôm nay',
    denHanBayGio: (ten: string) => `"${ten}" đến hạn bây giờ.`,

    // Android: tên kênh thông báo trong Cài đặt hệ thống
    kenhChung: 'Thông báo chung',
  },
  {
    tieuDe: 'Notifications',
    chuaDoc: (so: number) => soNhieu('en', so, { mot: '{so} unread notification', nhieu: '{so} unread notifications' }),
    daDocHet: 'You’re all caught up',
    docHet: 'Mark all read',
    khongTai: 'Couldn’t load notifications.',
    nhacTieuDe: 'Get a reminder before tasks are due',
    nhacNoiDung:
      'Allow WeDo to send notifications to remind you 24 hours before a deadline and right when it’s due. You can turn this off anytime in Notification settings.',
    deSau: 'Later',
    batThongBao: 'Turn on notifications',
    trongTieuDe: 'No notifications yet',
    trongNoiDung:
      'You’ll get a notification when someone assigns you a task, when a task is accepted or declined, and when a task is almost due.',

    vuaXong: 'Just now',
    phutTruoc: (so: number) => `${so} min ago`,
    gioTruoc: (so: number) => `${so} hr ago`,
    homQua: 'Yesterday',

    sapDenHan: 'Due soon',
    denHanSau24Gio: (ten: string) => `"${ten}" is due in 24 hours.`,
    denHanHomNay: 'Due today',
    denHanBayGio: (ten: string) => `"${ten}" is due now.`,

    kenhChung: 'General notifications',
  },
);
