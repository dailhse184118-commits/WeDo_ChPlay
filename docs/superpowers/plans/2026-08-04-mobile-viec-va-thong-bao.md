# Kế hoạch 3 — Việc của tôi và Thông báo

> **Dành cho người thực thi:** SUB-SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để làm từng task một. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Hoàn tất hai tính năng sản phẩm còn lại — danh sách công việc được giao kèm nhận/từ chối, và trung tâm thông báo kèm nhắc hạn chót cục bộ trên máy.

**Kiến trúc:** REST cho dữ liệu, TanStack Query cho cache. Logic nhóm theo hạn chót và logic lên lịch nhắc là **hàm thuần**, tách khỏi React để test được. Nhắc hạn dùng `expo-notifications` với **báo thức không chính xác**.

**Công nghệ:** expo-notifications · TanStack Query v5 · date-fns

**Nền tảng:** kế hoạch 1 và 2 đã xong. 133 test đang xanh.

**Spec nguồn:** [`2026-08-02-wedo-android-design.md`](../specs/2026-08-02-wedo-android-design.md) mục 5.4 và 5.5.

---

## Áp dụng bộ thiết kế (quyết định ngày 04/08/2026)

Chủ dự án cung cấp bộ thiết kế **"WeDo mobile app design system"** gồm 22 màn hình Android. Quyết định: **các màn hình mới của kế hoạch 3 viết thẳng theo thiết kế này**, còn màn hình cũ của kế hoạch 1 và 2 tân trang sau — để không phải viết hai lần.

### Nền tảng đã dựng

| Thành phần | Nội dung |
|---|---|
| `src/theme/tokens.ts` | Thêm `primaryLight` `#2071dc`, `page` `#eef2f7`, ba màu pha nhạt `dangerSoft`/`successSoft`/`warningSoft`, `warningText` `#8a5200`, `gradients`, `shadows`, `sizes` |
| `src/components/ui/GradientHeader.tsx` | Header gradient 160°, bo góc dưới 24, tự cộng inset thanh trạng thái |
| `src/components/ui/Card.tsx` | Thẻ trắng nổi bóng `0 2px 12px rgba(0,60,140,.10)`, hỗ trợ chồng lên mép gradient |
| `src/components/ui/IconTile.tsx` | Ô 40×40 bo 10, bốn tông: info / deadline / done / rejected |

**Không cần `expo-linear-gradient`.** React Native 0.86 nhận chuỗi CSS qua `experimental_backgroundImage`, nên tránh được một module native và một lần build lại APK.

### Bốn thứ thiết kế yêu cầu mà API không có — đã bỏ

Người thiết kế đã dặn trước *"nếu không có dữ liệu này ở API thì bỏ"*:

| Thiết kế | Vì sao bỏ |
|---|---|
| Tin nhắn cuối + mốc thời gian ở danh sách dự án | `GET /projects` không trả về; muốn có phải gọi thêm một request cho mỗi dự án |
| Thanh tiến độ "bao nhiêu việc đã xong" | `_count.tasks` chỉ có tổng số, không có số đã xong |
| Nhãn "Người giao" ở chi tiết việc | `Task` không có trường người tạo, cả Prisma schema lẫn API |
| Ba ô thống kê ở màn Tài khoản | Không có endpoint |

### Hai cải tiến của người thiết kế đã áp dụng

**Ba chip lý do từ chối nhanh** — "Trùng deadline khác · Đang quá tải · Không đúng phần mình". Bắt buộc gõ tay sinh ra lý do rỗng kiểu "không rảnh"; chạm chip điền sẵn rồi vẫn sửa được. Server vẫn nhận đủ 3 ký tự.

**Trạng thái rỗng dạy cử chỉ ẩn.** Người thiết kế chỉ ra: *"Nhấn giữ là cử chỉ ẩn, tính năng cốt lõi của app không có chỗ nào nhìn thấy được."* Đây vừa là vấn đề trải nghiệm vừa là rủi ro bị Play từ chối vì thiếu chức năng. Trạng thái rỗng của "Việc của tôi" phải dùng đúng câu chữ dạy thao tác:

> Khi nhóm chốt việc trong chat, bạn **nhấn giữ tin nhắn** đó để WeDo tạo công việc. Việc giao cho bạn sẽ xuất hiện ở đây.

---

## Ràng buộc toàn cục

Kế thừa toàn bộ ràng buộc của kế hoạch 1 và 2, cộng thêm ba điều **quyết định việc app có được Play duyệt hay không**:

- **TUYỆT ĐỐI KHÔNG khai `USE_EXACT_ALARM` hay `SCHEDULE_EXACT_ALARM`.** Google giới hạn quyền này cho app mà chức năng lõi là đồng hồ báo thức, hẹn giờ hoặc lịch. WeDo là app quản lý công việc nên **không đủ điều kiện**, và app xin quyền này *"will be disallowed from publishing on Google Play"*. Dùng báo thức không chính xác, mặc định của `expo-notifications`.
- **Nhắc hạn cục bộ là "cố gắng hết sức".** Dưới chế độ Doze, thông báo có thể trễ vài phút đến vài giờ. Đây là hành vi đã chấp nhận, không phải lỗi. Nó cũng là lập luận kỹ thuật cho Giai đoạn 2 (FCM).
- **Xin quyền `POST_NOTIFICATIONS` đúng lúc.** Android 13+ bắt buộc hỏi. Hỏi **lần đầu người dùng mở tab Thông báo**, kèm màn hình giải thích lý do trước khi gọi hộp thoại hệ thống. Không hỏi ở lần mở app đầu tiên.

Và ba ràng buộc kỹ thuật đã học được ở kế hoạch 2:

- **`expo-notifications` là module native → BẮT BUỘC build lại APK development client.** Đã vấp ba lần với `expo-crypto` và `expo-haptics`. Xem Task 9.
- **Thêm file route mới thì phải chạy lại `npx expo start`** để expo-router sinh lại `.expo/types/router.d.ts`, nếu không `tsc` sẽ báo đỏ.
- **`@testing-library/react-native` 14 là API bất đồng bộ:** `await render(...)`, `await fireEvent...`, destructure query từ kết quả `render`.

---

## Hợp đồng API đã kiểm chứng

Đọc trực tiếp từ `BE_WEDO/src/tasks` và `BE_WEDO/src/notifications`.

### Công việc

```
GET   /tasks?workspaceId=&projectId=   → Task[]
GET   /tasks/:id                       → Task
POST  /tasks/:id/accept                → Task
POST  /tasks/:id/reject  { reason }    → Task
```

| Điều kiện | Chi tiết |
|---|---|
| `GET /tasks` | Đã lọc theo quyền truy cập, **nhưng không lọc theo người phụ trách**. Phải lọc client-side `assigneeId === me` |
| `accept` | Chỉ khi `assigneeId === me` **và** `assignmentStatus === 'PENDING'`. Sai điều kiện → 403 hoặc 400 *"Task này không còn ở trạng thái chờ phản hồi"*. Thành công → `status: IN_PROGRESS`, `assignmentStatus: ACCEPTED` |
| `reject` | Cùng điều kiện. `reason` **bắt buộc, tối thiểu 3 ký tự** (`RejectTaskDto`). Thành công → `status: TODO`, `assignmentStatus: REJECTED`, lưu `rejectionReason` |
| **`PATCH /tasks/:id`** | **KHÔNG DÙNG.** Gọi `ensureProjectLeader`, ném 403 với thành viên thường. Xem ghi chú sửa spec |

### Thông báo

```
GET   /notifications                 → NotificationItem[]
GET   /notifications/unread-count
GET   /notifications/preferences     → { notifyTaskAssignment, notifyTaskReview,
                                         notifyDeadlineReminder, notifyMeeting }
PATCH /notifications/preferences     → cả bốn trường đều tuỳ chọn
PATCH /notifications/:id/read
POST  /notifications/read-all
```

`NotificationItem` có `type`, `title`, `message`, `readAt`, `actionUrl`, và các khoá liên kết `taskId` / `projectId` / `workspaceId` để điều hướng.

Backend đã có cron chạy mỗi 5 phút sinh thông báo `TASK_DEADLINE_REMINDER`. Kế hoạch này chỉ đọc ra, không tạo.

### Sự kiện socket dùng thêm

`notification:new` — server phát tới phòng `user:<userId>`, client tự vào phòng này khi kết nối nên **không cần join gì**. Payload là `NotificationItem`.

---

## Cấu trúc file sau kế hoạch này

| File | Trách nhiệm |
|---|---|
| `src/lib/types.ts` | *(mở rộng)* `NotificationItem`, `NotificationPreferences` |
| `src/lib/api/notifications.ts` | 6 hàm gọi API thông báo |
| `src/lib/api/tasks.ts` | *(mở rộng)* `listTasks`, `getTask`, `acceptTask`, `rejectTask` |
| `src/lib/tasks/deadline-groups.ts` | Hàm thuần nhóm công việc theo hạn chót |
| `src/lib/notifications/scheduler.ts` | Hàm thuần tính lịch nhắc + lớp bọc `expo-notifications` |
| `src/lib/notifications/permission.ts` | Xin quyền `POST_NOTIFICATIONS`, không bao giờ ném lỗi |
| `src/components/tasks/TaskRow.tsx` | Một dòng công việc |
| `src/components/tasks/RejectTaskSheet.tsx` | Ô nhập lý do từ chối |
| `src/components/notifications/NotificationRow.tsx` | Một dòng thông báo |
| `src/app/(tabs)/tasks/index.tsx` | *(thay thế)* danh sách việc của tôi |
| `src/app/(tabs)/tasks/[taskId].tsx` | Chi tiết công việc |
| `src/app/(tabs)/notifications/index.tsx` | *(thay thế)* trung tâm thông báo |
| `src/app/account/notification-settings.tsx` | Bật tắt loại thông báo |

