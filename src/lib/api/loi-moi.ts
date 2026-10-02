import { apiRequest } from './client';

/** Link mời đang dùng của một dự án. Chỉ Leader và chủ không gian gọi được. */
export interface LoiMoiDuAn {
  code: string;
  url: string;
  expiresAt: string;
  useCount: number;
}

/** Đủ để biết mình được mời vào đâu; máy chủ không gửi email hay id của ai. */
export interface XemTruocLoiMoi {
  projectName: string;
  workspaceName: string;
  leaderName: string;
  memberCount: number;
  expiresAt: string;
}

export interface KetQuaThamGia {
  projectId: string;
  workspaceId: string;
  alreadyMember: boolean;
}

/** Chưa có link còn hiệu lực thì máy chủ trả thân rỗng. */
export async function layLoiMoi(projectId: string): Promise<LoiMoiDuAn | null> {
  const ketQua = await apiRequest<LoiMoiDuAn | null | undefined>(
    `/projects/${encodeURIComponent(projectId)}/invite`,
  );
  return ketQua ?? null;
}

/** Tạo link mới; link cũ hết dùng được ngay. */
export function taoLoiMoi(projectId: string): Promise<LoiMoiDuAn> {
  return apiRequest<LoiMoiDuAn>(`/projects/${encodeURIComponent(projectId)}/invite`, {
    method: 'POST',
  });
}

export function tatLoiMoi(projectId: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/projects/${encodeURIComponent(projectId)}/invite`, {
    method: 'DELETE',
  });
}

export function xemTruocLoiMoi(ma: string): Promise<XemTruocLoiMoi> {
  return apiRequest<XemTruocLoiMoi>(`/invites/${encodeURIComponent(ma)}`);
}

export function thamGiaLoiMoi(ma: string): Promise<KetQuaThamGia> {
  return apiRequest<KetQuaThamGia>(`/invites/${encodeURIComponent(ma)}/join`, {
    method: 'POST',
  });
}
