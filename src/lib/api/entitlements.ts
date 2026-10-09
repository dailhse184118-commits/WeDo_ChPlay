import { apiRequest } from './client';

/** Mã máy chủ trả về khi đã dùng hết lượt AI trong tháng. */
export const MA_HET_LUOT_AI = 'AI_DETECTION_LIMIT_REACHED';

export interface HanMucAI {
  used: number;
  limit: number;
  remaining: number;
  /** Chuỗi ISO. Mốc hạn mức được nạp lại. */
  periodEnd: string;
  /** Số lượt đang giữ chỗ cho các yêu cầu chưa xong. */
  pending: number;
}

/** Gói đang có hiệu lực của workspace, kèm cách thanh toán và mốc hết kỳ. */
export interface GoiHienTai {
  provider: 'PAYOS' | 'APPLE';
  plan: 'PERSONAL_PRO' | 'TEAM_GROWTH';
  billingCycle: 'MONTHLY' | 'YEARLY';
  /** Chuỗi ISO. */
  currentPeriodEnd: string;
}

export interface Entitlements {
  plan: 'FREE' | 'PERSONAL_PRO' | 'TEAM_GROWTH';
  usage: {
    aiDetections: HanMucAI;
  };
  subscription: GoiHienTai | null;
}

/**
 * Hạn mức AI của người dùng trong không gian làm việc đang mở.
 *
 * Hạn mức tính theo phạm vi: gói cá nhân thì đếm theo người, gói nhóm thì đếm
 * theo cả workspace. Nên phải gửi `workspaceId`, thiếu nó máy chủ trả về hạn
 * mức cá nhân và con số hiện ra sẽ không khớp với thứ người dùng thực sự có.
 */
export function getEntitlements(workspaceId?: string): Promise<Entitlements> {
  const duong = workspaceId
    ? `/payments/entitlements?workspaceId=${encodeURIComponent(workspaceId)}`
    : '/payments/entitlements';
  return apiRequest<Entitlements>(duong);
}
