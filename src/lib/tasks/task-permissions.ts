import type { Project, Task, Workspace } from '../types';

export interface QuyenTrenTask {
  /** Được đính thêm tài liệu vào công việc. */
  nopTaiLieu: boolean;
  /** Được chuyển công việc sang Chờ duyệt. */
  guiDuyet: boolean;
  /** Được duyệt hoặc trả bài lại. */
  duyetBai: boolean;
}

export interface BoiCanhTask {
  task: Task;
  meId: string;
  /** Dự án chứa công việc, nếu đã tải được. Thiếu thì coi như không phải leader. */
  project?: Project | null;
  /** Không gian làm việc chứa công việc. Chủ không gian được quyền như leader. */
  workspace?: Workspace | null;
}

/**
 * Chủ không gian làm việc, hoặc thành viên dự án có vai trò LEADER.
 *
 * Chép đúng theo `hasProjectLeaderAccess` phía máy chủ. Lệch một chút là hiện
 * nút rồi ăn 403, hoặc giấu nút của người thật sự có quyền.
 */
function laLeader({ meId, project, workspace }: BoiCanhTask): boolean {
  if (workspace?.ownerId === meId) return true;
  return Boolean(
    project?.members?.some((member) => member.role === 'LEADER' && member.user.id === meId),
  );
}

/**
 * Những thao tác người đang đăng nhập được phép làm với công việc này.
 *
 * Tính ở client chỉ để quyết định hiện nút nào — máy chủ vẫn kiểm lại đủ. Mục
 * đích là không bày ra nút mà bấm vào chỉ nhận lỗi.
 */
export function quyenTrenTask(boiCanh: BoiCanhTask): QuyenTrenTask {
  const { task, meId } = boiCanh;

  // `ensureTaskAssigneeCanSubmit`: đúng người, đã nhận việc, và việc đang làm.
  const nopTaiLieu =
    task.assigneeId === meId &&
    task.assignmentStatus === 'ACCEPTED' &&
    task.status === 'IN_PROGRESS';

  /*
    `submitForReview` từ chối khi chưa có tệp nào. Khoá nút cho tới lúc nộp
    được ít nhất một tệp, thay vì để người dùng bấm rồi đọc thông báo lỗi.
  */
  const guiDuyet = nopTaiLieu && (task.submissions?.length ?? 0) > 0;

  const duyetBai =
    task.status === 'REVIEW' && Boolean(task.projectId) && laLeader(boiCanh);

  return { nopTaiLieu, guiDuyet, duyetBai };
}
