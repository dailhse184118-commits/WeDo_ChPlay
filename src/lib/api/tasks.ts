import { apiRequest } from './client';
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
    return Promise.reject(new Error('Lý do từ chối phải có ít nhất 3 ký tự'));
  }
  return apiRequest<Task>(`/tasks/${id}/reject`, {
    method: 'POST',
    body: { reason: trimmed },
  });
}

/** Một tệp người dùng vừa chọn trên máy, trước khi gửi đi. */
export interface TepChon {
  uri: string;
  name: string;
  mimeType?: string | null;
}

/**
 * Chuyển tệp đã chọn thành mảnh mà `FormData` của React Native hiểu.
 *
 * React Native nhận đúng bộ ba `{ uri, name, type }` rồi tự đọc tệp lúc gửi —
 * khác hẳn `FormData` chuẩn của trình duyệt vốn đòi `Blob`.
 */
export function phanTepGuiLen(tep: TepChon): { uri: string; name: string; type: string } {
  return {
    uri: tep.uri,
    name: tep.name,
    // Trình chọn tệp Android trả rỗng với đuôi lạ; multer đòi phải có Content-Type.
    type: tep.mimeType || 'application/octet-stream',
  };
}

/**
 * Nộp tài liệu cho công việc.
 *
 * Gửi cả lô trong một lượt: máy chủ chỉ phát một thông báo và cập nhật công
 * việc một lần, thay vì mỗi tệp một lần.
 */
export function uploadSubmissions(id: string, files: TepChon[]): Promise<Task> {
  if (files.length === 0) {
    return Promise.reject(new Error('Hãy chọn ít nhất một tệp để nộp'));
  }

  const form = new FormData();
  for (const tep of files) {
    // `as never`: kiểu FormData của TS lấy từ chuẩn web, không biết dạng tệp của RN.
    form.append('files', phanTepGuiLen(tep) as never);
  }

  return apiRequest<Task>(`/tasks/${id}/submissions`, { method: 'POST', body: form });
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
    return Promise.reject(new Error('Lý do trả lại phải có ít nhất 3 ký tự'));
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
