import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'wedo.accessToken';
const REFRESH_KEY = 'wedo.refreshToken';
const WORKSPACE_KEY = 'wedo.activeWorkspaceId';

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

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  /*
    Xoá luôn refresh token. Sót lại là ai cầm máy sau khi người trước đăng xuất
    vẫn gia hạn được phiên của họ.
  */
  await SecureStore.deleteItemAsync(REFRESH_KEY);
  await SecureStore.deleteItemAsync(WORKSPACE_KEY);
}

export async function saveActiveWorkspaceId(id: string): Promise<void> {
  await SecureStore.setItemAsync(WORKSPACE_KEY, id);
}

export async function loadActiveWorkspaceId(): Promise<string | null> {
  return readKey(WORKSPACE_KEY);
}
