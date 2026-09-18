# Tin nhắn riêng — đợt 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Người dùng WeDo mobile nhắn tin riêng được với người chung không gian làm việc, và tạo thêm không gian làm việc ngay trong app.

**Architecture:** Gộp vào tab Trò chuyện bằng thanh chuyển "Dự án | Tin nhắn", không thêm tab thứ sáu. Hai module API mới gọi thẳng các endpoint `chat/direct/*` đã có sẵn ở backend. Logic thuần tách khỏi component để kiểm được không cần dựng socket. Realtime dùng lại `socket-context` và `use-realtime-sync` hiện có.

**Tech Stack:** Expo SDK 57, React Native 0.86, React 19.2, expo-router (typed routes), TanStack Query v5, socket.io-client 4.8, TypeScript 6, Jest + jest-expo, @testing-library/react-native.

Thiết kế gốc: `docs/superpowers/specs/2026-09-18-tin-nhan-rieng-va-ket-ban-design.md`

## Global Constraints

- **Đọc tài liệu Expo đúng phiên bản** tại https://docs.expo.dev/versions/v57.0.0/ trước khi viết mã. Expo đã thay đổi nhiều — `AGENTS.md` của repo yêu cầu điều này.
- **Toàn bộ chữ hiển thị và bình luận viết bằng tiếng Việt**, theo đúng lối đang có trong repo. Bình luận giải thích *tại sao*, không mô tả lại mã làm gì.
- **Không đụng `BE_WEDO` ngoài đúng một hàm nêu ở Task 4.**
- **Không thêm thư viện mới.** Mọi thứ cần đã có trong `package.json`.
- **Màn hình trong `(tabs)` không viết test**, theo đúng quy ước repo. Hàm thuần và component thì bắt buộc có test.
- **Style dùng token**, không nhúng số cứng: `colors`, `fontSize`, `lineHeight`, `radius`, `spacing`, `sizes`, `scale`, `scaleWithFont` từ `src/theme/tokens`. Riêng `lineHeight` không đặt cho chữ đã bị chặn cỡ.
- **Không tăng `versionCode`** trong bất kỳ task nào. Việc đó làm một lần lúc chuẩn bị build.
- Cổng nghiệm thu mỗi task: `npx tsc --noEmit` sạch và `npx jest` qua hết.

---

### Task 1: Tạo thêm không gian làm việc

**Files:**
- Modify: `src/components/workspace/WorkspaceSwitcher.tsx`
- Modify: `src/app/(tabs)/chat/index.tsx`
- Modify: `src/app/(tabs)/tasks/index.tsx`
- Modify: `src/app/(tabs)/calendar/index.tsx`
- Test: `src/components/workspace/__tests__/WorkspaceSwitcher.test.tsx`

**Interfaces:**
- Consumes: `WorkspaceSwitcher` props hiện có (`visible`, `workspaces`, `activeId`, `onSelect`, `onDismiss`); `CreateWorkspaceForm` từ `src/components/workspace/CreateWorkspaceForm`.
- Produces: `WorkspaceSwitcher` nhận thêm prop bắt buộc `onCreate: () => void`.

Bối cảnh: `createWorkspace` đã có trong `src/lib/api/workspaces.ts`, `CreateWorkspaceForm` đã có, `WorkspaceProvider.create()` đã lưu id và chuyển sang workspace mới. Thiếu đúng chỗ bấm.

- [ ] **Step 1: Viết test thất bại cho dòng tạo mới**

Thêm vào cuối `describe('WorkspaceSwitcher', ...)` trong `src/components/workspace/__tests__/WorkspaceSwitcher.test.tsx`. Khai `onCreate` cạnh `onSelect` và `onDismiss` ở đầu describe, rồi truyền vào `renderSheet`:

```tsx
const onCreate = jest.fn();
```

Trong `renderSheet`, thêm `onCreate={onCreate}` vào danh sách prop. Rồi thêm hai test:

```tsx
it('có dòng tạo không gian mới', async () => {
  const { getByTestId } = await renderSheet();

  expect(getByTestId('workspace-tao-moi')).toBeTruthy();
});

it('chạm dòng tạo mới thì đóng sheet rồi báo ra ngoài', async () => {
  const { getByTestId } = await renderSheet();

  await fireEvent.press(getByTestId('workspace-tao-moi'));

  expect(onCreate).toHaveBeenCalled();
  expect(onDismiss).toHaveBeenCalled();
  expect(onSelect).not.toHaveBeenCalled();
});

it('vẫn dựng dòng tạo mới khi chỉ có một không gian', async () => {
  const { getByTestId } = await renderSheet({ workspaces: [A] });

  expect(getByTestId('workspace-tao-moi')).toBeTruthy();
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/components/workspace/__tests__/WorkspaceSwitcher.test.tsx`
Expected: FAIL — `Unable to find an element with testID: workspace-tao-moi`

- [ ] **Step 3: Thêm dòng tạo mới vào WorkspaceSwitcher**

Thêm `onCreate` vào interface, ngay dưới `onSelect`:

```tsx
  /** Chỉ gọi khi người dùng chọn một cái KHÁC cái đang dùng. */
  onSelect: (workspaceId: string) => void;
  /** Mở luồng tạo không gian làm việc mới. Sheet tự đóng trước khi gọi. */
  onCreate: () => void;
  onDismiss: () => void;
```

Thêm `onCreate` vào danh sách tham số của hàm, rồi thêm hàm xử lý cạnh `handlePress`:

```tsx
  const handleCreate = () => {
    // Đóng trước rồi mới báo ra ngoài: hai Modal chồng nhau trên Android làm
    // cái mở sau không nhận được chạm.
    onDismiss();
    onCreate();
  };
```

Chèn ngay **sau** `</ScrollView>`, trước `</View>` đóng sheet:

```tsx
        <Pressable
          testID="workspace-tao-moi"
          accessibilityRole="button"
          accessibilityLabel="Tạo không gian làm việc mới"
          onPress={handleCreate}
          style={({ pressed }) => [styles.taoMoi, pressed ? styles.rowPressed : null]}
        >
          <View style={styles.taoMoiIcon}>
            <Ionicons name="add" size={sizes.icon} color={colors.primary} />
          </View>
          <Text style={styles.taoMoiChu}>Tạo không gian mới</Text>
        </Pressable>
```

Thêm vào `StyleSheet.create`:

```tsx
  /* Đường kẻ tách hẳn hành động khỏi danh sách để không ai chạm nhầm. */
  taoMoi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + 4,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  taoMoiIcon: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taoMoiChu: {
    flex: 1,
    fontSize: fontSize.md,
    lineHeight: lineHeight.md,
    fontWeight: '600',
    color: colors.primary,
  },
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/components/workspace/__tests__/WorkspaceSwitcher.test.tsx`
Expected: PASS — 8 test

- [ ] **Step 5: Gắn vào màn Trò chuyện**

Trong `src/app/(tabs)/chat/index.tsx`:

Thêm import: `import { CreateWorkspaceForm } from '../../../components/workspace/CreateWorkspaceForm';` và `Modal` vào danh sách import từ `react-native`.

