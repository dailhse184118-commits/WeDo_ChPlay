import { khaiBaoTuDien } from '../dich';

/**
 * Chữ của báo cáo và chặn: bảng thao tác (nhấn giữ tin nhắn, dấu ba chấm cạnh
 * người), phiếu báo cáo và hộp thoại xác nhận chặn.
 *
 * Điều khoản sử dụng hứa với người dùng đúng những lời này, và reviewer của
 * Apple đọc chúng khi thử luồng báo cáo. Để rải trong từng màn thì sớm muộn hai
 * màn sẽ nói hai kiểu.
 *
 * Đường dẫn bỏ chặn ("Tài khoản → Người đã chặn") không viết cứng ở đây: nó được
 * ghép từ từ điển Tài khoản (xem lib/moderation/noi-dung.ts) để luôn khớp tên
 * hàng và tên màn thật ở mỗi ngôn ngữ.
 */
export const tuDienKiemDuyet = khaiBaoTuDien(
  {
    // Bảng thao tác
    baoCaoNguoi: 'Báo cáo người này',
    baoCaoTin: 'Báo cáo tin nhắn',
    chanNguoi: 'Chặn người này',

    // Lý do báo cáo, theo thứ tự hiện trên phiếu ("Lý do khác" luôn nằm cuối)
    lyDo: {
      SPAM: 'Spam, quảng cáo',
      HARASSMENT: 'Quấy rối, bắt nạt',
      HATE: 'Thù ghét, phân biệt đối xử',
      SEXUAL: 'Nội dung tình dục',
      VIOLENCE: 'Bạo lực, đe doạ',
      OTHER: 'Lý do khác',
    },

    // Phiếu báo cáo
    baoCaoTen: (ten: string) => `Báo cáo ${ten}`,
    baoCaoNguoiDung: 'Báo cáo người dùng',
    cauHoiNguoi: 'Vì sao bạn báo cáo người này?',
    cauHoiTin: 'Vì sao bạn báo cáo tin nhắn này?',
    daGui: 'Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.',
    // Máy chủ giới hạn 30 báo cáo mỗi người mỗi 24 giờ. Nói thẳng là phải đợi, đừng
    // để người dùng tưởng app hỏng rồi bấm gửi lại mãi.
    quaNhieuBaoCao: 'Bạn đã gửi nhiều báo cáo trong 24 giờ qua. Vui lòng thử lại sau.',
    chuaGuiDuoc: 'Chưa gửi được báo cáo. Thử lại sau.',
    ghiChuThem: 'Ghi chú thêm (không bắt buộc)',
    ghiChuNhan: 'Ghi chú thêm cho báo cáo',
    moTaNgan: 'Mô tả ngắn điều bạn thấy không ổn',
    guiBaoCao: 'Gửi báo cáo',

    // Hộp thoại xác nhận chặn
    tieuDeChan: (ten: string) => `Chặn ${ten}?`,
    nguoiNay: 'người này',
    noiDungChan: (duongBoChan: string) =>
      `Bạn sẽ không thấy tin nhắn của người này nữa, và hai người không thể nhắn tin riêng hay kết bạn với nhau. Bạn có thể bỏ chặn trong ${duongBoChan}.`,
    chan: 'Chặn',
    chuaChanDuoc: 'Chưa chặn được',
    coLoi: 'Có lỗi xảy ra. Thử lại sau.',
  },
  {
    // Bảng thao tác
    baoCaoNguoi: 'Report this person',
    baoCaoTin: 'Report message',
    chanNguoi: 'Block this person',

    lyDo: {
      SPAM: 'Spam or ads',
      HARASSMENT: 'Harassment or bullying',
      HATE: 'Hate or discrimination',
      SEXUAL: 'Sexual content',
      VIOLENCE: 'Violence or threats',
      OTHER: 'Another reason',
    },

    // Phiếu báo cáo
    baoCaoTen: (ten: string) => `Report ${ten}`,
    baoCaoNguoiDung: 'Report user',
    cauHoiNguoi: 'Why are you reporting this person?',
    cauHoiTin: 'Why are you reporting this message?',
    daGui: 'Report sent. WeDo will review it within 24 hours.',
    quaNhieuBaoCao: 'You’ve sent a lot of reports in the past 24 hours. Please try again later.',
    chuaGuiDuoc: 'Couldn’t send the report. Try again later.',
    ghiChuThem: 'Extra notes (optional)',
    ghiChuNhan: 'Extra notes for the report',
    moTaNgan: 'Briefly describe what concerns you',
    guiBaoCao: 'Send report',

    // Hộp thoại xác nhận chặn
    tieuDeChan: (ten: string) => `Block ${ten}?`,
    nguoiNay: 'this person',
    noiDungChan: (duongBoChan: string) =>
      `You won’t see this person’s messages anymore, and neither of you can send direct messages or friend requests. You can unblock them in ${duongBoChan}.`,
    chan: 'Block',
    chuaChanDuoc: 'Couldn’t block',
    coLoi: 'Something went wrong. Try again later.',
  },
);
