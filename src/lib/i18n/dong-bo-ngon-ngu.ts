import AsyncStorage from '@react-native-async-storage/async-storage';
import { dangKyNgonNgu, layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { capNhatNgonNgu } from '../api/account';

/** Giá trị ngôn ngữ máy chủ đã nhận, để không gửi trùng. */
export const KHOA_DA_GUI = 'wedo:ngon-ngu-da-gui';

/** Quên giá trị đã gửi (khi đăng xuất: tài khoản kế tiếp trên máy này chưa nhận gì). */
export async function quenNgonNguDaGui(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KHOA_DA_GUI);
  } catch {
    // Không xoá được thì lần đăng nhập sau chỉ có thể bỏ qua một lần gửi.
  }
}

/**
 * Gửi ngôn ngữ hiệu lực lên máy chủ khi đã đăng nhập, ngay lúc gọi và mỗi lần
 * ngôn ngữ đổi. Gửi rồi thì ghi nhớ; lỗi mạng thì không ghi nhớ, nên lần đổi
 * hoặc lần khởi động sau tự thử lại. Trả về hàm huỷ.
 */
export function batDongBoNgonNgu(daDangNhap: () => boolean): () => void {
  let dangGui = false;
  let conSong = true;

  async function gui() {
    if (dangGui || !conSong || !daDangNhap()) return;
    const ngonNgu: NgonNgu = layNgonNgu();
    dangGui = true;
    try {
      let daGui: string | null = null;
      try {
        daGui = await AsyncStorage.getItem(KHOA_DA_GUI);
      } catch {
        daGui = null;
      }
      if (daGui !== ngonNgu) {
        await capNhatNgonNgu(ngonNgu);
        // Đã huỷ (đăng xuất) giữa lúc gửi thì không ghi lại giá trị vừa bị quên.
        if (conSong) {
          try {
            await AsyncStorage.setItem(KHOA_DA_GUI, ngonNgu);
          } catch {
            // Không nhớ được thì lần sau gửi lại, vô hại.
          }
        }
      }
    } catch {
      // Lỗi mạng: không ghi "đã gửi", lần sau thử lại.
    } finally {
      dangGui = false;
    }
    // Ngôn ngữ đổi giữa lúc đang gửi thì gửi tiếp giá trị mới.
    if (conSong && layNgonNgu() !== ngonNgu) void gui();
  }

  const huyNghe = dangKyNgonNgu(() => void gui());
  void gui();
  return () => {
    conSong = false;
    huyNghe();
  };
}
