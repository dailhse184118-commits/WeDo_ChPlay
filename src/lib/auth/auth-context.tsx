import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  getMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  logout as logoutRequest,
  register as registerRequest,
} from '../api/auth';
import type { RegisterInput } from '../api/auth';
import { onUnauthorized } from '../api/client';
import { dongBoPushToken, huyDangKyPushToken } from '../notifications/push-token';
import { xoaCacheBenBi } from '../query';
import type { UserProfile } from '../types';
import { getGoogleIdToken, signOutFromGoogle } from './google-signin';
import {
  clearToken,
  loadRefreshToken,
  loadToken,
  saveRefreshToken,
  saveToken,
} from './token-storage';

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
    /*
      Bảo máy chủ cắt phiên TRƯỚC khi xoá token khỏi máy — xoá trước thì không
      còn gì để gửi lên. Bọc lại vì mất mạng không được phép giữ người dùng ở
      lại trong app.
    */
    /*
      Gỡ thiết bị TRƯỚC khi cắt phiên và xoá token: request này cần header xác
      thực. Bỏ qua bước này thì người vừa đăng xuất vẫn nhận thông báo công việc
      trên chiếc máy họ vừa trả lại.
    */
    await huyDangKyPushToken();

    try {
      const refreshToken = await loadRefreshToken();
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // Máy chủ không phản hồi. Phiên vẫn hết hạn sau 60 ngày.
    }

    await clearToken();

    /*
      Xoá cache đã ghi xuống đĩa. Nó chứa công việc, tin nhắn và tên dự án của
      người vừa dùng — không xoá thì người đăng nhập tiếp theo trên cùng máy sẽ
      thấy dữ liệu của người trước ngay khi mở app, trước cả khi lượt gọi mạng
      đầu tiên kịp trả về.
    */
    await xoaCacheBenBi();

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

        /*
          Đồng bộ lại cả ở đường khôi phục phiên, không chỉ lúc đăng nhập mới.
          Expo cấp token mới sau khi cài lại app hoặc xoá dữ liệu, mà phần lớn
          lần mở app đi qua đúng nhánh này chứ không qua màn đăng nhập.
        */
        void dongBoPushToken();
      } catch {
        /*
          Tầng API đã tự thử gia hạn bằng refresh token trước khi ném lỗi tới
          đây. Tới được chỗ này nghĩa là cả refresh token cũng hết hạn hoặc bị
          thu hồi, hoặc tài khoản đã bị xoá.
        */
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

  const establishSession = useCallback(async (accessToken: string, refreshToken?: string) => {
    // Lưu token TRƯỚC khi gọi getMe, nếu không request sẽ thiếu header Authorization.
    await saveToken(accessToken);

    /*
      Máy chủ bản cũ chưa trả `refreshToken`. Thiếu thì bỏ qua chứ không được
      để đăng nhập thất bại — app mới phải chạy được với cả backend chưa cập nhật.
    */
    if (refreshToken) {
      await saveRefreshToken(refreshToken);
    }
    const profile = await getMe();
    setUser(profile);
    setStatus('signedIn');

    /*
      Ghi nhận thiết bị để máy chủ đẩy thông báo xuống. Đặt sau khi đã vào được
      app: hàm này tự nuốt lỗi, nhưng nó có thể hiện hộp xin quyền hệ thống, và
      hỏi quyền trước khi người dùng thấy màn hình nào thì rất khó hiểu.
    */
    void dongBoPushToken();
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      await establishSession(response.accessToken, response.refreshToken);
    },
    [establishSession],
  );

  const signInWithGoogle = useCallback(async () => {
    const idToken = await getGoogleIdToken();
    // null nghĩa là người dùng tự đóng hộp thoại — không phải lỗi, không báo gì.
    if (!idToken) return;

    const response = await loginWithGoogleRequest(idToken);
    await establishSession(response.accessToken, response.refreshToken);
  }, [establishSession]);

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      await establishSession(response.accessToken, response.refreshToken);
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
