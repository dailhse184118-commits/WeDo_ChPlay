import type { CreateTaskInput } from '../api/tasks';

export interface FormTaoTask {
  tieuDe: string;
  moTa: string;
  /** Dạng `dd/mm/yyyy` như người dùng gõ. Rỗng nghĩa là không đặt hạn. */
  hanChot: string;
  projectId: string | null;
  assigneeId: string | null;
}

export const FORM_TAO_TASK_RONG: FormTaoTask = {
  tieuDe: '',
  moTa: '',
  hanChot: '',
  projectId: null,
  assigneeId: null,
};

/**
 * Đổi `dd/mm/yyyy` sang chuỗi ISO mà máy chủ nhận.
 *
 * Trả `null` khi chuỗi không hợp lệ, kể cả những ngày trông đúng dạng nhưng
 * không tồn tại như `31/02/2026` — `new Date` sẽ âm thầm cuộn sang đầu tháng 3
 * thay vì báo lỗi, và người dùng nhận được hạn chót không phải thứ họ gõ.
 *
 * Đặt vào cuối ngày (23:59) vì "hạn chót ngày 2/9" nghĩa là hết ngày 2/9, chứ
 * không phải 0 giờ sáng hôm đó.
 */
export function hanChotSangISO(chuoi: string): string | null {
  const khop = chuoi.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!khop) return null;

  const ngay = Number(khop[1]);
  const thang = Number(khop[2]);
  const nam = Number(khop[3]);

  const d = new Date(nam, thang - 1, ngay, 23, 59, 0, 0);
  // Kiểm ngược: nếu ngày bị cuộn thì các thành phần sẽ không còn khớp.
  if (d.getFullYear() !== nam || d.getMonth() !== thang - 1 || d.getDate() !== ngay) {
    return null;
  }
  return d.toISOString();
}

export interface KetQuaDungInput {
  input: CreateTaskInput | null;
  /** Câu báo lỗi để hiện thẳng cho người dùng; `null` khi hợp lệ. */
  loi: string | null;
}

/**
 * Dựng dữ liệu gửi lên từ trạng thái của form.
 *
 * Chỉ gửi những trường có giá trị: máy chủ phân biệt "không gửi" với "gửi chuỗi
 * rỗng", và gửi rỗng sẽ tạo ra công việc có mô tả là một khoảng trắng.
 */
export function dungInputTaoTask(
  form: FormTaoTask,
  workspaceId: string | null,
): KetQuaDungInput {
  const tieuDe = form.tieuDe.trim();
  if (!tieuDe) {
    return { input: null, loi: 'Nhập tên công việc trước đã.' };
  }

  /*
    Không có workspace thì không tạo được — máy chủ bắt buộc `workspaceId`.
    Chặn ở đây để người dùng nhận câu tiếng Việt thay vì lỗi 400 thô.
  */
  if (!workspaceId) {
    return { input: null, loi: 'Chưa chọn không gian làm việc.' };
  }

  const input: CreateTaskInput = { title: tieuDe, workspaceId };

  const moTa = form.moTa.trim();
  if (moTa) input.description = moTa;

  if (form.hanChot.trim()) {
    const iso = hanChotSangISO(form.hanChot);
    if (!iso) {
      return { input: null, loi: 'Hạn chót phải theo dạng ngày/tháng/năm, ví dụ 02/09/2026.' };
    }
    input.dueDate = iso;
  }

  if (form.projectId) input.projectId = form.projectId;
  if (form.assigneeId) input.assigneeId = form.assigneeId;

  return { input, loi: null };
}
