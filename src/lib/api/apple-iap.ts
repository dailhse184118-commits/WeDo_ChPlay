import { apiRequest } from './client';
import type { GoiHienTai } from './entitlements';

export const MA_LOI_IAP = {
  TRUNG_GOI: 'SUBSCRIPTION_CONFLICT',
  CUA_NGUOI_KHAC: 'TRANSACTION_OWNED_BY_OTHER_USER',
  TAT: 'APPLE_IAP_DISABLED',
  KHONG_PHAI_CHU: 'WORKSPACE_OWNER_REQUIRED',
} as const;

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
