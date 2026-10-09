import { apiRequest } from './client';
import type { GoiHienTai } from './entitlements';

/** Token máy chủ cấp để Apple gắn giao dịch với tài khoản WeDo (sinh một lần, giữ mãi). */
export function layAppAccountToken(): Promise<{ appAccountToken: string }> {
  return apiRequest('/payments/apple/account-token', { method: 'POST' });
}

/** Gửi giao dịch StoreKit đã ký lên máy chủ xác minh và cấp gói. */
export function guiGiaoDichApple(input: { jws: string; workspaceId?: string }) {
  return apiRequest<{ transactionId: string; subscription: GoiHienTai | null }>('/payments/apple/transactions', {
    method: 'POST',
    body: input,
  });
}
