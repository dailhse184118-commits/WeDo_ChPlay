import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { theoNgonNgu } from '../../i18n/dich';
import { LoiDaDich } from '../../i18n/loi';
import { tuDienDangNhap } from '../../i18n/tu-dien/dang-nhap';
import type { DangNhapAppleInput } from '../api/auth';
import { sha256Hex } from './sha256';

/*
  Sign in with Apple — chỉ có trên iPhone.

  Bắt buộc từ khi bản iPhone có đăng nhập Google: app nào trên iOS cho đăng nhập
  bằng tài khoản bên thứ ba thì phải cho cả đăng nhập bằng Apple (Guideline 4.8).
  Android không có nút này.
*/

/**
 * Máy này có đăng nhập bằng Apple hay không.
 *
 * Hỏi hệ điều hành chứ không chỉ nhìn `Platform.OS`: Apple chỉ cho vẽ nút khi
 * `isAvailableAsync()` trả `true`. Lỗi gì cũng coi là không có — thiếu một nút
 * còn hơn một nút bấm vào là hỏng.
 */
export async function coDangNhapApple(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * `coDangNhapApple` dạng hook cho màn hình. Bắt đầu bằng `false` — nút hiện ra
 * ngay khi hệ điều hành trả lời, thường trước cả khi người dùng kịp nhìn.
 */
export function useCoDangNhapApple(): boolean {
  const [co, setCo] = useState(false);

  useEffect(() => {
    let daRoi = false;
    void coDangNhapApple().then((ketQua) => {
      if (!daRoi) setCo(ketQua);
    });
    return () => {
      daRoi = true;
    };
  }, []);

  return co;
}

function thanhHex(byte: ArrayLike<number>): string {
  return Array.from(byte, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Nonce gốc: 64 ký tự hex, sinh từ nguồn ngẫu nhiên an toàn của hệ điều hành.
 *
 * App gửi bản băm SHA-256 của nó cho Apple, Apple ghi bản băm vào identity
 * token; app gửi bản GỐC cho máy chủ, máy chủ băm lại và so. Kẻ bắt được token
 * trên đường truyền không có bản gốc nên không dùng lại được token đó.
 *
 * Hermes không có sẵn `crypto.getRandomValues`, nên khi thiếu thì lấy UUID v4
 * native của `expo-modules-core` — trên iPhone là `UUID()` của Foundation, sinh
 * từ bộ sinh số ngẫu nhiên an toàn của hệ thống. Hai UUID cho 244 bit ngẫu
 * nhiên. KHÔNG bao giờ lùi về `Math.random`: nonce đoán được thì vô nghĩa.
 */
export function taoNonceGoc(): string {
  const mayMa = (globalThis as { crypto?: { getRandomValues?: <T extends Uint8Array>(mang: T) => T } })
    .crypto;
  if (typeof mayMa?.getRandomValues === 'function') {
    return thanhHex(mayMa.getRandomValues(new Uint8Array(32)));
  }

  const uuidv4 = (globalThis as { expo?: { uuidv4?: () => string } }).expo?.uuidv4;
  if (typeof uuidv4 === 'function') {
    return (uuidv4() + uuidv4()).replace(/-/g, '');
  }

  throw new LoiDaDich(theoNgonNgu(tuDienDangNhap).appleKhongTaoDuocMa);
}

/** Máy chủ nhận họ tên tối đa 100 ký tự. */
const DO_DAI_HO_TEN_TOI_DA = 100;

/**
 * Ghép họ tên Apple trả về thành một chuỗi, theo thứ tự tiếng Việt: họ, tên
 * đệm, tên — "Lê Hữu Đại" chứ không phải "Đại Lê".
 *
 * Apple chỉ gửi tên ở lần cấp quyền ĐẦU TIÊN, và người dùng có thể từ chối chia
 * sẻ; khi đó trả `undefined` để máy chủ tự đặt tên mặc định. App không hỏi lại
 * tên sau khi đăng nhập bằng Apple — người dùng tự sửa ở màn Tài khoản nếu muốn.
 */
export function ghepHoTenApple(
  ten: AppleAuthentication.AppleAuthenticationFullName | null | undefined,
): string | undefined {
  if (!ten) return undefined;

  const hoTen = [ten.familyName, ten.middleName, ten.givenName]
    .map((phan) => phan?.trim() ?? '')
    .filter((phan) => phan.length > 0)
    .join(' ')
    .slice(0, DO_DAI_HO_TEN_TOI_DA)
    .trim();

  return hoTen || undefined;
}

function maNativeCuaLoi(error: unknown): string | null {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: unknown }).code;
    if (typeof code === 'string') return code;
  }
  return null;
}

/**
 * Mở bảng đăng nhập Apple và gom đủ thứ máy chủ cần cho `POST /auth/apple`.
 *
 * Trả về `null` khi người dùng tự đóng bảng — đó không phải lỗi, màn hình gọi
 * hàm này không được hiện băng đỏ.
 */
export async function layThongTinApple(): Promise<DangNhapAppleInput | null> {
  if (Platform.OS !== 'ios') {
    throw new LoiDaDich(theoNgonNgu(tuDienDangNhap).appleChiCoTrenIphone);
  }

  const nonceGoc = taoNonceGoc();

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: sha256Hex(nonceGoc),
    });
  } catch (error) {
    const ma = maNativeCuaLoi(error);
    if (ma === 'ERR_REQUEST_CANCELED') return null;

    // Giữ mã trong ngoặc: thứ duy nhất lần ra nguyên nhân khi người kiểm thử
    // chụp màn hình gửi về — giống cách làm với Google.
    if (ma) {
      throw new LoiDaDich(theoNgonNgu(tuDienDangNhap).appleKhongThanhCong(ma));
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new LoiDaDich(theoNgonNgu(tuDienDangNhap).appleThieuMa);
  }

  const thongTin: DangNhapAppleInput = {
    identityToken: credential.identityToken,
    nonce: nonceGoc,
  };
  if (credential.authorizationCode) thongTin.authorizationCode = credential.authorizationCode;

  const hoTen = ghepHoTenApple(credential.fullName);
  if (hoTen) thongTin.fullName = hoTen;

  if (credential.email) thongTin.email = credential.email;

  return thongTin;
}
