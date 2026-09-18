import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/**
 * Cạnh ảnh đại diện sau khi thu nhỏ.
 *
 * Chỗ hiện lớn nhất trong app là thẻ danh tính màn Tài khoản, 80dp. Ở mật độ
 * 3x thì 240 điểm ảnh là vừa khít, lấy 256 cho chẵn.
 */
export const CANH_ANH_DAI_DIEN = 256;

/** Đủ nét cho một vòng tròn nhỏ, mà vẫn giữ chuỗi base64 ở mức vài chục KB. */
const CHAT_LUONG = 0.7;

/**
 * Chọn ảnh đại diện mới, trả về chuỗi `data:` gửi thẳng vào `avatarUrl`.
 *
 * Máy chủ KHÔNG có đường nhận tệp cho ảnh đại diện — `PATCH /users/me` chỉ nhận
 * `avatarUrl` là một chuỗi, và web đang nhét thẳng base64 vào đó. Làm giống vậy
 * để hai bên đọc được ảnh của nhau.
 *
 * Nhưng KHÔNG bê nguyên cách của web. `avatarUrl` được trả kèm MỖI tin nhắn
 * trong hội thoại. Web cho tới 2MB; một ảnh như thế nhân bốn mươi tin là hàng
 * chục MB dữ liệu di động mỗi lần mở hội thoại. Nên phải thu về
 * `CANH_ANH_DAI_DIEN` trước khi mã hoá — còn chừng hai chục KB.
 *
 * Trả `null` khi người dùng bấm huỷ: huỷ không phải lỗi.
 */
export async function chonAnhDaiDien(): Promise<string | null> {
  const ketQua = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Cắt vuông ngay trong trình chọn: ảnh đại diện luôn hiện trong vòng tròn,
    // để người dùng tự chọn phần nào nằm trong khung là đúng hơn máy tự đoán.
    allowsEditing: true,
    aspect: [1, 1],
  });

  if (ketQua.canceled || !ketQua.assets?.[0]) return null;

  const khung = ImageManipulator.manipulate(ketQua.assets[0].uri);
  khung.resize({ width: CANH_ANH_DAI_DIEN, height: CANH_ANH_DAI_DIEN });

  const anh = await khung.renderAsync();
  const daLuu = await anh.saveAsync({
    format: SaveFormat.JPEG,
    compress: CHAT_LUONG,
    base64: true,
  });

  /*
    Thiếu base64 thì dựng ra chuỗi "data:image/jpeg;base64,undefined" — một giá
    trị trông hợp lệ, lưu được vào cơ sở dữ liệu, mà không bao giờ dựng được
    thành ảnh. Thà hỏng ngay ở đây.
  */
  if (!daLuu.base64) {
    throw new Error('Không đọc được ảnh vừa chọn. Thử lại với ảnh khác nhé.');
  }

  return `data:image/jpeg;base64,${daLuu.base64}`;
}