Thêm state cạnh `switcherOpen`:

```tsx
  const [taoMoiOpen, setTaoMoiOpen] = useState(false);
```

**Xoá** biến `coTheDoiWorkspace` và khối bình luận của nó. Sheet nay còn chức năng tạo mới, nên người chỉ có một không gian cũng phải mở được — họ mới là người cần tạo thêm nhất.

Sửa prop của `GradientHeader`:

```tsx
        onPressSubtitle={() => setSwitcherOpen(true)}
```

Thêm `onCreate` vào `WorkspaceSwitcher` đang render:

```tsx
        onCreate={() => setTaoMoiOpen(true)}
```

Thêm ngay sau `</WorkspaceSwitcher>` (tức sau thẻ tự đóng của nó):

```tsx
      <Modal
        visible={taoMoiOpen}
        animationType="slide"
        onRequestClose={() => setTaoMoiOpen(false)}
      >
        <CreateWorkspaceForm onDone={() => setTaoMoiOpen(false)} />
      </Modal>
```

- [ ] **Step 6: Cho CreateWorkspaceForm biết lúc nào xong**

`CreateWorkspaceForm` đang dùng ở màn onboarding, nơi tạo xong thì `status` đổi sang `ready` và khung tab tự thay màn — không cần ai đóng. Trong Modal thì không có cơ chế đó.

Trong `src/components/workspace/CreateWorkspaceForm.tsx`, thêm prop tuỳ chọn để chỗ gọi cũ không phải sửa:

```tsx
interface CreateWorkspaceFormProps {
  /**
   * Gọi sau khi tạo xong. Màn onboarding không truyền: ở đó `status` đổi sang
   * `ready` và khung tab tự thay màn. Trong Modal thì phải có người đóng.
   */
  onDone?: () => void;
}

export function CreateWorkspaceForm({ onDone }: CreateWorkspaceFormProps = {}) {
```

Trong `handleSubmit`, sau `await create(name.trim());` thêm:

```tsx
      onDone?.();
```

- [ ] **Step 7: Gắn vào màn Việc của tôi và màn Lịch**

Lặp lại đúng Step 5 cho `src/app/(tabs)/tasks/index.tsx` và `src/app/(tabs)/calendar/index.tsx`: thêm import `Modal` và `CreateWorkspaceForm`, thêm state `taoMoiOpen`, xoá `coTheDoiWorkspace` cùng bình luận của nó, đổi `onPressSubtitle={() => setSwitcherOpen(true)}`, thêm `onCreate`, thêm khối `<Modal>`.

`calendar/index.tsx` chưa import `Modal` từ `react-native` — thêm vào dòng import sẵn có.

- [ ] **Step 8: Chạy typecheck và toàn bộ test**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

- [ ] **Step 9: Commit**

```bash
git add src/components/workspace src/app/\(tabs\)/chat/index.tsx src/app/\(tabs\)/tasks/index.tsx src/app/\(tabs\)/calendar/index.tsx
git commit -m "feat(mobile): tao them khong gian lam viec ngay trong app"
```

---

### Task 2: Kiểu dữ liệu và tầng API tin nhắn riêng

**Files:**
- Modify: `src/lib/types.ts`
- Create: `src/lib/api/direct-chat.ts`
- Test: `src/lib/api/__tests__/direct-chat.test.ts`

**Interfaces:**
- Consumes: `apiRequest` từ `src/lib/api/client`; `UserSummary` từ `src/lib/types`.
- Produces:
  - `DirectMessage { id, conversationId, senderId, content, createdAt, updatedAt, deletedAt?, replyToId?, sender?: UserSummary }`
  - `DirectConversation { id, pairKey, createdAt, updatedAt, participants: Array<{ id, userId, lastReadAt?, user: UserSummary }>, unreadCount: number }`
  - `listConversations(): Promise<DirectConversation[]>`
  - `startConversation(targetUserId: string): Promise<DirectConversation>`
  - `getDirectMessages(conversationId: string): Promise<DirectMessage[]>`
  - `sendDirectMessage(conversationId: string, content: string): Promise<DirectMessage>`
  - `markConversationRead(conversationId: string): Promise<unknown>`

- [ ] **Step 1: Thêm kiểu vào `src/lib/types.ts`**

Đặt ngay sau khối `ChatHistoryPage`:

```ts
/** Một người trong hội thoại riêng. */
export interface DirectParticipant {
  id: string;
  userId: string;
  /** Mốc người này đọc tới. Chưa đọc lần nào thì vắng. */
  lastReadAt?: string | null;
  user: UserSummary;
}

export interface DirectConversation {
  id: string;
  /** Hai id người dùng đã sắp xếp rồi nối bằng dấu hai chấm. Máy chủ dùng nó để chống tạo trùng. */
  pairKey: string;
  createdAt: string;
  updatedAt: string;
  participants: DirectParticipant[];
  /** Máy chủ đếm sẵn trong `getDirectConversations`, không phải đếm lại ở máy. */
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  replyToId?: string | null;
  sender?: UserSummary;
}
```

- [ ] **Step 2: Viết test thất bại**

Tạo `src/lib/api/__tests__/direct-chat.test.ts`:

```ts
import {
  listConversations,
  startConversation,
  getDirectMessages,
  sendDirectMessage,
  markConversationRead,
} from '../direct-chat';
import { apiRequest } from '../client';

jest.mock('../client', () => ({ apiRequest: jest.fn() }));

const mockedRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('API tin nhắn riêng', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedRequest.mockResolvedValue({} as never);
  });

  it('GET danh sách hội thoại', async () => {
    await listConversations();
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations');
  });

  it('POST tạo hội thoại kèm id người nhận', async () => {
    await startConversation('u2');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations', {
      method: 'POST',
      body: { targetUserId: 'u2' },
    });
  });

  it('GET tin nhắn của một hội thoại', async () => {
    await getDirectMessages('c1');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/messages');
  });

  it('mã hoá id hội thoại có ký tự đặc biệt', async () => {
    await getDirectMessages('a b/c');
    expect(mockedRequest).toHaveBeenCalledWith(
      '/chat/direct/conversations/a%20b%2Fc/messages',
    );
  });

  it('POST gửi tin nhắn', async () => {
    await sendDirectMessage('c1', 'chào bạn');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/messages', {
      method: 'POST',
      body: { content: 'chào bạn' },
    });
  });

  it('POST đánh dấu đã đọc', async () => {
    await markConversationRead('c1');
    expect(mockedRequest).toHaveBeenCalledWith('/chat/direct/conversations/c1/read', {
      method: 'POST',
    });
  });
});
```

- [ ] **Step 3: Chạy test, xác nhận thất bại**

Run: `npx jest src/lib/api/__tests__/direct-chat.test.ts`
Expected: FAIL — `Cannot find module '../direct-chat'`

- [ ] **Step 4: Viết `src/lib/api/direct-chat.ts`**

