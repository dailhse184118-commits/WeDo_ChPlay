import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  register as registerRequest,
} from '../api/auth';
import type { RegisterInput } from '../api/auth';
import { onUnauthorized } from '../api/client';
import type { UserProfile } from '../types';
import { getGoogleIdToken, signOutFromGoogle } from './google-signin';
import { clearToken, loadToken, saveToken } from './token-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  /** Người dùng đóng hộp thoại Google thì kết thúc êm, không đổi trạng thái. */
  signInWithGoogle: () => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
    setStatus('signedOut');

    /*
      Xoá luôn phiên phía Google, nếu không Google vẫn nhớ tài khoản: lần sau
      bấm "Tiếp tục với Google" là vào thẳng tài khoản cũ, không hiện hộp chọn,
      người dùng không đổi được tài khoản.

      Làm SAU khi đã đăng xuất khỏi WeDo, và bọc lại: người đăng nhập bằng email
      chưa hề chạm tới Google, và trục trặc phía Google không được phép giữ
      người dùng ở lại trong app.
    */
    try {
      await signOutFromGoogle();
    } catch {
      // Không có phiên Google, hoặc Google trục trặc. Người dùng đã ra khỏi app rồi.
    }
  }, []);

  // Khôi phục phiên lúc khởi động.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await loadToken();
      if (!token) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const profile = await getMe();
        if (cancelled) return;
        setUser(profile);
        setStatus('signedIn');
      } catch {
        // Token hết hạn (hạn 7 ngày, không có refresh token) hoặc tài khoản đã bị xoá.
        await clearToken();
        if (!cancelled) setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Bất kỳ 401 nào từ tầng API cũng đá người dùng về màn đăng nhập.
  useEffect(() => onUnauthorized(() => void signOut()), [signOut]);

  const establishSession = useCallback(async (accessToken: string) => {
    // Lưu token TRƯỚC khi gọi getMe, nếu không request sẽ thiếu header Authorization.
    await saveToken(accessToken);
    const profile = await getMe();
    setUser(profile);
    setStatus('signedIn');
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      await establishSession(response.accessToken);
    },
    [establishSession],
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    // null nghĩa là người dùng tự đóng hộp thoại — không phải lỗi, không báo gì.
    if (!idToken) return;

    const response = await loginWithGoogleRequest(idToken);
    await establishSession(response.accessToken);
  }, [establishSession]);

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      await establishSession(response.accessToken);
    },
    [establishSession],
  );

  const value = useMemo<AuthState>(
    () => ({ status, user, signIn, signInWithGoogle, signUp, signOut }),
    [status, user, signIn, signInWithGoogle, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}
