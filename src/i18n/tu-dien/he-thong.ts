import { khaiBaoTuDien } from '../dich';

/** Chữ của khung app: nhãn thanh tab, màn lỗi, nhắc cập nhật, chọn workspace, mất kết nối. */
export const tuDienHeThong = khaiBaoTuDien(
  {
    tab: {
      troChuyen: 'Trò chuyện',
      congViec: 'Công việc',
      cuocHop: 'Cuộc họp',
      thongBao: 'Thông báo',
      taiKhoan: 'Tài khoản',
    },
    manLoi: {
      tieuDe: 'Màn hình này gặp trục trặc',
      noiDung: 'Phần còn lại của WeDo vẫn dùng được. Thử mở lại, nếu vẫn lỗi thì báo giúp đội ngũ WeDo.',
    },
    capNhat: {
      macDinh: 'Đã có phiên bản mới của WeDo.',
      tieuDe: 'Có bản cập nhật mới',
      capNhat: 'Cập nhật',
      boQuaNhac: 'Bỏ qua nhắc cập nhật này',
      deSau: 'Để sau',
      chanTieuDe: 'Cần cập nhật WeDo',
      chanNoiDung:
        'Phiên bản bạn đang dùng đã quá cũ so với máy chủ nên một số chức năng sẽ không chạy đúng. Cập nhật xong là dùng lại được bình thường.',
      moAppStore: 'Mở App Store để cập nhật',
      moChPlay: 'Mở CH Play để cập nhật',
    },
    khongGian: {
      tieuDe: 'Không gian làm việc',
      taoMoiNhan: 'Tạo không gian làm việc mới',
      taoMoi: 'Tạo không gian mới',
      matKetNoiTieuDe: 'Chưa kết nối được máy chủ',
      matKetNoiNoiDung:
        'Kiểm tra Wi-Fi hoặc dữ liệu di động. Máy chủ cũng có thể đang khởi động lại — WeDo sẽ tự thử lại sau ít giây.',
    },
  },
  {
    tab: {
      troChuyen: 'Chat',
      congViec: 'Tasks',
      cuocHop: 'Meetings',
      thongBao: 'Notifications',
      taiKhoan: 'Account',
    },
    manLoi: {
      tieuDe: 'This screen ran into a problem',
      noiDung: 'The rest of WeDo still works. Try opening it again, and if it keeps failing, please let the WeDo team know.',
    },
    capNhat: {
      macDinh: 'A new version of WeDo is available.',
      tieuDe: 'Update available',
      capNhat: 'Update',
      boQuaNhac: 'Dismiss this update reminder',
      deSau: 'Later',
      chanTieuDe: 'WeDo needs an update',
      chanNoiDung:
        'The version you’re using is too old for our server, so some features won’t work properly. Once you update, everything will work normally again.',
      moAppStore: 'Open the App Store to update',
      moChPlay: 'Open Google Play to update',
    },
    khongGian: {
      tieuDe: 'Workspaces',
      taoMoiNhan: 'Create a new workspace',
      taoMoi: 'New workspace',
      matKetNoiTieuDe: 'Can’t reach the server',
      matKetNoiNoiDung:
        'Check your Wi-Fi or mobile data. The server may also be restarting — WeDo will try again in a few seconds.',
    },
  },
);