```ts
import { apiRequest } from './client';
import type { DirectConversation, DirectMessage } from '../types';

/**
 * Mọi id đi vào đường dẫn đều phải mã hoá.
 *
 * Id là uuid nên trong thực tế không có ký tự lạ, nhưng id hỏng từ cache cũ mà
 * lọt vào đường dẫn sẽ sinh một URL khác hẳn ý định — lỗi rất khó lần ra.
 */
function duongDan(conversationId: string, duoi: string): string {
  return `/chat/direct/conversations/${encodeURIComponent(conversationId)}${duoi}`;
}

export function listConversations(): Promise<DirectConversation[]> {
  return apiRequest<DirectConversation[]>('/chat/direct/conversations');
}

/**
 * Tạo hội thoại, hoặc lấy lại cái đã có.
 *
 * Máy chủ tra theo `pairKey` trước khi tạo, nên gọi nhiều lần với cùng một người
 * không sinh hội thoại trùng — chỗ gọi không cần tự kiểm tra trước.
 */
export function startConversation(targetUserId: string): Promise<DirectConversation> {
  return apiRequest<DirectConversation>('/chat/direct/conversations', {
    method: 'POST',
    body: { targetUserId },
  });
}

export function getDirectMessages(conversationId: string): Promise<DirectMessage[]> {
  return apiRequest<DirectMessage[]>(duongDan(conversationId, '/messages'));
}

export function sendDirectMessage(
  conversationId: string,
  content: string,
): Promise<DirectMessage> {
  return apiRequest<DirectMessage>(duongDan(conversationId, '/messages'), {
    method: 'POST',
    body: { content },
  });
}

export function markConversationRead(conversationId: string): Promise<unknown> {
  return apiRequest(duongDan(conversationId, '/read'), { method: 'POST' });
}
```

- [ ] **Step 5: Chạy test, xác nhận qua**

Run: `npx jest src/lib/api/__tests__/direct-chat.test.ts`
Expected: PASS — 6 test

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/api/direct-chat.ts src/lib/api/__tests__/direct-chat.test.ts
git commit -m "feat(mobile): tang API tin nhan rieng"
```

---

### Task 3: Hàm thuần lấy người đối thoại

**Files:**
- Create: `src/lib/chat/doi-phuong.ts`
- Test: `src/lib/chat/__tests__/doi-phuong.test.ts`

**Interfaces:**
- Consumes: `DirectConversation`, `UserSummary` từ `src/lib/types`.
- Produces: `doiPhuong(conversation: DirectConversation, userId: string): UserSummary | null`

> Thiết kế gốc còn nêu `gop-hoi-thoai.ts` để chèn tin nhắn từ socket vào danh
> sách. Kế hoạch này **bỏ nó**: Task 7 làm mới danh sách bằng cách vô hiệu hoá
> khoá truy vấn, nên hàm gộp thủ công sẽ không có chỗ gọi. Viết ra là viết mã
> chết. Spec đã cập nhật theo.

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/chat/__tests__/doi-phuong.test.ts`:

```ts
import { doiPhuong } from '../doi-phuong';
import type { DirectConversation, UserSummary } from '../../types';

function nguoi(id: string, ten: string): UserSummary {
  return { id, email: `${id}@wedo.vn`, fullName: ten };
}

function hoiThoai(users: UserSummary[]): DirectConversation {
  return {
    id: 'c1',
    pairKey: users.map((u) => u.id).sort().join(':'),
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    unreadCount: 0,
    participants: users.map((user) => ({ id: `p-${user.id}`, userId: user.id, user })),
  };
}

describe('doiPhuong', () => {
  const toi = nguoi('u1', 'Đại');
  const ban = nguoi('u2', 'Tuấn');

  it('trả về người còn lại', () => {
    expect(doiPhuong(hoiThoai([toi, ban]), 'u1')).toEqual(ban);
  });

  it('không phụ thuộc thứ tự người tham gia', () => {
    expect(doiPhuong(hoiThoai([ban, toi]), 'u1')).toEqual(ban);
  });

  it('trả về null khi mình không có trong hội thoại', () => {
    expect(doiPhuong(hoiThoai([toi, ban]), 'u9')).toBeNull();
  });

  it('trả về null khi hội thoại thiếu người tham gia', () => {
    expect(doiPhuong(hoiThoai([toi]), 'u1')).toBeNull();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/lib/chat/__tests__/doi-phuong.test.ts`
Expected: FAIL — `Cannot find module '../doi-phuong'`

- [ ] **Step 3: Viết `src/lib/chat/doi-phuong.ts`**

```ts
import type { DirectConversation, UserSummary } from '../types';

/**
 * Người kia trong một hội thoại riêng.
 *
 * Máy chủ trả về cả hai người tham gia, còn mọi chỗ hiển thị đều chỉ cần "người
 * kia là ai" — tên nào lên tiêu đề, avatar nào lên danh sách. Để phép lọc này
 * rải trong component thì lặp ba chỗ và mỗi chỗ tự xử lý trường hợp thiếu một
 * kiểu.
 *
 * Trả `null` chứ không ném: hội thoại có thể thiếu người tham gia nếu tài khoản
 * kia vừa bị xoá, và một dòng danh sách hỏng không được phép làm sập cả màn.
 */
export function doiPhuong(
  conversation: DirectConversation,
  userId: string,
): UserSummary | null {
  const participants = conversation?.participants ?? [];
  if (!participants.some((item) => item.userId === userId)) return null;

  const khac = participants.find((item) => item.userId !== userId);
  return khac?.user ?? null;
}
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/lib/chat/__tests__/doi-phuong.test.ts`
Expected: PASS — 4 test

- [ ] **Step 5: Commit**

```bash
git add src/lib/chat/doi-phuong.ts src/lib/chat/__tests__/doi-phuong.test.ts
git commit -m "feat(mobile): ham thuan lay nguoi doi thoai"
```

---

### Task 4: Nới điều kiện tạo hội thoại ở backend

**Files:**
- Modify: `BE_WEDO/src/chat/chat.service.ts` (hàm `startDirectConversation`)
- Test: `BE_WEDO/src/chat/start-direct-conversation.spec.ts`

**Interfaces:**
- Consumes: `PrismaService` đã tiêm sẵn trong `ChatService`.
- Produces: `startDirectConversation` cho phép tạo khi đã kết bạn **hoặc** chung không gian làm việc. Chữ lỗi mới: `'Bạn cần kết bạn hoặc chung không gian làm việc để bắt đầu trò chuyện riêng.'`

Đường dẫn backend trên máy này: `D:\WEDO_PC\BE_WEDO`.

- [ ] **Step 1: Viết test thất bại**

Tạo `BE_WEDO/src/chat/start-direct-conversation.spec.ts`:

