import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

/** Ngôn ngữ hiển thị của app. Lựa chọn của người dùng thêm 'he-thong' = theo ngôn ngữ máy. */
export type NgonNgu = 'vi' | 'en';
export type LuaChonNgonNgu = 'he-thong' | NgonNgu;
export const KHOA_LUA_CHON = 'wedo:ngon-ngu-chon';
export const MA_VUNG: Record<NgonNgu, string> = { vi: 'vi-VN', en: 'en-US' };
/** Tên viết bằng chính ngôn ngữ đó. */
export const TEN_NGON_NGU: Record<NgonNgu, string> = { vi: 'Tiếng Việt', en: 'English' };

export function laLuaChon(v: unknown): v is LuaChonNgonNgu {
  return v === 'he-thong' || v === 'vi' || v === 'en';
}
/** Máy dùng tiếng Việt thì tiếng Việt; mọi ngôn ngữ khác (và không đọc được) là tiếng Anh. */
export function ngonNguTheoMay(ma: string | null | undefined): NgonNgu {
  return (ma ?? '').trim().toLowerCase().startsWith('vi') ? 'vi' : 'en';
}
function maMay(): string | null {
  try {
    return getLocales()[0]?.languageCode ?? null;
  } catch {
    return null;
  }
}

let luaChon: LuaChonNgonNgu = 'he-thong';
let hienTai: NgonNgu | null = null;
const nguoiNghe = new Set<() => void>();

function tinh(): NgonNgu {
  return luaChon === 'he-thong' ? ngonNguTheoMay(maMay()) : luaChon;
}
function capNhat() {
  const moi = tinh();
  if (moi === hienTai) return;
  hienTai = moi;
  for (const nghe of [...nguoiNghe]) nghe();
}

export function layNgonNgu(): NgonNgu {
  if (hienTai === null) hienTai = tinh();
  return hienTai;
}
export function layLuaChon(): LuaChonNgonNgu {
  return luaChon;
}
/** Đọc lựa chọn đã lưu lúc mở app. Kho hỏng thì theo máy. */
export async function napLuaChonDaLuu(): Promise<void> {
  try {
    const v = await AsyncStorage.getItem(KHOA_LUA_CHON);
    luaChon = laLuaChon(v) ? v : 'he-thong';
  } catch {
    luaChon = 'he-thong';
  }
  capNhat();
}
export async function datLuaChon(l: LuaChonNgonNgu): Promise<void> {
  luaChon = l;
  capNhat();
  try {
    await AsyncStorage.setItem(KHOA_LUA_CHON, l);
  } catch {
    // Không lưu được thì vẫn đổi cho phiên này.
  }
}
/** Gọi khi app trở lại foreground: người dùng có thể vừa đổi ngôn ngữ máy. */
export function docLaiNgonNguMay() {
  capNhat();
}
export function dangKyNgonNgu(nghe: () => void): () => void {
  nguoiNghe.add(nghe);
  return () => {
    nguoiNghe.delete(nghe);
  };
}
/** Chỉ cho kiểm thử. `null` = tính lại từ lựa chọn hiện tại. */
export function datNgonNguChoKiemThu(n: NgonNgu | null) {
  if (n === null) {
    luaChon = 'he-thong';
    hienTai = null;
  } else {
    luaChon = n;
    hienTai = n;
  }
  for (const nghe of [...nguoiNghe]) nghe();
}