---

## Task 1: Mở rộng kiểu và module API

**Files:**
- Modify: `src/lib/types.ts`, `src/lib/api/tasks.ts`
- Create: `src/lib/api/notifications.ts`
- Test: `src/lib/api/__tests__/notifications.test.ts`

**Interfaces:**
- Produces:
  - `listTasks(workspaceId?, projectId?): Promise<Task[]>`
  - `getTask(id: string): Promise<Task>`
  - `acceptTask(id: string): Promise<Task>`
  - `rejectTask(id: string, reason: string): Promise<Task>`
  - `listNotifications(): Promise<NotificationItem[]>`
  - `getUnreadCount(): Promise<{ count: number }>`
  - `getPreferences(): Promise<NotificationPreferences>`
  - `updatePreferences(patch: Partial<NotificationPreferences>): Promise<NotificationPreferences>`
  - `markNotificationRead(id: string): Promise<unknown>`
  - `markAllNotificationsRead(): Promise<unknown>`

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/api/__tests__/notifications.test.ts`:

```ts
import {
  listNotifications,
  getUnreadCount,
  getPreferences,
  updatePreferences,
  markNotificationRead,
  markAllNotificationsRead,
} from '../notifications';
import { listTasks, getTask, acceptTask, rejectTask } from '../tasks';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API công việc', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET /tasks kèm workspaceId', async () => {
    await listTasks('w1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks?workspaceId=w1');
  });

  it('GET /tasks kèm cả projectId', async () => {
    await listTasks('w1', 'p1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks?workspaceId=w1&projectId=p1');
  });

  it('GET /tasks không tham số khi thiếu workspaceId', async () => {
    await listTasks();
    expect(mockedRequest).toHaveBeenCalledWith('/tasks');
  });

  it('GET chi tiết công việc', async () => {
    await getTask('t1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1');
  });

  it('POST nhận việc', async () => {
    await acceptTask('t1');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1/accept', { method: 'POST' });
  });

  it('POST từ chối việc kèm lý do đã cắt khoảng trắng', async () => {
    await rejectTask('t1', '  Bận thi cuối kỳ  ');
    expect(mockedRequest).toHaveBeenCalledWith('/tasks/t1/reject', {
      method: 'POST',
      body: { reason: 'Bận thi cuối kỳ' },
    });
  });

  it('chặn từ chối khi lý do ngắn hơn 3 ký tự', async () => {
    await expect(rejectTask('t1', 'ok')).rejects.toThrow(
      'Lý do từ chối phải có ít nhất 3 ký tự',
    );
    expect(mockedRequest).not.toHaveBeenCalled();
  });
});

describe('API thông báo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET danh sách thông báo', async () => {
    await listNotifications();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications');
  });

  it('GET số chưa đọc', async () => {
    await getUnreadCount();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/unread-count');
  });

  it('GET tuỳ chọn thông báo', async () => {
    await getPreferences();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/preferences');
  });

  it('PATCH tuỳ chọn, chỉ gửi trường được đổi', async () => {
    await updatePreferences({ notifyDeadlineReminder: false });
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/preferences', {
      method: 'PATCH',
      body: { notifyDeadlineReminder: false },
    });
  });

  it('PATCH đánh dấu một thông báo đã đọc', async () => {
    await markNotificationRead('n1');
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/n1/read', { method: 'PATCH' });
  });

  it('POST đánh dấu tất cả đã đọc', async () => {
    await markAllNotificationsRead();
    expect(mockedRequest).toHaveBeenCalledWith('/notifications/read-all', { method: 'POST' });
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest api/__tests__/notifications
```

Kỳ vọng: FAIL với "Cannot find module '../notifications'".

- [ ] **Bước 3: Mở rộng `src/lib/types.ts`**

Thêm vào cuối file:

```ts
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  dedupeKey?: string | null;
  actionUrl?: string | null;
  readAt?: string | null;
  userId: string;
  actorId?: string | null;
  workspaceId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string;
  actor?: UserSummary | null;
  task?: Pick<Task, 'id' | 'title' | 'status' | 'assignmentStatus'> | null;
}

export interface NotificationPreferences {
  notifyTaskAssignment: boolean;
  notifyTaskReview: boolean;
  notifyDeadlineReminder: boolean;
  notifyMeeting: boolean;
}
```

- [ ] **Bước 4: Mở rộng `src/lib/api/tasks.ts`**

Thêm vào cuối file, giữ nguyên `createTask` đang có:

```ts
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
```

- [ ] **Bước 5: Tạo `src/lib/api/notifications.ts`**

```ts
import { apiRequest } from './client';
import type { NotificationItem, NotificationPreferences } from '../types';

export function listNotifications(): Promise<NotificationItem[]> {
  return apiRequest<NotificationItem[]>('/notifications');
}

export function getUnreadCount(): Promise<{ count: number }> {
  return apiRequest<{ count: number }>('/notifications/unread-count');
}

export function getPreferences(): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/notifications/preferences');
}

/** Cả bốn trường đều tuỳ chọn phía server, nên chỉ gửi đúng thứ vừa đổi. */
export function updatePreferences(
  patch: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  return apiRequest<NotificationPreferences>('/notifications/preferences', {
    method: 'PATCH',
    body: patch,
  });
}

export function markNotificationRead(id: string): Promise<unknown> {
  return apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return apiRequest('/notifications/read-all', { method: 'POST' });
}
```

- [ ] **Bước 6: Chạy test, xác nhận pass**

```bash
npx jest api/__tests__/notifications
```

Kỳ vọng: PASS, 13 test.

- [ ] **Bước 7: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/types.ts src/lib/api/tasks.ts src/lib/api/notifications.ts src/lib/api/__tests__/notifications.test.ts
```

```bash
git commit -m "feat: them API cong viec va thong bao"
```

---

## Task 2: Nhóm công việc theo hạn chót

**Files:**
- Create: `src/lib/tasks/deadline-groups.ts`
- Test: `src/lib/tasks/__tests__/deadline-groups.test.ts`

**Interfaces:**
- Produces:
  - `type DeadlineBucket = 'pending' | 'overdue' | 'today' | 'thisWeek' | 'later' | 'noDueDate'`
  - `bucketOf(task: Task, now: Date): DeadlineBucket`
  - `groupByDeadline(tasks: Task[], now: Date): Array<{ bucket: DeadlineBucket; label: string; tasks: Task[] }>`
  - `myTasks(tasks: Task[], userId: string): Task[]`

**Yêu cầu hành vi:**
- Hàm thuần, nhận `now` làm tham số để test được, không gọi `Date.now()` bên trong
- Việc `assignmentStatus === 'PENDING'` luôn vào nhóm `pending` bất kể hạn chót, và nhóm này đứng đầu
- Việc `status === 'DONE'` bị loại khỏi danh sách
- Nhóm rỗng không xuất hiện trong kết quả

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/tasks/__tests__/deadline-groups.test.ts`:

```ts
import { bucketOf, groupByDeadline, myTasks } from '../deadline-groups';
import type { Task } from '../../types';

const NOW = new Date('2026-08-04T10:00:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('myTasks', () => {
  it('chỉ giữ việc giao cho mình', () => {
    const list = [makeTask({ id: 'a', assigneeId: 'u1' }), makeTask({ id: 'b', assigneeId: 'u2' })];
    expect(myTasks(list, 'u1').map((t) => t.id)).toEqual(['a']);
  });

  it('loại việc chưa giao ai', () => {
    const list = [makeTask({ id: 'a', assigneeId: null })];
    expect(myTasks(list, 'u1')).toEqual([]);
  });

  it('loại việc đã hoàn thành', () => {
    const list = [makeTask({ id: 'a', status: 'DONE' }), makeTask({ id: 'b', status: 'TODO' })];
    expect(myTasks(list, 'u1').map((t) => t.id)).toEqual(['b']);
  });
});

describe('bucketOf', () => {
  it('việc chờ phản hồi luôn vào nhóm pending', () => {
    const task = makeTask({ assignmentStatus: 'PENDING', dueDate: '2027-01-01T00:00:00.000Z' });
    expect(bucketOf(task, NOW)).toBe('pending');
  });

  it('không có hạn chót', () => {
    expect(bucketOf(makeTask({ dueDate: null }), NOW)).toBe('noDueDate');
  });

  it('quá hạn', () => {
    expect(bucketOf(makeTask({ dueDate: '2026-08-03T10:00:00.000Z' }), NOW)).toBe('overdue');
  });

  it('hôm nay', () => {
    expect(bucketOf(makeTask({ dueDate: '2026-08-04T20:00:00.000Z' }), NOW)).toBe('today');
  });

  it('trong tuần này', () => {
    expect(bucketOf(makeTask({ dueDate: '2026-08-08T10:00:00.000Z' }), NOW)).toBe('thisWeek');
  });

  it('xa hơn một tuần', () => {
    expect(bucketOf(makeTask({ dueDate: '2026-09-01T10:00:00.000Z' }), NOW)).toBe('later');
  });

  it('hạn chót không hợp lệ coi như không có hạn', () => {
    expect(bucketOf(makeTask({ dueDate: 'khong-phai-ngay' }), NOW)).toBe('noDueDate');
  });
});