```ts
import { ForbiddenException } from '@nestjs/common';
import { ChatService } from './chat.service';

/** Dựng ChatService với Prisma giả, chỉ đủ cho đường tạo hội thoại. */
function dungService(options: {
  friendshipStatus?: string | null;
  soWorkspaceChung: number;
}) {
  const taoHoiThoai = jest.fn().mockResolvedValue({ id: 'c1' });

  const prisma = {
    user: { findFirst: jest.fn().mockResolvedValue({ id: 'u2' }) },
    directConversation: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: taoHoiThoai,
    },
    friendship: {
      findUnique: jest.fn().mockResolvedValue(
        options.friendshipStatus ? { status: options.friendshipStatus } : null,
      ),
    },
    workspaceMember: { count: jest.fn().mockResolvedValue(options.soWorkspaceChung) },
  };

  const service = new ChatService(prisma as never, ...([] as never[]));
  return { service, prisma, taoHoiThoai };
}

describe('startDirectConversation', () => {
  it('cho tạo khi hai người đã kết bạn', async () => {
    const { service, taoHoiThoai } = dungService({
      friendshipStatus: 'ACCEPTED',
      soWorkspaceChung: 0,
    });

    await service.startDirectConversation('u1', { targetUserId: 'u2' } as never);

    expect(taoHoiThoai).toHaveBeenCalled();
  });

  it('cho tạo khi chung không gian làm việc dù chưa kết bạn', async () => {
    const { service, taoHoiThoai } = dungService({
      friendshipStatus: null,
      soWorkspaceChung: 1,
    });

    await service.startDirectConversation('u1', { targetUserId: 'u2' } as never);

    expect(taoHoiThoai).toHaveBeenCalled();
  });

  it('chặn khi không kết bạn và không chung không gian nào', async () => {
    const { service, taoHoiThoai } = dungService({
      friendshipStatus: null,
      soWorkspaceChung: 0,
    });

    await expect(
      service.startDirectConversation('u1', { targetUserId: 'u2' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(taoHoiThoai).not.toHaveBeenCalled();
  });

  it('chặn khi lời mời kết bạn còn đang chờ', async () => {
    const { service, taoHoiThoai } = dungService({
      friendshipStatus: 'PENDING',
      soWorkspaceChung: 0,
    });

    await expect(
      service.startDirectConversation('u1', { targetUserId: 'u2' } as never),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(taoHoiThoai).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest src/chat/start-direct-conversation.spec.ts`
Expected: FAIL — test "cho tạo khi chung không gian làm việc dù chưa kết bạn" ném `ForbiddenException`

Nếu constructor của `ChatService` nhận nhiều phụ thuộc hơn Prisma, đọc lại chữ ký thật ở đầu `chat.service.ts` và truyền `null as never` cho từng cái còn lại — đường tạo hội thoại không chạm tới chúng.

- [ ] **Step 3: Sửa `startDirectConversation`**

Thay khối chặn hiện tại:

```ts
    const friendship = await this.prisma.friendship.findUnique({ where: { pairKey } });
    if (!friendship || friendship.status !== 'ACCEPTED') {
      throw new ForbiddenException('Hai người cần kết bạn trước khi bắt đầu trò chuyện riêng.');
    }
```

bằng:

```ts
    /*
      Nới so với bản đầu: chung không gian làm việc cũng đủ, không bắt kết bạn.

      Lý do là ma sát. Bắt kết bạn trước nghĩa là tìm người → gửi lời mời → chờ
      người kia duyệt → mới nhắn được câu đầu tiên. Bốn bước và một lần chờ,
      trong khi hai người vốn đã ở chung một nhóm và nhìn thấy nhau mỗi ngày.

      Chỉ nới đường TẠO. Mọi đường đọc và gửi vẫn đi qua
      `ensureDirectConversationParticipant`, nên không mở thêm lối vào dữ liệu
      của người khác.
    */
    const friendship = await this.prisma.friendship.findUnique({ where: { pairKey } });
    const laBanBe = friendship?.status === 'ACCEPTED';

    const chungWorkspace =
      laBanBe ||
      (await this.prisma.workspaceMember.count({
        where: { userId, workspace: { members: { some: { userId: target.id } } } },
      })) > 0;

    if (!laBanBe && !chungWorkspace) {
      throw new ForbiddenException(
        'Bạn cần kết bạn hoặc chung không gian làm việc để bắt đầu trò chuyện riêng.',
      );
    }
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest src/chat/start-direct-conversation.spec.ts`
Expected: PASS — 4 test

- [ ] **Step 5: Chạy toàn bộ test backend**

Run: `cd /d/WEDO_PC/BE_WEDO && npx jest`
Expected: không có test nào hỏng thêm so với trước. Lỗi sẵn có trong `payments/entitlements.service.spec.ts` (ghi trong ghi chú 11/08) không thuộc phạm vi task này.

- [ ] **Step 6: Commit trong repo backend**

```bash
cd /d/WEDO_PC/BE_WEDO
git add src/chat/chat.service.ts src/chat/start-direct-conversation.spec.ts
git commit -m "feat(chat): cho nhan tin rieng voi nguoi chung workspace"
```

---

### Task 5: Dòng hội thoại và thanh chuyển Dự án | Tin nhắn

**Files:**
- Create: `src/components/chat/ConversationRow.tsx`
- Create: `src/components/chat/SegmentedTabs.tsx`
- Modify: `src/app/(tabs)/chat/index.tsx`
- Test: `src/components/chat/__tests__/ConversationRow.test.tsx`
- Test: `src/components/chat/__tests__/SegmentedTabs.test.tsx`

**Interfaces:**
- Consumes: `doiPhuong` từ `src/lib/chat/doi-phuong`; `listConversations` từ `src/lib/api/direct-chat`; `Card` từ `src/components/ui/Card`.
- Produces:
  - `ConversationRow({ conversation, currentUserId, online, onPress })`
  - `SegmentedTabs({ options: Array<{ key: string; label: string }>, value: string, onChange: (key: string) => void })`

- [ ] **Step 1: Viết test thất bại cho `SegmentedTabs`**

Tạo `src/components/chat/__tests__/SegmentedTabs.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { SegmentedTabs } from '../SegmentedTabs';

const OPTIONS = [
  { key: 'du-an', label: 'Dự án' },
  { key: 'tin-nhan', label: 'Tin nhắn' },
];

describe('SegmentedTabs', () => {
  it('dựng đủ các mục', () => {
    const { getByText } = render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={jest.fn()} />,
    );

    expect(getByText('Dự án')).toBeTruthy();
    expect(getByText('Tin nhắn')).toBeTruthy();
  });

  it('đánh dấu mục đang chọn', () => {
    const { getByTestId } = render(
      <SegmentedTabs options={OPTIONS} value="tin-nhan" onChange={jest.fn()} />,
    );

    expect(getByTestId('segment-tin-nhan').props.accessibilityState.selected).toBe(true);
    expect(getByTestId('segment-du-an').props.accessibilityState.selected).toBe(false);
  });

  it('báo key khi chạm mục khác', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={onChange} />,
    );

    fireEvent.press(getByTestId('segment-tin-nhan'));

    expect(onChange).toHaveBeenCalledWith('tin-nhan');
  });

  it('chạm lại mục đang chọn thì không báo gì', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <SegmentedTabs options={OPTIONS} value="du-an" onChange={onChange} />,
    );

    fireEvent.press(getByTestId('segment-du-an'));

    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/components/chat/__tests__/SegmentedTabs.test.tsx`
Expected: FAIL — `Cannot find module '../SegmentedTabs'`

- [ ] **Step 3: Viết `src/components/chat/SegmentedTabs.tsx`**

