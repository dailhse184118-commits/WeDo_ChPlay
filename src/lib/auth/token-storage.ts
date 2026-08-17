import * as SecureStore from 'expo-secure-store';

import type { UserProfile } from '../types';

const TOKEN_KEY = 'wedo.accessToken';
const REFRESH_KEY = 'wedo.refreshToken';
const WORKSPACE_KEY = 'wedo.activeWorkspaceId';
const PROFILE_KEY = 'wedo.userProfile';

async function readKey(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // Keystore có thể không dùng được trên một số máy. Coi như chưa đăng nhập
    // thay vì làm sập app lúc khởi động.
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return readKey(TOKEN_KEY);
}

export async function saveRefreshToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(REFRESH_KEY, token);
}

export async function loadRefreshToken(): Promise<string | null> {
  return readKey(REFRESH_KEY);
}

/**
 * Hồ sơ người dùng, lưu lại để mở app lúc không có mạng vẫn vào được.
 *
 * Máy chủ là nguồn đúng; bản này chỉ dùng khi gọi `getMe()` thất bại vì mạng.
 * Không có nó thì người dùng mở app ngoại tuyến sẽ bị đá về màn đăng nhập, và
 * toàn bộ cache dữ liệu trở nên vô dụng vì không ai vào được tới màn nào.
 */
export async function saveUserProfile(profile: UserProfile): Promise<void> {
  try {
    await SecureStore.setItemAsync(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Không lưu được thì thôi: chỉ mất khả năng mở app khi ngoại tuyến.
  }
}

export async function loadUserProfile(): Promise<UserProfile | null> {
  const raw = await readKey(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    // Dữ liệu hỏng: coi như chưa có.
    return null;
  }
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  /*
    Xoá luôn refresh token. Sót lại là ai cầm máy sau khi người trước đăng xuất
    vẫn gia hạn được phiên của họ.
  */
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(WORKSPACE_KEY);
  // Hồ sơ cũng phải đi theo: sót lại là người sau mở app thấy tên người trước.
  await SecureStore.deleteItemAsync(PROFILE_KEY);
}

export async function saveActiveWorkspaceId(id: string): Promise<void> {
  await SecureStore.setItemAsync(WORKSPACE_KEY, id);
}

export async function loadActiveWorkspaceId(): Promise<string | null> {
  return readKey(WORKSPACE_KEY);
}
