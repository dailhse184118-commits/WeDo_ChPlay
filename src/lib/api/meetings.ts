import { apiRequest } from './client';
import type { UserSummary } from '../types';

/**
 * Cuộc họp — phần app di động dùng tới.
 *
 * Máy chủ trả về nhiều trường hơn hẳn những gì khai ở đây (trạng thái phiên
 * ghi âm của Daily, id bản ghi, mốc thời gian nội bộ…). Chỉ khai thứ màn hình
 * thật sự đọc: khai đủ mọi trường là tự nhận việc phải sửa kiểu mỗi lần máy chủ
 * thêm một cột, cho một thứ không hiện ra ở đâu cả.
 */

export type TrangThaiHop = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type TrangThaiHangMuc = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface HangMucHanhDong {
  id: string;
  title: string;
  note?: string | null;
  status: TrangThaiHangMuc;
  dueDate?: string | null;
  assignee?: UserSummary | null;
  /** Có giá trị khi hạng mục đã được chuyển thành công việc thật. */
  task?: { id: string; title: string; status: string } | null;
}

export interface CuocHop {
  id: string;
  title: string;
  agenda?: string | null;
  /** Chuỗi ISO. */
  startTime: string;
  endTime?: string | null;
  status: TrangThaiHop;
  /** Chỉ có sau khi ai đó mở phòng. Hết hạn theo `roomExpiresAt` của máy chủ. */
  roomUrl?: string | null;
  summary?: string | null;
  decisions?: string | null;
  transcript?: string | null;
  workspaceId: string;
  projectId: string;
  project?: { id: string; name: string } | null;
  creator?: UserSummary | null;
  participants?: Array<{ id: string; user: UserSummary }>;
  actionItems?: HangMucHanhDong[];
}

/**
 * Danh sách cuộc họp của một không gian làm việc.
 *
 * Máy chủ đã sắp theo `startTime` tăng dần và đã lọc theo quyền — chỉ trả về
 * cuộc họp người dùng được thấy. Đừng lọc lại ở máy khách: làm vậy là đoán lại
 * luật phân quyền của máy chủ, và hai bên sẽ lệch nhau ngay lần đầu luật đổi.
 */
export function danhSachCuocHop(workspaceId: string): Promise<CuocHop[]> {
  return apiRequest<CuocHop[]>(`/meetings?workspaceId=${encodeURIComponent(workspaceId)}`);
}

export function chiTietCuocHop(meetingId: string): Promise<CuocHop> {
  return apiRequest<CuocHop>(`/meetings/${encodeURIComponent(meetingId)}`);
}

/**
 * Mở phòng gọi và lấy đường vào.
 *
 * Máy chủ tự dựng phòng ở lần gọi đầu rồi dùng lại cho những lần sau, nên gọi
 * nhiều lần là an toàn. Nó từ chối khi cuộc họp đã kết thúc hoặc đã huỷ — câu
 * từ chối là tiếng Việt, hiện thẳng lên cho người dùng đọc.
 */
export function moPhongHop(meetingId: string): Promise<CuocHop> {
  return apiRequest<CuocHop>(`/meetings/${encodeURIComponent(meetingId)}/room`, {
    method: 'POST',
  });
}

export interface TaoCuocHopInput {
  title: string;
  agenda?: string;
  /** Chuỗi ISO. */
  startTime: string;
  endTime?: string;
  workspaceId: string;
  projectId: string;
}

/**
 * Tạo cuộc họp. Máy chủ chỉ cho Leader của dự án làm việc này.
 *
 * Không tự đoán quyền ở máy khách rồi ẩn nút đi: danh sách dự án trả về cho
 * mobile không kèm vai trò của người đang đăng nhập trong mọi trường hợp, nên
 * đoán sai là ẩn mất nút của đúng người được phép. Để máy chủ trả lời, rồi hiện
 * câu từ chối của nó — câu đó đã là tiếng Việt và nói rõ lý do.
 */
export function taoCuocHop(input: TaoCuocHopInput): Promise<CuocHop> {
  return apiRequest<CuocHop>('/meetings', { method: 'POST', body: input });
}
