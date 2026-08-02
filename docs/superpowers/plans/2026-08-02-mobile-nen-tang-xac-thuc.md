# Kế hoạch 1 — Nền tảng, Xác thực và Khung Tab

> **Dành cho người thực thi:** SUB-SKILL BẮT BUỘC — dùng `superpowers:subagent-driven-development` (khuyến nghị) hoặc `superpowers:executing-plans` để làm từng task một. Các bước dùng cú pháp checkbox (`- [ ]`) để theo dõi.

**Mục tiêu:** Dựng ứng dụng Expo chạy được, đăng nhập bằng email/mật khẩu vào API WeDo thật, tự tạo workspace nếu tài khoản chưa có, và vào được khung 4 tab.

**Kiến trúc:** Expo Router điều hướng file-based. JWT lưu trong `expo-secure-store`. Một `fetch` wrapper duy nhất gắn `Authorization` và bắt 401 toàn cục để đăng xuất. `AuthContext` giữ trạng thái phiên; TanStack Query giữ dữ liệu server. Logic thuần (lưu token, chọn workspace, dựng request) tách khỏi React để test được bằng Jest không cần render.

**Công nghệ:** Expo SDK 57 · React Native 0.86 · TypeScript · expo-router · @tanstack/react-query v5 · expo-secure-store · Jest (jest-expo) · @testing-library/react-native

**Spec nguồn:** [`docs/superpowers/specs/2026-08-02-wedo-android-design.md`](../specs/2026-08-02-wedo-android-design.md)

## Trạng thái thực thi

**Task 1–12: đã làm xong và kiểm chứng bằng máy.** Một hạng mục còn lại cần thiết bị thật.

| Kiểm chứng | Lệnh | Kết quả |
|---|---|---|
| Test đơn vị | `npm test` | **52/52 PASS**, ổn định qua 5 lần chạy liên tiếp |
| Kiểu dữ liệu | `npx tsc --noEmit` | exit 0 |
| Bundle Android | `npx expo export --platform android` | exit 0, dựng được bundle Hermes |
| Không lộ bí mật | quét `*.ts,*.tsx,*.json,*.js` | không kết quả; `.env` bị `.gitignore` chặn |
| **Chạy trên điện thoại thật** | 6 bước ở Task 12 Bước 10 | **CHƯA LÀM — cần thiết bị Android của chủ dự án** |

Số test thực tế là 52 chứ không phải 48 như kế hoạch dự tính: thêm 2 test cho `client` (cắt dấu gạch chéo cuối base URL, thiếu biến môi trường), 1 cho `login` (cắt khoảng trắng quanh email), 1 cho `workspace-context` (workspace đã lưu không còn tồn tại).

**Lỗi thật do test bắt được:** `baseUrl()` bị gọi bên trong khối `try` của `apiRequest`, nên khi thiếu `EXPO_PUBLIC_API_BASE_URL` thì lỗi cấu hình bị `catch` nuốt và báo nhầm thành lỗi mạng. Đã sửa: dựng URL trước khi vào `try`.

---

## Điều chỉnh khi thực thi (cập nhật sau Task 1)

Kế hoạch được viết trước khi chạy `create-expo-app`. Thực tế khác bốn điểm. Các điều chỉnh dưới đây **ghi đè** nội dung tương ứng bên dưới.

**1. Repo đổi chỗ.** Mã nguồn nằm ở `C:\Users\Admin\Desktop\WeDo_ChPlay` (nhánh `main`, remote GitHub `dailhse184118-commits/WeDo_ChPlay`), không phải `WeDo_Moblie`. Thư mục `docs/` đã chuyển sang cùng repo.

**2. Mọi đường dẫn mã nguồn thêm tiền tố `src/`.** Template SDK 57 dùng bố cục `src/`:

| Kế hoạch ghi | Đường dẫn thật |
|---|---|
| `theme/tokens.ts` | `src/theme/tokens.ts` |
| `lib/**` | `src/lib/**` |
| `components/**` | `src/components/**` |
| `app/**` | `src/app/**` |

**Toàn bộ import tương đối trong kế hoạch vẫn đúng nguyên văn**, vì cấu trúc bên trong `src/` giống hệt cấu trúc gốc đã thiết kế. Chỉ dòng `Files:` và lệnh `git add` cần thêm `src/`. Alias `@/*` → `./src/*` cũng dùng được.

**3. `npx expo install ... "--" --dev` KHÔNG hoạt động trên Windows** — nó đẩy gói vào `dependencies`, khiến thư viện test lọt vào bản build production. Đã sửa tay trong `package.json`. Lần sau dùng `npm install --save-dev <pkg>`.

**4. Không cần cài `react-native-safe-area-context`** — template đã có sẵn `~5.7.0`. Cũng có sẵn: `react-native-gesture-handler`, `react-native-reanimated`, `expo-web-browser`, `expo-constants`, `expo-linking`.

**5. Kiểm chứng Task 1 dùng `npx expo export --platform android`** thay cho việc chỉ xem QR code — nó bundle thật nên chứng minh Metro resolve được mọi import.

**6. `@testing-library/react-native` 14 đổi sang API BẤT ĐỒNG BỘ.** Đây là thay đổi lớn nhất so với kế hoạch gốc. Mọi test component trong kế hoạch (Task 8, 9, 10, 11) viết theo API cũ đều SAI và phải sửa:

| Sai (API cũ) | Đúng (RNTL 14) |
|---|---|
| `render(<X />)` | `await render(<X />)` |
| `screen.getByTestId(...)` | destructure từ kết quả: `const { getByTestId } = await render(...)` |
| `fireEvent.press(el)` | `await fireEvent.press(el)` |
| `fireEvent.changeText(el, 'x')` | `await fireEvent.changeText(el, 'x')` |

Bằng chứng: `node_modules/@testing-library/react-native/dist/render.d.ts:16` khai báo `render` trả `Promise<{...}>`, và `fire-event.d.ts` khai báo `press`/`changeText` trả `Promise`.

Không await gây **lỗi ngẫu nhiên** `render function has not been called` — vì `screen` chỉ được gán sau khi promise render resolve. Đã đo: 1 lỗi/5 lần chạy trước khi sửa, 8/8 xanh sau khi sửa.

**7. KHÔNG ghi đè `setupFiles` và `transformIgnorePatterns`** trong `package.json`. Preset `jest-expo` đã định nghĩa cả hai, và config trong `package.json` **thay thế** chứ không gộp. Ghi đè `setupFiles` xoá mất mock môi trường React Native; ghi đè `transformIgnorePatterns` xoá mất loại trừ `react-native-reanimated/plugin`. Cấu hình Jest đúng chỉ cần đúng một dòng: `"preset": "jest-expo"`.

Cũng không cần đặt `IS_REACT_ACT_ENVIRONMENT` — `jest-expo/src/preset/setup.js:11` đã đặt sẵn.

---

## Ràng buộc toàn cục

Mọi task đều ngầm mang các ràng buộc này.

- **Ngôn ngữ giao diện: tiếng Việt.** Mọi chuỗi hiển thị cho người dùng phải là tiếng Việt.
- **Màu thương hiệu chính: `#0055c7`.** Khẩu hiệu: "Nghĩ ít hơn, làm nhiều hơn".
- **Không hardcode bí mật.** Không khoá, token, mật khẩu, chuỗi kết nối trong mã nguồn. API base URL đọc từ `process.env.EXPO_PUBLIC_API_BASE_URL`. File `.env` phải nằm trong `.gitignore`.
- **Không tự commit, không tự push.** Bước "Commit" trong mỗi task là **lệnh đưa cho chủ dự án tự chạy**, không phải lệnh người thực thi chạy.
- **Không dùng `git add .`** — luôn liệt kê từng file.
- **Không có WebView.** Không có màn hình nào render nội dung web của WeDo.
- **`socket.io-client` phải là v4** (server chạy socket.io 4.8.1). Chưa dùng ở kế hoạch này.
- **Không khai `USE_EXACT_ALARM` và `SCHEDULE_EXACT_ALARM`** trong bất kỳ file cấu hình nào.
- **Máy phát triển là Windows.** Cài dev dependency qua `npx expo install <pkg> "--" --dev` (dấu `"--"` là bắt buộc trên Windows).
- **Routes API nằm ở root**, không có prefix `/api`.
- Chỉ báo "đã xong" khi đã chạy lệnh và nhìn thấy kết quả. Không suy đoán.

