# Kế hoạch 2 — Trò chuyện dự án và biến tin nhắn thành công việc

> **Dành cho người thực thi:** SUB-SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để làm từng task một. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Xem danh sách dự án, mở khung chat, gửi và nhận tin nhắn realtime, nhấn giữ một tin nhắn để lấy đề xuất công việc từ AI rồi tạo công việc thật.

**Kiến trúc:** REST cho tải dữ liệu và gửi tin; Socket.IO cho tin đến, trạng thái gõ và hiện diện. Một `useProjectMessages` hook hợp nhất hai nguồn đó thành một danh sách duy nhất. Luồng tạo công việc gọi **ba** API liên tiếp và phải xử lý được trường hợp hỏng giữa chừng.

**Công nghệ:** socket.io-client v4 · @gorhom/bottom-sheet · expo-haptics · expo-crypto · @react-native-community/datetimepicker · TanStack Query v5

**Nền tảng:** kế hoạch 1 đã xong và nghiệm thu 6/6 trên thiết bị. Xem [`2026-08-02-mobile-nen-tang-xac-thuc.md`](2026-08-02-mobile-nen-tang-xac-thuc.md).

**Spec nguồn:** [`docs/superpowers/specs/2026-08-02-wedo-android-design.md`](../specs/2026-08-02-wedo-android-design.md) mục 5.3.

---

## Trạng thái thực thi

**Task 1–11: xong và kiểm chứng bằng máy. Task 12 chờ thiết bị.**

| Kiểm chứng | Lệnh | Kết quả |
|---|---|---|
| Test đơn vị | `npm test` | **127/127 PASS**, 21 test suite |
| Kiểu dữ liệu | `npx tsc --noEmit` | exit 0 |
| Bundle Android | `npx expo export --platform android` | exit 0 |
| Không lộ bí mật | quét `*.ts,*.tsx,*.json,*.js` | không kết quả |
| **Nghiệm thu thiết bị** | Task 12 | **CHƯA LÀM — cần máy ảo và tài khoản của chủ dự án** |

Số test thực tế là **127**, không phải 115 hay 118 như hai lần dự tính trong kế hoạch. Con số trong kế hoạch cộng sai; số thật lấy từ `npm test`.

**Một lỗi phát sinh khi thực thi:** bật `typedRoutes` khiến `tsc` báo lỗi `/chat/${string}` không thuộc union route sau khi tạo file `[projectId].tsx`. Nguyên nhân: expo-router sinh bảng kiểu vào `.expo/types/router.d.ts` lúc dev server chạy, mà Metro đang ở chế độ `CI=1` nên không theo dõi file mới. Sửa bằng cách khởi động lại Metro không đặt `CI`. **Sau khi thêm bất kỳ file route mới nào, phải chạy lại `npx expo start` trước khi `tsc` mới hết đỏ.**

---

## Điều chỉnh khi thực thi

**1. Không thể test kiểu dữ liệu bằng Jest.** Task 1 ban đầu viết một file `types-smoke.test.ts` dùng `import type`. File này **pass ngay cả khi các kiểu chưa tồn tại**, vì Babel xoá sạch `import type` lúc transpile nên Jest không bao giờ thấy. Một test không thể đỏ là test vô dụng.

Công cụ đúng để kiểm kiểu là `tsc`:

```bash
npx tsc --noEmit
```

Đã xoá file test giả. Kiểu dữ liệu được `tsc` kiểm qua chính chỗ dùng thật ở Task 2 đến Task 11. **Tổng số test cuối cùng là 115, không phải 118.**

**2. Không cài `@gorhom/bottom-sheet` và `@react-native-community/datetimepicker`.** Task 9 thực tế dùng `Modal` của React Native, còn datetimepicker để dành kế hoạch 3. Cài thư viện native không dùng là thêm mã chết vào AAB nộp Play. Chỉ cài `socket.io-client`, `expo-haptics`, `expo-crypto`.

Đã kiểm chứng `socket.io-client@4.8.3` — major 4, khớp server `socket.io@4.8.1`.

---

## Ràng buộc toàn cục

Mọi task đều ngầm mang các ràng buộc này. Kế thừa toàn bộ ràng buộc của kế hoạch 1, cộng thêm:

- **Ngôn ngữ giao diện: tiếng Việt.** Màu thương hiệu `#0055c7`.
- **Mã nguồn nằm dưới `src/`.** Import tương đối; alias `@/*` trỏ `./src/*`.
- **Không tự commit, không tự push.** Bước "Commit" là lệnh đưa cho chủ dự án tự chạy. Không dùng `git add .`.
- **Không hardcode bí mật.** Không có WebView.
- **`@testing-library/react-native` 14 là API bất đồng bộ:** `await render(...)`, `await fireEvent.press(...)`, `await fireEvent.changeText(...)`. Destructure query từ kết quả `render`, không dùng `screen`.
- **Không ghi đè `setupFiles` hay `transformIgnorePatterns`** trong `package.json`. Cấu hình Jest chỉ đúng một dòng `"preset": "jest-expo"`.
- **Chạy thử luôn bằng development build**, không bao giờ dùng Expo Go:
  ```
  npx expo start --dev-client
  ```
- **Máy ảo do chủ dự án tự khởi động**, bắt buộc có cờ DNS:
  ```
  emulator.exe -avd WeDo_Pixel7 -dns-server 8.8.8.8
  ```
- Chỉ báo "đã xong" khi đã chạy lệnh và nhìn thấy kết quả.

---

## Hợp đồng API đã kiểm chứng

Đọc trực tiếp từ `BE_WEDO/src` và `FE_WEDO/src/lib/api.ts`.

### REST

```
GET   /projects?workspaceId=                  → Project[]        (workspaceId tuỳ chọn)
GET   /projects/:projectId/chat               → ChatMessage[]
GET   /projects/:projectId/chat/history?before=&limit=
                                              → { items: ChatMessage[], nextCursor?: string|null }
POST  /projects/:projectId/chat  { content, replyToId? }   → ChatMessage
GET   /projects/:projectId/chat/unread-count
POST  /projects/:projectId/chat/read
POST  /projects/:projectId/chat/:messageId/ai-task-suggestion
        header: Idempotency-Key: <uuid>       → ChatTaskSuggestion
PATCH /projects/:projectId/chat/:messageId/task  { taskId }  → ChatMessage
POST  /tasks  { title, description?, status?, dueDate?, workspaceId, projectId?, assigneeId? }  → Task
```

### Socket.IO — chi tiết sống còn

Server chạy `socket.io@4.8.1`. Client **phải** là `socket.io-client@4`.

| Hạng mục | Giá trị |
|---|---|
| **Namespace** | **`/chat`** — nối tới `<API_BASE>/chat`, KHÔNG phải gốc |
| **Xác thực** | `io(url, { auth: { token } })` — server đọc `handshake.auth.token` |
| Transport | `['websocket', 'polling']` |

Khi kết nối thành công, server tự cho client vào phòng `user:<userId>`. Không cần gọi gì để nhận `notification:new`.

**Client gửi lên:**

```
join:project    { projectId }
typing:project  { projectId, typing }
```

**Server phát xuống:**

| Sự kiện | Dữ liệu | Dùng ở kế hoạch này |
|---|---|---|
| **`message:project`** | `ChatMessage` | **Có — quan trọng nhất** |
| `message:project:updated` | `ChatMessage` | Có |
| `message:project:recalled` | `ChatMessage` | Có |
| `typing:project` | `{ projectId, typing, userId }` | Có |
| `presence:snapshot` | `string[]` (mảng userId) | Có |
| `presence:online` / `presence:offline` | `{ userId }` | Có |
| `task:project:updated` | `Task` | Không |
| `notification:new` | `NotificationItem` | Không — để kế hoạch 3 |

> **Sai lệch so với mô tả ban đầu:** danh sách sự kiện trong bản mô tả gốc chỉ có `join:*`, `typing:*`, `presence:*` — **thiếu `message:project`**, chính là sự kiện làm chat trở nên realtime. Không có nó thì tin nhắn của người khác không bao giờ tự hiện.

### Kiểu dữ liệu bổ sung

```ts
interface Project {
  id: string; name: string; description?: string | null;
  workspaceId: string; status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string; updatedAt: string;
  members?: Array<{ id: string; role: string; user: UserSummary }>;
  _count?: { tasks: number; members?: number };
}

interface ChatMessage {
  id: string; content: string;
  workspaceId: string; projectId: string; authorId: string;
  taskId?: string | null;
  createdAt: string; updatedAt: string; deletedAt?: string | null;
  author?: UserSummary;
  task?: Pick<Task,'id'|'title'|'status'|'assignmentStatus'|'projectId'|'workspaceId'> | null;
  replyTo?: Pick<ChatMessage,'id'|'content'|'deletedAt'> & { author?: UserSummary };
  pinnedAt?: string | null;
}

interface ChatTaskSuggestion {
  hasTask: boolean; title: string; description?: string;
  assigneeHint?: string; assigneeId?: string; assigneeName?: string;
  dueDate?: string;   // 'YYYY-MM-DD'
  dueTime?: string;   // 'HH:mm'
  confidence: 'low' | 'medium' | 'high';
  reason?: string; model?: string;
}
```

---

## Cấu trúc file sau kế hoạch này

| File | Trách nhiệm |
|---|---|
| `src/lib/types.ts` | *(mở rộng)* thêm `Project`, `ChatMessage`, `ChatTaskSuggestion` |
| `src/lib/api/projects.ts` | `listProjects` |
| `src/lib/api/chat.ts` | 7 hàm gọi API chat |
| `src/lib/api/tasks.ts` | `createTask` |
| `src/lib/socket.ts` | Tạo và quản lý kết nối Socket.IO namespace `/chat` |
| `src/lib/socket/socket-context.tsx` | Provider, `useSocket`, `useProjectRoom` |
| `src/lib/chat/message-list.ts` | Hàm thuần: gộp, khử trùng, sắp xếp tin nhắn |
| `src/lib/chat/create-task-from-message.ts` | Luồng ba bước, có kiểu kết quả rõ ràng |
| `src/components/chat/ProjectRow.tsx` | Một dòng dự án kèm badge chưa đọc |
| `src/components/chat/MessageBubble.tsx` | Bong bóng tin nhắn, hỗ trợ nhấn giữ |
| `src/components/chat/MessageComposer.tsx` | Ô soạn tin và nút gửi |
| `src/components/chat/TaskSuggestionSheet.tsx` | Bottom sheet đề xuất công việc |
| `src/app/(tabs)/chat/index.tsx` | *(thay thế)* danh sách dự án |
| `src/app/(tabs)/chat/[projectId].tsx` | Khung chat |

---

## Task 1: Cài phụ thuộc và mở rộng kiểu dữ liệu

**Files:**
- Modify: `package.json`, `src/lib/types.ts`
- Test: `src/lib/__tests__/types-smoke.test.ts`

**Interfaces:**
- Produces: `Project`, `ChatMessage`, `ChatTaskSuggestion`, `ProjectStatus`

- [ ] **Bước 1: Cài phụ thuộc runtime**

```bash
npx expo install socket.io-client @gorhom/bottom-sheet expo-haptics expo-crypto @react-native-community/datetimepicker
```

`socket.io-client` phải là major 4. Kiểm ngay sau khi cài:

```bash
node -e "console.log(require('./node_modules/socket.io-client/package.json').version)"
```

Kỳ vọng: chuỗi bắt đầu bằng `4.`. Nếu ra `3.` hoặc `5.` thì **dừng lại và báo chủ dự án** — client lệch major với server `socket.io@4.8.1` sẽ không bắt tay được.

