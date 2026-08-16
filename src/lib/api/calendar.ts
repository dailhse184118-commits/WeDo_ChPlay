import { apiRequest } from './client';

/** Ba thứ cùng chiếm chỗ trên lịch của người dùng. */
export type LoaiMucLich = 'EVENT' | 'MEETING' | 'TASK_DEADLINE';

export interface MucLich {
  id: string;
  kind: LoaiMucLich;
  title: string;
  description?: string | null;
  /** Chuỗi ISO. Với hạn chót công việc thì trùng `endTime`. */
  startTime: string;
  endTime: string;
  workspaceId: string;
}

/**
 * Mọi thứ sắp diễn ra trong khoảng thời gian, đã sắp xếp sẵn.
 *
 * Máy chủ gộp ba nguồn — sự kiện, cuộc họp, hạn chót công việc — vào một danh
 * sách. Gọi ba lượt riêng rồi tự trộn ở máy khách là làm lại việc máy chủ đã
 * làm, và dễ sai thứ tự khi một nguồn về chậm.
 */
export function getCalendar(
  workspaceId: string,
  from: Date,
  to: Date,
): Promise<MucLich[]> {
  const params = new URLSearchParams({
    workspaceId,
    from: from.toISOString(),
    to: to.toISOString(),
  });
  return apiRequest<MucLich[]>(`/events/calendar?${params.toString()}`);
}