---

## Cấu trúc file sau kế hoạch này

| File | Trách nhiệm |
|---|---|
| `theme/tokens.ts` | Màu, khoảng cách, cỡ chữ. Nguồn duy nhất cho giá trị hình thức |
| `lib/types.ts` | Kiểu dữ liệu API dùng chung |
| `lib/api/client.ts` | Dựng request, gắn Bearer, phân giải lỗi, bắn sự kiện 401 |
| `lib/api/auth.ts` | `login`, `register`, `getMe` |
| `lib/api/workspaces.ts` | `listWorkspaces`, `createWorkspace` |
| `lib/auth/token-storage.ts` | Đọc/ghi/xoá JWT trong SecureStore |
| `lib/auth/auth-context.tsx` | Trạng thái phiên, hành động `signIn`/`signUp`/`signOut` |
| `lib/workspace/active-workspace.ts` | Chọn và ghi nhớ workspace đang hoạt động |
| `lib/query.ts` | Khởi tạo QueryClient |
| `components/ui/*` | Nút, ô nhập, khung màn hình |
| `components/workspace/CreateWorkspaceForm.tsx` | Form tạo workspace, dùng lại ở cả route lẫn khung tab |
| `app/**` | Màn hình và điều hướng |

---

## Task 1: Khởi tạo dự án và bộ khung test

**Files:**
- Create: toàn bộ dự án Expo trong `C:\Users\Admin\Desktop\WeDo_Moblie`
- Modify: `package.json`, `tsconfig.json`, `.gitignore`
- Create: `.env.example`, `.env`
- Test: `lib/__tests__/smoke.test.ts`

**Interfaces:**
- Consumes: không
- Produces: lệnh `npm test` chạy được; biến `process.env.EXPO_PUBLIC_API_BASE_URL` khả dụng trong mã nguồn

- [ ] **Bước 1: Khởi tạo dự án Expo**

Thư mục `WeDo_Moblie` đã có sẵn `docs/`. Tạo dự án vào thư mục hiện tại:

```bash
cd C:/Users/Admin/Desktop/WeDo_Moblie && npx create-expo-app@latest . --template default@sdk-57
```

Nếu lệnh từ chối vì thư mục không rỗng, tạo ở thư mục tạm rồi chuyển vào, giữ nguyên `docs/`.

- [ ] **Bước 2: Xoá code mẫu**

Template mặc định kèm màn hình demo. Xoá nội dung `app/` và `components/` do template sinh ra, giữ lại `app.json`, `package.json`, `tsconfig.json`. Các task sau sẽ tạo lại `app/`.

- [ ] **Bước 3: Cài phụ thuộc runtime**

```bash
npx expo install expo-secure-store @tanstack/react-query
```

- [ ] **Bước 4: Cài phụ thuộc test**

Dấu `"--"` là bắt buộc trên Windows:

```bash
npx expo install jest-expo jest @types/jest @testing-library/react-native "--" --dev
```

- [ ] **Bước 5: Cấu hình Jest trong `package.json`**

Thêm vào `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watchAll"
  },
  "jest": {
    "preset": "jest-expo",
    "transformIgnorePatterns": [
      "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg)"
    ]
  }
}
```

Thêm `"jest"` vào mảng `types` trong `tsconfig.json`.

- [ ] **Bước 6: Cấu hình biến môi trường**

Tạo `.env.example` (file này ĐƯỢC commit):

```
EXPO_PUBLIC_API_BASE_URL=https://your-api-host.example.com
```

Tạo `.env` (file này KHÔNG commit) và điền URL API thật mà chủ dự án cung cấp.

Thêm vào `.gitignore`:

```
.env
```

- [ ] **Bước 7: Viết test smoke để xác nhận bộ khung chạy**

Tạo `lib/__tests__/smoke.test.ts`:

```ts
describe('bộ khung test', () => {
  it('chạy được', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Bước 8: Chạy test**

```bash
npm test
```

Kỳ vọng: PASS, 1 test.

- [ ] **Bước 9: Xác nhận app khởi động**

```bash
npx expo start
```

Kỳ vọng: hiện QR code, không có lỗi đỏ trong terminal. Nhấn `Ctrl+C` để dừng.

- [ ] **Bước 10: Commit — lệnh cho chủ dự án chạy**

```bash
git add package.json package-lock.json tsconfig.json app.json .gitignore .env.example lib/__tests__/smoke.test.ts
```

```bash
git commit -m "chore: khoi tao du an Expo SDK 57 va bo khung test"
```

---

## Task 2: Design token

**Files:**
- Create: `theme/tokens.ts`
- Test: `theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: không
- Produces: `colors`, `spacing`, `radius`, `fontSize` — mọi component sau đều import từ đây

- [ ] **Bước 1: Viết test thất bại**

Tạo `theme/__tests__/tokens.test.ts`:

```ts
import { colors, spacing } from '../tokens';

describe('design tokens', () => {
  it('dùng đúng màu thương hiệu WeDo', () => {
    expect(colors.primary).toBe('#0055c7');
  });

  it('có thang khoảng cách tăng dần', () => {
    expect(spacing.sm).toBeLessThan(spacing.md);
    expect(spacing.md).toBeLessThan(spacing.lg);
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- theme
```

Kỳ vọng: FAIL với "Cannot find module '../tokens'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `theme/tokens.ts`:

```ts
export const colors = {
  primary: '#0055c7',
  primaryDark: '#00408f',
  primarySoft: '#e6eff9',
  background: '#ffffff',
  surface: '#f5f7fa',
  border: '#dfe4ec',
  text: '#111827',
  textMuted: '#6b7280',
  danger: '#c62828',
  success: '#1b7f4d',
  warning: '#b26a00',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 10,
  lg: 16,
  pill: 999,
} as const;

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 26,
} as const;
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- theme
```

Kỳ vọng: PASS, 2 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add theme/tokens.ts theme/__tests__/tokens.test.ts
```

```bash
git commit -m "feat: them design token mau thuong hieu WeDo"
```

---

## Task 3: Lưu trữ token an toàn

**Files:**
- Create: `lib/auth/token-storage.ts`
- Test: `lib/auth/__tests__/token-storage.test.ts`

**Interfaces:**
- Consumes: `expo-secure-store`
- Produces:
  - `saveToken(token: string): Promise<void>`
  - `loadToken(): Promise<string | null>`
  - `clearToken(): Promise<void>`
  - `saveActiveWorkspaceId(id: string): Promise<void>`
  - `loadActiveWorkspaceId(): Promise<string | null>`

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/auth/__tests__/token-storage.test.ts`:

```ts
import * as SecureStore from 'expo-secure-store';
import {
  saveToken,
  loadToken,
  clearToken,
  saveActiveWorkspaceId,
  loadActiveWorkspaceId,
} from '../token-storage';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(async () => undefined),
  getItemAsync: jest.fn(async () => null),
  deleteItemAsync: jest.fn(async () => undefined),
}));

const mockedStore = SecureStore as jest.Mocked<typeof SecureStore>;

describe('token-storage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('ghi token vào SecureStore', async () => {
    await saveToken('abc123');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('wedo.accessToken', 'abc123');
  });

  it('đọc token đã lưu', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce('abc123');
    await expect(loadToken()).resolves.toBe('abc123');
  });

  it('trả null khi chưa có token', async () => {
    mockedStore.getItemAsync.mockResolvedValueOnce(null);
    await expect(loadToken()).resolves.toBeNull();
  });

  it('xoá cả token lẫn workspace đang hoạt động khi đăng xuất', async () => {
    await clearToken();
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('wedo.accessToken');
    expect(mockedStore.deleteItemAsync).toHaveBeenCalledWith('wedo.activeWorkspaceId');
  });

  it('ghi và đọc workspace đang hoạt động', async () => {
    await saveActiveWorkspaceId('ws-1');
    expect(mockedStore.setItemAsync).toHaveBeenCalledWith('wedo.activeWorkspaceId', 'ws-1');

    mockedStore.getItemAsync.mockResolvedValueOnce('ws-1');
    await expect(loadActiveWorkspaceId()).resolves.toBe('ws-1');
  });

  it('trả null thay vì ném lỗi khi SecureStore hỏng', async () => {
    mockedStore.getItemAsync.mockRejectedValueOnce(new Error('keystore unavailable'));
    await expect(loadToken()).resolves.toBeNull();
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- token-storage
```

Kỳ vọng: FAIL với "Cannot find module '../token-storage'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/auth/token-storage.ts`:

```ts
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'wedo.accessToken';
const WORKSPACE_KEY = 'wedo.activeWorkspaceId';

async function readKey(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    // Keystore có thể không dùng được trên một số máy. Coi như chưa đăng nhập
    // thay vì làm sập app lúc khởi động.
    return null;
  }
}

export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function loadToken(): Promise<string | null> {
  return readKey(TOKEN_KEY);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(WORKSPACE_KEY);
}

export async function saveActiveWorkspaceId(id: string): Promise<void> {
  await SecureStore.setItemAsync(WORKSPACE_KEY, id);
}

export async function loadActiveWorkspaceId(): Promise<string | null> {
  return readKey(WORKSPACE_KEY);
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- token-storage
```

Kỳ vọng: PASS, 6 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/auth/token-storage.ts lib/auth/__tests__/token-storage.test.ts
```

```bash
git commit -m "feat: luu JWT trong SecureStore"
```

---

## Task 4: Kiểu dữ liệu API

**Files:**
- Create: `lib/types.ts`
- Test: không (chỉ khai báo kiểu, không có hành vi runtime)

**Interfaces:**
- Consumes: không
- Produces: `TaskStatus`, `TaskAssignmentStatus`, `NotificationType`, `UserSummary`, `UserProfile`, `AuthResponse`, `Workspace`, `ApiErrorShape`

Giá trị enum sao chép nguyên văn từ `FE_WEDO/src/lib/api.ts` dòng 6–11. Không tự chế giá trị mới.

- [ ] **Bước 1: Tạo file kiểu**

Tạo `lib/types.ts`:

```ts
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export type TaskAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_ACCEPTED'
  | 'TASK_REJECTED'
  | 'TASK_SUBMITTED'
  | 'TASK_REVIEW_APPROVED'
  | 'TASK_REVIEW_REJECTED'
  | 'TASK_DEADLINE_REMINDER'
  | 'MEETING_SCHEDULED'
  | 'SUBSCRIPTION_RENEWAL_DUE'
  | 'PAYMENT_CONFIRMED';

export type PlatformRole = 'USER' | 'ADMIN';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface UserProfile extends UserSummary {
  dob?: string | null;
  platformRole?: PlatformRole;
  createdAt?: string;
}

/** Hình dạng phản hồi của POST /auth/login và POST /auth/register. */
export interface AuthResponse {
  message: string;
  accessToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string | null;
    platformRole?: PlatformRole;
  };
}

export interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner?: UserSummary;
}
```

- [ ] **Bước 2: Xác nhận TypeScript biên dịch sạch**

```bash
npx tsc --noEmit
```

Kỳ vọng: không có lỗi.

- [ ] **Bước 3: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/types.ts
```

```bash
git commit -m "feat: them kieu du lieu API dung chung"
```

---

## Task 5: HTTP client

**Files:**
- Create: `lib/api/client.ts`
- Test: `lib/api/__tests__/client.test.ts`

**Interfaces:**
- Consumes: `loadToken` từ `lib/auth/token-storage`
- Produces:
  - `apiRequest<T>(path: string, options?: ApiRequestOptions): Promise<T>`
  - `ApiError` (class, có thuộc tính `status: number`)
  - `onUnauthorized(handler: () => void): () => void`

**Yêu cầu hành vi:**
- Ghép base URL từ `process.env.EXPO_PUBLIC_API_BASE_URL`
- Tự gắn `Authorization: Bearer <token>` khi có token
- Đặt `Content-Type: application/json` khi có body
- Phản hồi 401 → gọi mọi handler đã đăng ký, rồi ném `ApiError`
- Thông báo lỗi từ server (NestJS `message`) đã là tiếng Việt → dùng nguyên văn
- Phản hồi 204 hoặc body rỗng → trả `undefined`, không cố parse JSON

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/api/__tests__/client.test.ts`:

```ts
import { apiRequest, ApiError, onUnauthorized } from '../client';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => null),
}));

const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;

function mockFetchOnce(body: unknown, init: { status?: number } = {}) {
  const status = init.status ?? 200;
  const text = body === undefined ? '' : JSON.stringify(body);
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  });
}