describe('groupByDeadline', () => {
  it('trả mảng rỗng khi không có việc nào', () => {
    expect(groupByDeadline([], NOW)).toEqual([]);
  });

  it('bỏ nhóm rỗng', () => {
    const groups = groupByDeadline([makeTask({ dueDate: null })], NOW);
    expect(groups).toHaveLength(1);
    expect(groups[0].bucket).toBe('noDueDate');
  });

  it('sắp xếp nhóm theo đúng thứ tự ưu tiên', () => {
    const groups = groupByDeadline(
      [
        makeTask({ id: 'later', dueDate: '2026-09-01T10:00:00.000Z' }),
        makeTask({ id: 'overdue', dueDate: '2026-08-01T10:00:00.000Z' }),
        makeTask({ id: 'pending', assignmentStatus: 'PENDING' }),
        makeTask({ id: 'today', dueDate: '2026-08-04T20:00:00.000Z' }),
      ],
      NOW,
    );
    expect(groups.map((g) => g.bucket)).toEqual(['pending', 'overdue', 'today', 'later']);
  });

  it('trong mỗi nhóm sắp theo hạn chót tăng dần', () => {
    const groups = groupByDeadline(
      [
        makeTask({ id: 'muon', dueDate: '2026-08-04T22:00:00.000Z' }),
        makeTask({ id: 'som', dueDate: '2026-08-04T12:00:00.000Z' }),
      ],
      NOW,
    );
    expect(groups[0].tasks.map((t) => t.id)).toEqual(['som', 'muon']);
  });

  it('nhãn nhóm là tiếng Việt', () => {
    const groups = groupByDeadline([makeTask({ dueDate: '2026-08-01T10:00:00.000Z' })], NOW);
    expect(groups[0].label).toBe('Quá hạn');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest deadline-groups
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/tasks/deadline-groups.ts`:

```ts
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

  if (due.getTime() < now.getTime()) {
    return isSameDay(due, now) ? 'today' : 'overdue';
  }

  if (isSameDay(due, now)) {
    return 'today';
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
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest deadline-groups
```

Kỳ vọng: PASS, 16 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/tasks/deadline-groups.ts src/lib/tasks/__tests__/deadline-groups.test.ts
```

```bash
git commit -m "feat: them logic nhom cong viec theo han chot"
```

---

## Task 3: Component dòng công việc và ô từ chối

**Files:**
- Create: `src/components/tasks/TaskRow.tsx`, `src/components/tasks/RejectTaskSheet.tsx`
- Test: `src/components/tasks/__tests__/TaskRow.test.tsx`, `src/components/tasks/__tests__/RejectTaskSheet.test.tsx`

**Interfaces:**
- Produces:
  - `<TaskRow task now onPress onAccept onReject accepting />`
  - `<RejectTaskSheet visible submitting error onConfirm onDismiss />`

**Yêu cầu hành vi:**
- Chỉ việc `assignmentStatus === 'PENDING'` mới hiện hai nút Nhận / Từ chối
- Việc quá hạn hiện hạn chót màu đỏ
- Ô từ chối chặn gửi khi lý do dưới 3 ký tự, khớp ràng buộc server

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/components/tasks/__tests__/TaskRow.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { TaskRow } from '../TaskRow';
import type { Task } from '../../../lib/types';

const NOW = new Date('2026-08-04T10:00:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo tuần',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TaskRow', () => {
  it('hiện tiêu đề công việc', async () => {
    const { getByText } = await render(
      <TaskRow task={makeTask()} now={NOW} onPress={() => {}} />,
    );
    expect(getByText('Nộp báo cáo tuần')).toBeTruthy();
  });

  it('ẩn nút nhận và từ chối với việc đã nhận', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ assignmentStatus: 'ACCEPTED' })} now={NOW} onPress={() => {}} />,
    );
    expect(queryByTestId('task-accept-t1')).toBeNull();
    expect(queryByTestId('task-reject-t1')).toBeNull();
  });

  it('hiện hai nút với việc chờ phản hồi', async () => {
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={() => {}}
        onReject={() => {}}
      />,
    );
    expect(getByTestId('task-accept-t1')).toBeTruthy();
    expect(getByTestId('task-reject-t1')).toBeTruthy();
  });

  it('gọi onAccept khi bấm Nhận', async () => {
    const onAccept = jest.fn();
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={onAccept}
        onReject={() => {}}
      />,
    );

    await fireEvent.press(getByTestId('task-accept-t1'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('gọi onReject khi bấm Từ chối', async () => {
    const onReject = jest.fn();
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ assignmentStatus: 'PENDING' })}
        now={NOW}
        onPress={() => {}}
        onAccept={() => {}}
        onReject={onReject}
      />,
    );

    await fireEvent.press(getByTestId('task-reject-t1'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('gọi onPress khi nhấn vào dòng', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <TaskRow task={makeTask()} now={NOW} onPress={onPress} />,
    );

    await fireEvent.press(getByTestId('task-row-t1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('không hiện hạn chót khi việc không có hạn', async () => {
    const { queryByTestId } = await render(
      <TaskRow task={makeTask({ dueDate: null })} now={NOW} onPress={() => {}} />,
    );
    expect(queryByTestId('task-due-t1')).toBeNull();
  });

  it('hiện hạn chót khi có', async () => {
    const { getByTestId } = await render(
      <TaskRow
        task={makeTask({ dueDate: '2026-08-10T09:00:00.000Z' })}
        now={NOW}
        onPress={() => {}}
      />,
    );
    expect(getByTestId('task-due-t1')).toBeTruthy();
  });
});
```

Tạo `src/components/tasks/__tests__/RejectTaskSheet.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { RejectTaskSheet } from '../RejectTaskSheet';

describe('RejectTaskSheet', () => {
  it('chặn gửi khi lý do quá ngắn', async () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByText } = await render(
      <RejectTaskSheet visible onConfirm={onConfirm} onDismiss={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('reject-reason'), 'ok');
    await fireEvent.press(getByTestId('reject-confirm'));

    await waitFor(() => expect(getByText('Lý do từ chối phải có ít nhất 3 ký tự')).toBeTruthy());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('gửi lý do đã cắt khoảng trắng', async () => {
    const onConfirm = jest.fn();
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={onConfirm} onDismiss={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('reject-reason'), '  Bận thi cuối kỳ  ');
    await fireEvent.press(getByTestId('reject-confirm'));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('Bận thi cuối kỳ'));
  });

  it('hiện lỗi từ máy chủ khi được truyền vào', async () => {
    const { getByText } = await render(
      <RejectTaskSheet
        visible
        error="Task này không còn ở trạng thái chờ phản hồi"
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Task này không còn ở trạng thái chờ phản hồi')).toBeTruthy();
  });

  it('gọi onDismiss khi bấm huỷ', async () => {
    const onDismiss = jest.fn();
    const { getByTestId } = await render(
      <RejectTaskSheet visible onConfirm={() => {}} onDismiss={onDismiss} />,
    );

    await fireEvent.press(getByTestId('reject-cancel'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest "TaskRow|RejectTaskSheet"
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết `TaskRow`**

Tạo `src/components/tasks/TaskRow.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Task } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface TaskRowProps {
  task: Task;
  now: Date;
  onPress: () => void;
  onAccept?: () => void;
  onReject?: () => void;
  accepting?: boolean;
}

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  REVIEW: 'Chờ duyệt',
  DONE: 'Xong',
};

function formatDue(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function TaskRow({ task, now, onPress, onAccept, onReject, accepting }: TaskRowProps) {
  const pending = task.assignmentStatus === 'PENDING';
  const overdue = Boolean(
    task.dueDate && !Number.isNaN(new Date(task.dueDate).getTime()) &&
      new Date(task.dueDate).getTime() < now.getTime(),
  );

  return (
    <Pressable
      testID={`task-row-${task.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={styles.statusChip}>
          <Text style={styles.statusText}>{STATUS_LABEL[task.status]}</Text>
        </View>
      </View>

      {task.project ? (
        <Text style={styles.project} numberOfLines={1}>
          {task.project.name}
        </Text>
      ) : null}

      {task.dueDate ? (
        <Text
          testID={`task-due-${task.id}`}
          style={[styles.due, overdue ? styles.dueOverdue : null]}
        >
          Hạn: {formatDue(task.dueDate)}
        </Text>
      ) : null}

      {pending && onAccept && onReject ? (
        <View style={styles.actions}>
          <Pressable
            testID={`task-accept-${task.id}`}
            accessibilityRole="button"
            disabled={accepting}
            onPress={onAccept}
            style={[styles.accept, accepting ? styles.disabled : null]}
          >
            <Text style={styles.acceptText}>Nhận việc</Text>
          </Pressable>

          <Pressable
            testID={`task-reject-${task.id}`}
            accessibilityRole="button"
            disabled={accepting}
            onPress={onReject}
            style={[styles.reject, accepting ? styles.disabled : null]}
          >
            <Text style={styles.rejectText}>Từ chối</Text>
          </Pressable>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  title: { flex: 1, fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  statusChip: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  statusText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
  project: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  due: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  dueOverdue: { color: colors.danger, fontWeight: '600' },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  accept: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptText: { color: '#ffffff', fontWeight: '700', fontSize: fontSize.sm },
  reject: {
    flex: 1,
    minHeight: 40,
    marginLeft: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectText: { color: colors.danger, fontWeight: '600', fontSize: fontSize.sm },
  disabled: { opacity: 0.5 },
});
```

- [ ] **Bước 4: Viết `RejectTaskSheet`**

Tạo `src/components/tasks/RejectTaskSheet.tsx`:

```tsx
import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface RejectTaskSheetProps {
  visible: boolean;
  submitting?: boolean;
  error?: string;
  onConfirm: (reason: string) => void;
  onDismiss: () => void;
}

export function RejectTaskSheet({
  visible,
  submitting = false,
  error,
  onConfirm,
  onDismiss,
}: RejectTaskSheetProps) {
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  const handleConfirm = () => {
    const trimmed = reason.trim();
    // Khớp ràng buộc MinLength(3) của RejectTaskDto phía server.
    if (trimmed.length < 3) {
      setLocalError('Lý do từ chối phải có ít nhất 3 ký tự');
      return;
    }
    setLocalError('');
    onConfirm(trimmed);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.heading}>Từ chối công việc</Text>
        <Text style={styles.body}>
          Người giao việc sẽ nhận được lý do này, nên hãy viết rõ ràng.
        </Text>

        {error ? <ErrorBanner message={error} /> : null}
        {localError ? <ErrorBanner message={localError} /> : null}

        <TextField
          testID="reject-reason"
          label="Lý do"
          value={reason}
          onChangeText={setReason}
          placeholder="Ví dụ: Tuần này mình bận thi cuối kỳ"
          autoCapitalize="sentences"
        />

        <Button
          testID="reject-confirm"
          label="Gửi từ chối"
          variant="danger"
          onPress={handleConfirm}
          loading={submitting}
        />

        <Pressable testID="reject-cancel" onPress={onDismiss} style={styles.cancel}>
          <Text style={styles.cancelText}>Huỷ</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  handle: {
    width: 44,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  body: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  cancel: { marginTop: spacing.md, alignItems: 'center' },
  cancelText: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
});
```

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npx jest "TaskRow|RejectTaskSheet"
```

Kỳ vọng: PASS, 12 test.

- [ ] **Bước 6: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/components/tasks
```

```bash
git commit -m "feat: them component dong cong viec va o tu choi"
```

---

## Task 4: Màn hình Việc của tôi

**Trạng thái: XONG (05/08/2026).** Viết thẳng theo bộ thiết kế mới: `GradientHeader` với ba ô đếm Đang mở / Chờ nhận / Quá hạn, `SectionList` nhóm theo hạn, trạng thái rỗng dạy cử chỉ nhấn giữ.

**Files:**
- Modify: `src/app/(tabs)/tasks/index.tsx`

**Interfaces:**
- Consumes: `listTasks`, `acceptTask`, `rejectTask`, `myTasks`, `groupByDeadline`, `TaskRow`, `RejectTaskSheet`, `useAuth`, `useWorkspace`

**Yêu cầu hành vi:**
- `SectionList` theo nhóm hạn chót
- Sau khi nhận hoặc từ chối, làm mới danh sách để trạng thái đồng bộ với server
- Empty state tiếng Việt rõ ràng — quan trọng với người duyệt Play
- Lỗi từ server hiện nguyên văn (đã là tiếng Việt)

- [ ] **Bước 1: Thay toàn bộ `src/app/(tabs)/tasks/index.tsx`**

```tsx
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, RefreshControl, SectionList, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { RejectTaskSheet } from '../../../components/tasks/RejectTaskSheet';
import { TaskRow } from '../../../components/tasks/TaskRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { acceptTask, listTasks, rejectTask } from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { groupByDeadline, myTasks } from '../../../lib/tasks/deadline-groups';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../../theme/tokens';

export default function MyTasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const queryClient = useQueryClient();

  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const tasksQuery = useQuery({
    queryKey: ['tasks', active?.id],
    queryFn: () => listTasks(active?.id),
    enabled: Boolean(active?.id),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['tasks', active?.id] });
  }, [queryClient, active?.id]);

  const acceptMutation = useMutation({
    mutationFn: (taskId: string) => acceptTask(taskId),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không nhận được việc này.'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ taskId, reason }: { taskId: string; reason: string }) =>
      rejectTask(taskId, reason),
    onSuccess: () => {
      setActionError('');
      setRejectingId(null);
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không từ chối được việc này.'),
  });

  // Tính lại mỗi lần dữ liệu đổi. `now` chốt một lần cho toàn bộ lần render
  // để mọi việc được phân nhóm theo cùng một mốc thời gian.
  const sections = useMemo(() => {
    const now = new Date();
    const mine = myTasks(tasksQuery.data ?? [], user?.id ?? '');
    return groupByDeadline(mine, now).map((group) => ({
      title: group.label,
      data: group.tasks,
      now,
    }));
  }, [tasksQuery.data, user?.id]);

  if (tasksQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Text style={styles.heading}>Việc của tôi</Text>

      {tasksQuery.isError ? (
        <ErrorBanner
          message={
            tasksQuery.error instanceof Error
              ? tasksQuery.error.message
              : 'Không tải được danh sách công việc.'
          }
        />
      ) : null}
      {actionError ? <ErrorBanner message={actionError} /> : null}

      <SectionList
        sections={sections}
        keyExtractor={(task) => task.id}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item, section }) => (
          <TaskRow
            task={item}
            now={section.now}
            accepting={acceptMutation.isPending || rejectMutation.isPending}
            onPress={() => router.push(`/tasks/${item.id}`)}
            onAccept={() => acceptMutation.mutate(item.id)}
            onReject={() => {
              setActionError('');
              setRejectingId(item.id);
            }}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={tasksQuery.isRefetching}
            onRefresh={() => tasksQuery.refetch()}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          tasksQuery.isError ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có việc nào được giao</Text>
              <Text style={styles.emptyBody}>
                Khi ai đó giao việc cho bạn, hoặc bạn tạo việc từ một tin nhắn trong nhóm, việc đó
                sẽ xuất hiện ở đây.
              </Text>
            </View>
          )
        }
      />

      <RejectTaskSheet
        visible={rejectingId !== null}
        submitting={rejectMutation.isPending}
        error={actionError || undefined}
        onConfirm={(reason) => {
          if (rejectingId) rejectMutation.mutate({ taskId: rejectingId, reason });
        }}
        onDismiss={() => setRejectingId(null)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
```

- [ ] **Bước 2: Kiểm tra kiểu và chạy test**

```bash
npx tsc --noEmit
```

```bash
npm test
```

Kỳ vọng: exit 0, toàn bộ test PASS.

- [ ] **Bước 3: Commit — lệnh cho chủ dự án chạy**

```bash
git add "src/app/(tabs)/tasks/index.tsx"
```

```bash
git commit -m "feat: them man hinh viec cua toi"
```

---

## Task 5: Màn hình chi tiết công việc

**Trạng thái: XONG (05/08/2026).** Dạng thẻ với `IconTile` cho từng dòng thông tin, ô lý do từ chối, hai nút Nhận / Từ chối. Không có nút đổi trạng thái — `PATCH /tasks/:id` đòi quyền trưởng dự án, đã ghi trong bản đặc tả sửa đổi 04/08.

**Files:**
- Create: `src/app/(tabs)/tasks/[taskId].tsx`

**Yêu cầu hành vi:** hiện đầy đủ tiêu đề, mô tả, trạng thái, hạn chót, người phụ trách, dự án. Nếu bị từ chối thì hiện `rejectionReason`. Nếu `assignmentStatus === 'PENDING'` thì cho nhận hoặc từ chối ngay tại đây.

- [ ] **Bước 1: Tạo màn hình**

```tsx
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Button } from '../../../components/ui/Button';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { RejectTaskSheet } from '../../../components/tasks/RejectTaskSheet';
import { acceptTask, getTask, rejectTask } from '../../../lib/api/tasks';
import type { Task } from '../../../lib/types';
import { colors, fontSize, radius, spacing } from '../../../theme/tokens';

const STATUS_LABEL: Record<Task['status'], string> = {
  TODO: 'Cần làm',
  IN_PROGRESS: 'Đang làm',
  REVIEW: 'Chờ duyệt',
  DONE: 'Xong',
};

const ASSIGNMENT_LABEL: Record<string, string> = {
  PENDING: 'Chờ bạn phản hồi',
  ACCEPTED: 'Đã nhận',
  REJECTED: 'Đã từ chối',
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${date.getFullYear()} ${hh}:${mi}`;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const queryClient = useQueryClient();

  const [rejecting, setRejecting] = useState(false);
  const [actionError, setActionError] = useState('');

  const taskQuery = useQuery({
    queryKey: ['task', taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId),
  });

  const invalidate = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['task', taskId] });
    void queryClient.invalidateQueries({ queryKey: ['tasks'] });
  }, [queryClient, taskId]);

  const acceptMutation = useMutation({
    mutationFn: () => acceptTask(taskId as string),
    onSuccess: () => {
      setActionError('');
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không nhận được việc này.'),
  });

  const rejectMutation = useMutation({
    mutationFn: (reason: string) => rejectTask(taskId as string, reason),
    onSuccess: () => {
      setActionError('');
      setRejecting(false);
      invalidate();
    },
    onError: (err) =>
      setActionError(err instanceof Error ? err.message : 'Không từ chối được việc này.'),
  });

  const task = taskQuery.data;

  if (taskQuery.isLoading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ headerShown: true, title: 'Chi tiết công việc' }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: 'Chi tiết công việc' }} />

      <ScrollView>
        {taskQuery.isError ? (
          <ErrorBanner
            message={
              taskQuery.error instanceof Error
                ? taskQuery.error.message
                : 'Không tải được công việc.'
            }
          />
        ) : null}
        {actionError ? <ErrorBanner message={actionError} /> : null}

        {task ? (
          <>
            <Text style={styles.title}>{task.title}</Text>

            {task.description ? <Text style={styles.description}>{task.description}</Text> : null}

            <View style={styles.card}>
              <Row label="Trạng thái" value={STATUS_LABEL[task.status]} />
              <Row
                label="Phân công"
                value={
                  task.assignmentStatus ? ASSIGNMENT_LABEL[task.assignmentStatus] ?? '—' : '—'
                }
              />
              <Row label="Hạn chót" value={formatDateTime(task.dueDate)} />
              <Row label="Người phụ trách" value={task.assignee?.fullName ?? 'Chưa giao'} />
              <Row label="Dự án" value={task.project?.name ?? '—'} />
            </View>

            {task.rejectionReason ? (
              <View style={styles.rejectBox}>
                <Text style={styles.rejectTitle}>Lý do từ chối</Text>
                <Text style={styles.rejectText}>{task.rejectionReason}</Text>
              </View>
            ) : null}

            {task.assignmentStatus === 'PENDING' ? (
              <View style={styles.actions}>
                <Button
                  testID="detail-accept"
                  label="Nhận việc"
                  onPress={() => acceptMutation.mutate()}
                  loading={acceptMutation.isPending}
                />
                <View style={styles.actionSpacer} />
                <Button
                  testID="detail-reject"
                  label="Từ chối"
                  variant="danger"
                  onPress={() => {
                    setActionError('');
                    setRejecting(true);
                  }}
                />
              </View>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <RejectTaskSheet
        visible={rejecting}
        submitting={rejectMutation.isPending}
        error={actionError || undefined}
        onConfirm={(reason) => rejectMutation.mutate(reason)}
        onDismiss={() => setRejecting(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  description: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.sm },
  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600', flexShrink: 1 },
  rejectBox: {
    marginTop: spacing.md,
    backgroundColor: '#fdecea',
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  rejectTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.danger },
  rejectText: { fontSize: fontSize.sm, color: colors.text, marginTop: spacing.xs },
  actions: { flexDirection: 'row', marginTop: spacing.lg, marginBottom: spacing.xl },
  actionSpacer: { width: spacing.md },
});
```

- [ ] **Bước 2: Sinh lại kiểu route rồi kiểm tra**

Thêm file route mới nên **phải** chạy lại dev server để expo-router sinh `.expo/types/router.d.ts`:

```bash
npx expo start
```

Đợi tới khi hiện `Waiting on http://localhost:8081`, rồi ở cửa sổ khác:

```bash
npx tsc --noEmit
```

Kỳ vọng: exit 0. Nếu vẫn báo `/tasks/${string}` không hợp lệ thì dev server chưa sinh xong kiểu.

- [ ] **Bước 3: Commit — lệnh cho chủ dự án chạy**

```bash
git add "src/app/(tabs)/tasks/[taskId].tsx"
```

```bash
git commit -m "feat: them man hinh chi tiet cong viec"
```

---

## Task 6: Lịch nhắc hạn chót cục bộ

**Trạng thái: XONG (05/08/2026).** `planReminders` là hàm thuần, 12 test.

**Files:**
- Create: `src/lib/notifications/scheduler.ts`
- Test: `src/lib/notifications/__tests__/scheduler.test.ts`

**Interfaces:**
- Produces:
  - `type ReminderPlan = { taskId: string; title: string; body: string; fireAt: Date }`
  - `planReminders(tasks: Task[], userId: string, now: Date, limit?: number): ReminderPlan[]`

**Yêu cầu hành vi — hàm thuần, không gọi `expo-notifications`:**
- Chỉ việc của mình, có `dueDate`, chưa `DONE`, và `assignmentStatus !== 'REJECTED'`
- Mỗi việc sinh **hai** mốc: trước 24 giờ và đúng giờ hạn
- Bỏ mọi mốc đã qua
- Sắp theo thời gian tăng dần, cắt còn tối đa `limit` mốc (mặc định 60)

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/notifications/__tests__/scheduler.test.ts`:

```ts
import { planReminders } from '../scheduler';
import type { Task } from '../../types';

const NOW = new Date('2026-08-04T10:00:00.000Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    title: 'Nộp báo cáo',
    status: 'TODO',
    workspaceId: 'w1',
    assigneeId: 'u1',
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('planReminders', () => {
  it('trả rỗng khi không có việc nào', () => {
    expect(planReminders([], 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc của người khác', () => {
    const tasks = [makeTask({ assigneeId: 'u2', dueDate: '2026-08-10T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc đã xong', () => {
    const tasks = [makeTask({ status: 'DONE', dueDate: '2026-08-10T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc đã từ chối', () => {
    const tasks = [
      makeTask({ assignmentStatus: 'REJECTED', dueDate: '2026-08-10T10:00:00.000Z' }),
    ];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ việc không có hạn chót', () => {
    expect(planReminders([makeTask({ dueDate: null })], 'u1', NOW)).toEqual([]);
  });

  it('sinh hai mốc cho việc còn hạn xa', () => {
    const tasks = [makeTask({ dueDate: '2026-08-10T10:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans).toHaveLength(2);
    expect(plans[0].fireAt.toISOString()).toBe('2026-08-09T10:00:00.000Z');
    expect(plans[1].fireAt.toISOString()).toBe('2026-08-10T10:00:00.000Z');
  });

  it('bỏ mốc trước 24 giờ nếu mốc đó đã qua', () => {
    const tasks = [makeTask({ dueDate: '2026-08-04T20:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans).toHaveLength(1);
    expect(plans[0].fireAt.toISOString()).toBe('2026-08-04T20:00:00.000Z');
  });

  it('bỏ hẳn việc đã quá hạn', () => {
    const tasks = [makeTask({ dueDate: '2026-08-01T10:00:00.000Z' })];
    expect(planReminders(tasks, 'u1', NOW)).toEqual([]);
  });

  it('bỏ hạn chót không hợp lệ', () => {
    expect(planReminders([makeTask({ dueDate: 'sai-dinh-dang' })], 'u1', NOW)).toEqual([]);
  });

  it('sắp theo thời gian tăng dần', () => {
    const tasks = [
      makeTask({ id: 'xa', dueDate: '2026-08-20T10:00:00.000Z' }),
      makeTask({ id: 'gan', dueDate: '2026-08-06T10:00:00.000Z' }),
    ];
    const plans = planReminders(tasks, 'u1', NOW);
    expect(plans[0].taskId).toBe('gan');
  });

  it('cắt bớt khi vượt giới hạn', () => {
    const tasks = Array.from({ length: 50 }, (_, i) =>
      makeTask({ id: `t${i}`, dueDate: `2026-09-${String((i % 28) + 1).padStart(2, '0')}T10:00:00.000Z` }),
    );
    expect(planReminders(tasks, 'u1', NOW, 10)).toHaveLength(10);
  });

  it('nội dung thông báo bằng tiếng Việt và có tên việc', () => {
    const tasks = [makeTask({ title: 'Nộp báo cáo tuần', dueDate: '2026-08-10T10:00:00.000Z' })];
    const plans = planReminders(tasks, 'u1', NOW);

    expect(plans[0].title).toBe('Sắp đến hạn');
    expect(plans[0].body).toContain('Nộp báo cáo tuần');
    expect(plans[1].title).toBe('Đến hạn hôm nay');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest notifications/__tests__/scheduler
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/notifications/scheduler.ts`:

```ts
import type { Task } from '../types';

export interface ReminderPlan {
  taskId: string;
  title: string;
  body: string;
  fireAt: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Số lịch tối đa giữ cùng lúc. Android giới hạn số báo thức chờ của mỗi app. */
export const MAX_SCHEDULED = 60;

/**
 * Tính danh sách mốc nhắc. Hàm thuần, không gọi `expo-notifications`, nhận `now`
 * làm tham số để test được mà không cần giả lập đồng hồ.
 *
 * Mỗi việc sinh hai mốc: trước 24 giờ và đúng giờ hạn. Mốc đã qua bị bỏ.
 */
export function planReminders(
  tasks: Task[],
  userId: string,
  now: Date,
  limit: number = MAX_SCHEDULED,
): ReminderPlan[] {
  const plans: ReminderPlan[] = [];

  for (const task of tasks) {
    if (task.assigneeId !== userId) continue;
    if (task.status === 'DONE') continue;
    if (task.assignmentStatus === 'REJECTED') continue;
    if (!task.dueDate) continue;

    const due = new Date(task.dueDate);
    if (Number.isNaN(due.getTime())) continue;
    if (due.getTime() <= now.getTime()) continue;

    const dayBefore = new Date(due.getTime() - DAY_MS);
    if (dayBefore.getTime() > now.getTime()) {
      plans.push({
        taskId: task.id,
        title: 'Sắp đến hạn',
        body: `"${task.title}" đến hạn sau 24 giờ nữa.`,
        fireAt: dayBefore,
      });
    }

    plans.push({
      taskId: task.id,
      title: 'Đến hạn hôm nay',
      body: `"${task.title}" đến hạn bây giờ.`,
      fireAt: due,
    });
  }

  return plans.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime()).slice(0, limit);
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest notifications/__tests__/scheduler
```

Kỳ vọng: PASS, 12 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/notifications/scheduler.ts src/lib/notifications/__tests__/scheduler.test.ts
```

```bash
git commit -m "feat: them logic tinh lich nhac han chot"
```

---

## Task 7: Lớp bọc expo-notifications và xin quyền

**Trạng thái: XONG (05/08/2026).** Thêm `checkNotificationPermission()` ngoài kế hoạch gốc: đọc trạng thái quyền mà **không** hiện hộp thoại. Cần vì Android chỉ cho hỏi một lần — phải biết trạng thái trước để giải thích lý do rồi mới gọi hộp thoại (xem Task 8).

**Files:**
- Modify: `package.json` (cài `expo-notifications`), `app.json`
- Create: `src/lib/notifications/permission.ts`, `src/lib/notifications/local.ts`
- Test: `src/lib/notifications/__tests__/permission.test.ts`

**Interfaces:**
- Produces:
  - `ensureNotificationPermission(): Promise<boolean>` — không bao giờ ném lỗi
  - `syncScheduledReminders(plans: ReminderPlan[]): Promise<number>` — huỷ hết rồi đặt lại, trả số lịch đã đặt

- [ ] **Bước 1: Cài gói**

```bash
npx expo install expo-notifications
```

- [ ] **Bước 2: Cấu hình `app.json`**

Thêm `expo-notifications` vào mảng `plugins`. **Không thêm khối `permissions` nào** — đặc biệt không bao giờ thêm `USE_EXACT_ALARM` hay `SCHEDULE_EXACT_ALARM`.

```json
    "plugins": [
      "expo-router",
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#0055c7",
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 76
        }
      ],
      "expo-secure-store",
      [
        "expo-notifications",
        {
          "color": "#0055c7"
        }
      ]
    ],
```

- [ ] **Bước 3: Viết test thất bại**

Tạo `src/lib/notifications/__tests__/permission.test.ts`:

```ts
import * as Notifications from 'expo-notifications';
import { ensureNotificationPermission } from '../permission';

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
}));

const mockedGet = Notifications.getPermissionsAsync as jest.MockedFunction<
  typeof Notifications.getPermissionsAsync
>;
const mockedRequest = Notifications.requestPermissionsAsync as jest.MockedFunction<
  typeof Notifications.requestPermissionsAsync
>;

describe('ensureNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('trả true ngay khi đã được cấp quyền', async () => {
    mockedGet.mockResolvedValue({ status: 'granted' } as never);
    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it('xin quyền khi chưa được cấp', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined' } as never);
    mockedRequest.mockResolvedValue({ status: 'granted' } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(true);
    expect(mockedRequest).toHaveBeenCalled();
  });

  it('trả false khi người dùng từ chối', async () => {
    mockedGet.mockResolvedValue({ status: 'undetermined' } as never);
    mockedRequest.mockResolvedValue({ status: 'denied' } as never);

    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });

  it('trả false thay vì ném lỗi khi thiếu module native', async () => {
    mockedGet.mockRejectedValue(new Error('Cannot find native module'));
    await expect(ensureNotificationPermission()).resolves.toBe(false);
  });
});
```

- [ ] **Bước 4: Chạy test, xác nhận thất bại**

```bash
npx jest notifications/__tests__/permission
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 5: Viết implementation**

Tạo `src/lib/notifications/permission.ts`:

```ts
import * as Notifications from 'expo-notifications';

/**
 * Xin quyền `POST_NOTIFICATIONS`. Android 13+ bắt buộc hỏi.
 *
 * Không bao giờ ném lỗi. Người dùng từ chối quyền là chuyện bình thường, và app
 * vẫn phải dùng được — chỉ mất phần nhắc hạn cục bộ.
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.status === 'granted') {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.status === 'granted';
  } catch {
    // Thiếu module native, hoặc nền tảng không hỗ trợ.
    return false;
  }
}
```

Tạo `src/lib/notifications/local.ts`:

```ts
import * as Notifications from 'expo-notifications';
import type { ReminderPlan } from './scheduler';

/**
 * Đặt lại toàn bộ lịch nhắc: huỷ hết rồi đặt mới.
 *
 * Đơn giản hơn so sánh từng cái, và số lịch nhỏ nên không tốn kém. Trả về số lịch
 * đã đặt được.
 *
 * Dùng báo thức KHÔNG CHÍNH XÁC, mặc định của expo-notifications. Google chỉ cho
 * app đồng hồ báo thức, hẹn giờ và lịch xin `USE_EXACT_ALARM`; WeDo là app quản lý
 * công việc nên xin quyền đó sẽ bị từ chối phát hành.
 *
 * Đánh đổi: dưới Doze mode thông báo có thể trễ vài phút đến vài giờ. Đây là hành
 * vi đã chấp nhận, và là lý do kỹ thuật cho Giai đoạn 2 dùng FCM.
 */
export async function syncScheduledReminders(plans: ReminderPlan[]): Promise<number> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    let scheduled = 0;
    for (const plan of plans) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: plan.title,
          body: plan.body,
          data: { taskId: plan.taskId },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: plan.fireAt,
        },
      });
      scheduled += 1;
    }

    return scheduled;
  } catch {
    // Thiếu module native hoặc bị hệ thống chặn. Không được làm hỏng luồng chính.
    return 0;
  }
}
```

- [ ] **Bước 6: Chạy test, xác nhận pass**

```bash
npx jest notifications/__tests__/permission
```

Kỳ vọng: PASS, 4 test.

- [ ] **Bước 7: Commit — lệnh cho chủ dự án chạy**

```bash
git add package.json package-lock.json app.json src/lib/notifications
```

```bash
git commit -m "feat: them lop boc expo-notifications va xin quyen"
```

---

## Task 8: Màn hình Thông báo và cài đặt

**Trạng thái: XONG phần mã (05/08/2026), chờ nghiệm thu trên máy.**

**Một sửa đổi so với kế hoạch gốc.** Kế hoạch viết *"Xin quyền thông báo lần đầu mở tab này, kèm giải thích trước khi gọi hộp thoại hệ thống"*, nhưng bảng nghiệm thu Task 10 lại ghi hộp thoại Android bật lên ngay khi mở tab. Hai câu này mâu thuẫn nhau. Đã chọn theo **yêu cầu hành vi**, không theo bảng nghiệm thu:

Mở tab lần đầu hiện một thẻ giải thích trong app — *"Nhắc bạn trước khi việc đến hạn"* — với hai nút **Để sau** và **Bật thông báo**. Chỉ khi bấm "Bật thông báo" mới gọi hộp thoại hệ thống.

Lý do: Android chỉ cho hỏi quyền **một lần**. Bật hộp thoại ngay lúc người dùng chưa hiểu thông báo dùng để làm gì thì nhiều người bấm từ chối theo phản xạ, và mất luôn phần nhắc hạn vĩnh viễn — phải vào Cài đặt hệ thống mới bật lại được. Thẻ giải thích trước giữ cho hộp thoại hệ thống chỉ hiện khi người dùng đã đồng ý về mặt ý định.

Bảng nghiệm thu Task 10 dòng 7 đã sửa theo.

**Hai file thêm ngoài danh sách trên,** vì thiếu chúng thì phần nhắc hạn coi như hỏng một nửa:

- `src/lib/notifications/handler.ts` + test. Mặc định `expo-notifications` **nuốt** thông báo tới lúc app đang mở, nên việc đến hạn trong lúc người dùng đang chat sẽ trôi qua im lặng. `configureNotificationHandler()` gọi ở tầng module của `src/app/_layout.tsx` để chạy trước khi có thông báo nào tới.
- Móc điều hướng trong `src/app/(tabs)/_layout.tsx`. `syncScheduledReminders` đã nhét `taskId` vào phần `data` nhưng trước đó không ai đọc, nên chạm vào nhắc hạn chỉ mở app ở màn hình bất kỳ. Giờ mở thẳng công việc đó, xử lý cả trường hợp app bị đánh thức từ trạng thái tắt hẳn (`getLastNotificationResponseAsync`). Đặt ở layout tab chứ không phải layout gốc vì layout tab chỉ dựng khi đã đăng nhập.

**Files:**
- Create: `src/components/notifications/NotificationRow.tsx`, `src/app/account/notification-settings.tsx`
- Modify: `src/app/(tabs)/notifications/index.tsx`, `src/app/(tabs)/account/index.tsx`
- Test: `src/components/notifications/__tests__/NotificationRow.test.tsx`

**Yêu cầu hành vi:**
- Thông báo chưa đọc có nền nhạt và chấm màu
- Chạm → `PATCH /:id/read` rồi điều hướng theo `taskId` nếu có
- Nút "Đánh dấu tất cả đã đọc"
- **Xin quyền thông báo lần đầu mở tab này**, kèm giải thích trước khi gọi hộp thoại hệ thống
- Sau khi có danh sách công việc, tính và đặt lịch nhắc

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/components/notifications/__tests__/NotificationRow.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { NotificationRow } from '../NotificationRow';
import type { NotificationItem } from '../../../lib/types';

function makeItem(overrides: Partial<NotificationItem> = {}): NotificationItem {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'Bạn có việc mới',
    message: 'Nộp báo cáo tuần đã được giao cho bạn',
    userId: 'u1',
    createdAt: '2026-08-04T10:00:00.000Z',
    ...overrides,
  };
}

describe('NotificationRow', () => {
  it('hiện tiêu đề và nội dung', async () => {
    const { getByText } = await render(
      <NotificationRow item={makeItem()} onPress={() => {}} />,
    );
    expect(getByText('Bạn có việc mới')).toBeTruthy();
    expect(getByText('Nộp báo cáo tuần đã được giao cho bạn')).toBeTruthy();
  });

  it('hiện chấm chưa đọc khi readAt rỗng', async () => {
    const { getByTestId } = await render(
      <NotificationRow item={makeItem({ readAt: null })} onPress={() => {}} />,
    );
    expect(getByTestId('unread-dot-n1')).toBeTruthy();
  });

  it('ẩn chấm khi đã đọc', async () => {
    const { queryByTestId } = await render(
      <NotificationRow
        item={makeItem({ readAt: '2026-08-04T11:00:00.000Z' })}
        onPress={() => {}}
      />,
    );
    expect(queryByTestId('unread-dot-n1')).toBeNull();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <NotificationRow item={makeItem()} onPress={onPress} />,
    );

    await fireEvent.press(getByTestId('notification-n1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest NotificationRow
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết `NotificationRow`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { NotificationItem } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} ${hh}:${mi}`;
}

export function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const unread = !item.readAt;

  return (
    <Pressable
      testID={`notification-${item.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        unread ? styles.rowUnread : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.body}>
        <View style={styles.titleRow}>
          {unread ? <View testID={`unread-dot-${item.id}`} style={styles.dot} /> : null}
          <Text style={[styles.title, unread ? styles.titleUnread : null]} numberOfLines={1}>
            {item.title}
          </Text>
        </View>
        <Text style={styles.message} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={styles.when}>{formatWhen(item.createdAt)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowUnread: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.7 },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    marginRight: spacing.sm,
  },
  title: { flex: 1, fontSize: fontSize.md, color: colors.text },
  titleUnread: { fontWeight: '700' },
  message: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  when: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
});
```

- [ ] **Bước 4: Thay `src/app/(tabs)/notifications/index.tsx`**

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { NotificationRow } from '../../../components/notifications/NotificationRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../../lib/api/notifications';
import { listTasks } from '../../../lib/api/tasks';
import { useAuth } from '../../../lib/auth/auth-context';
import { syncScheduledReminders } from '../../../lib/notifications/local';
import { ensureNotificationPermission } from '../../../lib/notifications/permission';
import { planReminders } from '../../../lib/notifications/scheduler';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../../theme/tokens';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { active } = useWorkspace();

  const [permissionAsked, setPermissionAsked] = useState(false);
  const remindersSynced = useRef(false);

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  // Xin quyền LẦN ĐẦU người dùng mở tab này, không phải lúc mở app.
  // Tới đây người dùng đã hiểu app làm gì nên khả năng đồng ý cao hơn nhiều.
  useEffect(() => {
    if (permissionAsked) return;
    setPermissionAsked(true);
    void ensureNotificationPermission();
  }, [permissionAsked]);

  // Tải công việc rồi đặt lịch nhắc cục bộ. Chỉ làm một lần mỗi phiên mở màn hình.
  useEffect(() => {
    if (remindersSynced.current || !active?.id || !user?.id) return;
    remindersSynced.current = true;

    (async () => {
      const granted = await ensureNotificationPermission();
      if (!granted) return;

      try {
        const tasks = await listTasks(active.id);
        const plans = planReminders(tasks, user.id, new Date());
        await syncScheduledReminders(plans);
      } catch {
        // Không đặt được lịch nhắc thì thôi; danh sách thông báo vẫn dùng được.
      }
    })();
  }, [active?.id, user?.id]);

  const handlePress = useCallback(
    async (id: string, taskId?: string | null) => {
      try {
        await markNotificationRead(id);
        void queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {
        // Đánh dấu đã đọc hỏng thì vẫn cho điều hướng.
      }
      if (taskId) router.push(`/tasks/${taskId}`);
    },
    [queryClient, router],
  );

  const handleMarkAll = useCallback(async () => {
    try {
      await markAllNotificationsRead();
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch {
      // Im lặng; người dùng bấm lại được.
    }
  }, [queryClient]);

  const items = notificationsQuery.data ?? [];
  const hasUnread = items.some((item) => !item.readAt);

  if (notificationsQuery.isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={styles.heading}>Thông báo</Text>
        {hasUnread ? (
          <Pressable testID="mark-all-read" onPress={handleMarkAll}>
            <Text style={styles.markAll}>Đánh dấu tất cả đã đọc</Text>
          </Pressable>
        ) : null}
      </View>

      {notificationsQuery.isError ? (
        <ErrorBanner
          message={
            notificationsQuery.error instanceof Error
              ? notificationsQuery.error.message
              : 'Không tải được thông báo.'
          }
        />
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow item={item} onPress={() => void handlePress(item.id, item.taskId)} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={notificationsQuery.isRefetching}
            onRefresh={() => notificationsQuery.refetch()}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          notificationsQuery.isError ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có thông báo nào</Text>
              <Text style={styles.emptyBody}>
                Bạn sẽ nhận thông báo khi có người giao việc, khi việc sắp đến hạn, hoặc khi có
                phản hồi trong dự án.
              </Text>
            </View>
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  markAll: { fontSize: fontSize.xs, color: colors.primary, fontWeight: '600' },
  empty: { paddingTop: spacing.xl, alignItems: 'center' },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
```

- [ ] **Bước 5: Tạo màn hình cài đặt thông báo**

Tạo `src/app/account/notification-settings.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, Switch, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { getPreferences, updatePreferences } from '../../lib/api/notifications';
import type { NotificationPreferences } from '../../lib/types';
import { colors, fontSize, spacing } from '../../theme/tokens';

/**
 * Hiện đủ cả bốn loại, kể cả `notifyMeeting`.
 *
 * Cuộc họp không có màn hình riêng trên mobile, nhưng người dùng vẫn bật tắt được
 * mục này trên web và vẫn nhận thông báo họp trên điện thoại. Ẩn đi sẽ khiến họ
 * tưởng app mất cài đặt, hoặc tệ hơn là không tắt được thứ đang làm phiền mình.
 */
const ROWS: Array<{ key: keyof NotificationPreferences; label: string; hint: string }> = [
  {
    key: 'notifyTaskAssignment',
    label: 'Giao việc',
    hint: 'Khi có người giao việc cho bạn, hoặc phản hồi việc bạn giao',
  },
  {
    key: 'notifyTaskReview',
    label: 'Duyệt việc',
    hint: 'Khi việc được nộp hoặc được duyệt',
  },
  {
    key: 'notifyDeadlineReminder',
    label: 'Nhắc hạn chót',
    hint: 'Nhắc trước 24 giờ và đúng giờ hạn',
  },
  {
    key: 'notifyMeeting',
    label: 'Cuộc họp',
    hint: 'Khi có cuộc họp mới được lên lịch. Xem chi tiết họp trên web WeDo',
  },
];

export default function NotificationSettingsScreen() {
  const queryClient = useQueryClient();

  const prefsQuery = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: getPreferences,
  });

  const mutation = useMutation({
    mutationFn: (patch: Partial<NotificationPreferences>) => updatePreferences(patch),
    onSuccess: (next) => queryClient.setQueryData(['notification-preferences'], next),
  });

  const prefs = prefsQuery.data;

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: 'Cài đặt thông báo' }} />

      {prefsQuery.isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <>
          {prefsQuery.isError ? <ErrorBanner message="Không tải được cài đặt." /> : null}
          {mutation.isError ? <ErrorBanner message="Không lưu được thay đổi." /> : null}

          {prefs
            ? ROWS.map((row) => (
                <View key={row.key} style={styles.row}>
                  <View style={styles.rowBody}>
                    <Text style={styles.rowLabel}>{row.label}</Text>
                    <Text style={styles.rowHint}>{row.hint}</Text>
                  </View>
                  <Switch
                    testID={`switch-${row.key}`}
                    value={prefs[row.key]}
                    disabled={mutation.isPending}
                    onValueChange={(value) => mutation.mutate({ [row.key]: value })}
                    trackColor={{ true: colors.primary }}
                  />
                </View>
              ))
            : null}

          <Text style={styles.note}>
            Nhắc hạn chót hoạt động ngay trên máy nên có thể trễ vài phút khi điện thoại ở chế độ
            tiết kiệm pin.
          </Text>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, marginRight: spacing.md },
  rowLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '600' },
  rowHint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  note: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    lineHeight: 18,
  },
});
```

- [ ] **Bước 6: Thêm lối vào cài đặt trong tab Tài khoản**

Trong `src/app/(tabs)/account/index.tsx`, thêm import `useRouter` từ `expo-router`, rồi thêm nút ngay trên nút Đăng xuất:

```tsx
      <Button
        testID="account-notification-settings"
        label="Cài đặt thông báo"
        variant="secondary"
        onPress={() => router.push('/account/notification-settings')}
      />
      <View style={{ height: spacing.sm }} />
```

Và đổi dòng ghi chú cuối màn hình thành:

```tsx
      <Text style={styles.note}>
        Chính sách bảo mật và xoá tài khoản sẽ được bổ sung ở bản tiếp theo.
      </Text>
```

- [ ] **Bước 7: Gắn badge số chưa đọc lên thanh tab**

Spec mục 5.5 yêu cầu tab Thông báo có badge đếm số chưa đọc. `getUnreadCount` đã viết ở Task 1 nhưng chưa dùng ở đâu.

Trong `src/app/(tabs)/_layout.tsx`, thêm import:

```tsx
import { useQuery } from '@tanstack/react-query';

import { getUnreadCount } from '../../lib/api/notifications';
```

Bên trong `TabsWithWorkspace`, thêm ngay sau dòng `const { status } = useWorkspace();`:

```tsx
  // Badge số thông báo chưa đọc. Poll mỗi phút; rẻ vì endpoint chỉ trả một con số.
  const unreadQuery = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const unread = unreadQuery.data?.count ?? 0;
```

Rồi sửa `Tabs.Screen` của Thông báo thành:

```tsx
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Thông báo',
          tabBarBadge: unread > 0 ? (unread > 99 ? '99+' : unread) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.danger },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
```

Và trong `src/app/(tabs)/notifications/index.tsx`, sau khi đánh dấu đã đọc, làm mới luôn badge — sửa cả `handlePress` và `handleMarkAll` để gọi thêm:

```tsx
        void queryClient.invalidateQueries({ queryKey: ['notifications-unread'] });
```

- [ ] **Bước 8: Sinh lại kiểu route, kiểm tra kiểu và chạy test**

```bash
npx expo start
```

Đợi `Waiting on http://localhost:8081`, rồi ở cửa sổ khác:

```bash
npx tsc --noEmit
```

```bash
npm test
```

Kỳ vọng: exit 0 và toàn bộ test PASS.

- [ ] **Bước 9: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/components/notifications "src/app/(tabs)/notifications/index.tsx" "src/app/(tabs)/_layout.tsx" src/app/account "src/app/(tabs)/account/index.tsx"
```

```bash
git commit -m "feat: them man hinh thong bao va cai dat"
```

---

## Task 9: Build lại APK development client

**Trạng thái: KHÔNG CẦN LÀM (kiểm chứng 05/08/2026).**

Lần build lại vì logo (`19a93a59-b986-4e38-a1f7-10fa9a5c95f5`) đã kéo theo `expo-notifications` rồi. Đã tải chính file APK đó về và soi manifest:

```
aapt2 dump permissions wedo-dev.apk
```

Kết quả có `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `com.google.android.c2dm.permission.RECEIVE` và nhóm quyền badge của launcher. Những quyền này **chỉ** vào được bằng cách hợp nhất manifest của `expo-notifications`, nên mã native chắc chắn đã nằm trong APK.

Cũng xác nhận **không có** `USE_EXACT_ALARM` lẫn `SCHEDULE_EXACT_ALARM` — hai quyền Google chỉ cấp cho app báo thức, hẹn giờ và lịch.

Vẫn phải đối chiếu lần cuối ở Task 10 phép thử 7: nếu thiếu module native thì hộp thoại quyền sẽ không hiện mà ném `Cannot find native module`.

**Files:** không sửa file nào.

**Vì sao bắt buộc:** `expo-notifications` là **module native**. Cài gói JS không thêm được mã native vào APK đã build. Kế hoạch 2 đã vấp đúng lỗi này ba lần với `expo-crypto` và `expo-haptics`. Không build lại thì mọi thứ liên quan tới thông báo sẽ ném `Cannot find native module`.

Lần build này cũng khiến **`expo-haptics` bắt đầu hoạt động thật** — hiện tại `tapFeedback()` đang im lặng bỏ qua.

- [ ] **Bước 1: Kiểm tra biến môi trường đã có trên EAS**

```bash
npx eas-cli env:list --environment development
```

Kỳ vọng: thấy `EXPO_PUBLIC_API_BASE_URL`.

- [ ] **Bước 2: Chạy build**

```bash
npx eas-cli build --platform android --profile development --non-interactive
```

Mất khoảng 10–25 phút kể cả thời gian xếp hàng.

- [ ] **Bước 3: Lấy đường dẫn APK**

```bash
npx eas-cli build:list --platform android --limit 1 --json --non-interactive
```

Đọc trường `artifacts.buildUrl`.

- [ ] **Bước 4: Cài vào máy ảo**

Tải file APK về, rồi:

```bash
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r <duong-dan-file.apk>
```

Kỳ vọng: `Success`.

- [ ] **Bước 5: Xác minh quyền trong AAB/APK — kiểm tra chống từ chối Play**

Không hardcode phiên bản build-tools, tìm bản mới nhất đang cài:

```bash
$aapt = (Get-ChildItem "$env:LOCALAPPDATA\Android\Sdk\build-tools" -Directory | Sort-Object Name -Descending | Select-Object -First 1).FullName + "\aapt2.exe"; & $aapt dump permissions <duong-dan-file.apk>
```

**Bắt buộc KHÔNG được thấy** `USE_EXACT_ALARM` hay `SCHEDULE_EXACT_ALARM`. Thấy là dừng lại ngay và báo chủ dự án — app sẽ bị Google từ chối phát hành.

Kỳ vọng thấy `POST_NOTIFICATIONS` và `RECEIVE_BOOT_COMPLETED` (expo-notifications cần để đặt lại lịch sau khi khởi động máy).

---

## Task 10: Nghiệm thu trên thiết bị

- [ ] **Bước 1: Khởi động máy ảo — chủ dự án tự chạy**

```bash
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd WeDo_Pixel7 -dns-server 8.8.8.8
```

- [ ] **Bước 2: Khởi động Metro và mở app**

```bash
npx expo start --dev-client
```

- [ ] **Bước 3: Chạy mười một phép thử, chụp màn hình từng cái**

| # | Phép thử | Đạt khi |
|---|---|---|
| 1 | Mở tab Việc của tôi | Hiện việc đã tạo từ chat, nhóm theo hạn chót; tài khoản trắng thì hiện empty state tiếng Việt |
| 2 | Việc chờ phản hồi | Ghim đầu danh sách, có hai nút Nhận việc / Từ chối |
| 3 | Bấm **Nhận việc** | Trạng thái đổi thành "Đang làm", nút biến mất |
| 4 | Bấm **Từ chối**, nhập 2 ký tự | Chặn lại, báo *"Lý do từ chối phải có ít nhất 3 ký tự"* |
| 5 | Từ chối với lý do hợp lệ | Việc chuyển sang "Đã từ chối", chi tiết hiện đúng lý do |
| 6 | Mở chi tiết công việc | Đủ tiêu đề, hạn chót, người phụ trách, dự án |
| 7 | Mở tab Thông báo lần đầu | Hiện **thẻ giải thích trong app** với hai nút Để sau / Bật thông báo. Bấm "Bật thông báo" mới hiện hộp thoại Android. Không có hộp thoại nào lúc mở app |
| 8 | Danh sách thông báo | Thông báo chưa đọc có nền nhạt và chấm; chạm thì mất chấm và đi tới việc |
| 9 | Badge trên tab Thông báo | Hiện số chưa đọc; đánh dấu đã đọc thì số giảm |
| 10 | Cài đặt thông báo | Đủ **bốn** công tắc; tắt một cái rồi mở lại màn hình thì trạng thái giữ nguyên |
| 11 | **Nhắc hạn cục bộ** | Xem bước 4 |

- [ ] **Bước 4: Kiểm chứng nhắc hạn thật**

Trên web WeDo, tạo một việc giao cho mình với **hạn chót cách hiện tại 3 phút**. Trên máy ảo, kéo làm mới tab Việc của tôi rồi mở tab Thông báo để lịch được đặt lại.

Kiểm tra lịch đã đặt:

```bash
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell dumpsys alarm | Select-String "vn.wedo.app"
```

Rồi **đưa app xuống nền** và chờ. Đạt khi thông báo hiện trên thanh trạng thái với đúng tiêu đề "Đến hạn hôm nay".

Trễ vài phút là **bình thường và đúng thiết kế** — báo thức không chính xác. Trễ quá 30 phút thì mới cần xem lại.

- [ ] **Bước 5: Soát lộ bí mật**

```bash
grep -rnE "azurewebsites|postgres://|supabase\.co|Bearer ey" --include="*.ts" --include="*.tsx" --include="*.json" --exclude-dir=node_modules --exclude-dir=docs .
```

Kỳ vọng: không in ra dòng nào.

---

## Kiểm chứng khi kết thúc kế hoạch

| Hạng mục | Lệnh | Kỳ vọng |
|---|---|---|
| Test đơn vị | `npm test` | Toàn bộ PASS |
| Kiểu dữ liệu | `npx tsc --noEmit` | exit 0 |
| Bundle Android | `npx expo export --platform android` | exit 0 |
| **Không có quyền báo thức chính xác** | `aapt2 dump permissions` | **Không thấy `USE_EXACT_ALARM` hay `SCHEDULE_EXACT_ALARM`** |
| Không lộ bí mật | lệnh grep ở Task 10 Bước 5 | không kết quả |
| Nghiệm thu thiết bị | 11 phép thử | có ảnh chụp từng cái |

---

## Việc kế hoạch này KHÔNG làm

- **Kế hoạch 4 — tuân thủ và phát hành:** màn hình xoá tài khoản, link chính sách bảo mật, bảng khai Data safety, build AAB production, chuẩn bị hồ sơ nộp Play
- **Kế hoạch backend:** `DELETE /users/me`, `GET /users/me/deletion-blockers`, `PATCH /workspaces/:id/owner`
- **Giai đoạn 2 — thông báo đẩy thật:** bảng lưu device token, tích hợp FCM. Cần sửa backend, sẽ trình bày phạm vi và chờ duyệt riêng
- **Đổi trạng thái công việc:** đã loại khỏi spec ngày 04/08/2026 vì `PATCH /tasks/:id` yêu cầu quyền leader dự án
- **Đính kèm tệp và gửi duyệt:** ngoài phạm vi bản mobile
