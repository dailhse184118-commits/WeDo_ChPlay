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

export interface Entitlements {
  usage: {
    aiDetections: HanMucAI;
  };
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