- [ ] **Bước 2: Viết test thất bại**

Tạo `src/lib/__tests__/types-smoke.test.ts`:

```ts
import type { ChatMessage, Project, ChatTaskSuggestion } from '../types';

describe('kiểu dữ liệu chat', () => {
  it('ChatMessage nhận đủ trường bắt buộc', () => {
    const message: ChatMessage = {
      id: 'm1',
      content: 'Mai họp nhóm nhé',
      workspaceId: 'w1',
      projectId: 'p1',
      authorId: 'u1',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z',
    };
    expect(message.id).toBe('m1');
  });

  it('Project nhận trạng thái hợp lệ', () => {
    const project: Project = {
      id: 'p1',
      name: 'Đồ án tốt nghiệp',
      workspaceId: 'w1',
      status: 'ACTIVE',
      createdAt: '2026-08-04T00:00:00.000Z',
      updatedAt: '2026-08-04T00:00:00.000Z',
    };
    expect(project.status).toBe('ACTIVE');
  });

  it('ChatTaskSuggestion cho phép thiếu trường tuỳ chọn', () => {
    const suggestion: ChatTaskSuggestion = {
      hasTask: true,
      title: 'Nộp báo cáo',
      confidence: 'high',
    };
    expect(suggestion.hasTask).toBe(true);
  });
});
```

- [ ] **Bước 3: Chạy test, xác nhận thất bại**

```bash
npx jest types-smoke
```

Kỳ vọng: FAIL vì `types.ts` chưa có `ChatMessage`.

- [ ] **Bước 4: Mở rộng `src/lib/types.ts`**

Thêm vào cuối file, giữ nguyên nội dung đang có:

```ts
export type ProjectStatus = 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';

export interface Project {
  id: string;
  name: string;
  description?: string | null;
  workspaceId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  members?: Array<{ id: string; role: string; user: UserSummary }>;
  _count?: { tasks: number; members?: number };
}

export interface Task {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  dueDate?: string | null;
  completedAt?: string | null;
  assignmentStatus?: TaskAssignmentStatus | null;
  rejectionReason?: string | null;
  projectId?: string | null;
  workspaceId: string;
  assigneeId?: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: UserSummary | null;
  project?: Pick<Project, 'id' | 'name' | 'status'> | null;
}

export interface ChatMessage {
  id: string;
  content: string;
  workspaceId: string;
  projectId: string;
  authorId: string;
  taskId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  author?: UserSummary;
  task?: Pick<
    Task,
    'id' | 'title' | 'status' | 'assignmentStatus' | 'projectId' | 'workspaceId'
  > | null;
  replyTo?: Pick<ChatMessage, 'id' | 'content' | 'deletedAt'> & {
    author?: UserSummary;
  };
  pinnedAt?: string | null;
}

/** Kết quả phân tích của AI. Mọi trường ngoài ba trường đầu đều có thể vắng. */
export interface ChatTaskSuggestion {
  hasTask: boolean;
  title: string;
  description?: string;
  assigneeHint?: string;
  assigneeId?: string;
  assigneeName?: string;
  /** Dạng 'YYYY-MM-DD'. */
  dueDate?: string;
  /** Dạng 'HH:mm'. */
  dueTime?: string;
  confidence: 'low' | 'medium' | 'high';
  reason?: string;
  model?: string;
}

export interface ChatHistoryPage {
  items: ChatMessage[];
  nextCursor?: string | null;
}
```

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npx jest types-smoke
```

Kỳ vọng: PASS, 3 test.

- [ ] **Bước 6: Kiểm tra kiểu toàn dự án**

```bash
npx tsc --noEmit
```

Kỳ vọng: exit 0.

- [ ] **Bước 7: Commit — lệnh cho chủ dự án chạy**

```bash
git add package.json package-lock.json src/lib/types.ts src/lib/__tests__/types-smoke.test.ts
```

```bash
git commit -m "feat: them kieu du lieu chat va phu thuoc realtime"
```

---

## Task 2: Module API dự án và chat

**Files:**
- Create: `src/lib/api/projects.ts`, `src/lib/api/chat.ts`, `src/lib/api/tasks.ts`
- Test: `src/lib/api/__tests__/chat.test.ts`

**Interfaces:**
- Consumes: `apiRequest` từ `src/lib/api/client`
- Produces:
  - `listProjects(workspaceId?: string): Promise<Project[]>`
  - `getProjectMessages(projectId: string): Promise<ChatMessage[]>`
  - `getProjectHistory(projectId: string, before?: string, limit?: number): Promise<ChatHistoryPage>`
  - `sendProjectMessage(projectId: string, content: string, replyToId?: string): Promise<ChatMessage>`
  - `getProjectUnreadCount(projectId: string): Promise<{ count: number }>`
  - `markProjectRead(projectId: string): Promise<unknown>`
  - `requestTaskSuggestion(projectId: string, messageId: string, idempotencyKey: string): Promise<ChatTaskSuggestion>`
  - `linkMessageTask(projectId: string, messageId: string, taskId: string): Promise<ChatMessage>`
  - `createTask(input: CreateTaskInput): Promise<Task>`

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/api/__tests__/chat.test.ts`:

```ts
import {
  getProjectMessages,
  getProjectHistory,
  sendProjectMessage,
  markProjectRead,
  requestTaskSuggestion,
  linkMessageTask,
} from '../chat';
import { listProjects } from '../projects';
import { createTask } from '../tasks';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API chat và dự án', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET /projects kèm workspaceId', async () => {
    await listProjects('w1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects?workspaceId=w1');
  });

  it('GET /projects không kèm tham số khi thiếu workspaceId', async () => {
    await listProjects();
    expect(mockedRequest).toHaveBeenCalledWith('/projects');
  });

  it('mã hoá workspaceId có ký tự đặc biệt', async () => {
    await listProjects('a b&c');
    expect(mockedRequest).toHaveBeenCalledWith('/projects?workspaceId=a%20b%26c');
  });

  it('GET danh sách tin nhắn ban đầu', async () => {
    await getProjectMessages('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat');
  });

  it('GET lịch sử kèm con trỏ before và limit', async () => {
    await getProjectHistory('p1', '2026-08-01T00:00:00.000Z', 30);
    expect(mockedRequest).toHaveBeenCalledWith(
      '/projects/p1/chat/history?before=2026-08-01T00%3A00%3A00.000Z&limit=30',
    );
  });

  it('GET lịch sử chỉ kèm limit khi chưa có con trỏ', async () => {
    await getProjectHistory('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/history?limit=30');
  });

  it('POST gửi tin nhắn', async () => {
    await sendProjectMessage('p1', 'Xin chào');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat', {
      method: 'POST',
      body: { content: 'Xin chào' },
    });
  });

  it('POST gửi tin nhắn kèm replyToId khi có', async () => {
    await sendProjectMessage('p1', 'Ừ', 'm9');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat', {
      method: 'POST',
      body: { content: 'Ừ', replyToId: 'm9' },
    });
  });

  it('POST đánh dấu đã đọc', async () => {
    await markProjectRead('p1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/read', { method: 'POST' });
  });

  it('POST xin đề xuất AI kèm header Idempotency-Key', async () => {
    await requestTaskSuggestion('p1', 'm1', 'key-abc');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/m1/ai-task-suggestion', {
      method: 'POST',
      headers: { 'Idempotency-Key': 'key-abc' },
    });
  });

  it('PATCH gắn công việc vào tin nhắn', async () => {
    await linkMessageTask('p1', 'm1', 't1');
    expect(mockedRequest).toHaveBeenCalledWith('/projects/p1/chat/m1/task', {
      method: 'PATCH',
      body: { taskId: 't1' },
    });
  });

  it('POST tạo công việc, bỏ trường rỗng', async () => {
    await createTask({ title: 'Nộp báo cáo', workspaceId: 'w1', projectId: 'p1' });
    expect(mockedRequest).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      body: { title: 'Nộp báo cáo', workspaceId: 'w1', projectId: 'p1' },
    });
  });

  it('POST tạo công việc kèm hạn chót và người phụ trách', async () => {
    await createTask({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
      assigneeId: 'u2',
      dueDate: '2026-08-10T09:00:00.000Z',
      description: 'Từ tin nhắn',
    });
    expect(mockedRequest).toHaveBeenCalledWith('/tasks', {
      method: 'POST',
      body: {
        title: 'Nộp báo cáo',
        workspaceId: 'w1',
        projectId: 'p1',
        assigneeId: 'u2',
        dueDate: '2026-08-10T09:00:00.000Z',
        description: 'Từ tin nhắn',
      },
    });
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest api/__tests__/chat
```

Kỳ vọng: FAIL với "Cannot find module '../chat'".

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/api/projects.ts`:

```ts
import { apiRequest } from './client';
import type { Project } from '../types';

export function listProjects(workspaceId?: string): Promise<Project[]> {
  const path = workspaceId
    ? `/projects?workspaceId=${encodeURIComponent(workspaceId)}`
    : '/projects';
  return apiRequest<Project[]>(path);
}
```

Tạo `src/lib/api/chat.ts`:

```ts
import { apiRequest } from './client';
import type { ChatHistoryPage, ChatMessage, ChatTaskSuggestion } from '../types';

/** Số tin nhắn tải mỗi lần cuộn lên. */
export const HISTORY_PAGE_SIZE = 30;

export function getProjectMessages(projectId: string): Promise<ChatMessage[]> {
  return apiRequest<ChatMessage[]>(`/projects/${projectId}/chat`);
}

export function getProjectHistory(
  projectId: string,
  before?: string,
  limit: number = HISTORY_PAGE_SIZE,
): Promise<ChatHistoryPage> {
  const params = new URLSearchParams();
  if (before) params.set('before', before);
  params.set('limit', String(limit));
  return apiRequest<ChatHistoryPage>(`/projects/${projectId}/chat/history?${params.toString()}`);
}

export function sendProjectMessage(
  projectId: string,
  content: string,
  replyToId?: string,
): Promise<ChatMessage> {
  const body: Record<string, string> = { content };
  if (replyToId) body.replyToId = replyToId;
  return apiRequest<ChatMessage>(`/projects/${projectId}/chat`, { method: 'POST', body });
}

export function getProjectUnreadCount(projectId: string): Promise<{ count: number }> {
  return apiRequest<{ count: number }>(`/projects/${projectId}/chat/unread-count`);
}

export function markProjectRead(projectId: string): Promise<unknown> {
  return apiRequest(`/projects/${projectId}/chat/read`, { method: 'POST' });
}

/**
 * Xin AI phân tích tin nhắn.
 * `idempotencyKey` phải được sinh MỘT LẦN cho mỗi tin nhắn và giữ nguyên khi thử lại,
 * nếu không mạng chập chờn sẽ khiến server gọi AI nhiều lần.
 */
export function requestTaskSuggestion(
  projectId: string,
  messageId: string,
  idempotencyKey: string,
): Promise<ChatTaskSuggestion> {
  return apiRequest<ChatTaskSuggestion>(
    `/projects/${projectId}/chat/${messageId}/ai-task-suggestion`,
    { method: 'POST', headers: { 'Idempotency-Key': idempotencyKey } },
  );
}

/** Gắn một công việc ĐÃ TỒN TẠI vào tin nhắn. Không tạo công việc mới. */
export function linkMessageTask(
  projectId: string,
  messageId: string,
  taskId: string,
): Promise<ChatMessage> {
  return apiRequest<ChatMessage>(`/projects/${projectId}/chat/${messageId}/task`, {
    method: 'PATCH',
    body: { taskId },
  });
}
```

Tạo `src/lib/api/tasks.ts`:

```ts
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
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest api/__tests__/chat
```

Kỳ vọng: PASS, 13 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/api/projects.ts src/lib/api/chat.ts src/lib/api/tasks.ts src/lib/api/__tests__/chat.test.ts
```

