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
  { tep: 'src/lib/api/client.ts', chuoi: "Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.", lyDo: "Thông báo lỗi cấu hình bản dựng sai (biến môi trường thiếu hoặc sai); bản phát hành không bao giờ được mang lỗi này, nên không cần dịch." },
  { tep: 'src/lib/api/client.ts', chuoi: "EXPO_PUBLIC_API_BASE_URL phải bắt đầu bằng http:// hoặc https://, đang là \"${url}\".", lyDo: "Thông báo lỗi cấu hình bản dựng sai (biến môi trường thiếu hoặc sai); bản phát hành không bao giờ được mang lỗi này, nên không cần dịch." },
  { tep: 'src/lib/socket.ts', chuoi: "Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.", lyDo: "Lỗi cấu hình lúc dựng bản (thiếu biến môi trường), chỉ lập trình viên gặp." },
  { tep: 'src/lib/web-link.ts', chuoi: "Thiếu EXPO_PUBLIC_WEB_URL. Kiểm tra file .env.", lyDo: "Lỗi cấu hình lúc dựng bản (thiếu biến môi trường), chỉ lập trình viên gặp; giao diện ẩn nút bằng coWeb() trước khi tới đây." },
  { tep: 'src/lib/web-link.ts', chuoi: "Đường dẫn \"${duongDan}\" dính tới thanh toán. App Android không được dẫn", lyDo: "Lỗi lập trình viên: chốt chặn chính sách Google Play, người dùng không bao giờ bấm tới đường dẫn bị cấm; có test canh câu này." },
  { tep: 'src/lib/web-link.ts', chuoi: "người dùng ra ngoài để mua hàng hoá số — xem chính sách Google Play.", lyDo: "Nửa sau của câu lỗi lập trình viên ở trên (chuỗi nối), cùng lý do." },
  { tep: 'src/lib/web-link.ts', chuoi: "Đường dẫn \"${duongDan}\" không nằm trong danh sách trang được mở từ app.", lyDo: "Lỗi lập trình viên: đường dẫn ngoài TRANG_DUOC_MO, người dùng không bao giờ thấy; có test canh câu này." },
  { tep: 'src/lib/web-link.ts', chuoi: "Màn ứng dụng web nào cũng có lối sang trang mua — xem `TRANG_DUOC_MO`.", lyDo: "Nửa sau của câu lỗi lập trình viên ở trên (chuỗi nối), cùng lý do." },
  { tep: 'src/lib/socket/socket-context.tsx', chuoi: "useSocket phải được dùng bên trong SocketProvider", lyDo: "Lỗi lập trình viên (dùng hook sai chỗ), người dùng không bao giờ thấy; cùng loại với mục auth-context." },
  { tep: 'src/lib/workspace/workspace-context.tsx', chuoi: "useWorkspace phải được dùng bên trong WorkspaceProvider", lyDo: "Lỗi lập trình viên (dùng hook sai chỗ), người dùng không bao giờ thấy; cùng loại với mục auth-context." },
];