```tsx
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '../../theme/tokens';

export interface SegmentOption {
  key: string;
  label: string;
}

interface SegmentedTabsProps {
  options: SegmentOption[];
  value: string;
  onChange: (key: string) => void;
}

/**
 * Thanh chuyển hai mục, đặt trên dải gradient của header.
 *
 * Nền trắng bán trong suốt chứ không phải màu đặc: dải gradient chạy từ đậm sang
 * nhạt, một màu đặc sẽ hợp ở đầu này và chỏi ở đầu kia.
 *
 * Không đặt `lineHeight` cho nhãn. Chữ ở đây nằm trong khung không cuộn được nên
 * đã bị chặn cỡ; ghép chặn cỡ với lineHeight nới theo cỡ chữ thật sẽ hở khoảng
 * dòng ở mức 200%.
 */
export function SegmentedTabs({ options, value, onChange }: SegmentedTabsProps) {
  return (
    <View style={styles.thanh}>
      {options.map((option) => {
        const dangChon = option.key === value;

        return (
          <Pressable
            key={option.key}
            testID={`segment-${option.key}`}
            accessibilityRole="tab"
            accessibilityState={{ selected: dangChon }}
            onPress={() => {
              // Chạm lại mục đang chọn không có gì để đổi. Báo ra ngoài chỉ tổ
              // khiến chỗ gọi dựng lại danh sách không vì lý do gì.
              if (!dangChon) onChange(option.key);
            }}
            style={[styles.muc, dangChon ? styles.mucChon : null]}
          >
            <Text style={[styles.chu, dangChon ? styles.chuChon : null]} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  thanh: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: radius.pill,
    padding: spacing.xxs,
    gap: spacing.xxs,
  },
  muc: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  mucChon: { backgroundColor: colors.background },
  chu: { fontSize: fontSize.sm, fontWeight: '600', color: colors.onPrimary },
  chuChon: { color: colors.primary },
});
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/components/chat/__tests__/SegmentedTabs.test.tsx`
Expected: PASS — 4 test

- [ ] **Step 5: Viết test thất bại cho `ConversationRow`**

Tạo `src/components/chat/__tests__/ConversationRow.test.tsx`:

```tsx
import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { ConversationRow } from '../ConversationRow';
import type { DirectConversation, UserSummary } from '../../../lib/types';

function nguoi(id: string, ten: string): UserSummary {
  return { id, email: `${id}@wedo.vn`, fullName: ten };
}

const TOI = nguoi('u1', 'Đại');
const BAN = nguoi('u2', 'Tuấn');

function hoiThoai(unreadCount = 0): DirectConversation {
  return {
    id: 'c1',
    pairKey: 'u1:u2',
    createdAt: '2026-09-18T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
    unreadCount,
    participants: [
      { id: 'p1', userId: TOI.id, user: TOI },
      { id: 'p2', userId: BAN.id, user: BAN },
    ],
  };
}

describe('ConversationRow', () => {
  it('hiện tên người đối thoại, không phải tên mình', () => {
    const { getByText, queryByText } = render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(getByText('Tuấn')).toBeTruthy();
    expect(queryByText('Đại')).toBeNull();
  });

  it('hiện huy hiệu khi còn tin chưa đọc', () => {
    const { getByTestId } = render(
      <ConversationRow
        conversation={hoiThoai(3)}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId('unread-badge')).toBeTruthy();
  });

  it('không hiện huy hiệu khi đã đọc hết', () => {
    const { queryByTestId } = render(
      <ConversationRow
        conversation={hoiThoai(0)}
        currentUserId="u1"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(queryByTestId('unread-badge')).toBeNull();
  });

  it('hiện chấm online khi người kia đang kết nối', () => {
    const { getByTestId } = render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online
        onPress={jest.fn()}
      />,
    );

    expect(getByTestId('cham-online')).toBeTruthy();
  });

  it('báo ra ngoài khi được chạm', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u1"
        online={false}
        onPress={onPress}
      />,
    );

    fireEvent.press(getByTestId('conversation-row-c1'));

    expect(onPress).toHaveBeenCalled();
  });

  it('không dựng gì khi không tìm ra người đối thoại', () => {
    const { toJSON } = render(
      <ConversationRow
        conversation={hoiThoai()}
        currentUserId="u9"
        online={false}
        onPress={jest.fn()}
      />,
    );

    expect(toJSON()).toBeNull();
  });
});
```

- [ ] **Step 6: Chạy test, xác nhận thất bại**

Run: `npx jest src/components/chat/__tests__/ConversationRow.test.tsx`
Expected: FAIL — `Cannot find module '../ConversationRow'`

- [ ] **Step 7: Viết `src/components/chat/ConversationRow.tsx`**

```tsx
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '../ui/Card';
import { doiPhuong } from '../../lib/chat/doi-phuong';
import type { DirectConversation } from '../../lib/types';
import {
  colors,
  fontSize,
  radius,
  scaleWithFont,
  sizes,
  spacing,
} from '../../theme/tokens';

interface ConversationRowProps {
  conversation: DirectConversation;
  currentUserId: string;
  /** Người đối thoại có đang kết nối không. Lấy từ `onlineUserIds` của socket. */
  online: boolean;
  onPress: () => void;
}

/**
 * Một dòng trong danh sách tin nhắn riêng.
 *
 * Không dựng gì khi không tìm ra người đối thoại — tài khoản kia có thể vừa bị
 * xoá. Một dòng hỏng thì bỏ dòng đó, không được làm sập cả danh sách.
 */
export function ConversationRow({
  conversation,
  currentUserId,
  online,
  onPress,
}: ConversationRowProps) {
  const nguoiKia = doiPhuong(conversation, currentUserId);
  if (!nguoiKia) return null;

  const chuaDoc = conversation.unreadCount;
  const badgeLabel = chuaDoc > 99 ? '99+' : String(chuaDoc);

  return (
    <Card
      testID={`conversation-row-${conversation.id}`}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.row}>
        <View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {nguoiKia.fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
          {online ? <View testID="cham-online" style={styles.cham} /> : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1}>
            {nguoiKia.fullName}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {online ? 'Đang hoạt động' : nguoiKia.email}
          </Text>
        </View>

        {chuaDoc > 0 ? (
          <View testID="unread-badge" style={styles.badge}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm + 4 },
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: sizes.projectAvatar,
    height: sizes.projectAvatar,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  avatarText: { fontWeight: '700', fontSize: fontSize.lg, color: colors.primary },
  /* Viền cùng màu nền thẻ để chấm không dính vào avatar khi hai màu gần nhau. */
  cham: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: scaleWithFont(12),
    height: scaleWithFont(12),
    borderRadius: radius.pill,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.background,
  },
  body: { flex: 1, marginLeft: spacing.sm + 4 },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xxs },
  badge: {
    minWidth: scaleWithFont(24),
    minHeight: scaleWithFont(24),
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs + 2,
    marginLeft: spacing.sm,
  },
  badgeText: { color: colors.onPrimary, fontSize: fontSize.xs, fontWeight: '700' },
});
```

- [ ] **Step 8: Chạy test, xác nhận qua**

