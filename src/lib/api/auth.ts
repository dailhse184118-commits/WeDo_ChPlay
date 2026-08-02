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

export function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}