```bash
git commit -m "feat: them module API du an, chat va cong viec"
```

---

## Task 3: Hàm thuần gộp danh sách tin nhắn

**Files:**
- Create: `src/lib/chat/message-list.ts`
- Test: `src/lib/chat/__tests__/message-list.test.ts`

**Interfaces:**
- Produces:
  - `mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[]`
  - `applyRecall(list: ChatMessage[], recalled: ChatMessage): ChatMessage[]`

**Yêu cầu hành vi:** hàm thuần, không I/O, không React. Sắp xếp tăng dần theo `createdAt`. Trùng `id` thì bản mới thắng — cần thiết vì cùng một tin nhắn đến từ cả REST lẫn socket.

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/chat/__tests__/message-list.test.ts`:

```ts
import { mergeMessages, applyRecall } from '../message-list';
import type { ChatMessage } from '../../types';

function makeMessage(id: string, minute: number, content = 'noi dung'): ChatMessage {
  return {
    id,
    content,
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u1',
    createdAt: `2026-08-04T00:${String(minute).padStart(2, '0')}:00.000Z`,
    updatedAt: `2026-08-04T00:${String(minute).padStart(2, '0')}:00.000Z`,
  };
}

describe('mergeMessages', () => {
  it('trả danh sách rỗng khi cả hai nguồn rỗng', () => {
    expect(mergeMessages([], [])).toEqual([]);
  });

  it('sắp xếp tăng dần theo thời gian tạo', () => {
    const merged = mergeMessages([makeMessage('b', 5)], [makeMessage('a', 1)]);
    expect(merged.map((m) => m.id)).toEqual(['a', 'b']);
  });

  it('khử trùng theo id, bản đến sau thắng', () => {
    const cu = makeMessage('a', 1, 'ban cu');
    const moi = makeMessage('a', 1, 'ban moi');
    const merged = mergeMessages([cu], [moi]);
    expect(merged).toHaveLength(1);
    expect(merged[0].content).toBe('ban moi');
  });

  it('không làm thay đổi mảng đầu vào', () => {
    const existing = [makeMessage('a', 1)];
    const snapshot = [...existing];
    mergeMessages(existing, [makeMessage('b', 2)]);
    expect(existing).toEqual(snapshot);
  });

  it('gộp được nhiều tin cùng lúc', () => {
    const merged = mergeMessages(
      [makeMessage('a', 1), makeMessage('c', 3)],
      [makeMessage('b', 2), makeMessage('d', 4)],
    );
    expect(merged.map((m) => m.id)).toEqual(['a', 'b', 'c', 'd']);
  });
});

