/**
 * Danh sách cho phép của `kiem-chuoi-chua-dich.ts`: những chữ tiếng Việt CỐ Ý
 * để nguyên trong mã, không đưa vào từ điển. Mỗi mục phải ghi lý do.
 *
 * Chỉ thêm vào đây khi chữ đó đúng là giống nhau ở cả hai ngôn ngữ (tên riêng,
 * dữ liệu mẫu chỉ là tên người) hoặc không phải chữ hiển thị. Chữ người dùng
 * đọc được thì đưa vào src/i18n/tu-dien, đừng thêm vào đây.
 */

/** Tệp bỏ qua hẳn. Đường dẫn tính từ gốc dự án, dùng dấu `/`. */
export const TEP_BO_QUA: ReadonlyArray<{ tep: string; lyDo: string }> = [];

/** Chuỗi được phép trong một tệp cụ thể. So khớp nguyên văn (đã chuẩn hoá NFC, bỏ khoảng trắng hai đầu). */
export const CHUOI_DUOC_PHEP: ReadonlyArray<{ tep: string; chuoi: string; lyDo: string }> = [
  { tep: 'src/i18n/ngon-ngu.ts', chuoi: 'Tiếng Việt', lyDo: 'Tên ngôn ngữ viết bằng chính ngôn ngữ đó (endonym), giống nhau ở cả hai bản.' },
  { tep: 'src/app/(tabs)/account/index.tsx', chuoi: 'Ngôn ngữ / Language', lyDo: 'Nhãn song ngữ cố ý: người đang đọc nhầm ngôn ngữ vẫn tìm thấy hàng đổi ngôn ngữ.' },
  { tep: 'src/i18n/dinh-dang.ts', chuoi: 'VNĐ', lyDo: 'Đơn vị tiền của bản tiếng Việt; bản tiếng Anh ghi VND trong cùng hàm.' },
  { tep: 'src/i18n/dinh-dang.ts', chuoi: 'đ', lyDo: 'Đơn vị tiền mặc định của bản tiếng Việt; bản tiếng Anh ghi VND trong cùng hàm.' },
  { tep: 'src/i18n/loi.ts', chuoi: 'Bạn không thể kết bạn với người này.', lyDo: 'Câu gốc tiếng Việt do máy chủ trả về, dùng để nhận diện lỗi; bản tiếng Anh dịch ngay trong loi.ts.' },
  { tep: 'src/lib/auth/auth-context.tsx', chuoi: 'useAuth phải được dùng bên trong AuthProvider', lyDo: 'Lỗi lập trình viên (dùng hook sai chỗ), người dùng không bao giờ thấy.' },
];