Run: `npx jest src/components/chat/__tests__/ConversationRow.test.tsx`
Expected: PASS — 6 test

- [ ] **Step 9: Gắn thanh chuyển và danh sách vào màn Trò chuyện**

Trong `src/app/(tabs)/chat/index.tsx`:

Thêm import:

```tsx
import { ConversationRow } from '../../../components/chat/ConversationRow';
import { SegmentedTabs } from '../../../components/chat/SegmentedTabs';
import { listConversations } from '../../../lib/api/direct-chat';
import { useSocket } from '../../../lib/socket/socket-context';
```

Thêm state và truy vấn, đặt cạnh `projectsQuery`:

```tsx
  const [muc, setMuc] = useState<'du-an' | 'tin-nhan'>('du-an');
  const { onlineUserIds } = useSocket();

  const conversationsQuery = useQuery({
    queryKey: ['direct-conversations'],
    queryFn: listConversations,
    // Chỉ gọi khi người dùng thật sự mở mục đó. Mục Dự án là mặc định, phần lớn
    // lượt mở app không chạm tới tin nhắn riêng.
    enabled: muc === 'tin-nhan',
  });
```

Trong `GradientHeader`, đặt `SegmentedTabs` **trên** ô tìm kiếm:

```tsx
        <SegmentedTabs
          options={[
            { key: 'du-an', label: 'Dự án' },
            { key: 'tin-nhan', label: 'Tin nhắn' },
          ]}
          value={muc}
          onChange={(key) => setMuc(key as 'du-an' | 'tin-nhan')}
        />
```

Ô tìm kiếm chỉ dựng khi `muc === 'du-an'` — nó lọc dự án, không lọc hội thoại. Bọc khối `<View style={styles.search}>` hiện có bằng `{muc === 'du-an' ? (...) : null}`, và thêm `marginTop: spacing.sm` cho `styles.search` để nó không dính vào thanh chuyển.

Trong thân màn, bọc `FlatList` dự án hiện có bằng `{muc === 'du-an' ? (...) : (...)}`, nhánh còn lại:

```tsx
          <FlatList
            data={conversationsQuery.data ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={conversationsQuery.isRefetching}
                onRefresh={() => conversationsQuery.refetch()}
                colors={[colors.primary]}
              />
            }
            renderItem={({ item }) => {
              const nguoiKia = item.participants.find(
                (participant) => participant.userId !== user?.id,
              );
              return (
                <ConversationRow
                  conversation={item}
                  currentUserId={user?.id ?? ''}
                  online={nguoiKia ? onlineUserIds.has(nguoiKia.userId) : false}
                  onPress={() => router.push(`/chat/dm/${item.id}`)}
                />
              );
            }}
            ListEmptyComponent={
              conversationsQuery.isLoading ? null : (
                <View style={styles.empty}>
                  <View style={styles.emptyIcon}>
                    <Ionicons
                      name="chatbubbles-outline"
                      size={28}
                      color={colors.primary}
                    />
                  </View>
                  <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</Text>
                  <Text style={styles.emptyBody}>
                    Mở một dự án rồi chạm vào tên thành viên để nhắn riêng cho họ.
                  </Text>
                </View>
              )
            }
          />
```

`styles.list`, `styles.empty`, `styles.emptyIcon`, `styles.emptyTitle` và `styles.emptyBody` đã có sẵn trong file — dùng lại, không khai thêm.

- [ ] **Step 10: Chạy typecheck và toàn bộ test**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

- [ ] **Step 11: Commit**

```bash
git add src/components/chat src/app/\(tabs\)/chat/index.tsx
git commit -m "feat(mobile): thanh chuyen Du an Tin nhan va danh sach hoi thoai"
```

---

### Task 6: Màn luồng tin nhắn riêng

**Files:**
- Modify: `src/components/chat/MessageBubble.tsx` (chỉ nới kiểu prop)
- Create: `src/app/(tabs)/chat/dm/[conversationId].tsx`
- Modify: `src/app/(tabs)/_layout.tsx`
- Modify: `src/app/(tabs)/chat/index.tsx`
- Test: `src/components/chat/__tests__/MessageBubble.test.tsx`

**Interfaces:**
- Consumes: `getDirectMessages`, `sendDirectMessage`, `markConversationRead` từ `src/lib/api/direct-chat`; `GradientHeader`; `ErrorBanner`.
- Produces: route `/chat/dm/:conversationId`; kiểu xuất khẩu `BongBongMessage` từ `src/components/chat/MessageBubble`.

**Hai chữ ký thật, đã đọc từ mã nguồn — không được đoán lại:**

```
MessageBubble   { message: ChatMessage; isMine: boolean; isPending?: boolean;
                  isFailed?: boolean; onLongPress: () => void; onRetry?: () => void }
MessageComposer { value: string; onChangeText: (v: string) => void;
                  onSend: () => void; sending?: boolean }
```

`MessageComposer` là controlled component — màn hình phải tự giữ `value`.
`MessageBubble` đang nhận `ChatMessage`, mà tin nhắn riêng có `sender` chứ không
có `author`, và thiếu cả `projectId` lẫn `workspaceId`. Phải nới kiểu trước khi
dùng lại được.

Sáu trường mà `MessageBubble` thật sự đọc tới: `id`, `content`, `createdAt`,
`deletedAt`, `author.fullName`, `task.title`. Bốn trong số đó là tuỳ chọn.

- [ ] **Step 1: Viết test thất bại cho kiểu prop đã nới**

Thêm vào `src/components/chat/__tests__/MessageBubble.test.tsx`:

```tsx
it('dựng được tin nhắn riêng, thứ không có projectId lẫn workspaceId', () => {
  const tinRieng = {
    id: 'd1',
    content: 'chào bạn',
    createdAt: '2026-09-18T12:00:00.000Z',
    author: { id: 'u2', email: 'u2@wedo.vn', fullName: 'Tuấn' },
  };

  const { getByText } = render(
    <MessageBubble message={tinRieng} isMine={false} onLongPress={jest.fn()} />,
  );

  expect(getByText('chào bạn')).toBeTruthy();
  expect(getByText('Tuấn')).toBeTruthy();
});
```

- [ ] **Step 2: Chạy typecheck, xác nhận thất bại**

Run: `npx tsc --noEmit`
Expected: FAIL — `tinRieng` thiếu `workspaceId`, `projectId`, `authorId`, `updatedAt` so với `ChatMessage`

- [ ] **Step 3: Nới kiểu prop của MessageBubble**

Trong `src/components/chat/MessageBubble.tsx`, thêm kiểu mới ngay trên
`interface MessageBubbleProps`:

```tsx
/**
 * Hình dạng tối thiểu mà bong bóng thật sự đọc tới.
 *
 * Trước đây nhận thẳng `ChatMessage`, nên không dựng được tin nhắn riêng — thứ
 * không có `projectId` lẫn `workspaceId` và gọi người gửi là `sender`. Component
 * chưa bao giờ đụng tới những trường ấy; bắt buộc phải có chúng chỉ là ràng buộc
 * thừa.
 *
 * `ChatMessage` thoả kiểu này về mặt cấu trúc, nên mọi chỗ gọi cũ không phải sửa
 * một dòng nào.
 */
export interface BongBongMessage {
  id: string;
  content: string;
  createdAt: string;
  deletedAt?: string | null;
  author?: UserSummary | null;
  task?: { title: string } | null;
}
```