describe('applyRecall', () => {
  it('thay tin nhắn bị thu hồi bằng bản mới', () => {
    const list = [makeMessage('a', 1), makeMessage('b', 2)];
    const recalled: ChatMessage = { ...makeMessage('b', 2), deletedAt: '2026-08-04T01:00:00.000Z' };

    const next = applyRecall(list, recalled);

    expect(next).toHaveLength(2);
    expect(next[1].deletedAt).toBe('2026-08-04T01:00:00.000Z');
  });

  it('bỏ qua khi không tìm thấy tin nhắn', () => {
    const list = [makeMessage('a', 1)];
    expect(applyRecall(list, makeMessage('khong-ton-tai', 9))).toEqual(list);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest message-list
```

Kỳ vọng: FAIL với "Cannot find module '../message-list'".

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/chat/message-list.ts`:

```ts
import type { ChatMessage } from '../types';

/**
 * Gộp hai nguồn tin nhắn thành một danh sách đã sắp xếp và khử trùng.
 * Cùng một tin nhắn có thể đến từ cả REST lẫn socket, nên khử trùng theo id là bắt buộc.
 * Bản đến sau thắng vì nó mới hơn.
 */
export function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const byId = new Map<string, ChatMessage>();
  for (const message of existing) {
    byId.set(message.id, message);
  }
  for (const message of incoming) {
    byId.set(message.id, message);
  }

  return Array.from(byId.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

/** Thay một tin nhắn bằng bản đã thu hồi. Trả nguyên danh sách nếu không tìm thấy. */
export function applyRecall(list: ChatMessage[], recalled: ChatMessage): ChatMessage[] {
  if (!list.some((message) => message.id === recalled.id)) {
    return list;
  }
  return list.map((message) => (message.id === recalled.id ? recalled : message));
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest message-list
```

Kỳ vọng: PASS, 7 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/chat/message-list.ts src/lib/chat/__tests__/message-list.test.ts
```

```bash
git commit -m "feat: them logic gop danh sach tin nhan"
```

---

## Task 4: Luồng ba bước tạo công việc từ tin nhắn

**Files:**
- Create: `src/lib/chat/create-task-from-message.ts`
- Test: `src/lib/chat/__tests__/create-task-from-message.test.ts`

**Interfaces:**
- Consumes: `createTask` từ `src/lib/api/tasks`; `linkMessageTask` từ `src/lib/api/chat`
- Produces:
  - `combineDueDateTime(date?: string, time?: string): string | undefined`
  - `createTaskFromMessage(input): Promise<CreateTaskFromMessageResult>`
  - `type CreateTaskFromMessageResult = { outcome: 'created-and-linked'; task; message } | { outcome: 'created-not-linked'; task; error } | { outcome: 'failed'; error }`

**Yêu cầu hành vi — đây là phần dễ sai nhất của cả kế hoạch:**

`POST /tasks` và `PATCH /chat/:id/task` là hai lời gọi tách rời. Nếu bước một thành công còn bước hai hỏng, **công việc đã được tạo thật trong hệ thống**. Tuyệt đối không được nuốt lỗi rồi để người dùng bấm lại, vì như vậy sẽ tạo công việc trùng. Hàm này phải trả về ba kết cục phân biệt được để tầng giao diện xử lý đúng.

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/chat/__tests__/create-task-from-message.test.ts`:

```ts
import { createTaskFromMessage, combineDueDateTime } from '../create-task-from-message';
import { createTask } from '../../api/tasks';
import { linkMessageTask } from '../../api/chat';

jest.mock('../../api/tasks');
jest.mock('../../api/chat');

const mockedCreateTask = createTask as jest.MockedFunction<typeof createTask>;
const mockedLink = linkMessageTask as jest.MockedFunction<typeof linkMessageTask>;

const task = { id: 't1', title: 'Nộp báo cáo' };
const message = { id: 'm1', content: 'Mai nộp báo cáo nhé' };

const baseInput = {
  projectId: 'p1',
  workspaceId: 'w1',
  messageId: 'm1',
  title: 'Nộp báo cáo',
};

describe('combineDueDateTime', () => {
  it('trả undefined khi không có ngày', () => {
    expect(combineDueDateTime(undefined, '09:00')).toBeUndefined();
  });

  it('mặc định 00:00 khi có ngày mà thiếu giờ', () => {
    const iso = combineDueDateTime('2026-08-10');
    expect(iso).toBe(new Date('2026-08-10T00:00:00').toISOString());
  });

  it('ghép ngày với giờ', () => {
    const iso = combineDueDateTime('2026-08-10', '09:30');
    expect(iso).toBe(new Date('2026-08-10T09:30:00').toISOString());
  });

  it('trả undefined khi ngày không hợp lệ', () => {
    expect(combineDueDateTime('khong-phai-ngay', '09:00')).toBeUndefined();
  });
});

describe('createTaskFromMessage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('tạo rồi gắn thành công', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockResolvedValue(message as never);

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('created-and-linked');
    expect(mockedCreateTask).toHaveBeenCalledWith({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
    });
    expect(mockedLink).toHaveBeenCalledWith('p1', 'm1', 't1');
  });

  it('gửi kèm người phụ trách và hạn chót khi có', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockResolvedValue(message as never);

    await createTaskFromMessage({
      ...baseInput,
      assigneeId: 'u2',
      description: 'Từ tin nhắn',
      dueDate: '2026-08-10',
      dueTime: '09:00',
    });

    expect(mockedCreateTask).toHaveBeenCalledWith({
      title: 'Nộp báo cáo',
      workspaceId: 'w1',
      projectId: 'p1',
      assigneeId: 'u2',
      description: 'Từ tin nhắn',
      dueDate: new Date('2026-08-10T09:00:00').toISOString(),
    });
  });

  it('báo created-not-linked khi tạo xong nhưng gắn hỏng', async () => {
    mockedCreateTask.mockResolvedValue(task as never);
    mockedLink.mockRejectedValue(new Error('Mạng lỗi'));

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('created-not-linked');
    if (result.outcome === 'created-not-linked') {
      expect(result.task.id).toBe('t1');
      expect(result.error.message).toBe('Mạng lỗi');
    }
  });

  it('báo failed khi ngay bước tạo đã hỏng', async () => {
    mockedCreateTask.mockRejectedValue(new Error('Không tạo được công việc'));

    const result = await createTaskFromMessage(baseInput);

    expect(result.outcome).toBe('failed');
    expect(mockedLink).not.toHaveBeenCalled();
  });

  it('không tạo lại công việc khi được đưa sẵn existingTaskId', async () => {
    mockedLink.mockResolvedValue(message as never);

    const result = await createTaskFromMessage({ ...baseInput, existingTaskId: 't1' });

    expect(mockedCreateTask).not.toHaveBeenCalled();
    expect(mockedLink).toHaveBeenCalledWith('p1', 'm1', 't1');
    expect(result.outcome).toBe('created-and-linked');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest create-task-from-message
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/chat/create-task-from-message.ts`:

```ts
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
    try {
      task = await createTask({
        title: input.title,
        workspaceId: input.workspaceId,
        projectId: input.projectId,
        ...(input.description ? { description: input.description } : {}),
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        ...(combineDueDateTime(input.dueDate, input.dueTime)
          ? { dueDate: combineDueDateTime(input.dueDate, input.dueTime) }
          : {}),
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
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest create-task-from-message
```

Kỳ vọng: PASS, 9 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/chat/create-task-from-message.ts src/lib/chat/__tests__/create-task-from-message.test.ts
```

```bash
git commit -m "feat: them luong ba buoc tao cong viec tu tin nhan"
```

---

## Task 5: Kết nối Socket.IO

**Files:**
- Create: `src/lib/socket.ts`
- Test: `src/lib/__tests__/socket.test.ts`

**Interfaces:**
- Consumes: `socket.io-client`; `loadToken` từ `src/lib/auth/token-storage`
- Produces:
  - `buildSocketUrl(baseUrl: string): string`
  - `createChatSocket(token: string): Socket`

**Yêu cầu hành vi:**
- URL phải là `<API_BASE>/chat` — namespace `/chat`, không phải gốc
- Token đi qua `auth: { token }`, không phải query string
- `transports: ['websocket', 'polling']` khớp cấu hình server

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/__tests__/socket.test.ts`:

```ts
import { io } from 'socket.io-client';
import { buildSocketUrl, createChatSocket } from '../socket';

jest.mock('socket.io-client', () => ({ io: jest.fn(() => ({ on: jest.fn() })) }));

const mockedIo = io as jest.MockedFunction<typeof io>;

describe('buildSocketUrl', () => {
  it('gắn namespace /chat vào base URL', () => {
    expect(buildSocketUrl('https://api.test')).toBe('https://api.test/chat');
  });

  it('cắt dấu gạch chéo thừa ở cuối', () => {
    expect(buildSocketUrl('https://api.test/')).toBe('https://api.test/chat');
  });
});

describe('createChatSocket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
  });

  it('nối tới namespace /chat', () => {
    createChatSocket('tok-1');
    expect(mockedIo).toHaveBeenCalledWith('https://api.test/chat', expect.anything());
  });

  it('gửi token qua auth chứ không qua query', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as { auth: { token: string } };
    expect(options.auth).toEqual({ token: 'tok-1' });
  });

  it('dùng đúng transport như server cấu hình', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as { transports: string[] };
    expect(options.transports).toEqual(['websocket', 'polling']);
  });

  it('bật tự kết nối lại', () => {
    createChatSocket('tok-1');
    const options = mockedIo.mock.calls[0][1] as { reconnection: boolean };
    expect(options.reconnection).toBe(true);
  });

  it('ném lỗi rõ ràng khi thiếu biến môi trường', () => {
    delete process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(() => createChatSocket('tok-1')).toThrow(
      'Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.',
    );
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest __tests__/socket
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/socket.ts`:

```ts
import { io, type Socket } from 'socket.io-client';
import type { ChatMessage } from './types';

/**
 * Gateway của server khai `namespace: '/chat'`. Nối vào gốc sẽ bắt tay được nhưng
 * KHÔNG nhận được sự kiện nào — một lỗi rất khó nhìn ra.
 */
export function buildSocketUrl(baseUrl: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/chat`;
}

/** Sự kiện server phát xuống. Đặt tên theo đúng chuỗi trong `chat.gateway.ts`. */
export interface ServerEvents {
  'message:project': (message: ChatMessage) => void;
  'message:project:updated': (message: ChatMessage) => void;
  'message:project:recalled': (message: ChatMessage) => void;
  'typing:project': (payload: { projectId: string; typing: boolean; userId: string }) => void;
  'presence:snapshot': (userIds: string[]) => void;
  'presence:online': (payload: { userId: string }) => void;
  'presence:offline': (payload: { userId: string }) => void;
}

export function createChatSocket(token: string): Socket {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!base) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }

  return io(buildSocketUrl(base), {
    // Server đọc `handshake.auth.token`. Truyền qua query sẽ bị từ chối.
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10_000,
    timeout: 20_000,
  });
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest __tests__/socket
```

Kỳ vọng: PASS, 8 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/socket.ts src/lib/__tests__/socket.test.ts
```

```bash
git commit -m "feat: them ket noi Socket.IO namespace chat"
```

---

## Task 6: SocketProvider

**Files:**
- Create: `src/lib/socket/socket-context.tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Test: `src/lib/socket/__tests__/socket-context.test.tsx`

**Interfaces:**
- Consumes: `createChatSocket`; `useAuth`; `loadToken`
- Produces:
  - `SocketProvider` (component)
  - `useSocket(): { socket: Socket | null; connected: boolean; onlineUserIds: Set<string> }`

**Yêu cầu hành vi:** chỉ kết nối khi `status === 'signedIn'`. Ngắt kết nối và dọn listener khi đăng xuất hoặc unmount — nếu không, đăng nhập lại sẽ tạo kết nối chồng và tin nhắn hiện hai lần.

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/socket/__tests__/socket-context.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { SocketProvider, useSocket } from '../socket-context';
import { createChatSocket } from '../../socket';
import { useAuth } from '../../auth/auth-context';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../socket');
jest.mock('../../auth/auth-context');
jest.mock('../../auth/token-storage');

const mockedCreate = createChatSocket as jest.MockedFunction<typeof createChatSocket>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;

function makeFakeSocket() {
  const handlers: Record<string, (...args: never[]) => void> = {};
  return {
    handlers,
    on: jest.fn((event: string, fn: (...args: never[]) => void) => {
      handlers[event] = fn;
    }),
    off: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  };
}

function Probe() {
  const { connected, onlineUserIds } = useSocket();
  return (
    <>
      <Text testID="connected">{connected ? 'co' : 'khong'}</Text>
      <Text testID="online">{String(onlineUserIds.size)}</Text>
    </>
  );
}

describe('SocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadToken.mockResolvedValue('tok-1');
  });

  it('không kết nối khi chưa đăng nhập', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedOut' } as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).not.toHaveBeenCalled());
  });

  it('kết nối khi đã đăng nhập', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    mockedCreate.mockReturnValue(makeFakeSocket() as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith('tok-1'));
  });

  it('cập nhật cờ connected khi socket báo connect', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { getByTestId } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(fake.handlers.connect).toBeDefined());
    fake.handlers.connect();

    await waitFor(() => expect(getByTestId('connected').props.children).toBe('co'));
  });

  it('ghi nhận danh sách người đang online từ presence:snapshot', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { getByTestId } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(fake.handlers['presence:snapshot']).toBeDefined());
    fake.handlers['presence:snapshot'](['u1', 'u2'] as never);

    await waitFor(() => expect(getByTestId('online').props.children).toBe('2'));
  });

  it('ngắt kết nối khi unmount', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { unmount } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    await unmount();

    expect(fake.disconnect).toHaveBeenCalled();
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest socket-context
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/socket/socket-context.tsx`:

```tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Socket } from 'socket.io-client';

import { useAuth } from '../auth/auth-context';
import { loadToken } from '../auth/token-storage';
import { createChatSocket } from '../socket';

export interface SocketState {
  socket: Socket | null;
  connected: boolean;
  onlineUserIds: Set<string>;
}

const SocketContext = createContext<SocketState | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }

    let cancelled = false;
    let active: Socket | null = null;

    (async () => {
      const token = await loadToken();
      if (!token || cancelled) return;

      const next = createChatSocket(token);
      active = next;

      next.on('connect', () => setConnected(true));
      next.on('disconnect', () => setConnected(false));
      next.on('presence:snapshot', (ids: string[]) => setOnlineUserIds(new Set(ids)));
      next.on('presence:online', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => new Set(current).add(userId)),
      );
      next.on('presence:offline', ({ userId }: { userId: string }) =>
        setOnlineUserIds((current) => {
          const copy = new Set(current);
          copy.delete(userId);
          return copy;
        }),
      );

      if (!cancelled) setSocket(next);
    })();

    return () => {
      cancelled = true;
      // Bắt buộc dọn. Bỏ qua sẽ khiến đăng nhập lại tạo kết nối chồng
      // và mỗi tin nhắn hiện hai lần.
      active?.disconnect();
      setSocket(null);
      setConnected(false);
      setOnlineUserIds(new Set());
    };
  }, [status]);

  const value = useMemo<SocketState>(
    () => ({ socket, connected, onlineUserIds }),
    [socket, connected, onlineUserIds],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket(): SocketState {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket phải được dùng bên trong SocketProvider');
  }
  return context;
}
```

- [ ] **Bước 4: Gắn provider vào khung tab**

Trong `src/app/(tabs)/_layout.tsx`, thêm import:

```tsx
import { SocketProvider } from '../../lib/socket/socket-context';
```

rồi bọc `WorkspaceProvider` lại — đổi phần `return` của `TabsLayout` thành:

```tsx
  return (
    <SocketProvider>
      <WorkspaceProvider>
        <TabsWithWorkspace />
      </WorkspaceProvider>
    </SocketProvider>
  );
```

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npx jest socket-context
```

Kỳ vọng: PASS, 5 test.

- [ ] **Bước 6: Kiểm tra kiểu**

```bash
npx tsc --noEmit
```

Kỳ vọng: exit 0.

- [ ] **Bước 7: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/socket/socket-context.tsx src/lib/socket/__tests__/socket-context.test.tsx "src/app/(tabs)/_layout.tsx"
```

```bash
git commit -m "feat: them SocketProvider quan ly ket noi realtime"
```

---

## Task 7: Màn hình danh sách dự án

**Files:**
- Create: `src/components/chat/ProjectRow.tsx`
- Modify: `src/app/(tabs)/chat/index.tsx`
- Test: `src/components/chat/__tests__/ProjectRow.test.tsx`

**Interfaces:**
- Consumes: `listProjects`, `getProjectUnreadCount`, `useWorkspace`, `Button`, `ScreenContainer`
- Produces: `<ProjectRow project unreadCount onPress />`

**Yêu cầu hành vi:**
- Empty state tiếng Việt khi workspace chưa có dự án nào — **quan trọng với người duyệt Play**, vì tài khoản demo trống mà trông như app hỏng là lý do bị từ chối
- `/chat/unread-count` là per-project nên có N+1 request; giới hạn **tối đa 6 request đồng thời**

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/components/chat/__tests__/ProjectRow.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { ProjectRow } from '../ProjectRow';
import type { Project } from '../../../lib/types';

const project: Project = {
  id: 'p1',
  name: 'Đồ án tốt nghiệp',
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '2026-08-04T00:00:00.000Z',
  updatedAt: '2026-08-04T00:00:00.000Z',
};

describe('ProjectRow', () => {
  it('hiện tên dự án', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={() => {}} />,
    );
    expect(getByText('Đồ án tốt nghiệp')).toBeTruthy();
  });

  it('ẩn badge khi không có tin chưa đọc', async () => {
    const { queryByTestId } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={() => {}} />,
    );
    expect(queryByTestId('unread-badge')).toBeNull();
  });

  it('hiện số tin chưa đọc', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={5} onPress={() => {}} />,
    );
    expect(getByText('5')).toBeTruthy();
  });

  it('rút gọn thành 99+ khi quá lớn', async () => {
    const { getByText } = await render(
      <ProjectRow project={project} unreadCount={150} onPress={() => {}} />,
    );
    expect(getByText('99+')).toBeTruthy();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <ProjectRow project={project} unreadCount={0} onPress={onPress} />,
    );

    await fireEvent.press(getByTestId('project-row-p1'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest ProjectRow
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết component**

Tạo `src/components/chat/ProjectRow.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Project } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface ProjectRowProps {
  project: Project;
  unreadCount: number;
  onPress: () => void;
}

export function ProjectRow({ project, unreadCount, onPress }: ProjectRowProps) {
  const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <Pressable
      testID={`project-row-${project.id}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{project.name.charAt(0).toUpperCase()}</Text>
      </View>

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {project.name}
        </Text>
        {project.description ? (
          <Text style={styles.description} numberOfLines={1}>
            {project.description}
          </Text>
        ) : null}
      </View>

      {unreadCount > 0 ? (
        <View testID="unread-badge" style={styles.badge}>
          <Text style={styles.badgeText}>{badgeLabel}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surface },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: fontSize.md },
  body: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  description: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  badge: {
    minWidth: 24,
    height: 24,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    marginLeft: spacing.sm,
  },
  badgeText: { color: '#ffffff', fontSize: fontSize.xs, fontWeight: '700' },
});
```

- [ ] **Bước 4: Thay màn hình danh sách dự án**

Thay toàn bộ `src/app/(tabs)/chat/index.tsx`:

```tsx
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueries } from '@tanstack/react-query';

import { ProjectRow } from '../../../components/chat/ProjectRow';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { listProjects } from '../../../lib/api/projects';
import { getProjectUnreadCount } from '../../../lib/api/chat';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../../theme/tokens';

/** Giới hạn để tránh N+1 request bắn cùng lúc trên mạng di động. */
const MAX_UNREAD_QUERIES = 6;

