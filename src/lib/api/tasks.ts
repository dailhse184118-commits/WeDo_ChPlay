import { tuDienLoiMang } from '../../i18n/tu-dien/loi-mang';
import { apiRequest } from './client';
import { taiNhieuTepLen } from './chat-files';
import type { Task, TaskStatus } from '../types';

export interface CreateTaskInput {
  title: string;
  workspaceId: string;
  description?: string;
  status?: TaskStatus;
  /** Chuỗi ISO 8601 đầy đủ. */
  dueDate?: string;
  projectId?: string;
  assigneeId?: string;
}

export function createTask(input: CreateTaskInput): Promise<Task> {
  const body: Record<string, string> = {
    title: input.title,
    workspaceId: input.workspaceId,
  };
  if (input.description) body.description = input.description;
  if (input.status) body.status = input.status;
  if (input.dueDate) body.dueDate = input.dueDate;
  if (input.projectId) body.projectId = input.projectId;
  if (input.assigneeId) body.assigneeId = input.assigneeId;

  return apiRequest<Task>('/tasks', { method: 'POST', body });
}

export function listTasks(workspaceId?: string, projectId?: string): Promise<Task[]> {
  const params = new URLSearchParams();
  if (workspaceId) params.set('workspaceId', workspaceId);
  if (projectId) params.set('projectId', projectId);
  const query = params.toString();
  return apiRequest<Task[]>(query ? `/tasks?${query}` : '/tasks');
}

export function getTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}`);
}

/** Chỉ chạy được khi assignmentStatus === 'PENDING' và mình là người phụ trách. */
export function acceptTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/accept`, { method: 'POST' });
}

/**
 * Từ chối việc được giao. `RejectTaskDto` phía server yêu cầu tối thiểu 3 ký tự,
 * nên chặn ngay ở client để người dùng thấy lỗi tức thì thay vì đợi một vòng mạng.
 */
export function rejectTask(id: string, reason: string): Promise<Task> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return Promise.reject(new Error(tuDienLoiMang.vi.lyDoTuChoiNgan));
  }
  return apiRequest<Task>(`/tasks/${id}/reject`, {
    method: 'POST',
    body: { reason: trimmed },
  });
}

/**
 * Đổi trạng thái công việc bằng `PATCH /tasks/:id`.
 *
 * Chỉ gửi đúng trường `status`: máy chủ hiểu "không gửi" là giữ nguyên, nên
 * kèm thêm trường nào là tự nhận việc sửa trường đó. Máy chủ chỉ cho leader dự
 * án (hoặc người tạo / chủ không gian với việc không thuộc dự án) đổi trạng thái
 * — xem `quyenTrenTask` để biết khi nào nên hiện nút.
 */
export function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  return apiRequest<Task>(`/tasks/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: { status },
  });
}

/** Một tệp người dùng vừa chọn trên máy, trước khi gửi đi. */
export interface TepChon {
  uri: string;
  name: string;
  mimeType?: string | null;
}

/**
 * Nộp tài liệu cho công việc.
 *
 * Mỗi tệp đi một lượt gọi riêng. Trước đây gói cả lô vào một `FormData` rồi gửi
 * một lượt, nhưng `FormData` của React Native hỏng trên Expo SDK 57 nên không
 * tệp nào lên được — xem khối ghi chú trong `tai-tep.ts`.
 */
export async function uploadSubmissions(id: string, files: TepChon[]): Promise<Task> {
  if (files.length === 0) {
    throw new Error(tuDienLoiMang.vi.chuaChonTep);
  }

  const ketQua = await taiNhieuTepLen<Task>(
    `/tasks/${encodeURIComponent(id)}/submissions`,
    files,
    '',
  );

  /*
    Máy chủ trả về nguyên công việc sau mỗi lần nộp. Chỉ bản CUỐI mới đủ danh
    sách tệp; trả bản đầu thì giao diện thiếu mất những tệp nộp sau.
  */
  return ketQua[ketQua.length - 1];
}

/** Chuyển công việc sang Chờ duyệt. Máy chủ đòi đã có ít nhất một tệp nộp. */
export function submitForReview(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/submit-review`, { method: 'POST' });
}

/** Leader duyệt bài: công việc chuyển sang Xong. */
export function approveReview(id: string): Promise<Task> {
  return apiRequest<Task>(`/tasks/${id}/approve-review`, { method: 'POST' });
}

/** Leader trả bài về Đang làm kèm lý do. Máy chủ đòi tối thiểu 3 ký tự. */
export function rejectReview(id: string, reason: string): Promise<Task> {
  const trimmed = reason.trim();
  if (trimmed.length < 3) {
    return Promise.reject(new Error(tuDienLoiMang.vi.lyDoTraLaiNgan));
  }
  return apiRequest<Task>(`/tasks/${id}/reject-review`, {
    method: 'POST',
    body: { reason: trimmed },
  });
}

export interface DongGopThanhVien {
  userId: string;
  duocGiao: number;
  hoanThanh: number;
  dungHan: number;
  treHan: number;
  chuaXong: number;
  daNop: number;
  /** Số VIỆC từng bị trả lại, không phải số lần — máy chủ chỉ lưu lý do gần nhất. */
  biTraLai: number;
  /** `null` khi chưa hoàn thành việc nào có hạn, tức chưa có gì để đo. */
  tyLeDungHanPhanTram: number | null;
  user: { id: string; fullName: string; email: string; avatarUrl?: string | null } | null;
}

export interface BangDongGop {
  generatedAt: string;
  thanhVien: DongGopThanhVien[];
}

/** Ai làm bao nhiêu, ai đúng hạn, ai để việc trôi. */
export function getContributions(
  workspaceId: string,
  projectId?: string,
): Promise<BangDongGop> {
  const params = new URLSearchParams({ workspaceId });
  if (projectId) params.set('projectId', projectId);
  return apiRequest<BangDongGop>(`/tasks/contributions?${params.toString()}`);
}