describe('apiRequest', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    global.fetch = jest.fn();
    mockedLoadToken.mockResolvedValue(null);
  });

  it('ghép base URL với đường dẫn', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/health');
    expect(global.fetch).toHaveBeenCalledWith('https://api.test/health', expect.anything());
  });

  it('gắn header Bearer khi đã có token', async () => {
    mockedLoadToken.mockResolvedValue('tok-1');
    mockFetchOnce({ ok: true });
    await apiRequest('/users/me');

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.headers.Authorization).toBe('Bearer tok-1');
  });

  it('không gắn header Bearer khi chưa đăng nhập', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c' } });

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it('serialize body thành JSON và đặt Content-Type', async () => {
    mockFetchOnce({ ok: true });
    await apiRequest('/auth/login', { method: 'POST', body: { email: 'a@b.c' } });

    const init = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(init.body).toBe('{"email":"a@b.c"}');
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('trả dữ liệu đã parse khi thành công', async () => {
    mockFetchOnce({ id: 'u1', fullName: 'Lê Hữu Đại' });
    await expect(apiRequest<{ id: string }>('/users/me')).resolves.toEqual({
      id: 'u1',
      fullName: 'Lê Hữu Đại',
    });
  });

  it('trả undefined khi body rỗng', async () => {
    mockFetchOnce(undefined, { status: 204 });
    await expect(apiRequest('/notifications/read-all', { method: 'POST' })).resolves.toBeUndefined();
  });

  it('ném ApiError kèm thông báo tiếng Việt từ server', async () => {
    mockFetchOnce({ message: 'Mật khẩu phải có ít nhất 6 ký tự' }, { status: 400 });

    await expect(apiRequest('/auth/register', { method: 'POST', body: {} })).rejects.toThrow(
      'Mật khẩu phải có ít nhất 6 ký tự',
    );
  });

  it('ghép mảng message của NestJS thành một chuỗi', async () => {
    mockFetchOnce({ message: ['Email không hợp lệ', 'Họ và tên không được để trống'] }, { status: 400 });

    await expect(apiRequest('/auth/register', { method: 'POST', body: {} })).rejects.toThrow(
      'Email không hợp lệ. Họ và tên không được để trống',
    );
  });

  it('gắn status vào ApiError', async () => {
    mockFetchOnce({ message: 'Không tìm thấy' }, { status: 404 });

    await expect(apiRequest('/tasks/nope')).rejects.toMatchObject({ status: 404 });
    expect(new ApiError('x', 404)).toBeInstanceOf(Error);
  });

  it('gọi handler đã đăng ký khi gặp 401', async () => {
    const handler = jest.fn();
    const unsubscribe = onUnauthorized(handler);

    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    await expect(apiRequest('/users/me')).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('không gọi handler nữa sau khi huỷ đăng ký', async () => {
    const handler = jest.fn();
    onUnauthorized(handler)();

    mockFetchOnce({ message: 'Unauthorized' }, { status: 401 });
    await expect(apiRequest('/users/me')).rejects.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  it('báo lỗi tiếng Việt khi mất mạng', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    await expect(apiRequest('/users/me')).rejects.toThrow('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- api/__tests__/client
```

Kỳ vọng: FAIL với "Cannot find module '../client'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/api/client.ts`:

```ts
import { loadToken } from '../auth/token-storage';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    // Cần thiết để `instanceof ApiError` vẫn đúng sau khi transpile.
    Object.setPrototypeOf(this, ApiError.prototype);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Bỏ qua header Authorization. Dùng cho đăng nhập và đăng ký. */
  skipAuth?: boolean;
}

const unauthorizedHandlers = new Set<() => void>();

/** Đăng ký handler chạy khi API trả 401. Trả về hàm huỷ đăng ký. */
export function onUnauthorized(handler: () => void): () => void {
  unauthorizedHandlers.add(handler);
  return () => {
    unauthorizedHandlers.delete(handler);
  };
}

function baseUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (!url) {
    throw new Error('Thiếu EXPO_PUBLIC_API_BASE_URL. Kiểm tra file .env.');
  }
  return url.replace(/\/+$/, '');
}

/** NestJS trả message dạng chuỗi hoặc mảng chuỗi. Cả hai đều đã là tiếng Việt. */
function extractMessage(payload: unknown, status: number): string {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message.length) return message.join('. ');
  }
  return `Máy chủ trả lỗi ${status}.`;
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const requestHeaders: Record<string, string> = { ...headers };
  if (body !== undefined) {
    requestHeaders['Content-Type'] = 'application/json';
  }
  if (!skipAuth) {
    const token = await loadToken();
    if (token) {
      requestHeaders.Authorization = `Bearer ${token}`;
    }
  }

  let response: { ok: boolean; status: number; text: () => Promise<string> };
  try {
    response = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0);
  }

  const raw = await response.text();
  const payload = raw ? (JSON.parse(raw) as unknown) : undefined;

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandlers.forEach((handler) => handler());
    }
    throw new ApiError(extractMessage(payload, response.status), response.status);
  }

  return payload as T;
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- api/__tests__/client
```

Kỳ vọng: PASS, 12 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/api/client.ts lib/api/__tests__/client.test.ts
```

```bash
git commit -m "feat: them HTTP client co xu ly 401 toan cuc"
```

---

## Task 6: Module API xác thực và workspace

**Files:**
- Create: `lib/api/auth.ts`, `lib/api/workspaces.ts`
- Test: `lib/api/__tests__/auth.test.ts`

**Interfaces:**
- Consumes: `apiRequest` từ `lib/api/client`; kiểu từ `lib/types`
- Produces:
  - `login(email: string, password: string): Promise<AuthResponse>`
  - `register(input: RegisterInput): Promise<AuthResponse>`
  - `getMe(): Promise<UserProfile>`
  - `listWorkspaces(): Promise<Workspace[]>`
  - `createWorkspace(input: { name: string; description?: string }): Promise<Workspace>`

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/api/__tests__/auth.test.ts`:

```ts
import { login, register, getMe } from '../auth';
import { apiRequest } from '../client';

jest.mock('../client', () => ({
  apiRequest: jest.fn(),
}));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('auth API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('POST /auth/login và bỏ qua header auth', async () => {
    await login('a@b.c', 'matkhau');
    expect(mockedRequest).toHaveBeenCalledWith('/auth/login', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau' },
      skipAuth: true,
    });
  });

  it('POST /auth/register chỉ gửi trường có giá trị', async () => {
    await register({ email: 'a@b.c', password: 'matkhau', fullName: 'Đại' });
    expect(mockedRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau', fullName: 'Đại' },
      skipAuth: true,
    });
  });

  it('POST /auth/register kèm số điện thoại khi được cung cấp', async () => {
    await register({ email: 'a@b.c', password: 'matkhau', fullName: 'Đại', phone: '0900000000' });
    expect(mockedRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { email: 'a@b.c', password: 'matkhau', fullName: 'Đại', phone: '0900000000' },
      skipAuth: true,
    });
  });

  it('GET /users/me', async () => {
    await getMe();
    expect(mockedRequest).toHaveBeenCalledWith('/users/me');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- api/__tests__/auth
```

Kỳ vọng: FAIL với "Cannot find module '../auth'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/api/auth.ts`:

```ts
import { apiRequest } from './client';
import type { AuthResponse, UserProfile } from '../types';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: { email, password },
    skipAuth: true,
  });
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  const body: Record<string, string> = {
    email: input.email,
    password: input.password,
    fullName: input.fullName,
  };
  if (input.phone) {
    body.phone = input.phone;
  }

  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body,
    skipAuth: true,
  });
}

export function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>('/users/me');
}
```

Tạo `lib/api/workspaces.ts`:

```ts
import { apiRequest } from './client';
import type { Workspace } from '../types';

export function listWorkspaces(): Promise<Workspace[]> {
  return apiRequest<Workspace[]>('/workspaces');
}

export function createWorkspace(input: {
  name: string;
  description?: string;
}): Promise<Workspace> {
  const body: Record<string, string> = { name: input.name };
  if (input.description) {
    body.description = input.description;
  }
  return apiRequest<Workspace>('/workspaces', { method: 'POST', body });
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- api/__tests__/auth
```

Kỳ vọng: PASS, 4 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/api/auth.ts lib/api/workspaces.ts lib/api/__tests__/auth.test.ts
```

```bash
git commit -m "feat: them module API xac thuc va workspace"
```

---

## Task 7: Chọn workspace đang hoạt động

**Files:**
- Create: `lib/workspace/active-workspace.ts`
- Test: `lib/workspace/__tests__/active-workspace.test.ts`

**Interfaces:**
- Consumes: kiểu `Workspace` từ `lib/types`
- Produces: `pickActiveWorkspace(workspaces: Workspace[], savedId: string | null): Workspace | null`

**Yêu cầu hành vi:** hàm thuần, không I/O. Ưu tiên workspace đã lưu nếu còn tồn tại; nếu không, lấy cái đầu tiên; danh sách rỗng thì trả `null`.

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/workspace/__tests__/active-workspace.test.ts`:

```ts
import { pickActiveWorkspace } from '../active-workspace';
import type { Workspace } from '../../types';

function makeWorkspace(id: string): Workspace {
  return {
    id,
    name: `Không gian ${id}`,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

describe('pickActiveWorkspace', () => {
  it('trả null khi chưa có workspace nào', () => {
    expect(pickActiveWorkspace([], null)).toBeNull();
  });

  it('lấy workspace đầu tiên khi chưa lưu lựa chọn', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, null)?.id).toBe('a');
  });

  it('ưu tiên workspace đã lưu', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, 'b')?.id).toBe('b');
  });

  it('quay về workspace đầu tiên khi cái đã lưu không còn tồn tại', () => {
    const list = [makeWorkspace('a'), makeWorkspace('b')];
    expect(pickActiveWorkspace(list, 'da-bi-xoa')?.id).toBe('a');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- active-workspace
```

Kỳ vọng: FAIL với "Cannot find module '../active-workspace'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/workspace/active-workspace.ts`:

```ts
import type { Workspace } from '../types';

/**
 * Chọn workspace sẽ dùng. Hàm thuần để test được không cần I/O.
 * Workspace đã lưu có thể đã bị xoá hoặc người dùng bị mời ra — khi đó quay về cái đầu tiên.
 */
export function pickActiveWorkspace(
  workspaces: Workspace[],
  savedId: string | null,
): Workspace | null {
  if (workspaces.length === 0) {
    return null;
  }
  if (savedId) {
    const saved = workspaces.find((workspace) => workspace.id === savedId);
    if (saved) {
      return saved;
    }
  }
  return workspaces[0];
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- active-workspace
```

Kỳ vọng: PASS, 4 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/workspace/active-workspace.ts lib/workspace/__tests__/active-workspace.test.ts
```

```bash
git commit -m "feat: them logic chon workspace dang hoat dong"
```

---

## Task 8: AuthContext

**Files:**
- Create: `lib/auth/auth-context.tsx`
- Test: `lib/auth/__tests__/auth-context.test.tsx`

**Interfaces:**
- Consumes: `login`, `register`, `getMe` từ `lib/api/auth`; `saveToken`, `loadToken`, `clearToken` từ `lib/auth/token-storage`; `onUnauthorized` từ `lib/api/client`
- Produces:
  - `AuthProvider` (component)
  - `useAuth(): AuthState`
  - `AuthState = { status: 'loading' | 'signedOut' | 'signedIn'; user: UserProfile | null; signIn(email, password): Promise<void>; signUp(input): Promise<void>; signOut(): Promise<void> }`

**Yêu cầu hành vi:**
- Khi mount: đọc token. Không có → `signedOut`. Có → `getMe()`; thành công → `signedIn`; thất bại → xoá token, `signedOut`
- `signIn` lưu token **trước** khi đặt user, để request kế tiếp có header
- 401 từ bất kỳ đâu → đăng xuất

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/auth/__tests__/auth-context.test.tsx`:

```tsx
import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '../auth-context';
import * as authApi from '../../api/auth';
import * as tokenStorage from '../token-storage';

jest.mock('../../api/auth');
jest.mock('../token-storage');

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

const profile = { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' };

function Probe() {
  const { status, user, signIn, signOut } = useAuth();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="user">{user?.fullName ?? 'trong'}</Text>
      <Pressable testID="signin" onPress={() => signIn('a@b.c', 'matkhau')}>
        <Text>vao</Text>
      </Pressable>
      <Pressable testID="signout" onPress={() => signOut()}>
        <Text>ra</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadToken.mockResolvedValue(null);
    mockedStorage.saveToken.mockResolvedValue(undefined);
    mockedStorage.clearToken.mockResolvedValue(undefined);
  });

  it('kết thúc ở signedOut khi chưa có token', async () => {
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedAuthApi.getMe).not.toHaveBeenCalled();
  });

  it('khôi phục phiên khi token còn hiệu lực', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedIn'));
    expect(screen.getByTestId('user').props.children).toBe('Lê Hữu Đại');
  });

  it('xoá token khi token đã hết hạn', async () => {
    mockedStorage.loadToken.mockResolvedValue('het-han');
    mockedAuthApi.getMe.mockRejectedValue(new Error('401'));

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).toHaveBeenCalled();
  });

  it('lưu token rồi mới chuyển sang signedIn khi đăng nhập', async () => {
    mockedAuthApi.login.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-moi',
      user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    } as never);
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedOut'));

    fireEvent.press(screen.getByTestId('signin'));

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedStorage.saveToken).toHaveBeenCalledWith('tok-moi');
  });

  it('xoá token khi đăng xuất', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedIn'));

    fireEvent.press(screen.getByTestId('signout'));

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).toHaveBeenCalled();
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- auth-context
```

Kỳ vọng: FAIL với "Cannot find module '../auth-context'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/auth/auth-context.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getMe, login as loginRequest, register as registerRequest } from '../api/auth';
import type { RegisterInput } from '../api/auth';
import { onUnauthorized } from '../api/client';
import type { UserProfile } from '../types';
import { clearToken, loadToken, saveToken } from './token-storage';

export type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

export interface AuthState {
  status: AuthStatus;
  user: UserProfile | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (input: RegisterInput) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<UserProfile | null>(null);

  const signOut = useCallback(async () => {
    await clearToken();
    setUser(null);
    setStatus('signedOut');
  }, []);

  // Khôi phục phiên lúc khởi động.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await loadToken();
      if (!token) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const profile = await getMe();
        if (cancelled) return;
        setUser(profile);
        setStatus('signedIn');
      } catch {
        // Token hết hạn (hạn 7 ngày, không có refresh token) hoặc tài khoản đã bị xoá.
        await clearToken();
        if (!cancelled) setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Bất kỳ 401 nào từ tầng API cũng đá người dùng về màn đăng nhập.
  useEffect(() => onUnauthorized(() => void signOut()), [signOut]);

  const establishSession = useCallback(async (accessToken: string) => {
    // Lưu token TRƯỚC khi gọi getMe, nếu không request sẽ thiếu header Authorization.
    await saveToken(accessToken);
    const profile = await getMe();
    setUser(profile);
    setStatus('signedIn');
  }, []);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const response = await loginRequest(email, password);
      await establishSession(response.accessToken);
    },
    [establishSession],
  );

  const signUp = useCallback(
    async (input: RegisterInput) => {
      const response = await registerRequest(input);
      await establishSession(response.accessToken);
    },
    [establishSession],
  );

  const value = useMemo<AuthState>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- auth-context
```

Kỳ vọng: PASS, 5 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/auth/auth-context.tsx lib/auth/__tests__/auth-context.test.tsx
```

```bash
git commit -m "feat: them AuthContext quan ly phien dang nhap"
```

---

## Task 9: Component giao diện dùng chung

**Files:**
- Create: `components/ui/Button.tsx`, `components/ui/TextField.tsx`, `components/ui/ScreenContainer.tsx`, `components/ui/ErrorBanner.tsx`
- Test: `components/ui/__tests__/Button.test.tsx`, `components/ui/__tests__/TextField.test.tsx`

**Interfaces:**
- Consumes: `colors`, `spacing`, `radius`, `fontSize` từ `theme/tokens`
- Produces:
  - `<Button label onPress variant? loading? disabled? testID? />` với `variant: 'primary' | 'secondary' | 'danger'`
  - `<TextField label value onChangeText error? ... />`
  - `<ScreenContainer>` — bọc `SafeAreaView`, bắt buộc vì API 36 ép edge-to-edge
  - `<ErrorBanner message />`

- [ ] **Bước 1: Viết test thất bại**

Tạo `components/ui/__tests__/Button.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  it('hiện nhãn', () => {
    render(<Button label="Đăng nhập" onPress={() => {}} />);
    expect(screen.getByText('Đăng nhập')).toBeTruthy();
  });

  it('gọi onPress khi nhấn', () => {
    const onPress = jest.fn();
    render(<Button label="Đăng nhập" onPress={onPress} testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('không gọi onPress khi đang tải', () => {
    const onPress = jest.fn();
    render(<Button label="Đăng nhập" onPress={onPress} loading testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('không gọi onPress khi bị vô hiệu hoá', () => {
    const onPress = jest.fn();
    render(<Button label="Đăng nhập" onPress={onPress} disabled testID="btn" />);
    fireEvent.press(screen.getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

Tạo `components/ui/__tests__/TextField.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('TextField', () => {
  it('hiện nhãn và giá trị', () => {
    render(<TextField label="Email" value="a@b.c" onChangeText={() => {}} testID="field" />);
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByTestId('field').props.value).toBe('a@b.c');
  });

  it('báo thay đổi văn bản', () => {
    const onChangeText = jest.fn();
    render(<TextField label="Email" value="" onChangeText={onChangeText} testID="field" />);
    fireEvent.changeText(screen.getByTestId('field'), 'moi');
    expect(onChangeText).toHaveBeenCalledWith('moi');
  });

  it('hiện thông báo lỗi khi có', () => {
    render(
      <TextField label="Email" value="" onChangeText={() => {}} error="Email không hợp lệ" />,
    );
    expect(screen.getByText('Email không hợp lệ')).toBeTruthy();
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- components/ui
```

Kỳ vọng: FAIL với "Cannot find module '../Button'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `components/ui/Button.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  testID,
}: ButtonProps) {
  const inactive = loading || disabled;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !inactive ? styles.pressed : null,
        inactive ? styles.inactive : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'secondary' ? colors.primary : '#ffffff'} />
      ) : (
        <Text style={[styles.label, variant === 'secondary' ? styles.labelSecondary : null]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  danger: { backgroundColor: colors.danger },
  pressed: { opacity: 0.85 },
  inactive: { opacity: 0.5 },
  label: { color: '#ffffff', fontSize: fontSize.md, fontWeight: '600' },
  labelSecondary: { color: colors.primary },
});
```

Tạo `components/ui/TextField.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import type { KeyboardTypeOptions } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  testID?: string;
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  secureTextEntry,
  keyboardType,
  autoCapitalize = 'none',
  testID,
}: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        style={[styles.input, error ? styles.inputError : null]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.md },
  label: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  error: { marginTop: spacing.xs, color: colors.danger, fontSize: fontSize.xs },
});
```

Tạo `components/ui/ScreenContainer.tsx`:

```tsx
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '../../theme/tokens';

/**
 * Android 16 (API 36) ép chế độ edge-to-edge và không cho opt-out.
 * Mọi màn hình PHẢI bọc bằng component này, nếu không nội dung sẽ chui
 * xuống dưới thanh trạng thái và thanh điều hướng.
 */
export function ScreenContainer({
  children,
  padded = true,
}: {
  children: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={[styles.content, padded ? styles.padded : null]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  padded: { paddingHorizontal: spacing.md },
});
```

Tạo `components/ui/ErrorBanner.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fdecea',
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  text: { color: colors.danger, fontSize: fontSize.sm },
});
```

- [ ] **Bước 4: Cài safe-area-context nếu template chưa có**

```bash
npx expo install react-native-safe-area-context
```

- [ ] **Bước 5: Chạy test, xác nhận pass**

```bash
npm test -- components/ui
```

Kỳ vọng: PASS, 7 test.

- [ ] **Bước 6: Commit — lệnh cho chủ dự án chạy**

```bash
git add components/ui/Button.tsx components/ui/TextField.tsx components/ui/ScreenContainer.tsx components/ui/ErrorBanner.tsx components/ui/__tests__/Button.test.tsx components/ui/__tests__/TextField.test.tsx
```

```bash
git commit -m "feat: them component giao dien dung chung"
```

---

## Task 10: Màn hình đăng nhập và đăng ký

**Files:**
- Create: `app/(auth)/_layout.tsx`, `app/(auth)/login.tsx`, `app/(auth)/register.tsx`
- Test: `app/(auth)/__tests__/login.test.tsx`

**Interfaces:**
- Consumes: `useAuth` từ `lib/auth/auth-context`; component từ `components/ui`
- Produces: route `/login` và `/register`

**Yêu cầu hành vi:**
- Xác thực phía client: email không rỗng, mật khẩu ≥6 ký tự (khớp `RegisterDto`)
- Thông báo lỗi từ server đã là tiếng Việt → hiện nguyên văn trong `ErrorBanner`
- Nút hiện trạng thái đang tải, chặn nhấn nhiều lần

- [ ] **Bước 1: Viết test thất bại**

Tạo `app/(auth)/__tests__/login.test.tsx`:

```tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '../login';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/auth/auth-context');
jest.mock('expo-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => children,
  router: { replace: jest.fn(), push: jest.fn() },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('màn hình đăng nhập', () => {
  const signIn = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      status: 'signedOut',
      user: null,
      signIn,
      signUp: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('hiện khẩu hiệu WeDo', () => {
    render(<LoginScreen />);
    expect(screen.getByText('Nghĩ ít hơn, làm nhiều hơn')).toBeTruthy();
  });

  it('chặn gửi khi mật khẩu ngắn hơn 6 ký tự', async () => {
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email'), 'a@b.c');
    fireEvent.changeText(screen.getByTestId('password'), '123');
    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(screen.getByText('Mật khẩu phải có ít nhất 6 ký tự')).toBeTruthy());
    expect(signIn).not.toHaveBeenCalled();
  });

  it('gọi signIn với dữ liệu hợp lệ', async () => {
    signIn.mockResolvedValue(undefined);
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email'), 'a@b.c');
    fireEvent.changeText(screen.getByTestId('password'), 'matkhau');
    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.c', 'matkhau'));
  });

  it('hiện nguyên văn thông báo lỗi từ máy chủ', async () => {
    signIn.mockRejectedValue(new Error('Email hoặc mật khẩu không đúng'));
    render(<LoginScreen />);

    fireEvent.changeText(screen.getByTestId('email'), 'a@b.c');
    fireEvent.changeText(screen.getByTestId('password'), 'matkhau');
    fireEvent.press(screen.getByTestId('submit'));

    await waitFor(() => expect(screen.getByText('Email hoặc mật khẩu không đúng')).toBeTruthy());
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- login
```

Kỳ vọng: FAIL với "Cannot find module '../login'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `app/(auth)/_layout.tsx`:

```tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

Tạo `app/(auth)/login.tsx`:

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../lib/auth/auth-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    // Khớp với ràng buộc MinLength(6) của RegisterDto phía máy chủ.
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>WeDo</Text>
        <Text style={styles.tagline}>Nghĩ ít hơn, làm nhiều hơn</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          testID="email"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@example.com"
          keyboardType="email-address"
        />
        <TextField
          testID="password"
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Ít nhất 6 ký tự"
          secureTextEntry
        />

        <Button testID="submit" label="Đăng nhập" onPress={handleSubmit} loading={submitting} />

        <Link href="/register" style={styles.link}>
          Chưa có tài khoản? Đăng ký
        </Link>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  brand: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary, textAlign: 'center' },
  tagline: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.primary, fontSize: fontSize.sm },
});
```

Tạo `app/(auth)/register.tsx`:

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Link } from 'expo-router';

import { Button } from '../../components/ui/Button';
import { ErrorBanner } from '../../components/ui/ErrorBanner';
import { ScreenContainer } from '../../components/ui/ScreenContainer';
import { TextField } from '../../components/ui/TextField';
import { useAuth } from '../../lib/auth/auth-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      setError('Họ và tên không được để trống');
      return;
    }
    if (!email.trim()) {
      setError('Vui lòng nhập email');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await signUp({ email: email.trim(), password, fullName: fullName.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tạo tài khoản WeDo</Text>

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          testID="fullName"
          label="Họ và tên"
          value={fullName}
          onChangeText={setFullName}
          placeholder="Nguyễn Văn A"
          autoCapitalize="words"
        />
        <TextField
          testID="email"
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="ban@example.com"
          keyboardType="email-address"
        />
        <TextField
          testID="password"
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Ít nhất 6 ký tự"
          secureTextEntry
        />

        <Button testID="submit" label="Đăng ký" onPress={handleSubmit} loading={submitting} />

        <Link href="/login" style={styles.link}>
          Đã có tài khoản? Đăng nhập
        </Link>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  link: { marginTop: spacing.lg, textAlign: 'center', color: colors.primary, fontSize: fontSize.sm },
});
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- login
```

Kỳ vọng: PASS, 4 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add "app/(auth)/_layout.tsx" "app/(auth)/login.tsx" "app/(auth)/register.tsx" "app/(auth)/__tests__/login.test.tsx"
```

```bash
git commit -m "feat: them man hinh dang nhap va dang ky"
```

---

## Task 11: Khởi tạo workspace

**Files:**
- Create: `lib/workspace/workspace-context.tsx`, `components/workspace/CreateWorkspaceForm.tsx`, `app/(onboarding)/create-workspace.tsx`
- Test: `lib/workspace/__tests__/workspace-context.test.tsx`

**Interfaces:**
- Consumes: `listWorkspaces`, `createWorkspace` từ `lib/api/workspaces`; `pickActiveWorkspace` từ `lib/workspace/active-workspace`; `saveActiveWorkspaceId`, `loadActiveWorkspaceId` từ `lib/auth/token-storage`
- Produces:
  - `WorkspaceProvider` (component)
  - `useWorkspace(): { status: 'loading' | 'empty' | 'ready'; active: Workspace | null; workspaces: Workspace[]; refresh(): Promise<void>; create(name: string): Promise<void> }`

**Yêu cầu hành vi:** người dùng mới chưa có workspace → `status: 'empty'` → app điều hướng tới màn hình tạo workspace. Web app cũng làm vậy.

- [ ] **Bước 1: Viết test thất bại**

Tạo `lib/workspace/__tests__/workspace-context.test.tsx`:

```tsx
import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, screen, waitFor, fireEvent } from '@testing-library/react-native';

import { WorkspaceProvider, useWorkspace } from '../workspace-context';
import * as workspacesApi from '../../api/workspaces';
import * as tokenStorage from '../../auth/token-storage';

jest.mock('../../api/workspaces');
jest.mock('../../auth/token-storage');

const mockedApi = workspacesApi as jest.Mocked<typeof workspacesApi>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;

function makeWorkspace(id: string) {
  return {
    id,
    name: `Không gian ${id}`,
    ownerId: 'u1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function Probe() {
  const { status, active, create } = useWorkspace();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="active">{active?.id ?? 'khong'}</Text>
      <Pressable testID="create" onPress={() => create('Nhóm đồ án')}>
        <Text>tao</Text>
      </Pressable>
    </>
  );
}

function renderProbe() {
  return render(
    <WorkspaceProvider>
      <Probe />
    </WorkspaceProvider>,
  );
}

describe('WorkspaceProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue(null);
    mockedStorage.saveActiveWorkspaceId.mockResolvedValue(undefined);
  });

  it('báo empty khi tài khoản chưa có workspace nào', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([]);
    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('empty'));
  });

  it('chọn workspace đã lưu khi nó còn tồn tại', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([makeWorkspace('a'), makeWorkspace('b')] as never);
    mockedStorage.loadActiveWorkspaceId.mockResolvedValue('b');

    renderProbe();

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('ready'));
    expect(screen.getByTestId('active').props.children).toBe('b');
  });

  it('tạo workspace rồi chuyển sang ready', async () => {
    mockedApi.listWorkspaces.mockResolvedValue([]);
    mockedApi.createWorkspace.mockResolvedValue(makeWorkspace('moi') as never);

    renderProbe();
    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('empty'));

    fireEvent.press(screen.getByTestId('create'));

    await waitFor(() => expect(screen.getByTestId('status').props.children).toBe('ready'));
    expect(mockedApi.createWorkspace).toHaveBeenCalledWith({ name: 'Nhóm đồ án' });
    expect(mockedStorage.saveActiveWorkspaceId).toHaveBeenCalledWith('moi');
  });
});
```

- [ ] **Bước 2: Chạy test, xác nhận thất bại**

```bash
npm test -- workspace-context
```

Kỳ vọng: FAIL với "Cannot find module '../workspace-context'".

- [ ] **Bước 3: Viết implementation tối thiểu**

Tạo `lib/workspace/workspace-context.tsx`:

```tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { createWorkspace, listWorkspaces } from '../api/workspaces';
import { loadActiveWorkspaceId, saveActiveWorkspaceId } from '../auth/token-storage';
import type { Workspace } from '../types';
import { pickActiveWorkspace } from './active-workspace';

