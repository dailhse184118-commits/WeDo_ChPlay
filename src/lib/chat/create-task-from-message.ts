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
  /** 'YYYY-MM-DD' */
  dueDate?: string;
  /** 'HH:mm' */
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

/** Ghép ngày và giờ thành chuỗi ISO theo múi giờ thiết bị. Trả undefined nếu không hợp lệ. */
export function combineDueDateTime(date?: string, time?: string): string | undefined {
  if (!date) return undefined;

  const parsed = new Date(`${date}T${time || '00:00'}:00`);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toISOString();
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
    const dueDate = combineDueDateTime(input.dueDate, input.dueTime);
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