Đổi dòng import kiểu ở đầu file thành:

```tsx
import type { UserSummary } from '../../lib/types';
```

(bỏ `ChatMessage` nếu sau thay đổi này không còn chỗ nào trong file dùng tới nó)

Rồi đổi trong `interface MessageBubbleProps`:

```tsx
  message: BongBongMessage;
```

- [ ] **Step 4: Chạy typecheck và test, xác nhận qua**

Run: `npx tsc --noEmit && npx jest src/components/chat/__tests__/MessageBubble.test.tsx`
Expected: typecheck không lỗi; toàn bộ test của MessageBubble qua

- [ ] **Step 5: Khai route ẩn khỏi thanh tab**

Trong `src/app/(tabs)/_layout.tsx`, thêm cạnh các dòng `href: null` sẵn có:

```tsx
      <Tabs.Screen name="chat/dm/[conversationId]" options={{ href: null }} />
```

Không khai thì expo-router dựng thêm một mục trên thanh tab.

- [ ] **Step 6: Viết màn hình**

Tạo `src/app/(tabs)/chat/dm/[conversationId].tsx`:

```tsx
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { MessageBubble } from '../../../../components/chat/MessageBubble';
import { MessageComposer } from '../../../../components/chat/MessageComposer';
import { ErrorBanner } from '../../../../components/ui/ErrorBanner';
import { GradientHeader } from '../../../../components/ui/GradientHeader';
import {
  getDirectMessages,
  markConversationRead,
  sendDirectMessage,
} from '../../../../lib/api/direct-chat';
import { useAuth } from '../../../../lib/auth/auth-context';
import { colors, spacing } from '../../../../theme/tokens';

export default function ManTinNhanRieng() {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { conversationId, ten } = useLocalSearchParams<{
    conversationId: string;
    ten?: string;
  }>();

  // MessageComposer là controlled component, màn hình giữ nội dung đang soạn.
  const [noiDung, setNoiDung] = useState('');

  const messagesQuery = useQuery({
    queryKey: ['direct-messages', conversationId],
    queryFn: () => getDirectMessages(conversationId),
    enabled: Boolean(conversationId),
  });

  const guiMutation = useMutation({
    mutationFn: (content: string) => sendDirectMessage(conversationId, content),
    onSuccess: () => {
      // Xoá ô soạn SAU khi máy chủ nhận. Xoá trước mà mạng hỏng thì người dùng
      // mất luôn câu vừa gõ và không có cách nào lấy lại.
      setNoiDung('');
      void queryClient.invalidateQueries({ queryKey: ['direct-messages', conversationId] });
      void queryClient.invalidateQueries({ queryKey: ['direct-conversations'] });
    },
  });

  /*
    Đánh dấu đã đọc khi mở, và mỗi lần có tin mới về trong lúc màn đang mở.
    Không làm thì huy hiệu chưa đọc vẫn sáng dù người dùng đang nhìn thẳng vào
    tin nhắn đó.
  */
  const soTin = messagesQuery.data?.length ?? 0;
  useEffect(() => {
    if (!conversationId || soTin === 0) return;

    void markConversationRead(conversationId)
      .then(() => queryClient.invalidateQueries({ queryKey: ['direct-conversations'] }))
      // Đánh dấu đã đọc hỏng không đáng làm phiền người dùng: họ vẫn đọc được
      // tin nhắn, và lượt mở sau sẽ thử lại.
      .catch(() => undefined);
  }, [conversationId, soTin, queryClient]);

  /*
    Đảo ngược để `inverted` của FlatList neo ở tin mới nhất, và đổi `sender`
    thành `author` — tên mà MessageBubble đọc.
  */
  const duLieu = useMemo(
    () =>
      [...(messagesQuery.data ?? [])]
        .reverse()
        .map((tin) => ({ ...tin, author: tin.sender ?? null })),
    [messagesQuery.data],
  );

  return (
    <View style={styles.man}>
      <GradientHeader title={ten ?? 'Tin nhắn'} onBack={() => router.back()} dense />

      <View style={styles.than}>
        {messagesQuery.isError && !messagesQuery.data ? (
          <ErrorBanner
            message={
              messagesQuery.error instanceof Error
                ? messagesQuery.error.message
                : 'Không tải được tin nhắn.'
            }
          />
        ) : null}

        {messagesQuery.isLoading && !messagesQuery.data ? (
          <ActivityIndicator style={styles.cho} size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={duLieu}
            inverted
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.danhSach}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isMine={item.senderId === user?.id}
                // Nhấn giữ để tạo công việc là tính năng của chat dự án. Tin
                // nhắn riêng chưa có hành động nào, nhưng prop là bắt buộc.
                onLongPress={() => undefined}
              />
            )}
          />
        )}
      </View>

      <MessageComposer
        value={noiDung}
        onChangeText={setNoiDung}
        onSend={() => guiMutation.mutate(noiDung.trim())}
        sending={guiMutation.isPending}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  man: { flex: 1, backgroundColor: colors.page },
  than: { flex: 1 },
  cho: { marginTop: spacing.xl },
  danhSach: { padding: spacing.md },
});
```

- [ ] **Step 7: Truyền tên người đối thoại khi điều hướng**

`GradientHeader` cần tiêu đề ngay, còn truy vấn tin nhắn không trả về tên người
kia. Truyền qua tham số đường dẫn.

Trong `src/app/(tabs)/chat/index.tsx`, sửa `onPress` của `ConversationRow`:

```tsx
                  onPress={() =>
                    router.push(
                      `/chat/dm/${item.id}?ten=${encodeURIComponent(nguoiKia?.user.fullName ?? '')}`,
                    )
                  }
```

- [ ] **Step 8: Chạy typecheck và toàn bộ test**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

Nếu `typedRoutes` báo đường dẫn không hợp lệ, khởi động lại `npx expo start` một
lần để expo-router sinh lại kiểu đường dẫn, rồi chạy typecheck lại.

- [ ] **Step 9: Commit**

```bash
git add "src/components/chat/MessageBubble.tsx" "src/components/chat/__tests__/MessageBubble.test.tsx" "src/app/(tabs)/chat/dm" "src/app/(tabs)/_layout.tsx" "src/app/(tabs)/chat/index.tsx"
git commit -m "feat(mobile): man luong tin nhan rieng"
```

---

### Task 7: Nhận tin nhắn riêng theo thời gian thực

**Files:**
- Modify: `src/lib/realtime/sync-rules.ts`
- Modify: `src/lib/realtime/use-realtime-sync.ts`
- Test: `src/lib/realtime/__tests__/sync-rules.test.ts`

**Interfaces:**
- Consumes: `keysToInvalidate` và kiểu `RealtimeEvent` hiện có.
- Produces: `RealtimeEvent` nhận thêm `'message:direct' | 'message:direct:updated' | 'read:direct'`.

