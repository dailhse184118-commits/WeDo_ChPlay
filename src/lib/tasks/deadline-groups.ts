import type { Task } from '../types';

export type DeadlineBucket = 'pending' | 'overdue' | 'today' | 'thisWeek' | 'later' | 'noDueDate';

export interface DeadlineGroup {
  bucket: DeadlineBucket;
  label: string;
  tasks: Task[];
}

/** Thứ tự hiển thị. Việc chờ phản hồi luôn lên đầu vì nó cần hành động ngay. */
const BUCKET_ORDER: DeadlineBucket[] = [
  'pending',
  'overdue',
  'today',
  'thisWeek',
  'later',
  'noDueDate',
];

const BUCKET_LABEL: Record<DeadlineBucket, string> = {
  pending: 'Chờ bạn phản hồi',
  overdue: 'Quá hạn',
  today: 'Hôm nay',
  thisWeek: 'Tuần này',
  later: 'Sau đó',
  noDueDate: 'Không có hạn',
};

/** So sánh theo giờ địa phương của thiết bị, đúng cảm nhận "hôm nay" của người dùng. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * `GET /tasks` trả về mọi việc mà người dùng có quyền xem, không chỉ việc của họ.
 * API không có filter theo người phụ trách nên phải lọc ở client.
 */
export function myTasks(tasks: Task[], userId: string): Task[] {
  return tasks.filter((task) => task.assigneeId === userId && task.status !== 'DONE');
}

export function bucketOf(task: Task, now: Date): DeadlineBucket {
  if (task.assignmentStatus === 'PENDING') {
    return 'pending';
  }

  if (!task.dueDate) {
    return 'noDueDate';
  }

  const due = new Date(task.dueDate);
  if (Number.isNaN(due.getTime())) {
    return 'noDueDate';
  }

  // Việc đến hạn trong ngày hôm nay vẫn thuộc "Hôm nay" kể cả khi giờ đã trôi qua,
  // vì gọi nó là "Quá hạn" ngay trong ngày sẽ gây hoang mang không cần thiết.
  if (isSameDay(due, now)) {
    return 'today';
  }

  if (due.getTime() < now.getTime()) {
    return 'overdue';
  }

  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return due.getTime() <= sevenDaysLater.getTime() ? 'thisWeek' : 'later';
}

export function groupByDeadline(tasks: Task[], now: Date): DeadlineGroup[] {
  const byBucket = new Map<DeadlineBucket, Task[]>();

  for (const task of tasks) {
    const bucket = bucketOf(task, now);
    const list = byBucket.get(bucket) ?? [];
    list.push(task);
    byBucket.set(bucket, list);
  }

  return BUCKET_ORDER.filter((bucket) => (byBucket.get(bucket)?.length ?? 0) > 0).map((bucket) => ({
    bucket,
    label: BUCKET_LABEL[bucket],
    tasks: (byBucket.get(bucket) ?? []).sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }),
  }));
}
