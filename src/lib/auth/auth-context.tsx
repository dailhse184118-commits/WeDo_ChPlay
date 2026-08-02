import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getMe, login as loginRequest, register as registerRequest } from '../api/auth';
import type { RegisterInput } from '../api/auth';
import { onUnauthorized } from '../api/client';
import type { UserProfile } from '../types';
import { clearToken, loadToken, saveToken } from './token-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
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

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      await establishSession(response.accessToken);
    },
    [establishSession],
  );

  const value = useMemo<AuthState>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
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