export type WorkspaceStatus = 'loading' | 'empty' | 'ready';

export interface WorkspaceState {
  status: WorkspaceStatus;
  active: Workspace | null;
  workspaces: Workspace[];
  refresh: () => Promise<void>;
  create: (name: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceState | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<WorkspaceStatus>('loading');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [active, setActive] = useState<Workspace | null>(null);

  const refresh = useCallback(async () => {
    const list = await listWorkspaces();
    setWorkspaces(list);

    const savedId = await loadActiveWorkspaceId();
    const chosen = pickActiveWorkspace(list, savedId);

    setActive(chosen);
    setStatus(chosen ? 'ready' : 'empty');

    if (chosen && chosen.id !== savedId) {
      await saveActiveWorkspaceId(chosen.id);
    }
  }, []);

  const create = useCallback(async (name: string) => {
    const workspace = await createWorkspace({ name });
    await saveActiveWorkspaceId(workspace.id);
    setWorkspaces((current) => [...current, workspace]);
    setActive(workspace);
    setStatus('ready');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<WorkspaceState>(
    () => ({ status, active, workspaces, refresh, create }),
    [status, active, workspaces, refresh, create],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceState {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace phải được dùng bên trong WorkspaceProvider');
  }
  return context;
}
```

Tạo `components/workspace/CreateWorkspaceForm.tsx`.

Đây là **component**, không phải route. Lý do: khung tab cần render nó trực tiếp khi `status === 'empty'` (lúc đó `WorkspaceProvider` chỉ tồn tại bên trong khung tab, nên không điều hướng sang route khác được). Route ở bước sau chỉ là lớp vỏ mỏng bọc component này.

```tsx
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from '../ui/Button';
import { ErrorBanner } from '../ui/ErrorBanner';
import { ScreenContainer } from '../ui/ScreenContainer';
import { TextField } from '../ui/TextField';
import { useWorkspace } from '../../lib/workspace/workspace-context';
import { colors, fontSize, spacing } from '../../theme/tokens';

export function CreateWorkspaceForm() {
  const { create } = useWorkspace();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Vui lòng nhập tên không gian làm việc');
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      await create(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được không gian làm việc.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.heading}>Tạo không gian làm việc</Text>
        <Text style={styles.body}>
          Không gian làm việc là nơi chứa các dự án và công việc của nhóm bạn. Tạo một cái để bắt đầu.
        </Text>

        {error ? <ErrorBanner message={error} /> : null}

        <TextField
          testID="name"
          label="Tên không gian làm việc"
          value={name}
          onChangeText={setName}
          placeholder="Nhóm đồ án tốt nghiệp"
          autoCapitalize="sentences"
        />

        <Button testID="submit" label="Tạo" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'center', paddingVertical: spacing.xl },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  body: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xl },
});
```

Tạo `app/(onboarding)/create-workspace.tsx` — lớp vỏ mỏng để route tồn tại theo đúng cây điều hướng trong spec:

```tsx
import { CreateWorkspaceForm } from '../../components/workspace/CreateWorkspaceForm';

export default function CreateWorkspaceScreen() {
  return <CreateWorkspaceForm />;
}
```

- [ ] **Bước 4: Chạy test, xác nhận pass**

```bash
npm test -- workspace-context
```

Kỳ vọng: PASS, 3 test.

- [ ] **Bước 5: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/workspace/workspace-context.tsx components/workspace/CreateWorkspaceForm.tsx "app/(onboarding)/create-workspace.tsx" lib/workspace/__tests__/workspace-context.test.tsx
```

```bash
git commit -m "feat: them khoi tao workspace cho tai khoan moi"
```

---

## Task 12: Layout gốc, điều hướng và khung tab

**Files:**
- Create: `lib/query.ts`, `app/_layout.tsx`, `app/index.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/chat/index.tsx`, `app/(tabs)/tasks/index.tsx`, `app/(tabs)/notifications/index.tsx`, `app/(tabs)/account/index.tsx`
- Modify: `app.json`

**Interfaces:**
- Consumes: `AuthProvider`, `useAuth`; `WorkspaceProvider`, `useWorkspace`
- Produces: app chạy được đầu-cuối; các màn hình tab placeholder cho kế hoạch 2 và 3 thay thế

**Yêu cầu hành vi:** đúng luồng khởi động ở mục 5.1 của spec.

- [ ] **Bước 1: Cài phụ thuộc điều hướng còn thiếu**

```bash
npx expo install @expo/vector-icons
```

- [ ] **Bước 2: Tạo QueryClient**

Tạo `lib/query.ts`:

```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Mạng di động hay chập chờn; đừng nạp lại liên tục khi app đổi focus.
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Bước 3: Tạo layout gốc**

Tạo `app/_layout.tsx`:

```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '../lib/auth/auth-context';
import { queryClient } from '../lib/query';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Bước 4: Tạo màn hình splash điều hướng**

Tạo `app/index.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useAuth } from '../lib/auth/auth-context';
import { colors } from '../theme/tokens';

export default function Index() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/chat" />;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
```

- [ ] **Bước 5: Tạo layout tab kèm cổng workspace**

Tạo `app/(tabs)/_layout.tsx`:

```tsx
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../../lib/auth/auth-context';
import { WorkspaceProvider, useWorkspace } from '../../lib/workspace/workspace-context';
import { colors } from '../../theme/tokens';
import { CreateWorkspaceForm } from '../../components/workspace/CreateWorkspaceForm';

function TabsWithWorkspace() {
  const { status } = useWorkspace();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Tài khoản mới chưa có workspace phải tự tạo một cái trước khi dùng app.
  if (status === 'empty') {
    return <CreateWorkspaceForm />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen
        name="chat/index"
        options={{
          title: 'Trò chuyện',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks/index"
        options={{
          title: 'Việc của tôi',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications/index"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="account/index"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabsLayout() {
  const { status } = useAuth();

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (status === 'signedOut') {
    return <Redirect href="/login" />;
  }

  return (
    <WorkspaceProvider>
      <TabsWithWorkspace />
    </WorkspaceProvider>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
});
```

- [ ] **Bước 6: Tạo màn hình tab placeholder**

Tạo `app/(tabs)/chat/index.tsx`:

```tsx
import React from 'react';
import { StyleSheet, Text } from 'react-native';

import { ScreenContainer } from '../../../components/ui/ScreenContainer';
import { colors, fontSize, spacing } from '../../../theme/tokens';

export default function ChatListScreen() {
  return (
    <ScreenContainer>
      <Text style={styles.heading}>Trò chuyện</Text>
      <Text style={styles.body}>Danh sách dự án sẽ hiển thị ở đây.</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  body: { fontSize: fontSize.sm, color: colors.textMuted },
});
```

Tạo `app/(tabs)/tasks/index.tsx`, `app/(tabs)/notifications/index.tsx`, `app/(tabs)/account/index.tsx` theo đúng khuôn trên, đổi tên hàm và hai chuỗi hiển thị:

| File | Tên hàm | Tiêu đề | Nội dung |
|---|---|---|---|
| `tasks/index.tsx` | `MyTasksScreen` | `Việc của tôi` | `Công việc được giao cho bạn sẽ hiển thị ở đây.` |
| `notifications/index.tsx` | `NotificationsScreen` | `Thông báo` | `Thông báo của bạn sẽ hiển thị ở đây.` |
| `account/index.tsx` | `AccountScreen` | `Tài khoản` | `Hồ sơ và cài đặt sẽ hiển thị ở đây.` |

- [ ] **Bước 7: Cấu hình app.json cho Android**

Sửa `app.json` — đặt các giá trị này trong `expo`:

```json
{
  "expo": {
    "name": "WeDo",
    "slug": "wedo",
    "scheme": "wedo",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "light",
    "android": {
      "package": "vn.wedo.app",
      "versionCode": 1,
      "adaptiveIcon": {
        "backgroundColor": "#0055c7"
      },
      "edgeToEdgeEnabled": true
    },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

Không thêm khối `permissions` nào ở bước này. Quyền sẽ được thêm có chủ đích ở kế hoạch 3.

- [ ] **Bước 8: Chạy toàn bộ test**

```bash
npm test
```

Kỳ vọng: PASS toàn bộ, **48 test** trên 11 file:

| File test | Số test |
|---|---|
| `lib/__tests__/smoke.test.ts` | 1 |
| `theme/__tests__/tokens.test.ts` | 2 |
| `lib/auth/__tests__/token-storage.test.ts` | 6 |
| `lib/api/__tests__/client.test.ts` | 12 |
| `lib/api/__tests__/auth.test.ts` | 4 |
| `lib/workspace/__tests__/active-workspace.test.ts` | 4 |
| `lib/auth/__tests__/auth-context.test.tsx` | 5 |
| `components/ui/__tests__/Button.test.tsx` | 4 |
| `components/ui/__tests__/TextField.test.tsx` | 3 |
| `app/(auth)/__tests__/login.test.tsx` | 4 |
| `lib/workspace/__tests__/workspace-context.test.tsx` | 3 |

- [ ] **Bước 9: Kiểm tra TypeScript**

```bash
npx tsc --noEmit
```

Kỳ vọng: không lỗi.

- [ ] **Bước 10: Kiểm chứng trên thiết bị thật**

```bash
npx expo start
```

Quét QR bằng Expo Go trên điện thoại Android. Kiểm chứng theo thứ tự, **chụp màn hình từng bước**:

1. App mở ra màn hình đăng nhập, có khẩu hiệu "Nghĩ ít hơn, làm nhiều hơn"
2. Nhập sai mật khẩu → hiện thông báo lỗi tiếng Việt từ máy chủ
3. Nhập đúng tài khoản thật → vào được khung 4 tab
4. Đóng app hoàn toàn, mở lại → **vẫn đăng nhập**, không hỏi lại mật khẩu (chứng minh SecureStore hoạt động)
5. Bật chế độ máy bay, mở lại app → hiện lỗi mạng tiếng Việt, không sập
6. Chuyển qua lại cả 4 tab → không tab nào bị nội dung che bởi thanh điều hướng hệ thống (chứng minh edge-to-edge được xử lý)

Nếu bước nào không đạt, sửa trước khi đóng task. **Không đánh dấu hoàn thành khi chưa chạy đủ 6 bước.**

- [ ] **Bước 11: Commit — lệnh cho chủ dự án chạy**

```bash
git add lib/query.ts app/_layout.tsx app/index.tsx "app/(tabs)/_layout.tsx" "app/(tabs)/chat/index.tsx" "app/(tabs)/tasks/index.tsx" "app/(tabs)/notifications/index.tsx" "app/(tabs)/account/index.tsx" app.json
```

```bash
git commit -m "feat: them dieu huong goc va khung 4 tab"
```

---

## Kiểm chứng khi kết thúc kế hoạch

Cả bốn mục phải đạt trước khi coi kế hoạch 1 là xong:

| Hạng mục | Lệnh | Kỳ vọng |
|---|---|---|
| Test đơn vị | `npm test` | Toàn bộ PASS, 48 test |
| Kiểu dữ liệu | `npx tsc --noEmit` | Không lỗi |
| Không lộ bí mật | xem lệnh bên dưới | Không kết quả nào |
| Chạy trên máy thật | 6 bước ở Task 12 Bước 10 | Có ảnh chụp từng bước |

Lệnh soát bí mật (chạy ở gốc dự án):

```bash
grep -rnE "azurewebsites|Bearer ey|postgres://|supabase\.co" --include="*.ts" --include="*.tsx" --include="*.json" --exclude-dir=node_modules --exclude-dir=docs .
```

Kỳ vọng: không in ra dòng nào. `.env` chứa URL thật nhưng đã nằm trong `.gitignore` nên không vào repo.

---

## Việc kế hoạch này KHÔNG làm

Nằm ở kế hoạch 2 và 3:

- **Kế hoạch 2 — Trò chuyện và biến tin nhắn thành công việc:** danh sách dự án, khung chat, Socket.IO, nhấn giữ, đề xuất AI, luồng ba bước tạo công việc
- **Kế hoạch 3 — Việc của tôi, Thông báo, Tài khoản, phát hành:** danh sách công việc, nhận/từ chối, thông báo, nhắc hạn cục bộ, xoá tài khoản, EAS Build, chuẩn bị nộp Play
- **Kế hoạch backend (repo riêng `BE_WEDO`):** `DELETE /users/me`, `GET /users/me/deletion-blockers`, `PATCH /workspaces/:id/owner`
