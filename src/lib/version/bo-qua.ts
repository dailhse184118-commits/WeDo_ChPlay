import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Khoá kèm số phiên bản, cố ý.
 *
 * Tắt nhắc của 1.0.11 không được làm im luôn 1.0.12 — mỗi bản mới là một lần
 * đáng nhắc lại. Dùng một khoá chung thì người dùng bấm tắt một lần là không
 * bao giờ được nhắc nữa.
 */
function khoa(phienBan: string): string {
  return `wedo.boQuaCapNhat.${phienBan}`;
}

/**
 * Người dùng đã tắt nhắc cho đúng phiên bản này chưa.
 *
 * Bộ nhớ hỏng thì trả `false` — thà nhắc thừa một lần còn hơn im lặng khi đáng
 * lẽ phải nhắc.
 */
export async function daBoQua(phienBan: string): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(khoa(phienBan))) === '1';
  } catch {
    return false;
  }
}

/** Ghi nhớ rằng người dùng đã tắt nhắc cho phiên bản này. */
export async function ghiNhoBoQua(phienBan: string): Promise<void> {
  try {
    await AsyncStorage.setItem(khoa(phienBan), '1');
  } catch {
    // Không ghi được thì lần mở sau sẽ nhắc lại. Phiền, nhưng không hỏng gì.
  }
}
