import { createTask } from '../api/tasks';
import { linkMessageTask } from '../api/chat';
import type { ChatMessage, Task } from '../types';

export interface CreateTaskFromMessageInput {
  projectId: string;
  workspaceId: string;
  messageId: string;
  title: string;
  description?: string;
  assigneeId?: string;
  /** 'YYYY-MM-DD' hoặc 'DD/MM/YYYY' — xem `docHanChotAI`. */
  dueDate?: string;
  /** 'HH:mm', 'H:mm' hoặc '20h' — xem `docHanChotAI`. */
  dueTime?: string;
  /**
   * Chỉ dùng khi thử lại sau khi bước gắn hỏng. Có giá trị thì BỎ QUA bước tạo,
   * tránh tạo công việc trùng.
   */
  existingTaskId?: string;
}

export type CreateTaskFromMessageResult =
  | { outcome: 'created-and-linked'; task: Task; message: ChatMessage }
  | { outcome: 'created-not-linked'; task: Task; error: Error }
  | { outcome: 'failed'; error: Error };

export interface KetQuaHanChotAI {
  /** Chuỗi ISO gửi cho máy chủ; `null` khi không đặt hạn hoặc khi có lỗi. */
  iso: string | null;
  /** Câu báo lỗi để hiện thẳng cho người dùng; `null` khi hợp lệ. */
  loi: string | null;
}

const LOI_NGAY = 'Ngày hết hạn chưa đúng. Viết theo dạng ngày/tháng/năm, ví dụ 30/09/2026.';
const LOI_GIO = 'Giờ chưa đúng. Viết theo dạng giờ:phút, ví dụ 08:00, 8:00 hoặc 20h.';

/** Tách ngày, tháng, năm từ `yyyy-mm-dd` (dạng máy chủ trả) hoặc `dd/mm/yyyy` (dạng người dùng gõ). */
function tachNgay(chuoi: string): [number, number, number] | null {
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(chuoi);
  if (iso) return [Number(iso[1]), Number(iso[2]), Number(iso[3])];

  const vn = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(chuoi);
  if (vn) return [Number(vn[3]), Number(vn[2]), Number(vn[1])];

  return null;
}

/** `8:00`, `08:00`, `20h`, `20h30`, `8` — kiểu người Việt hay gõ giờ. */
function tachGio(chuoi: string): [number, number] | null {
  const khop = /^(\d{1,2})(?:\s*[:hHg.]\s*(\d{2})?)?$/.exec(chuoi);
  if (!khop) return null;

  const gio = Number(khop[1]);
  const phut = khop[2] ? Number(khop[2]) : 0;
  if (gio > 23 || phut > 59) return null;
  return [gio, phut];
}

/**
 * Đọc hạn chót người dùng gõ ở phiếu đề xuất của trợ lý.
 *
 * Trước đây chỉ `yyyy-mm-dd` + `HH:mm` mới qua, mọi dạng khác bị vứt đi trong
 * im lặng: việc được tạo KHÔNG có hạn, không có nhắc, mà màn vẫn báo "Đã tạo".
 * Trong khi mọi ô ngày khác của app đều dạy người dùng gõ ngày/tháng/năm.
 *
 * Dựng theo giờ ĐỊA PHƯƠNG — hạn chót là một thời điểm, xem
 * `../meetings/thoi-diem.ts`. Kiểm ngược sau khi dựng để `31/02` không âm thầm
 * cuộn sang tháng 3, giống `hanChotSangISO` ở màn tạo công việc.
 */
export function docHanChotAI(ngay?: string, gio?: string): KetQuaHanChotAI {
  const chuoiNgay = (ngay ?? '').trim();
  if (!chuoiNgay) return { iso: null, loi: null };

  const phanNgay = tachNgay(chuoiNgay);
  if (!phanNgay) return { iso: null, loi: LOI_NGAY };
  const [nam, thang, ngayTrongThang] = phanNgay;

  const chuoiGio = (gio ?? '').trim();
  const phanGio = chuoiGio ? tachGio(chuoiGio) : [0, 0];
  if (!phanGio) return { iso: null, loi: LOI_GIO };

  const d = new Date(nam, thang - 1, ngayTrongThang, phanGio[0], phanGio[1], 0, 0);
  if (d.getFullYear() !== nam || d.getMonth() !== thang - 1 || d.getDate() !== ngayTrongThang) {
    return { iso: null, loi: LOI_NGAY };
  }

  return { iso: d.toISOString(), loi: null };
}

/** Ghép ngày và giờ thành chuỗi ISO theo múi giờ thiết bị. Trả undefined nếu không hợp lệ. */
export function combineDueDateTime(date?: string, time?: string): string | undefined {
  return docHanChotAI(date, time).iso ?? undefined;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error('Đã xảy ra lỗi không xác định.');
}

/**
 * Luồng ba bước tạo công việc từ tin nhắn.
 *
 * Bước xin đề xuất AI đã chạy trước đó ở tầng giao diện. Hàm này lo hai bước còn lại:
 *   POST /tasks                    → tạo công việc
 *   PATCH /chat/:messageId/task    → gắn vào tin nhắn
 *
 * Hai lời gọi này KHÔNG có giao dịch chung. Nếu bước gắn hỏng thì công việc vẫn đã
 * được tạo thật, nên phải trả về `created-not-linked` kèm `task` để người dùng thử lại
 * ĐÚNG bước gắn, thay vì bấm lại từ đầu và tạo ra công việc trùng.
 */
export async function createTaskFromMessage(
  input: CreateTaskFromMessageInput,
): Promise<CreateTaskFromMessageResult> {
  let task: Task;

  if (input.existingTaskId) {
    task = { id: input.existingTaskId } as Task;
  } else {
    /*
      Có gõ ngày mà không đọc được thì DỪNG, đừng tạo một việc thiếu hạn chót
      rồi báo thành công — người dùng sẽ tin là hạn đã được lưu.
    */
    const han = docHanChotAI(input.dueDate, input.dueTime);
    if (han.loi) return { outcome: 'failed', error: new Error(han.loi) };
    const dueDate = han.iso;
    try {
      task = await createTask({
        title: input.title,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        ...(input.description ? { description: input.description } : {}),
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        ...(dueDate ? { dueDate } : {}),
      });
    } catch (err) {
      return { outcome: 'failed', error: toError(err) };
    }
  }

  try {
    const message = await linkMessageTask(input.projectId, input.messageId, task.id);
    return { outcome: 'created-and-linked', task, message };
  } catch (err) {
    return { outcome: 'created-not-linked', task, error: toError(err) };
  }
}