Gateway tự cho người dùng vào mọi phòng `direct:*` ngay trong `handleConnection`, nên không cần gọi `join:direct` cho hội thoại cũ.

- [ ] **Step 1: Viết test thất bại**

Thêm vào `describe('keysToInvalidate', ...)` trong `src/lib/realtime/__tests__/sync-rules.test.ts`:

```ts
  it('tin nhắn riêng mới làm hỏng cả danh sách hội thoại lẫn luồng đang mở', () => {
    expect(keysToInvalidate('message:direct')).toEqual([
      ['direct-conversations'],
      ['direct-messages'],
    ]);
  });

  it('tin nhắn riêng sửa chỉ làm hỏng luồng', () => {
    expect(keysToInvalidate('message:direct:updated')).toEqual([['direct-messages']]);
  });

  it('đã đọc làm hỏng danh sách hội thoại để huy hiệu tắt đi', () => {
    expect(keysToInvalidate('read:direct')).toEqual([['direct-conversations']]);
  });
```

- [ ] **Step 2: Chạy test, xác nhận thất bại**

Run: `npx jest src/lib/realtime/__tests__/sync-rules.test.ts`
Expected: FAIL — lỗi kiểu, `'message:direct'` không gán được cho `RealtimeEvent`

- [ ] **Step 3: Mở rộng `sync-rules.ts`**

Sửa kiểu:

```ts
export type RealtimeEvent =
  | 'notification:new'
  | 'task:project:updated'
  | 'message:direct'
  | 'message:direct:updated'
  | 'read:direct';
```

Thêm ba nhánh vào `switch`:

```ts
    case 'message:direct':
      // Cả hai: danh sách để đẩy hội thoại lên đầu và cộng huy hiệu, luồng để
      // tin hiện ra nếu người dùng đang mở đúng hội thoại đó.
      return [['direct-conversations'], ['direct-messages']];
    case 'message:direct:updated':
      return [['direct-messages']];
    case 'read:direct':
      return [['direct-conversations']];
```

- [ ] **Step 4: Chạy test, xác nhận qua**

Run: `npx jest src/lib/realtime/__tests__/sync-rules.test.ts`
Expected: PASS

- [ ] **Step 5: Nghe ba sự kiện mới**

Trong `src/lib/realtime/use-realtime-sync.ts`, trong `useEffect` đang gắn listener, thêm:

```ts
    const onDirectMessage = () => invalidate('message:direct');
    const onDirectUpdated = () => invalidate('message:direct:updated');
    const onDirectRead = () => invalidate('read:direct');

    socket.on('message:direct', onDirectMessage);
    socket.on('message:direct:updated', onDirectUpdated);
    socket.on('read:direct', onDirectRead);
```

và trong hàm dọn dẹp trả về:

```ts
      socket.off('message:direct', onDirectMessage);
      socket.off('message:direct:updated', onDirectUpdated);
      socket.off('read:direct', onDirectRead);
```

Gỡ listener là bắt buộc. Bỏ qua thì mỗi lần kết nối lại chồng thêm một listener và một tin nhắn sinh nhiều lượt làm mới.

- [ ] **Step 6: Chạy typecheck và toàn bộ test**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

- [ ] **Step 7: Commit**

```bash
git add src/lib/realtime
git commit -m "feat(mobile): nhan tin nhan rieng theo thoi gian thuc"
```

---

### Task 8: Nghiệm thu trên máy thật

**Files:** không sửa file nào. Task này là cổng chất lượng trước khi lên bản build.

- [ ] **Step 1: Chạy toàn bộ cổng tự động**

Run: `npx tsc --noEmit && npx jest`
Expected: typecheck không lỗi; toàn bộ test qua

Lưu ý: lần chạy đầu trên máy tải nặng có thể có một hai test quá hạn 5 giây — chạy lại riêng bộ đó để phân biệt nhiễu với lỗi thật.

- [ ] **Step 2: Chạy app trên máy thật với hai tài khoản**

Run: `npx expo start`

Cần hai máy hoặc một máy và một máy ảo, đăng nhập hai tài khoản **chung một không gian làm việc** nhưng **chưa kết bạn** — đó chính là trường hợp Task 4 vừa mở ra.

- [ ] **Step 3: Đi hết danh sách nghiệm thu**

- [ ] Thanh chuyển "Dự án | Tin nhắn" hiện trên header, chạm đổi được qua lại
- [ ] Mục Tin nhắn hiện trạng thái rỗng đúng chữ khi chưa có hội thoại nào
- [ ] Tạo được hội thoại với người chung workspace mà không phải kết bạn
- [ ] Gửi tin ở máy A thì máy B thấy **ngay**, không cần kéo làm mới
- [ ] Huy hiệu số chưa đọc tăng ở máy B khi B không mở hội thoại đó
- [ ] Mở hội thoại ở máy B thì huy hiệu tắt
- [ ] Chấm xanh hiện khi người kia đang mở app, tắt sau khi họ thoát
- [ ] Dòng "+ Tạo không gian mới" hiện ở cuối sheet, kể cả khi chỉ có một không gian
- [ ] Tạo xong không gian mới thì Modal đóng và app chuyển sang không gian vừa tạo
- [ ] Mở sheet đổi không gian được từ cả ba tab Trò chuyện, Việc của tôi và Lịch

- [ ] **Step 4: Thử ở cỡ chữ hệ thống lớn nhất**

Bật cỡ chữ lớn nhất trong Cài đặt Android, mở lại app. Kiểm: nhãn thanh chuyển không bị cắt, tên trong dòng hội thoại không tràn, huy hiệu không xén chữ số.

Jest không dựng được bố cục thật nên bước này không thể thay bằng test.

- [ ] **Step 5: Ghi chú bàn giao**

Tạo `docs/superpowers/notes/2026-09-18-tin-nhan-rieng-ban-giao.md` ghi: những gì đã chạy được trên máy thật, những gì chưa thử, và bất cứ chỗ nào lệch so với kế hoạch này cùng lý do.

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/notes
git commit -m "docs: ghi chu nghiem thu tin nhan rieng dot 1"
```

---

## Không nằm trong kế hoạch này

Để sang kế hoạch đợt 2, sau 30/09:

- Kết bạn đầy đủ: màn `chat/friends.tsx`, tìm người, gửi lời mời, hộp lời mời đến và đã gửi, duyệt và từ chối
- Tệp đính kèm, cảm xúc, chuyển tiếp, thu hồi, tìm trong hội thoại, phân trang lịch sử
- `gop-hoi-thoai.ts` nêu trong spec — **bỏ hẳn**, không chuyển sang đợt 2.
  Task 7 làm mới bằng vô hiệu hoá khoá truy vấn, nên hàm gộp thủ công sẽ
  không có chỗ gọi. Viết ra là viết mã chết.
- Chỉ báo "đang gõ" cho tin nhắn riêng — `typing:direct` đã có ở gateway và `typing-state.ts` đã có ở mobile, nhưng nối vào cần thêm trạng thái cục bộ ở màn luồng, không đi qua react-query nên không thuộc Task 7

Tăng `versionCode` và `version` trong `app.json` làm một lần khi chuẩn bị build, không nằm trong task nào.
