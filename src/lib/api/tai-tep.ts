import { File, UploadType } from 'expo-file-system';

import { ApiError, apiRequest, baseUrl } from './client';
import { loadToken } from '../auth/token-storage';
import type { TepChon } from './tasks';

function moTaLoi(loi: unknown): string {
  return loi instanceof Error ? `${loi.name}: ${loi.message}` : String(loi);
}

/**
 * Dựng phần tệp đúng dạng bộ chuyển `FormData` của Expo chấp nhận.
 *
 * ===========================================================================
 * ĐỪNG quay lại dạng `{ uri, name, type }` của React Native. Đó chính là lỗi
 * người kiểm thử báo ngày 19/09/2026: không ai tải được tệp nào, cả ảnh lẫn
 * tài liệu nộp bài, mà máy chủ không hề ghi nhận gì.
 *
 * Trên Expo SDK 57, Expo thay `fetch` toàn cục và tự chuyển `FormData` thành
 * thân multipart. Bộ chuyển (`expo/src/winter/fetch/convertFormData.ts`) chỉ
 * nhận ba dạng phần: chuỗi, `Blob`, hoặc object có `bytes()`. Bộ ba
 * `{ uri, name, type }` không khớp dạng nào nên nó ném thẳng
 * `Unsupported FormDataPart implementation` — yêu cầu chết trước khi rời máy,
 * nên trạng thái trả về là 0 và máy chủ im lặng.
 *
 * Dạng dưới đây khớp nhánh thứ ba. Tự dựng thay vì đưa thẳng `File` của
 * expo-file-system để giữ ĐÚNG tên tệp người dùng thấy: `File.name` trả tên
 * tệp tạm trong cache, không phải tên gốc.
 * ===========================================================================
 */
export function phanTepGuiLen(tep: TepChon) {
  const tepNative = new File(tep.uri);

  return {
    bytes: () => tepNative.bytes(),
    name: tep.name,
    // Trình chọn tệp Android đôi khi trả kiểu rỗng; multer đòi phải có.
    type: tep.mimeType || 'application/octet-stream',
  };
}

/** Đường dự phòng: để tầng native tự đọc tệp và tự dựng multipart. */
async function guiBangNative<T>(duongDan: string, tep: TepChon, noiDung: string): Promise<T> {
  /*
    Dùng CHUNG `baseUrl()` với mọi lượt gọi khác, không tự ghép địa chỉ nữa.
    Bản trước tự ghép, và tầng native ném
    `IllegalArgumentException: Expected URL scheme 'http' or 'https'` — tức
    chuỗi địa chỉ tới nơi đã hỏng, trong khi cùng lúc đó mọi lượt gọi đi qua
    `apiRequest` vẫn chạy tốt. Một chỗ dựng địa chỉ thì không lệch được nữa.
  */
  const token = await loadToken();
  const ketQua = await new File(tep.uri).upload(`${baseUrl()}${duongDan}`, {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    // Máy chủ khai `FilesInterceptor('files', …)`; sai tên trường là mất tệp.
    fieldName: 'files',
    mimeType: tep.mimeType || 'application/octet-stream',
    // KHÔNG đặt Content-Type: thiếu `boundary` thì máy chủ không tách nổi.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    parameters: noiDung ? { content: noiDung } : undefined,
  });

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

/**
 * Tải MỘT tệp lên, thử lần lượt hai đường.
 *
 * Đường chính đi qua `fetch` — cùng tầng mạng với mọi lượt gọi khác đang chạy
 * tốt. Đường dự phòng đẩy thẳng xuống native, phòng khi tầng `fetch` lại hỏng
 * ở một bản Expo nào đó.
 *
 * Máy chủ TRẢ LỜI rồi mà báo lỗi thì dừng luôn, không thử đường còn lại: yêu
 * cầu đã tới nơi, gửi lại chỉ tạo ra tin nhắn trùng.
 *
 * Giới hạn đã biết: mỗi lượt gọi chỉ gửi được một tệp.
 */
export async function taiMotTepLen<T = unknown>(
  duongDan: string,
  tep: TepChon,
  chuThich: string,
): Promise<T> {
  const noiDung = chuThich.trim();
  const daGap: string[] = [];

  try {
    const form = new FormData();
    form.append('files', phanTepGuiLen(tep) as never);
    if (noiDung) form.append('content', noiDung);

    return await apiRequest<T>(duongDan, { method: 'POST', body: form });
  } catch (loi) {
    if (loi instanceof ApiError && loi.status > 0) throw loi;
    daGap.push(`form: ${loi instanceof ApiError ? loi.nguyenNhan : moTaLoi(loi)}`);
  }

  try {
    return await guiBangNative<T>(duongDan, tep, noiDung);
  } catch (loi) {
    if (loi instanceof ApiError && loi.status > 0) throw loi;
    daGap.push(`native: ${moTaLoi(loi)}`);
  }

  throw new ApiError(
    'Không gửi được tệp. Kiểm tra mạng và thử lại.',
    0,
    undefined,
    daGap.join(' | '),
  );
}
