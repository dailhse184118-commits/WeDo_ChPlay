import { khaiBaoTuDien } from '../dich';

/**
 * Câu lỗi mà lớp mạng (lib/api) tự ném ra.
 *
 * Những câu này được ném ra khi chưa biết sẽ hiện ở đâu, và `i18n/loi.ts` nhận
 * ra chúng theo NGUYÊN VĂN tiếng Việt để dịch lúc hiển thị. Vì vậy lớp mạng
 * luôn ném bản `vi` (`tuDienLoiMang.vi`), còn bản `en` là câu mà `loi.ts` trả ở
 * chế độ tiếng Anh. `__tests__/loi-mang.test.ts` kiểm hai bên luôn khớp nhau:
 * sửa câu ở đây mà quên `loi.ts` là test đỏ.
 */
export const tuDienLoiMang = khaiBaoTuDien(
  {
    mayChuBan: (ma: number) => `Máy chủ đang bận hoặc đang khởi động lại (mã ${ma}). Thử lại sau ít phút.`,
    mayChuTraLoi: (ma: number) => `Máy chủ trả lỗi ${ma}.`,
    khongKetNoi: 'Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.',
    giaHanLoi: (ma: number) => `Gia hạn phiên đăng nhập lỗi ${ma}.`,
    khongGuiDuocTep: 'Không gửi được tệp. Kiểm tra mạng và thử lại.',
    lyDoTuChoiNgan: 'Lý do từ chối phải có ít nhất 3 ký tự',
    chuaChonTep: 'Hãy chọn ít nhất một tệp để nộp',
    lyDoTraLaiNgan: 'Lý do trả lại phải có ít nhất 3 ký tự',
  },
  {
    mayChuBan: (ma: number) => `The server is busy or restarting (code ${ma}). Please try again in a few minutes.`,
    mayChuTraLoi: (ma: number) => `The server returned an error (code ${ma}).`,
    khongKetNoi: 'Can’t reach the server. Check your connection and try again.',
    giaHanLoi: (ma: number) => `Couldn’t renew your session (code ${ma}).`,
    khongGuiDuocTep: 'Couldn’t upload the file. Check your connection and try again.',
    lyDoTuChoiNgan: 'The reason must be at least 3 characters',
    chuaChonTep: 'Choose at least one file to submit',
    lyDoTraLaiNgan: 'The reason must be at least 3 characters',
  },
);
