/**
 * Sự kiện socket nào làm hỏng bộ nhớ đệm nào.
 *
 * Tách ra thành dữ liệu thuần để test được mà không cần dựng socket thật.
 */
export type RealtimeEvent = 'notification:new' | 'task:project:updated';

/** Khoá truy vấn cần báo hỏng khi nhận được sự kiện. */
export function keysToInvalidate(event: RealtimeEvent): string[][] {
  switch (event) {
    case 'notification:new':
      return [['notifications'], ['notifications-unread']];
    case 'task:project:updated':
      // Không biết việc thuộc không gian làm việc nào nên báo hỏng cả nhánh
      // 'tasks'; react-query khớp theo tiền tố khoá.
      return [['tasks'], ['task']];
  }
}

/**
 * Danh sách phòng dự án cần tham gia.
 *
 * Máy chủ tự cho vào phòng `user:<id>` lúc kết nối, nên thông báo cá nhân tới nơi
 * mà không cần làm gì. Riêng sự kiện công việc bắn theo phòng dự án, phải tự xin
 * vào từng phòng một.
 *
 * Giới hạn số phòng: mỗi lượt `join:project` là một lần máy chủ kiểm tra quyền
 * trong cơ sở dữ liệu. Người dùng có hàng trăm dự án thì lúc kết nối lại sẽ dội
 * một loạt truy vấn.
 */
export const MAX_JOINED_PROJECTS = 40;

export function projectRoomsToJoin(
  projects: Array<{ id: string }>,
  limit: number = MAX_JOINED_PROJECTS,
): string[] {
  const seen = new Set<string>();

  for (const project of projects) {
    if (!project?.id) continue;
    seen.add(project.id);
    if (seen.size >= limit) break;
  }

  return Array.from(seen);
}
