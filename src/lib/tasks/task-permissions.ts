import type { Project, Task, Workspace } from '../types';

export interface QuyenTrenTask {
  /** Được đính thêm tài liệu vào công việc. */
  nopTaiLieu: boolean;
  /** Được chuyển công việc sang Chờ duyệt. */
  guiDuyet: boolean;
  /** Được duyệt hoặc trả bài lại. */
  duyetBai: boolean;
  /** Được chuyển việc của chính mình từ Cần làm sang Đang làm. */
  batDauLam: boolean;
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

  /*
    Việc tự giao cho mình: máy chủ tạo sẵn ở Cần làm + Đã nhận, bỏ qua bước Nhận
    việc — mà chính bước đó mới đẩy việc sang Đang làm. Không có lối nào khác thì
    việc kẹt mãi ở Cần làm, không nộp được tài liệu.

    Lối duy nhất là `PATCH /tasks/:id`, và máy chủ chỉ cho:
    - việc thuộc dự án: leader dự án hoặc chủ không gian (`ensureProjectLeader`);
    - việc không thuộc dự án: người tạo hoặc chủ/ADMIN không gian. Người CHỈ được
      giao thì bị chặn đổi trạng thái (`ensureNguoiLamKhongTuDoiTrangThai`).
    Không biết ai là ADMIN không gian, nên nhánh ADMIN không có nút — thà thiếu
    nút còn hơn bày nút bấm vào ăn 403.
  */
  const viecCuaMinhChuaBatDau =
    task.assigneeId === meId &&
    task.assignmentStatus === 'ACCEPTED' &&
    task.status === 'TODO';
  const duocDoiTrangThai = task.projectId
    ? laLeader(boiCanh)
    : task.creatorId === meId || boiCanh.workspace?.ownerId === meId;
  const batDauLam = viecCuaMinhChuaBatDau && duocDoiTrangThai;

  return { nopTaiLieu, guiDuyet, duyetBai, batDauLam };
}
