import { apiRequest } from './client';
import type { AuthResponse, UserProfile } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  /** Đã đánh dấu ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản…". */
  acceptTerms?: boolean;
  confirmAdult?: boolean;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  const body: Record<string, string | boolean> = {
    email: input.email,
    password: input.password,
    fullName: input.fullName,
  };
  if (input.phone) {
    body.phone = input.phone;
  }
  /*
    Chỉ gửi khi đã đánh dấu. Máy chủ ghi mốc đồng ý khi CẢ HAI cùng `true`;
    máy chủ bản cũ chưa khai hai trường này và bật `forbidNonWhitelisted`, nên
    không đánh dấu thì không gửi khoá nào cả.
  */
  if (input.acceptTerms) body.acceptTerms = true;
  if (input.confirmAdult) body.confirmAdult = true;

  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
  });
}

/**
 * Đăng nhập bằng Google.
 *
 * Gửi **ID token** chứ không phải access token: máy chủ đối chiếu `aud` của
 * token với client ID của ứng dụng. Trên Android, access token do thư viện cấp
 * gắn với client dạng Android nên `aud` lệch và máy chủ từ chối; còn ID token
 * thì được cấp cho `webClientId` mà ứng dụng khai báo, nên khớp. Trên iPhone,
 * `aud` là client dạng iOS — máy chủ nhận cả `GOOGLE_IOS_CLIENT_ID`.
 */
export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: { idToken },
    skipAuth: true,
  });
}

/** Những gì `POST /auth/apple` nhận. Xem `layThongTinApple`. */
export interface DangNhapAppleInput {
  /** JWT do Apple ký; máy chủ tự kiểm chữ ký, `aud` và `nonce`. */
  identityToken: string;
  /** Mã dùng một lần; máy chủ đổi lấy refresh token để thu hồi khi xoá tài khoản. */
  authorizationCode?: string;
  /** Nonce GỐC. Identity token mang SHA-256 của nó. */
  nonce: string;
  /** Apple chỉ gửi tên ở lần cấp quyền đầu tiên. */
  fullName?: string;
  email?: string;
}

/**
 * Đăng nhập bằng Apple (chỉ iPhone). Máy chủ trả đúng hình dạng như `/auth/google`.
 *
 * Chỉ gửi những khoá có giá trị: máy chủ bật `forbidNonWhitelisted` và kiểm độ
 * dài `fullName`, gửi `null` hay chuỗi rỗng là tự chuốc lỗi 400.
 */
export function loginWithApple(input: DangNhapAppleInput): Promise<AuthResponse> {
  const body: Record<string, string> = {
    identityToken: input.identityToken,
    nonce: input.nonce,
  };
  if (input.authorizationCode) body.authorizationCode = input.authorizationCode;
  if (input.fullName) body.fullName = input.fullName;
  if (input.email) body.email = input.email;

  return apiRequest<AuthResponse>('/auth/apple', {
    method: 'POST',
    body,
    skipAuth: true,
  });
}

/**
 * Xin mã đặt lại mật khẩu gửi về email.
 *
 * Máy chủ trả về cùng một câu dù email có tài khoản hay không — cố ý như vậy
 * để không ai dò được danh sách người dùng. Nên màn hình gọi hàm này cũng phải
 * hiện đúng một thông báo cho mọi trường hợp.
 */
export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: { email },
    skipAuth: true,
  });
}

/** Đổi mật khẩu bằng mã 6 số nhận qua email. */
export function resetPassword(
  email: string,
  code: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/reset-password', {
    method: 'POST',
    body: { email, code, newPassword },
    skipAuth: true,
  });
}

/**
 * Bảo máy chủ cắt phiên này.
 *
 * Không có bước này thì bản sao refresh token bị đánh cắp vẫn sống thêm 60
 * ngày sau khi người dùng đã đăng xuất.
 */
export function logout(refreshToken: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>('/auth/logout', {
    method: 'POST',
    body: { refreshToken },
    skipAuth: true,
  });
}

export function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}
