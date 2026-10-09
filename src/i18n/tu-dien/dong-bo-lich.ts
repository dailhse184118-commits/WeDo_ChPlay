import { khaiBaoTuDien } from '../dich';

/**
 * Chữ của màn "Đồng bộ lịch" (Tài khoản → Đồng bộ lịch) và của các câu báo lỗi
 * khi tạo, đổi hay tắt link lịch.
 *
 * Link, địa chỉ webcal và tên sản phẩm (Google Calendar, Lịch Apple, Outlook)
 * không phải chữ để dịch.
 */
export const tuDienDongBoLich = khaiBaoTuDien(
  {
    tieuDe: 'Đồng bộ lịch',
    gioiThieu:
      'Hạn chót việc bạn đã nhận, cuộc họp và sự kiện của bạn trên WeDo tự hiện trong Google Calendar, Lịch Apple hoặc Outlook, và tự cập nhật.',
    thuLai: 'Thử lại',
    tinhNangGoiPro: 'Tính năng của gói Pro và Team.',
    tatDongBo: 'Tắt đồng bộ',
    taoLinkDongBo: 'Tạo link đồng bộ',
    taoLinkMoi: 'Tạo link mới',

    linkCuaBan: {
      tieuDe: 'Link của bạn',
      chiaSe: 'Chia sẻ link',
      tieuDeChiaSe: 'Link lịch WeDo',
      canhBao:
        'Ai có link này đều xem được lịch của bạn. Chỉ gửi cho chính bạn; lỡ gửi nhầm thì bấm Tạo link mới.',
    },

    themVaoLich: {
      tieuDe: 'Thêm vào lịch',
      googleTieuDe: 'Google Calendar',
      googleBuoc:
        'Ứng dụng Google Calendar trên điện thoại không thêm được lịch bằng link. Chia sẻ link sang máy tính, mở calendar.google.com, chọn “Thêm lịch → Từ URL” rồi dán link. Sau đó lịch tự hiện cả trên điện thoại.',
      appleTieuDe: 'Lịch Apple (máy Mac, iPhone)',
      appleBuoc: 'Gửi link sang máy đó rồi mở link webcal dưới đây, chọn Đăng ký:',
      outlookTieuDe: 'Outlook',
      outlookBuoc: 'Trên outlook.com, chọn “Thêm lịch → Đăng ký từ web” rồi dán link.',
      tanSuat: 'Google cập nhật lịch vài giờ một lần; Lịch Apple và Outlook khoảng mỗi giờ.',
    },

    lanCuoi: (gio: string) => `Lần cuối lịch của bạn lấy dữ liệu: ${gio}`,
    chuaLayLanNao: 'Chưa có ứng dụng lịch nào lấy dữ liệu từ link này.',

    hoiTaoLinkMoi: {
      tieuDe: 'Tạo link mới?',
      noiDung:
        'Link đang dùng sẽ ngừng chạy ngay. Lịch nào đã thêm link cũ sẽ không cập nhật nữa, bạn phải thêm lại bằng link mới.',
      huy: 'Huỷ',
      xacNhan: 'Tạo link mới',
    },
    hoiTatDongBo: {
      tieuDe: 'Tắt đồng bộ lịch?',
      noiDung:
        'Link sẽ ngừng chạy ngay. Lịch đã thêm không nhận thêm thay đổi nào từ WeDo; bạn có thể xoá lịch đó trong ứng dụng lịch.',
      huy: 'Huỷ',
      xacNhan: 'Tắt đồng bộ',
    },

    // Câu báo lỗi (lib/api/dong-bo-lich.ts)
    loi: {
      khongCoTrongGoi:
        'Gói hiện tại của bạn không có đồng bộ lịch. Tính năng này dành cho gói Pro và Team.',
      quaNhanh: 'Bạn thao tác quá nhanh. Đợi một phút rồi thử lại.',
      chung: 'Chưa làm được lúc này. Thử lại sau ít phút.',
    },
  },
  {
    tieuDe: 'Calendar sync',
    gioiThieu:
      'The deadlines of tasks you’ve accepted, plus your meetings and events in WeDo, show up in Google Calendar, Apple Calendar or Outlook and stay up to date.',
    thuLai: 'Try again',
    tinhNangGoiPro: 'Calendar sync is part of the Pro and Team plans.',
    tatDongBo: 'Turn off sync',
    taoLinkDongBo: 'Create sync link',
    taoLinkMoi: 'Create a new link',

    linkCuaBan: {
      tieuDe: 'Your link',
      chiaSe: 'Share link',
      tieuDeChiaSe: 'WeDo calendar link',
      canhBao:
        'Anyone with this link can see your calendar. Only send it to yourself. If you shared it by mistake, tap Create a new link.',
    },

    themVaoLich: {
      tieuDe: 'Add to your calendar',
      googleTieuDe: 'Google Calendar',
      googleBuoc:
        'The Google Calendar app on your phone can’t add a calendar from a link. Share the link to a computer, open calendar.google.com, choose “Add calendar → From URL” and paste the link. The calendar then shows up on your phone too.',
      appleTieuDe: 'Apple Calendar (Mac, iPhone)',
      appleBuoc: 'Send the link to that device, then open the webcal link below and choose Subscribe:',
      outlookTieuDe: 'Outlook',
      outlookBuoc: 'On outlook.com, choose “Add calendar → Subscribe from web” and paste the link.',
      tanSuat:
        'Google refreshes the calendar every few hours. Apple Calendar and Outlook refresh about once an hour.',
    },

    lanCuoi: (gio: string) => `Your calendar last fetched data: ${gio}`,
    chuaLayLanNao: 'No calendar app has fetched data from this link yet.',

    hoiTaoLinkMoi: {
      tieuDe: 'Create a new link?',
      noiDung:
        'Your current link stops working right away. Any calendar that uses the old link will stop updating, and you’ll need to add it again with the new link.',
      huy: 'Cancel',
      xacNhan: 'Create a new link',
    },
    hoiTatDongBo: {
      tieuDe: 'Turn off calendar sync?',
      noiDung:
        'The link stops working right away. Calendars you’ve added won’t get any more changes from WeDo. You can delete them in your calendar app.',
      huy: 'Cancel',
      xacNhan: 'Turn off sync',
    },

    loi: {
      khongCoTrongGoi:
        'Your current plan doesn’t include calendar sync. It’s part of the Pro and Team plans.',
      quaNhanh: 'You’re going too fast. Wait a minute and try again.',
      chung: 'Couldn’t do that right now. Please try again in a few minutes.',
    },
  },
);
