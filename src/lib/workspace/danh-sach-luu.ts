import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Workspace } from '../types';

/*
  Danh sách không gian làm việc lần nạp được gần nhất, ghi xuống máy.

  Danh sách này nằm NGOÀI react-query nên không đi theo cache trên đĩa. Thiếu nó
  thì mở app lúc mất mạng — hay lúc máy chủ đang khởi động lại — là kẹt ở vòng
  quay mãi mãi, dù cache công việc, tin nhắn đã nằm sẵn trên máy chờ được đọc.

  AsyncStorage chứ không phải SecureStore: danh sách có thể dài quá giới hạn
  2 KB của SecureStore, và nó không nhạy cảm hơn cache react-query nằm cạnh.
  Xoá cùng lúc với cache đó — xem `xoaCacheBenBi`.
*/
const KHOA = 'wedo:workspaces:v1';

export async function luuDanhSachKhongGian(danhSach: Workspace[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KHOA, JSON.stringify(danhSach));
  } catch {
    // Không ghi được thì lần sau mất mạng chỉ không có bản dự phòng.
  }
}

/** Danh sách đã lưu, hoặc `null` khi chưa có hay bản lưu hỏng. */
export async function docDanhSachKhongGian(): Promise<Workspace[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KHOA);
    if (!raw) return null;
    const danhSach: unknown = JSON.parse(raw);
    if (!Array.isArray(danhSach)) return null;
    return danhSach.filter(
      (item): item is Workspace =>
        Boolean(item) && typeof item === 'object' && typeof (item as Workspace).id === 'string',
    );
  } catch {
    return null;
  }
}

export async function xoaDanhSachKhongGian(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KHOA);
  } catch {
    // Bỏ qua: không xoá được thì cũng không chặn được việc đăng xuất.
  }
}
