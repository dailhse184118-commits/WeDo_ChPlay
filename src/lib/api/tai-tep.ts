import { File, UploadType } from 'expo-file-system';

import { ApiError } from './client';
import { loadToken } from '../auth/token-storage';
import type { TepChon } from './tasks';

/**
 * Tải MỘT tệp lên, để tầng native tự đọc tệp và dựng multipart.
 *
 * ===========================================================================
 * ĐỪNG đổi chỗ này về `FormData` + `fetch` hay `XMLHttpRequest`. Cả hai đều đã
 * thử và đều hỏng — người kiểm thử báo ngày 19/09/2026 là không tải được tệp
 * nào, cả ảnh lẫn tài liệu nộp bài.
 *
 * Triệu chứng: trạng thái trả về là **0**, tức yêu cầu chưa bao giờ hoàn tất,
 * và máy chủ không hề ghi nhận lỗi nào. Nhìn y hệt mất sóng, trong khi máy
 * đang dùng wifi.
 *
 * Gốc rễ nằm ở `FormData` của React Native trên Expo SDK 57. Expo vá đối tượng
 * này và thay luôn `fetch` toàn cục; phần chuyển đổi của nó ghi rõ trong mã
 * nguồn — `expo/src/winter/fetch/convertFormData.ts`:
 *
 *     `uri` is not supported for React Native's FormData.
 *
 * Mảnh tệp của React Native chỉ mang `uri`, nên rơi ra `undefined` và thân
 * multipart hỏng. Đổi cách GỬI không cứu được, vì hỏng nằm ở chính DỮ LIỆU.
 *
 * Đường này không đụng tới `FormData`: đưa thẳng đường dẫn cho mã native, nó
 * tự mở tệp và tự dựng multipart.
 * ===========================================================================
 *
 * Giới hạn đã biết: mỗi lượt gọi chỉ gửi được một tệp. Nhiều ảnh thì gọi nhiều
 * lượt, và mỗi ảnh thành một tin nhắn riêng.
 */
export async function taiMotTepLen<T = unknown>(
  duongDan: string,
  tep: TepChon,
  chuThich: string,
): Promise<T> {
  const goc = (process.env.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/+$/, '');
  if (!goc) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  const token = await loadToken();
  const noiDung = chuThich.trim();

  let ketQua: { status: number; body: string };
  try {
    ketQua = await new File(tep.uri).upload(`${goc}${duongDan}`, {
      httpMethod: 'POST',
      uploadType: UploadType.MULTIPART,
      // Máy chủ khai `FilesInterceptor('files', …)`; sai tên trường là mất tệp.
      fieldName: 'files',
      // Trình chọn tệp Android đôi khi trả kiểu rỗng; multer đòi phải có.
      mimeType: tep.mimeType || 'application/octet-stream',
      // KHÔNG đặt Content-Type: thiếu `boundary` thì máy chủ không tách nổi.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      parameters: noiDung ? { content: noiDung } : undefined,
    });
  } catch (loi) {
    throw new ApiError(
      'Không gửi được tệp. Kiểm tra mạng và thử lại.',
      0,
      undefined,
      loi instanceof Error ? `${loi.name}: ${loi.message}` : String(loi),
    );
  }

  const payload = ketQua.body ? (JSON.parse(ketQua.body) as unknown) : undefined;

  /*
    `upload` KHÔNG ném lỗi với mã 4xx/5xx — nó trả về nguyên phản hồi. Không tự
    kiểm thì lỗi máy chủ biến thành "thành công" và tin nhắn lặng lẽ biến mất.
  */
  if (ketQua.status < 200 || ketQua.status >= 300) {
    const message =
      payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : `Máy chủ trả lỗi ${ketQua.status}.`;

    throw new ApiError(message, ketQua.status);
  }

  return payload as T;
}
