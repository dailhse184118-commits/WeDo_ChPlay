import { apiRequest } from './client';

export type DinhDangBaoCao = 'pdf' | 'xlsx';

/** Link tải có chữ ký, sống 5 phút (máy chủ: src/bao-cao-dong-gop). */
export interface LinkBaoCao {
  url: string;
  expiresAt: string;
}

/**
 * Xin link tải báo cáo đóng góp. App luôn dùng khoảng thời gian mặc định của
 * máy chủ (từ ngày tạo dự án tới hôm nay) và tiếng Việt — app chỉ có tiếng Việt.
 */
export function xinLinkBaoCao(projectId: string, format: DinhDangBaoCao): Promise<LinkBaoCao> {
  return apiRequest<LinkBaoCao>(`/projects/${encodeURIComponent(projectId)}/contribution-report/link`, {
    method: 'POST',
    body: { format, lang: 'vi' },
  });
}
