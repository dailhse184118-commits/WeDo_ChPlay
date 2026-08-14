import * as DocumentPicker from 'expo-document-picker';

import type { TepChon } from '../api/tasks';

/** `FilesInterceptor('files', 10, …)` phía máy chủ chỉ nhận 10 tệp mỗi lượt. */
export const GIOI_HAN_SO_TEP = 10;

/** `limits.fileSize` phía máy chủ: 20MB cho mỗi tệp. */
export const GIOI_HAN_DUNG_LUONG = 20 * 1024 * 1024;

function doiSangMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0);
}

/**
 * Mở hộp chọn tệp của hệ điều hành.
 *
 * Trả mảng rỗng khi người dùng bấm huỷ — huỷ không phải lỗi, màn hình không
 * cần báo gì cả. Ném lỗi khi lựa chọn vượt giới hạn máy chủ nhận, để người dùng
 * biết ngay thay vì đợi tải xong mới nhận 400.
 */
export async function chonTaiLieu(): Promise<TepChon[]> {
  const ketQua = await DocumentPicker.getDocumentAsync({
    multiple: true,
    /*
      Bắt buộc trên Android: hộp chọn trả uri kiểu content:// chỉ còn hiệu lực
      trong lúc hộp thoại mở. Chép về bộ nhớ tạm rồi mới có tệp đọc được lúc gửi.
    */
    copyToCacheDirectory: true,
  });

  if (ketQua.canceled || !ketQua.assets) return [];

  if (ketQua.assets.length > GIOI_HAN_SO_TEP) {
    throw new Error(`Mỗi lần chỉ nộp được tối đa ${GIOI_HAN_SO_TEP} tệp.`);
  }

  const qua = ketQua.assets.find((tep) => (tep.size ?? 0) > GIOI_HAN_DUNG_LUONG);
  if (qua) {
    throw new Error(
      `Tệp "${qua.name || 'đã chọn'}" nặng quá ${doiSangMB(GIOI_HAN_DUNG_LUONG)}MB nên không nộp được.`,
    );
  }

  return ketQua.assets.map((tep) => ({
    uri: tep.uri,
    // Vài nguồn trên Android trả tên rỗng; máy chủ vẫn cần một tên có nghĩa.
    name: tep.name || 'tai-lieu',
    mimeType: tep.mimeType,
  }));
}
