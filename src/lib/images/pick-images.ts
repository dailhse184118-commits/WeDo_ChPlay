import * as ImagePicker from 'expo-image-picker';

import type { TepChon } from '../api/tasks';

/** `FilesInterceptor('files', 5, …)` phía máy chủ chỉ nhận 5 tệp mỗi lượt. */
export const GIOI_HAN_ANH = 5;

/** `limits.fileSize` phía máy chủ: 10MB cho mỗi tệp chat. */
export const GIOI_HAN_DUNG_LUONG_ANH = 10 * 1024 * 1024;

/**
 * Nén còn 70%.
 *
 * Ảnh gốc của điện thoại giờ 4–8MB, gửi nguyên là vừa chạm trần 10MB của máy
 * chủ vừa ngốn dữ liệu di động của cả hai đầu. Ở 70% thì ảnh chụp màn hình hay
 * ảnh bài tập vẫn đọc rõ chữ.
 */
const CHAT_LUONG = 0.7;

function doiSangMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0);
}

/**
 * Đổi một ảnh vừa chọn sang dạng gửi lên được.
 *
 * Android hay trả tên rỗng và đôi khi thiếu cả kiểu. Multer phía máy chủ đòi
 * mỗi phần phải có tên tệp và Content-Type, thiếu là 400.
 */
function doiSangTep(anh: ImagePicker.ImagePickerAsset): TepChon {
  return {
    uri: anh.uri,
    name: anh.fileName || 'anh.jpg',
    mimeType: anh.mimeType || 'image/jpeg',
  };
}

function kiemTraDungLuong(danhSach: ImagePicker.ImagePickerAsset[]): void {
  const qua = danhSach.find((anh) => (anh.fileSize ?? 0) > GIOI_HAN_DUNG_LUONG_ANH);
  if (qua) {
    throw new Error(
      `Ảnh "${qua.fileName || 'đã chọn'}" nặng quá ${doiSangMB(GIOI_HAN_DUNG_LUONG_ANH)}MB nên không gửi được.`,
    );
  }
}

/**
 * Mở máy ảnh để chụp một tấm gửi ngay.
 *
 * Trả mảng rỗng khi người dùng bấm huỷ — huỷ không phải lỗi. Ném lỗi khi bị từ
 * chối quyền, để màn hình nói rõ vì sao máy ảnh không mở; trả rỗng lặng lẽ cho
 * ra một nút bấm mãi không có phản ứng gì.
 */
export async function chupAnh(): Promise<TepChon[]> {
  const quyen = await ImagePicker.requestCameraPermissionsAsync();
  if (!quyen.granted) {
    throw new Error(
      'WeDo chưa được phép dùng máy ảnh. Vào Cài đặt > Ứng dụng > WeDo > Quyền để bật lại.',
    );
  }

  const ketQua = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: CHAT_LUONG,
  });

  if (ketQua.canceled || !ketQua.assets) return [];

  kiemTraDungLuong(ketQua.assets);
  return ketQua.assets.map(doiSangTep);
}

/**
 * Mở thư viện ảnh của máy.
 *
 * KHÔNG gọi `requestMediaLibraryPermissionsAsync`: Android dùng bộ chọn ảnh
 * của hệ thống, người dùng tự chọn đúng ảnh muốn chia sẻ nên không cần quyền
 * nào. Xin thêm là tự rước quyền READ_MEDIA_IMAGES — thứ Google bắt khai báo
 * riêng ("Photo and Video Permissions") khi đưa app lên CH Play.
 */
export async function chonAnh(): Promise<TepChon[]> {
  const ketQua = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: CHAT_LUONG,
    allowsMultipleSelection: true,
    selectionLimit: GIOI_HAN_ANH,
  });

  if (ketQua.canceled || !ketQua.assets) return [];

  kiemTraDungLuong(ketQua.assets);
  return ketQua.assets.map(doiSangTep);
}
