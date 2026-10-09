import { apiRequest } from './client';

/**
 * Báo cáo và chặn — phần Apple bắt buộc có ở app cho người dùng tự đăng nội
 * dung (Guideline 1.2). Máy chủ làm việc nặng: tự tìm ra ai bị báo cáo, kiểm
 * người báo cáo có thấy được thứ họ báo không, và chặn có hiệu lực hai chiều.
 */

export type LoaiDoiTuongBaoCao = 'USER' | 'PROJECT_MESSAGE' | 'DIRECT_MESSAGE';

export type LyDoBaoCao = 'SPAM' | 'HARASSMENT' | 'HATE' | 'SEXUAL' | 'VIOLENCE' | 'OTHER';

export interface YeuCauBaoCao {
  targetType: LoaiDoiTuongBaoCao;
  /** Id tin nhắn, hoặc id người dùng khi `targetType` là `USER`. */
  targetId: string;
  reason: LyDoBaoCao;
  note?: string;
}

export interface KetQuaBaoCao {
  id: string;
  status: 'OPEN';
}

/** Một người mình đã chặn, theo `GET /moderation/blocks`. */
export interface NguoiDaChan {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  /** Chuỗi ISO. */
  blockedAt: string;
}

/** Mã máy chủ gắn vào 429 khi một người gửi quá 30 báo cáo trong 24 giờ. */
export const MA_QUA_NHIEU_BAO_CAO = 'REPORT_LIMIT';

/** Khớp `MaxLength(500)` của DTO phía máy chủ. */
export const DO_DAI_GHI_CHU_TOI_DA = 500;

/**
 * Gửi một báo cáo.
 *
 * Ghi chú rỗng thì bỏ hẳn khoá, không gửi chuỗi rỗng: máy chủ lưu nguyên văn,
 * và người xử lý báo cáo đọc một ô "ghi chú" trống chỉ mất công.
 */
export function reportContent(yeuCau: YeuCauBaoCao): Promise<KetQuaBaoCao> {
  const ghiChu = yeuCau.note?.trim().slice(0, DO_DAI_GHI_CHU_TOI_DA);

  return apiRequest<KetQuaBaoCao>('/moderation/reports', {
    method: 'POST',
    body: {
      targetType: yeuCau.targetType,
      targetId: yeuCau.targetId,
      reason: yeuCau.reason,
      ...(ghiChu ? { note: ghiChu } : {}),
    },
  });
}

/**
 * Danh sách người mình đã chặn.
 *
 * Máy chủ bọc trong `{ items }`; bóc ra ở đây để mọi chỗ dùng chỉ thấy một mảng.
 * Thiếu `items` (máy chủ cũ, chưa có endpoint) thì coi như chưa chặn ai — một
 * danh sách chặn hỏng không được làm sập khung chat.
 */
export async function listBlocks(): Promise<NguoiDaChan[]> {
  const ketQua = await apiRequest<{ items?: NguoiDaChan[] } | undefined>('/moderation/blocks');
  return Array.isArray(ketQua?.items) ? ketQua.items : [];
}

/** Chặn một người. Gọi lại với người đã chặn cũng không sao — máy chủ bỏ qua. */
export function blockUser(userId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>('/moderation/blocks', {
    method: 'POST',
    body: { userId },
  });
}

export function unblockUser(userId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/moderation/blocks/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });
}
