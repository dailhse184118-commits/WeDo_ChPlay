import { apiRequest } from './client';
import type { AuthResponse, UserProfile } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  const body: Record<string, string> = {
    email: input.email,
    password: input.password,
    fullName: input.fullName,
  };
  if (input.phone) {
    body.phone = input.phone;
  }

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
 * token với một `GOOGLE_CLIENT_ID` duy nhất — client dạng Web. Trên Android,
 * access token do thư viện cấp gắn với client dạng Android nên `aud` lệch và
 * máy chủ từ chối; còn ID token thì được cấp cho `webClientId` mà ứng dụng khai
 * báo, nên khớp.
 */
export function loginWithGoogle(idToken: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: { idToken },
    skipAuth: true,
  });
}

export function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}