export default function ChatListScreen() {
  const router = useRouter();
  const { active } = useWorkspace();
  const workspaceId = active?.id;

  const projectsQuery = useQuery({
    queryKey: ['projects', workspaceId],
    queryFn: () => listProjects(workspaceId),
    enabled: Boolean(workspaceId),
  });

  const projects = projectsQuery.data ?? [];

  // Chỉ hỏi số chưa đọc cho một số dự án đầu tiên. Các dự án còn lại hiện badge 0
  // cho tới khi người dùng mở, thay vì bắn hàng chục request cùng lúc.
  const unreadQueries = useQueries({
    queries: projects.slice(0, MAX_UNREAD_QUERIES).map((project) => ({
      queryKey: ['chat-unread', project.id],
      queryFn: () => getProjectUnreadCount(project.id),
      staleTime: 15_000,
    })),
  });

  const unreadById = new Map<string, number>();
  projects.slice(0, MAX_UNREAD_QUERIES).forEach((project, index) => {
    unreadById.set(project.id, unreadQueries[index]?.data?.count ?? 0);
  });

  const openProject = useCallback(
    (projectId: string) => router.push(`/chat/${projectId}`),
    [router],
  );

  if (projectsQuery.isLoading) {
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
      <Text style={styles.heading}>Trò chuyện</Text>

      {projectsQuery.isError ? (
        <ErrorBanner
          message={
            projectsQuery.error instanceof Error
              ? projectsQuery.error.message
              : 'Không tải được danh sách dự án.'
          }
        />
      ) : null}

      <FlatList
        data={projects}
        keyExtractor={(project) => project.id}
        renderItem={({ item }) => (
          <ProjectRow
            project={item}
            unreadCount={unreadById.get(item.id) ?? 0}
            onPress={() => openProject(item.id)}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={projectsQuery.isRefetching}
            onRefresh={() => projectsQuery.refetch()}
            colors={[colors.primary]}
          />
        }
        ListEmptyComponent={
          projectsQuery.isError ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có dự án nào</Text>
              <Text style={styles.emptyBody}>
                Không gian làm việc này chưa có dự án. Tạo dự án trên web WeDo, rồi quay lại đây để
                trò chuyện cùng nhóm.
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
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npx jest ProjectRow
```

Kỳ vọng: PASS, 5 test.

- [ ] **Bước 6: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/components/chat/ProjectRow.tsx src/components/chat/__tests__/ProjectRow.test.tsx "src/app/(tabs)/chat/index.tsx"
```

```bash
git commit -m "feat: them man hinh danh sach du an"
```

---

## Task 8: Bong bóng tin nhắn và ô soạn tin

**Files:**
- Create: `src/components/chat/MessageBubble.tsx`, `src/components/chat/MessageComposer.tsx`
- Test: `src/components/chat/__tests__/MessageBubble.test.tsx`, `src/components/chat/__tests__/MessageComposer.test.tsx`

**Interfaces:**
- Produces:
  - `<MessageBubble message isMine isPending isFailed onLongPress onRetry />`
  - `<MessageComposer value onChangeText onSend sending />`

**Yêu cầu hành vi:**
- Nhấn giữ kích hoạt `onLongPress` kèm phản hồi rung — đây là tương tác native chống lại cáo buộc "app mỏng"
- Tin đã thu hồi (`deletedAt`) hiện chữ xám "Tin nhắn đã được thu hồi", không hiện nội dung cũ
- Tin đã gắn công việc hiện nhãn nhỏ

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/components/chat/__tests__/MessageBubble.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { MessageBubble } from '../MessageBubble';
import type { ChatMessage } from '../../../lib/types';

function makeMessage(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: 'm1',
    content: 'Mai nộp báo cáo nhé',
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u1',
    createdAt: '2026-08-04T03:15:00.000Z',
    updatedAt: '2026-08-04T03:15:00.000Z',
    author: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    ...overrides,
  };
}

describe('MessageBubble', () => {
  it('hiện nội dung tin nhắn', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Mai nộp báo cáo nhé')).toBeTruthy();
  });

  it('hiện tên người gửi khi không phải tin của mình', async () => {
    const { getByText } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={() => {}} />,
    );
    expect(getByText('Lê Hữu Đại')).toBeTruthy();
  });

  it('ẩn tên người gửi với tin của mình', async () => {
    const { queryByText } = await render(
      <MessageBubble message={makeMessage()} isMine onLongPress={() => {}} />,
    );
    expect(queryByText('Lê Hữu Đại')).toBeNull();
  });

  it('gọi onLongPress khi nhấn giữ', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble message={makeMessage()} isMine={false} onLongPress={onLongPress} />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('hiện chữ thu hồi thay cho nội dung cũ', async () => {
    const { getByText, queryByText } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );

    expect(getByText('Tin nhắn đã được thu hồi')).toBeTruthy();
    expect(queryByText('Mai nộp báo cáo nhé')).toBeNull();
  });

  it('không cho nhấn giữ tin đã thu hồi', async () => {
    const onLongPress = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage({ deletedAt: '2026-08-04T04:00:00.000Z' })}
        isMine={false}
        onLongPress={onLongPress}
      />,
    );

    await fireEvent(getByTestId('message-m1'), 'longPress');
    expect(onLongPress).not.toHaveBeenCalled();
  });

  it('hiện nhãn khi tin đã gắn công việc', async () => {
    const { getByText } = await render(
      <MessageBubble
        message={makeMessage({
          taskId: 't1',
          task: {
            id: 't1',
            title: 'Nộp báo cáo',
            status: 'TODO',
            projectId: 'p1',
            workspaceId: 'w1',
          },
        })}
        isMine={false}
        onLongPress={() => {}}
      />,
    );
    expect(getByText('Đã tạo công việc: Nộp báo cáo')).toBeTruthy();
  });

  it('hiện nút thử lại khi gửi hỏng', async () => {
    const onRetry = jest.fn();
    const { getByTestId } = await render(
      <MessageBubble
        message={makeMessage()}
        isMine
        isFailed
        onRetry={onRetry}
        onLongPress={() => {}}
      />,
    );

    await fireEvent.press(getByTestId('retry-m1'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
```

Tạo `src/components/chat/__tests__/MessageComposer.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { MessageComposer } from '../MessageComposer';

describe('MessageComposer', () => {
  it('báo thay đổi văn bản', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="" onChangeText={onChangeText} onSend={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('composer-input'), 'Xin chào');
    expect(onChangeText).toHaveBeenCalledWith('Xin chào');
  });

  it('gọi onSend khi bấm gửi', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('không gửi khi ô trống', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="   " onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('không gửi khi đang gửi dở', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} sending />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest "MessageBubble|MessageComposer"
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết `MessageBubble`**

Tạo `src/components/chat/MessageBubble.tsx`:

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import type { ChatMessage } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface MessageBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  isPending?: boolean;
  isFailed?: boolean;
  onLongPress: () => void;
  onRetry?: () => void;
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function MessageBubble({
  message,
  isMine,
  isPending = false,
  isFailed = false,
  onLongPress,
  onRetry,
}: MessageBubbleProps) {
  const recalled = Boolean(message.deletedAt);

  const handleLongPress = () => {
    if (recalled) return;
    // Rung nhẹ khi nhấn giữ. Đây là tương tác native thật, thứ phân biệt app gốc
    // với trang web bọc lại.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress();
  };

  return (
    <View style={[styles.wrapper, isMine ? styles.wrapperMine : styles.wrapperTheirs]}>
      {!isMine && message.author ? (
        <Text style={styles.author}>{message.author.fullName}</Text>
      ) : null}

      <Pressable
        testID={`message-${message.id}`}
        accessibilityRole="button"
        accessibilityHint={recalled ? undefined : 'Nhấn giữ để tạo công việc từ tin nhắn này'}
        onLongPress={handleLongPress}
        delayLongPress={350}
        style={[
          styles.bubble,
          isMine ? styles.bubbleMine : styles.bubbleTheirs,
          isPending ? styles.bubblePending : null,
          isFailed ? styles.bubbleFailed : null,
        ]}
      >
        {recalled ? (
          <Text style={styles.recalled}>Tin nhắn đã được thu hồi</Text>
        ) : (
          <Text style={[styles.content, isMine ? styles.contentMine : null]}>
            {message.content}
          </Text>
        )}

        {message.task ? (
          <View style={styles.taskTag}>
            <Text style={styles.taskTagText}>Đã tạo công việc: {message.task.title}</Text>
          </View>
        ) : null}

        <Text style={[styles.time, isMine ? styles.timeMine : null]}>
          {isPending ? 'Đang gửi…' : formatTime(message.createdAt)}
        </Text>
      </Pressable>

      {isFailed && onRetry ? (
        <Pressable testID={`retry-${message.id}`} onPress={onRetry} style={styles.retry}>
          <Text style={styles.retryText}>Gửi lại</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: spacing.xs, maxWidth: '82%' },
  wrapperMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  wrapperTheirs: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  author: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2, marginLeft: spacing.xs },
  bubble: { borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  bubbleMine: { backgroundColor: colors.primary },
  bubbleTheirs: { backgroundColor: colors.surface },
  bubblePending: { opacity: 0.6 },
  bubbleFailed: { borderWidth: 1, borderColor: colors.danger },
  content: { fontSize: fontSize.md, color: colors.text },
  contentMine: { color: '#ffffff' },
  recalled: { fontSize: fontSize.sm, color: colors.textMuted, fontStyle: 'italic' },
  taskTag: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.12)',
  },
  taskTagText: { fontSize: fontSize.xs, color: colors.success, fontWeight: '600' },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: 'flex-end' },
  timeMine: { color: 'rgba(255,255,255,0.75)' },
  retry: { marginTop: spacing.xs },
  retryText: { fontSize: fontSize.xs, color: colors.danger, fontWeight: '600' },
});
```

- [ ] **Bước 4: Viết `MessageComposer`**

Tạo `src/components/chat/MessageComposer.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface MessageComposerProps {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
}

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  sending = false,
}: MessageComposerProps) {
  const canSend = value.trim().length > 0 && !sending;

  return (
    <View style={styles.bar}>
      <TextInput
        testID="composer-input"
        accessibilityLabel="Soạn tin nhắn"
        value={value}
        onChangeText={onChangeText}
        placeholder="Nhập tin nhắn…"
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        maxLength={2000}
      />

      <Pressable
        testID="composer-send"
        accessibilityRole="button"
        accessibilityLabel="Gửi"
        accessibilityState={{ disabled: !canSend }}
        onPress={() => {
          if (canSend) onSend();
        }}
        style={[styles.send, canSend ? null : styles.sendDisabled]}
      >
        {sending ? (
          <ActivityIndicator color="#ffffff" size="small" />
        ) : (
          <Text style={styles.sendText}>Gửi</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text,
  },
  send: {
    marginLeft: spacing.sm,
    minWidth: 64,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#ffffff', fontWeight: '700', fontSize: fontSize.sm },
});
```

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npx jest "MessageBubble|MessageComposer"
```

Kỳ vọng: PASS, 12 test.

- [ ] **Bước 6: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/components/chat/MessageBubble.tsx src/components/chat/MessageComposer.tsx src/components/chat/__tests__/MessageBubble.test.tsx src/components/chat/__tests__/MessageComposer.test.tsx
```

```bash
git commit -m "feat: them bong bong tin nhan va o soan tin"
```

---

## Task 9: Bottom sheet đề xuất công việc

**Files:**
- Create: `src/components/chat/TaskSuggestionSheet.tsx`
- Test: `src/components/chat/__tests__/TaskSuggestionSheet.test.tsx`

**Interfaces:**
- Consumes: `Button`, `TextField`, `ErrorBanner`, `@react-native-community/datetimepicker`
- Produces: `<TaskSuggestionSheet visible loading suggestion members error onConfirm onDismiss onReport />`
- `onConfirm(values: { title: string; description?: string; assigneeId?: string; dueDate?: string; dueTime?: string })`

**Yêu cầu hành vi:**
- Mọi trường AI đề xuất đều **sửa được**. AI đề xuất, người dùng quyết định.
- `hasTask === false` → hiện lời nhắc nhưng **vẫn cho tạo thủ công**
- Có nút "Đề xuất này không đúng" (mục 3.3 của spec — chính sách AI không bắt buộc với app năng suất, nhưng đây là bảo hiểm rẻ)
- Không được gửi khi tiêu đề rỗng

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/components/chat/__tests__/TaskSuggestionSheet.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';

import { TaskSuggestionSheet } from '../TaskSuggestionSheet';
import type { ChatTaskSuggestion, UserSummary } from '../../../lib/types';

const members: UserSummary[] = [
  { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
  { id: 'u2', email: 'x@y.z', fullName: 'Nguyễn Văn A' },
];

const suggestion: ChatTaskSuggestion = {
  hasTask: true,
  title: 'Nộp báo cáo tuần',
  description: 'Từ tin nhắn trong nhóm',
  assigneeId: 'u2',
  dueDate: '2026-08-10',
  dueTime: '09:00',
  confidence: 'high',
};

describe('TaskSuggestionSheet', () => {
  it('hiện trạng thái đang phân tích', async () => {
    const { getByText } = await render(
      <TaskSuggestionSheet
        visible
        loading
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Đang phân tích tin nhắn…')).toBeTruthy();
  });

  it('điền sẵn tiêu đề từ đề xuất', async () => {
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );

    await waitFor(() => expect(getByTestId('suggestion-title').props.value).toBe('Nộp báo cáo tuần'));
  });

  it('cho sửa tiêu đề rồi gửi giá trị đã sửa', async () => {
    const onConfirm = jest.fn();
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    await fireEvent.changeText(getByTestId('suggestion-title'), 'Tiêu đề đã sửa');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tiêu đề đã sửa' })),
    );
  });

  it('chặn gửi khi tiêu đề rỗng', async () => {
    const onConfirm = jest.fn();
    const { getByTestId, getByText } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    await fireEvent.changeText(getByTestId('suggestion-title'), '   ');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() => expect(getByText('Vui lòng nhập tên công việc')).toBeTruthy());
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('báo khi AI không thấy công việc nhưng vẫn cho tạo', async () => {
    const onConfirm = jest.fn();
    const { getByText, getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={{ hasTask: false, title: '', confidence: 'low' }}
        members={members}
        onConfirm={onConfirm}
        onDismiss={() => {}}
      />,
    );

    expect(getByText('Tin nhắn này có vẻ không chứa công việc')).toBeTruthy();

    await fireEvent.changeText(getByTestId('suggestion-title'), 'Tự nhập');
    await fireEvent.press(getByTestId('suggestion-confirm'));

    await waitFor(() =>
      expect(onConfirm).toHaveBeenCalledWith(expect.objectContaining({ title: 'Tự nhập' })),
    );
  });

  it('hiện thông báo lỗi khi được truyền vào', async () => {
    const { getByText } = await render(
      <TaskSuggestionSheet
        visible
        error="Không phân tích được tin nhắn."
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
      />,
    );
    expect(getByText('Không phân tích được tin nhắn.')).toBeTruthy();
  });

  it('gọi onReport khi báo đề xuất sai', async () => {
    const onReport = jest.fn();
    const { getByTestId } = await render(
      <TaskSuggestionSheet
        visible
        suggestion={suggestion}
        members={members}
        onConfirm={() => {}}
        onDismiss={() => {}}
        onReport={onReport}
      />,
    );

    await fireEvent.press(getByTestId('suggestion-report'));
    expect(onReport).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest TaskSuggestionSheet
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết component**

Tạo `src/components/chat/TaskSuggestionSheet.tsx`:

```tsx
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { TextField } from '../ui/TextField';
import type { ChatTaskSuggestion, UserSummary } from '../../lib/types';
import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export interface TaskSuggestionValues {
  title: string;
  description?: string;
  assigneeId?: string;
  dueDate?: string;
  dueTime?: string;
}

interface TaskSuggestionSheetProps {
  visible: boolean;
  loading?: boolean;
  suggestion?: ChatTaskSuggestion;
  members: UserSummary[];
  error?: string;
  onConfirm: (values: TaskSuggestionValues) => void;
  onDismiss: () => void;
  onReport?: () => void;
  submitting?: boolean;
}

const CONFIDENCE_LABEL: Record<ChatTaskSuggestion['confidence'], string> = {
  low: 'Độ tin cậy thấp',
  medium: 'Độ tin cậy trung bình',
  high: 'Độ tin cậy cao',
};

export function TaskSuggestionSheet({
  visible,
  loading = false,
  suggestion,
  members,
  error,
  onConfirm,
  onDismiss,
  onReport,
  submitting = false,
}: TaskSuggestionSheetProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [localError, setLocalError] = useState('');

  // Nạp lại mỗi khi có đề xuất mới. AI chỉ gợi ý, người dùng vẫn sửa được mọi trường.
  useEffect(() => {
    if (!suggestion) return;
    setTitle(suggestion.title ?? '');
    setDescription(suggestion.description ?? '');
    setAssigneeId(suggestion.assigneeId);
    setDueDate(suggestion.dueDate ?? '');
    setDueTime(suggestion.dueTime ?? '');
    setLocalError('');
  }, [suggestion]);

  const handleConfirm = () => {
    if (!title.trim()) {
      setLocalError('Vui lòng nhập tên công việc');
      return;
    }
    setLocalError('');
    onConfirm({
      title: title.trim(),
      description: description.trim() || undefined,
      assigneeId,
      dueDate: dueDate.trim() || undefined,
      dueTime: dueTime.trim() || undefined,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss} />

      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.heading}>Tạo công việc từ tin nhắn</Text>

        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang phân tích tin nhắn…</Text>
          </View>
        ) : (
          <ScrollView keyboardShouldPersistTaps="handled">
            {error ? <ErrorBanner message={error} /> : null}
            {localError ? <ErrorBanner message={localError} /> : null}

            {suggestion && !suggestion.hasTask ? (
              <View style={styles.notice}>
                <Text style={styles.noticeText}>Tin nhắn này có vẻ không chứa công việc</Text>
                <Text style={styles.noticeBody}>
                  Bạn vẫn có thể tự nhập nội dung bên dưới để tạo công việc.
                </Text>
              </View>
            ) : null}

            {suggestion?.hasTask ? (
              <Text style={styles.confidence}>{CONFIDENCE_LABEL[suggestion.confidence]}</Text>
            ) : null}

            <TextField
              testID="suggestion-title"
              label="Tên công việc"
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Nộp báo cáo tuần"
              autoCapitalize="sentences"
            />

            <TextField
              testID="suggestion-description"
              label="Mô tả"
              value={description}
              onChangeText={setDescription}
              placeholder="Không bắt buộc"
              autoCapitalize="sentences"
            />

            <Text style={styles.label}>Người phụ trách</Text>
            <View style={styles.memberList}>
              <Pressable
                testID="assignee-none"
                onPress={() => setAssigneeId(undefined)}
                style={[styles.memberChip, !assigneeId ? styles.memberChipActive : null]}
              >
                <Text style={[styles.memberText, !assigneeId ? styles.memberTextActive : null]}>
                  Chưa giao
                </Text>
              </Pressable>

              {members.map((member) => {
                const selected = assigneeId === member.id;
                return (
                  <Pressable
                    key={member.id}
                    testID={`assignee-${member.id}`}
                    onPress={() => setAssigneeId(member.id)}
                    style={[styles.memberChip, selected ? styles.memberChipActive : null]}
                  >
                    <Text style={[styles.memberText, selected ? styles.memberTextActive : null]}>
                      {member.fullName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.dueRow}>
              <View style={styles.dueCol}>
                <TextField
                  testID="suggestion-due-date"
                  label="Hạn chót (ngày)"
                  value={dueDate}
                  onChangeText={setDueDate}
                  placeholder="2026-08-10"
                />
              </View>
              <View style={styles.dueSpacer} />
              <View style={styles.dueCol}>
                <TextField
                  testID="suggestion-due-time"
                  label="Giờ"
                  value={dueTime}
                  onChangeText={setDueTime}
                  placeholder="09:00"
                />
              </View>
            </View>

            <Button
              testID="suggestion-confirm"
              label="Tạo công việc"
              onPress={handleConfirm}
              loading={submitting}
            />

            <View style={styles.footer}>
              <Pressable testID="suggestion-cancel" onPress={onDismiss}>
                <Text style={styles.footerLink}>Huỷ</Text>
              </Pressable>

              {onReport ? (
                <Pressable testID="suggestion-report" onPress={onReport}>
                  <Text style={styles.footerLinkMuted}>Đề xuất này không đúng</Text>
                </Pressable>
              ) : null}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    maxHeight: '85%',
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
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  loadingText: { marginTop: spacing.md, color: colors.textMuted, fontSize: fontSize.sm },
  notice: {
    backgroundColor: '#fff8e1',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noticeText: { color: colors.warning, fontWeight: '600', fontSize: fontSize.sm },
  noticeBody: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: spacing.xs },
  confidence: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.sm },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  memberList: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md },
  memberChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  memberChipActive: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  memberText: { fontSize: fontSize.sm, color: colors.text },
  memberTextActive: { color: colors.primary, fontWeight: '600' },
  dueRow: { flexDirection: 'row' },
  dueCol: { flex: 1 },
  dueSpacer: { width: spacing.md },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerLink: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  footerLinkMuted: { color: colors.textMuted, fontSize: fontSize.xs },
});
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest TaskSuggestionSheet
```

Kỳ vọng: PASS, 7 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/components/chat/TaskSuggestionSheet.tsx src/components/chat/__tests__/TaskSuggestionSheet.test.tsx
```

```bash
git commit -m "feat: them bottom sheet de xuat cong viec"
```

---

## Task 10: Màn hình khung chat

**Files:**
- Create: `src/app/(tabs)/chat/[projectId].tsx`

**Interfaces:**
- Consumes: toàn bộ những gì Task 2 đến Task 9 tạo ra

**Yêu cầu hành vi:**
- `FlatList` **inverted**, dữ liệu đảo ngược để tin mới nhất ở dưới cùng
- Cuộn lên đầu danh sách → tải trang lịch sử tiếp theo bằng `nextCursor`
- Gửi tin có optimistic: hiện ngay ở trạng thái mờ, thay bằng bản thật khi server trả về, hiện nút "Gửi lại" khi hỏng
- `join:project` khi vào, huỷ listener khi rời — không huỷ sẽ khiến mở lại phòng làm tin hiện nhiều lần
- `POST /chat/read` khi mở màn hình (không phải mỗi lần focus — đủ dùng và ít request hơn)
- **`Idempotency-Key` sinh một lần cho mỗi `messageId`**, giữ nguyên khi thử lại
- Xử lý đủ **ba** kết cục của `createTaskFromMessage`

- [ ] **Bước 1: Tạo màn hình**

Tạo `src/app/(tabs)/chat/[projectId].tsx`:

```tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { randomUUID } from 'expo-crypto';

import { MessageBubble } from '../../../components/chat/MessageBubble';
import { MessageComposer } from '../../../components/chat/MessageComposer';
import {
  TaskSuggestionSheet,
  type TaskSuggestionValues,
} from '../../../components/chat/TaskSuggestionSheet';
import { ErrorBanner } from '../../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import {
  getProjectHistory,
  getProjectMessages,
  markProjectRead,
  requestTaskSuggestion,
  sendProjectMessage,
} from '../../../lib/api/chat';
import { listProjects } from '../../../lib/api/projects';
import { useAuth } from '../../../lib/auth/auth-context';
import { applyRecall, mergeMessages } from '../../../lib/chat/message-list';
import { createTaskFromMessage } from '../../../lib/chat/create-task-from-message';
import { useSocket } from '../../../lib/socket/socket-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { ChatMessage, ChatTaskSuggestion, UserSummary } from '../../../lib/types';
import { colors, fontSize, spacing } from '../../../theme/tokens';

interface PendingItem {
  localId: string;
  content: string;
  failed: boolean;
}

export default function ChatThreadScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { active } = useWorkspace();
  const { socket } = useSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const [members, setMembers] = useState<UserSummary[]>([]);
  const [projectName, setProjectName] = useState('Trò chuyện');

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [sheetError, setSheetError] = useState('');
  const [sheetSubmitting, setSheetSubmitting] = useState(false);
  const [suggestion, setSuggestion] = useState<ChatTaskSuggestion | undefined>(undefined);
  const [sourceMessageId, setSourceMessageId] = useState<string | null>(null);

  /**
   * Idempotency-Key theo từng messageId. Sinh một lần rồi dùng lại khi thử lại,
   * để mạng chập chờn không khiến server gọi AI nhiều lần cho cùng một tin nhắn.
   */
  const idempotencyKeys = useRef(new Map<string, string>());

  /** Công việc đã tạo nhưng chưa gắn được, để thử lại đúng bước gắn thay vì tạo trùng. */
  const orphanTaskId = useRef<string | null>(null);

  const getIdempotencyKey = useCallback((messageId: string) => {
    const existing = idempotencyKeys.current.get(messageId);
    if (existing) return existing;
    const created = randomUUID();
    idempotencyKeys.current.set(messageId, created);
    return created;
  }, []);

  // Tải tin nhắn ban đầu, tên dự án và danh sách thành viên.
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const [list, projects] = await Promise.all([
          getProjectMessages(projectId),
          listProjects(active?.id),
        ]);
        if (cancelled) return;

        const sorted = mergeMessages([], list);
        setMessages(sorted);
        setCursor(sorted.length ? sorted[0].createdAt : null);

        const project = projects.find((item) => item.id === projectId);
        if (project) {
          setProjectName(project.name);
          setMembers((project.members ?? []).map((member) => member.user));
        }

        await markProjectRead(projectId);
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Không tải được tin nhắn.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, active?.id]);

  // Vào phòng và lắng nghe sự kiện. Huỷ listener khi rời, nếu không mở lại
  // sẽ đăng ký chồng và mỗi tin hiện nhiều lần.
  useEffect(() => {
    if (!socket || !projectId) return;

    socket.emit('join:project', { projectId });

    const onMessage = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => mergeMessages(current, [incoming]));
    };
    const onUpdated = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => mergeMessages(current, [incoming]));
    };
    const onRecalled = (incoming: ChatMessage) => {
      if (incoming.projectId !== projectId) return;
      setMessages((current) => applyRecall(current, incoming));
    };

    socket.on('message:project', onMessage);
    socket.on('message:project:updated', onUpdated);
    socket.on('message:project:recalled', onRecalled);

    return () => {
      socket.off('message:project', onMessage);
      socket.off('message:project:updated', onUpdated);
      socket.off('message:project:recalled', onRecalled);
    };
  }, [socket, projectId]);

  const loadMore = useCallback(async () => {
    if (!projectId || !cursor || loadingMore) return;

    setLoadingMore(true);
    try {
      const page = await getProjectHistory(projectId, cursor);
      if (page.items.length) {
        setMessages((current) => mergeMessages(current, page.items));
        setCursor(page.nextCursor ?? null);
      } else {
        setCursor(null);
      }
    } catch {
      // Cuộn lên mà hỏng thì im lặng; người dùng cuộn lại là thử lại.
      // Không chặn màn hình vì tin nhắn hiện có vẫn đọc được.
    } finally {
      setLoadingMore(false);
    }
  }, [projectId, cursor, loadingMore]);

  const doSend = useCallback(
    async (content: string, localId: string) => {
      if (!projectId) return;
      setSending(true);
      try {
        const saved = await sendProjectMessage(projectId, content);
        setMessages((current) => mergeMessages(current, [saved]));
        setPending((current) => current.filter((item) => item.localId !== localId));
      } catch {
        setPending((current) =>
          current.map((item) => (item.localId === localId ? { ...item, failed: true } : item)),
        );
      } finally {
        setSending(false);
      }
    },
    [projectId],
  );

  const handleSend = useCallback(() => {
    const content = draft.trim();
    if (!content) return;

    const localId = randomUUID();
    setPending((current) => [...current, { localId, content, failed: false }]);
    setDraft('');
    void doSend(content, localId);
  }, [draft, doSend]);

  const handleLongPress = useCallback(
    async (messageId: string) => {
      if (!projectId) return;

      setSourceMessageId(messageId);
      setSuggestion(undefined);
      setSheetError('');
      setSheetOpen(true);
      setSheetLoading(true);
      orphanTaskId.current = null;

      try {
        const result = await requestTaskSuggestion(
          projectId,
          messageId,
          getIdempotencyKey(messageId),
        );
        setSuggestion(result);
      } catch (err) {
        setSheetError(err instanceof Error ? err.message : 'Không phân tích được tin nhắn.');
        setSuggestion({ hasTask: false, title: '', confidence: 'low' });
      } finally {
        setSheetLoading(false);
      }
    },
    [projectId, getIdempotencyKey],
  );

  const handleConfirm = useCallback(
    async (values: TaskSuggestionValues) => {
      if (!projectId || !sourceMessageId || !active?.id) return;

      setSheetSubmitting(true);
      setSheetError('');

      const result = await createTaskFromMessage({
        projectId,
        workspaceId: active.id,
        messageId: sourceMessageId,
        title: values.title,
        description: values.description,
        assigneeId: values.assigneeId,
        dueDate: values.dueDate,
        dueTime: values.dueTime,
        ...(orphanTaskId.current ? { existingTaskId: orphanTaskId.current } : {}),
      });

      setSheetSubmitting(false);

      if (result.outcome === 'created-and-linked') {
        orphanTaskId.current = null;
        setMessages((current) => mergeMessages(current, [result.message]));
        setSheetOpen(false);
        Alert.alert('Đã tạo công việc', result.task.title ?? values.title, [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Xem công việc', onPress: () => router.push('/tasks') },
        ]);
        return;
      }

      if (result.outcome === 'created-not-linked') {
        // Công việc ĐÃ được tạo thật. Giữ lại id để lần thử tiếp theo chỉ gắn,
        // không tạo thêm công việc trùng.
        orphanTaskId.current = result.task.id;
        setSheetError(
          'Đã tạo công việc nhưng chưa gắn được vào tin nhắn. Bấm "Tạo công việc" để thử gắn lại — sẽ không tạo thêm công việc mới.',
        );
        return;
      }

      setSheetError(result.error.message);
    },
    [projectId, sourceMessageId, active?.id, router],
  );

  // Danh sách hiển thị: tin thật cộng tin đang gửi, đảo ngược cho FlatList inverted.
  const display = useMemo(() => {
    const pendingAsMessages: ChatMessage[] = pending.map((item) => ({
      id: item.localId,
      content: item.content,
      workspaceId: active?.id ?? '',
      projectId: projectId ?? '',
      authorId: user?.id ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
    return [...messages, ...pendingAsMessages].reverse();
  }, [messages, pending, active?.id, projectId, user?.id]);

  const pendingById = new Map(pending.map((item) => [item.localId, item]));

  if (loading) {
    return (
      <ScreenContainer>
        <Stack.Screen options={{ headerShown: true, title: projectName }} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Stack.Screen options={{ headerShown: true, title: projectName }} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loadError ? <ErrorBanner message={loadError} /> : null}

        <FlatList
          inverted
          data={display}
          keyExtractor={(item) => item.id}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={styles.more} color={colors.primary} /> : null
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Chưa có tin nhắn nào</Text>
              <Text style={styles.emptyBody}>
                Gửi tin nhắn đầu tiên. Nhấn giữ một tin nhắn bất kỳ để biến nó thành công việc.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const pendingItem = pendingById.get(item.id);
            return (
              <MessageBubble
                message={item}
                isMine={item.authorId === user?.id}
                isPending={Boolean(pendingItem) && !pendingItem?.failed}
                isFailed={Boolean(pendingItem?.failed)}
                onLongPress={() => void handleLongPress(item.id)}
                onRetry={
                  pendingItem
                    ? () => {
                        setPending((current) =>
                          current.map((p) =>
                            p.localId === pendingItem.localId ? { ...p, failed: false } : p,
                          ),
                        );
                        void doSend(pendingItem.content, pendingItem.localId);
                      }
                    : undefined
                }
              />
            );
          }}
        />

        <MessageComposer
          value={draft}
          onChangeText={setDraft}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>

      <TaskSuggestionSheet
        visible={sheetOpen}
        loading={sheetLoading}
        suggestion={suggestion}
        members={members}
        error={sheetError || undefined}
        submitting={sheetSubmitting}
        onConfirm={handleConfirm}
        onDismiss={() => setSheetOpen(false)}
        onReport={() =>
          Alert.alert(
            'Cảm ơn phản hồi',
            'Chúng tôi đã ghi nhận rằng đề xuất này chưa chính xác.',
          )
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  more: { marginVertical: spacing.md },
  empty: { paddingTop: spacing.xl, alignItems: 'center', transform: [{ scaleY: -1 }] },
  emptyTitle: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyBody: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
});
```

- [ ] **Bước 2: Kiểm tra kiểu**

```bash
npx tsc --noEmit
```

Kỳ vọng: exit 0.

- [ ] **Bước 3: Chạy toàn bộ test**

```bash
npm test
```

Kỳ vọng: PASS toàn bộ. Tổng **108 test**:

| File test | Số test |
|---|---|
| *(52 test của kế hoạch 1)* | 52 |
| `src/lib/__tests__/types-smoke.test.ts` | 3 |
| `src/lib/api/__tests__/chat.test.ts` | 13 |
| `src/lib/chat/__tests__/message-list.test.ts` | 7 |
| `src/lib/chat/__tests__/create-task-from-message.test.ts` | 9 |
| `src/lib/__tests__/socket.test.ts` | 8 |
| `src/lib/socket/__tests__/socket-context.test.tsx` | 5 |
| `src/components/chat/__tests__/ProjectRow.test.tsx` | 5 |
| `src/components/chat/__tests__/MessageBubble.test.tsx` | 8 |
| `src/components/chat/__tests__/MessageComposer.test.tsx` | 4 |
| `src/components/chat/__tests__/TaskSuggestionSheet.test.tsx` | 7 |

- [ ] **Bước 4: Commit — lệnh cho chủ dự án chạy**

```bash
git add "src/app/(tabs)/chat/[projectId].tsx"
```

```bash
git commit -m "feat: them man hinh khung chat va tao viec tu tin nhan"
```

---

## Task 11: Chỉ báo đang gõ

**Files:**
- Create: `src/lib/chat/typing-state.ts`
- Modify: `src/app/(tabs)/chat/[projectId].tsx`
- Test: `src/lib/chat/__tests__/typing-state.test.ts`

**Interfaces:**
- Produces:
  - `applyTyping(current: Record<string, number>, userId: string, typing: boolean, now: number): Record<string, number>`
  - `activeTypers(state: Record<string, number>, now: number, ttlMs?: number): string[]`
  - `typingLabel(names: string[]): string`

**Yêu cầu hành vi:** trạng thái gõ phải **tự hết hạn**. Nếu người kia mất mạng giữa lúc đang gõ, sự kiện `typing: false` không bao giờ tới và chữ "đang nhập" sẽ treo vĩnh viễn. Dùng dấu thời gian với TTL 5 giây thay vì cờ boolean.

- [ ] **Bước 1: Viết test thất bại**

Tạo `src/lib/chat/__tests__/typing-state.test.ts`:

```ts
import { applyTyping, activeTypers, typingLabel } from '../typing-state';

const NOW = 1_000_000;

describe('applyTyping', () => {
  it('ghi dấu thời gian khi bắt đầu gõ', () => {
    const next = applyTyping({}, 'u1', true, NOW);
    expect(next.u1).toBe(NOW);
  });

  it('xoá người dùng khi ngừng gõ', () => {
    const next = applyTyping({ u1: NOW }, 'u1', false, NOW + 100);
    expect(next.u1).toBeUndefined();
  });

  it('không làm thay đổi đối tượng đầu vào', () => {
    const current = { u1: NOW };
    applyTyping(current, 'u2', true, NOW);
    expect(current).toEqual({ u1: NOW });
  });
});

describe('activeTypers', () => {
  it('trả người còn trong thời hạn', () => {
    expect(activeTypers({ u1: NOW }, NOW + 2000)).toEqual(['u1']);
  });

  it('bỏ người đã quá hạn', () => {
    expect(activeTypers({ u1: NOW }, NOW + 6000)).toEqual([]);
  });

  it('lọc đúng khi có nhiều người', () => {
    const state = { u1: NOW, u2: NOW + 4000 };
    expect(activeTypers(state, NOW + 6000)).toEqual(['u2']);
  });
});

describe('typingLabel', () => {
  it('trả chuỗi rỗng khi không ai gõ', () => {
    expect(typingLabel([])).toBe('');
  });

  it('nêu tên khi một người gõ', () => {
    expect(typingLabel(['Đại'])).toBe('Đại đang nhập…');
  });

  it('nêu hai tên khi hai người gõ', () => {
    expect(typingLabel(['Đại', 'An'])).toBe('Đại và An đang nhập…');
  });

  it('rút gọn khi nhiều hơn hai người', () => {
    expect(typingLabel(['Đại', 'An', 'Bình'])).toBe('3 người đang nhập…');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npx jest typing-state
```

Kỳ vọng: FAIL vì chưa có module.

- [ ] **Bước 3: Viết implementation**

Tạo `src/lib/chat/typing-state.ts`:

```ts
/** Thời gian một dấu hiệu đang gõ còn hiệu lực, tính bằng mili giây. */
export const TYPING_TTL_MS = 5000;

/**
 * Lưu dấu THỜI GIAN chứ không lưu cờ boolean.
 * Nếu người kia mất mạng giữa lúc gõ, sự kiện `typing: false` sẽ không bao giờ tới;
 * dùng cờ boolean thì chữ "đang nhập" treo vĩnh viễn, dùng dấu thời gian thì tự hết hạn.
 */
export function applyTyping(
  current: Record<string, number>,
  userId: string,
  typing: boolean,
  now: number,
): Record<string, number> {
  const next = { ...current };
  if (typing) {
    next[userId] = now;
  } else {
    delete next[userId];
  }
  return next;
}

export function activeTypers(
  state: Record<string, number>,
  now: number,
  ttlMs: number = TYPING_TTL_MS,
): string[] {
  return Object.entries(state)
    .filter(([, at]) => now - at < ttlMs)
    .map(([userId]) => userId);
}

export function typingLabel(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} đang nhập…`;
  if (names.length === 2) return `${names[0]} và ${names[1]} đang nhập…`;
  return `${names.length} người đang nhập…`;
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npx jest typing-state
```

Kỳ vọng: PASS, 10 test.

- [ ] **Bước 5: Nối vào màn hình chat**

Trong `src/app/(tabs)/chat/[projectId].tsx`, thêm import:

```tsx
import { activeTypers, applyTyping, typingLabel } from '../../../lib/chat/typing-state';
```

Thêm state, đặt cạnh các `useState` khác:

```tsx
  const [typingBy, setTypingBy] = useState<Record<string, number>>({});
  const [typingTick, setTypingTick] = useState(0);
  const typingSentAt = useRef(0);
```

Trong `useEffect` đăng ký socket, thêm handler và nhớ huỷ:

```tsx
    const onTyping = (payload: { projectId: string; typing: boolean; userId: string }) => {
      if (payload.projectId !== projectId) return;
      if (payload.userId === user?.id) return;
      setTypingBy((current) => applyTyping(current, payload.userId, payload.typing, Date.now()));
    };
```

```tsx
    socket.on('typing:project', onTyping);
```

```tsx
      socket.off('typing:project', onTyping);
```

Thêm bộ đếm để chữ "đang nhập" tự biến mất khi quá hạn, kể cả khi không có sự kiện mới:

```tsx
  useEffect(() => {
    if (Object.keys(typingBy).length === 0) return;
    const timer = setInterval(() => setTypingTick((value) => value + 1), 1000);
    return () => clearInterval(timer);
  }, [typingBy]);
```

Đổi `onChangeText` của `MessageComposer` để báo đang gõ, có tiết lưu 2 giây:

```tsx
  const handleDraftChange = useCallback(
    (value: string) => {
      setDraft(value);
      if (!socket || !projectId) return;

      const now = Date.now();
      // Tiết lưu: chỉ báo mỗi 2 giây, tránh bắn sự kiện theo từng phím gõ.
      if (now - typingSentAt.current > 2000) {
        typingSentAt.current = now;
        socket.emit('typing:project', { projectId, typing: true });
      }
    },
    [socket, projectId],
  );
```

Trong `handleSend`, sau khi xoá `draft`, thêm:

```tsx
    typingSentAt.current = 0;
    socket?.emit('typing:project', { projectId, typing: false });
```

Tính nhãn và hiển thị ngay trên `MessageComposer`:

```tsx
  const typingText = useMemo(() => {
    void typingTick;
    const ids = activeTypers(typingBy, Date.now());
    const names = ids
      .map((id) => members.find((member) => member.id === id)?.fullName)
      .filter((name): name is string => Boolean(name));
    return typingLabel(names);
  }, [typingBy, typingTick, members]);
```

```tsx
        {typingText ? <Text style={styles.typing}>{typingText}</Text> : null}

        <MessageComposer
          value={draft}
          onChangeText={handleDraftChange}
          onSend={handleSend}
          sending={sending}
        />
```

Thêm style:

```tsx
  typing: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    fontStyle: 'italic',
  },
```

- [ ] **Bước 6: Kiểm tra kiểu và chạy toàn bộ test**

```bash
npx tsc --noEmit
```

```bash
npm test
```

Kỳ vọng: exit 0 và **118 test** PASS.

- [ ] **Bước 7: Commit — lệnh cho chủ dự án chạy**

```bash
git add src/lib/chat/typing-state.ts src/lib/chat/__tests__/typing-state.test.ts "src/app/(tabs)/chat/[projectId].tsx"
```

```bash
git commit -m "feat: them chi bao dang go trong khung chat"
```

---

## Task 12: Nghiệm thu trên thiết bị

**Files:** không sửa file nào. Task này chỉ chạy và ghi nhận bằng chứng.

- [ ] **Bước 1: Khởi động máy ảo — chủ dự án tự chạy**

Mở PowerShell mới:

```bash
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd WeDo_Pixel7 -dns-server 8.8.8.8
```

Cờ `-dns-server` là **bắt buộc**. Thiếu nó máy ảo không phân giải được tên miền và app báo nhầm thành lỗi mạng.

- [ ] **Bước 2: Khởi động Metro**

```bash
npx expo start --dev-client
```

- [ ] **Bước 3: Mở app**

```bash
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -a android.intent.action.VIEW -d "wedo://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081" vn.wedo.app
```

- [ ] **Bước 4: Chạy bảy phép thử, chụp màn hình từng cái**

| # | Phép thử | Đạt khi |
|---|---|---|
| 1 | Mở tab Trò chuyện | Hiện danh sách dự án; workspace rỗng thì hiện đúng empty state tiếng Việt, **không** phải màn hình trắng |
| 2 | Mở một dự án | Tin nhắn cũ hiện ra, mới nhất ở dưới cùng |
| 3 | Gửi một tin nhắn | Hiện ngay ở trạng thái mờ, rồi chuyển sang bình thường khi server xác nhận |
| 4 | Cuộn lên đầu | Tải thêm trang lịch sử cũ hơn |
| 5 | **Nhấn giữ một tin nhắn** | Có rung phản hồi; bottom sheet hiện "Đang phân tích tin nhắn…" rồi hiện đề xuất |
| 6 | Sửa tiêu đề rồi bấm Tạo công việc | Hiện hộp thoại "Đã tạo công việc"; bong bóng tin nhắn xuất hiện nhãn "Đã tạo công việc: …" |
| 7 | Bật chế độ máy bay rồi gửi tin | Bong bóng viền đỏ kèm nút "Gửi lại"; tắt chế độ máy bay, bấm Gửi lại thì tin đi được |
| 8 | Gõ vào ô soạn tin trên **web**, nhìn máy ảo | Hiện "… đang nhập…" phía trên ô soạn tin; ngừng gõ 5 giây thì chữ đó tự biến mất |

- [ ] **Bước 5: Kiểm chứng realtime bằng hai phía**

Đăng nhập cùng dự án trên **web WeDo** ở trình duyệt. Gửi một tin từ web.

Đạt khi: tin nhắn hiện trên máy ảo **mà không cần thao tác gì**. Đây là phép thử duy nhất chứng minh `message:project` và namespace `/chat` đã đúng — không có nó thì mọi thứ khác vẫn "trông như chạy" nhưng chat không realtime.

- [ ] **Bước 6: Xác minh công việc vừa tạo là thật**

Mở web WeDo, vào dự án đó, kiểm tra công việc vừa tạo từ điện thoại có xuất hiện đúng tiêu đề, người phụ trách và hạn chót không.

- [ ] **Bước 7: Soát lộ bí mật**

```bash
grep -rnE "azurewebsites|postgres://|supabase\.co|Bearer ey" --include="*.ts" --include="*.tsx" --include="*.json" --exclude-dir=node_modules --exclude-dir=docs .
```

Kỳ vọng: không in ra dòng nào.

---

## Kiểm chứng khi kết thúc kế hoạch

Tất cả phải đạt trước khi coi kế hoạch 2 là xong:

| Hạng mục | Lệnh | Kỳ vọng |
|---|---|---|
| Test đơn vị | `npm test` | Toàn bộ PASS, **118 test** |
| Kiểu dữ liệu | `npx tsc --noEmit` | exit 0 |
| Bundle Android | `npx expo export --platform android` | exit 0 |
| Không lộ bí mật | lệnh grep ở Task 12 Bước 7 | không kết quả |
| Nghiệm thu thiết bị | 8 phép thử + realtime hai phía + đối chiếu web | có ảnh chụp từng cái |

---

## Việc kế hoạch này KHÔNG làm

- **Kế hoạch 3 — Việc của tôi, Thông báo, Tài khoản, phát hành:** danh sách công việc theo hạn chót, nhận/từ chối, thông báo, nhắc hạn cục bộ, xoá tài khoản, EAS Build production, chuẩn bị hồ sơ nộp Play
- **Kế hoạch backend (repo `BE_WEDO`):** `DELETE /users/me`, `GET /users/me/deletion-blockers`, `PATCH /workspaces/:id/owner`
- **Ngoài phạm vi bản mobile:** chat trực tiếp giữa hai người, đính kèm tệp, thả cảm xúc, ghim tin, chuyển tiếp, thu hồi tin do mình gửi, tìm kiếm trong chat. Backend có sẵn API cho tất cả những thứ này nhưng spec đã loại khỏi bản mobile.
