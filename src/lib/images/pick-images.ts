import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

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

/**
 * Câu báo khi máy ảnh chưa được cấp quyền.
 *
 * Không chỉ đường kiểu "Cài đặt > Ứng dụng > WeDo > Quyền": đường đó chỉ có
 * trên Android, iPhone đi lối khác. Nút "Mở Cài đặt" đi kèm mở thẳng trang cài
 * đặt của WeDo trên cả hai.
 */
export const CAU_CHUA_CO_QUYEN_MAY_ANH =
  'WeDo chưa được phép dùng máy ảnh. Bạn có thể bật lại trong Cài đặt của điện thoại.';

/** Đuôi tên của ảnh HEIC/HEIF — dạng mặc định của máy ảnh iPhone. */
const DUOI_HEIC = /\.(heic|heif)$/i;

function doiSangMB(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(0);
}

/**
 * Ảnh này có phải nén lại sang JPEG trước khi gửi không.
 *
 * Máy chủ chỉ nhận jpeg, png, webp, gif — web và Android cũng chỉ hiện được
 * chừng đó. iPhone lưu ảnh dạng HEIC, gửi nguyên là máy chủ trả 400 "File không
 * hợp lệ". Nên:
 *
 * - HEIC/HEIF, nhận ra qua kiểu hoặc đuôi tên: nén lại, trên mọi nền tảng.
 * - Trên iPhone, mọi ảnh không phải jpeg hay png: nén lại luôn. Bộ chọn ảnh của
 *   iOS có lúc bỏ trống kiểu; đoán bừa là JPEG thì ảnh HEIC lọt qua.
 *
 * Android giữ nguyên như cũ cho mọi ảnh khác: thiếu kiểu thì coi như JPEG.
 */
export function canDoiSangJpeg(anh: ImagePicker.ImagePickerAsset): boolean {
  const kieu = (anh.mimeType ?? '').toLowerCase();
  if (kieu === 'image/heic' || kieu === 'image/heif') return true;
  if (DUOI_HEIC.test(anh.fileName ?? '') || DUOI_HEIC.test(anh.uri)) return true;

  if (Platform.OS === 'ios') {
    return kieu !== 'image/jpeg' && kieu !== 'image/jpg' && kieu !== 'image/png';
  }
  return false;
}

/** "IMG_0001.HEIC" → "IMG_0001.jpg". Không có tên thì đặt tên chung. */
function tenJpeg(ten: string | null | undefined): string {
  const goc = ten?.trim();
  if (!goc) return 'anh.jpg';
  return `${goc.replace(/\.[^./]+$/, '')}.jpg`;
}

/**
 * Nén một ảnh sang JPEG bằng `expo-image-manipulator`.
 *
 * Bộ giải mã của iOS đọc được HEIC, nên chỉ cần dựng lại rồi lưu ra JPEG ở cùng
 * chất lượng với ảnh gửi thường. Hỏng thì nói rõ ảnh nào, đừng gửi nguyên bản
 * HEIC để máy chủ trả một câu lỗi khó hiểu.
 */
async function nenSangJpeg(anh: ImagePicker.ImagePickerAsset): Promise<TepChon> {
  try {
    const daDung = await ImageManipulator.manipulate(anh.uri).renderAsync();
    const daLuu = await daDung.saveAsync({ format: SaveFormat.JPEG, compress: CHAT_LUONG });

    return { uri: daLuu.uri, name: tenJpeg(anh.fileName), mimeType: 'image/jpeg' };
  } catch {
    throw new Error(`Không đọc được ảnh "${anh.fileName || 'đã chọn'}". Thử lại với ảnh khác nhé.`);
  }
}

/**
 * Đổi một ảnh vừa chọn sang dạng gửi lên được.
 *
 * Android hay trả tên rỗng và đôi khi thiếu cả kiểu. Multer phía máy chủ đòi
 * mỗi phần phải có tên tệp và Content-Type, thiếu là 400.
 */
async function doiSangTep(anh: ImagePicker.ImagePickerAsset): Promise<TepChon> {
  if (canDoiSangJpeg(anh)) return nenSangJpeg(anh);

  return {
    uri: anh.uri,
    name: anh.fileName || 'anh.jpg',
    mimeType: anh.mimeType || 'image/jpeg',
  };
}

/** Đổi lần lượt từng ảnh, giữ đúng thứ tự người dùng đã chọn. */
async function doiCaLoat(danhSach: ImagePicker.ImagePickerAsset[]): Promise<TepChon[]> {
  const ketQua: TepChon[] = [];
  for (const anh of danhSach) {
    ketQua.push(await doiSangTep(anh));
  }
  return ketQua;
}

function kiemTraDungLuong(danhSach: ImagePicker.ImagePickerAsset[]): void {
  const qua = danhSach.find((anh) => (anh.fileSize ?? 0) > GIOI_HAN_DUNG_LUONG_ANH);
  if (qua) {
    throw new Error(
      `Ảnh "${qua.fileName || 'đã chọn'}" nặng quá ${doiSangMB(GIOI_HAN_DUNG_LUONG_ANH)}MB nên không gửi được.`,
    );
  }
}

/** Báo máy ảnh chưa được cấp quyền, kèm nút mở thẳng trang cài đặt của WeDo. */
function baoChuaCoQuyenMayAnh(): void {
  Alert.alert('Chưa có quyền dùng máy ảnh', CAU_CHUA_CO_QUYEN_MAY_ANH, [
    { text: 'Để sau', style: 'cancel' },
    {
      text: 'Mở Cài đặt',
      onPress: () => {
        Linking.openSettings().catch(() => undefined);
      },
    },
  ]);
}

/**
 * Mở máy ảnh để chụp một tấm gửi ngay.
 *
 * Trả mảng rỗng khi người dùng bấm huỷ — huỷ không phải lỗi. Bị từ chối quyền
 * thì hiện hộp thoại nói rõ vì sao máy ảnh không mở, kèm nút "Mở Cài đặt", rồi
 * cũng trả rỗng. Im lặng thì thành một nút bấm mãi không có phản ứng gì.
 */
export async function chupAnh(): Promise<TepChon[]> {
  const quyen = await ImagePicker.requestCameraPermissionsAsync();
  if (!quyen.granted) {
    baoChuaCoQuyenMayAnh();
    return [];
  }

  const ketQua = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: CHAT_LUONG,
  });

  if (ketQua.canceled || !ketQua.assets) return [];

  kiemTraDungLuong(ketQua.assets);
  return doiCaLoat(ketQua.assets);
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
    // Chỉ iOS đọc tuỳ chọn này: nhờ bộ chọn ảnh tự đổi HEIC sang JPEG. Chưa thử
    // trên máy thật, nên `doiSangTep` vẫn nén lại phòng hờ.
    preferredAssetRepresentationMode:
      ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });

  if (ketQua.canceled || !ketQua.assets) return [];

  kiemTraDungLuong(ketQua.assets);
  return doiCaLoat(ketQua.assets);
}
