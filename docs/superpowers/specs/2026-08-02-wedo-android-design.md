# WeDo Android — Thiết kế bản 1

**Ngày:** 02/08/2026
**Trạng thái:** Chờ duyệt
**Mục tiêu:** Ứng dụng Android gốc cho WeDo, được Google Play duyệt, gồm ba tính năng.

---

## 1. Bối cảnh

WeDo giải quyết bài toán: nhóm sinh viên chốt việc trong chat rồi quên, deadline nằm rải rác trong tin nhắn. Sản phẩm đã chạy thật:

| Thành phần | Công nghệ | Nơi triển khai |
|---|---|---|
| Web app | React 19 + Vite 6 + Tailwind CSS 4 | Vercel |
| Backend | NestJS 11 + Prisma 7 + PostgreSQL (Supabase) | Azure Web App |
| Realtime | Socket.IO 4.8.1 | cùng host với API |

**API gốc:** biến môi trường `EXPO_PUBLIC_API_BASE_URL`. Routes nằm ở root, không có prefix `/api`. Đã kiểm chứng: `GET /health` trả `{"ok":true,"service":"wedo-api"}`; các route được bảo vệ trả 401 khi thiếu token.

**Xác thực:** JWT qua header `Authorization: Bearer <token>`, hạn 7 ngày, **không có refresh token**.

**Ngôn ngữ giao diện:** tiếng Việt. **Màu thương hiệu:** primary `#0055c7`. **Khẩu hiệu:** "Nghĩ ít hơn, làm nhiều hơn".

### Phạm vi

**Trong phạm vi:** Trò chuyện dự án và biến tin nhắn thành công việc · Việc của tôi · Thông báo · Màn hình tài khoản (bắt buộc để được Play duyệt).

**Ngoài phạm vi:** Kho tri thức · Cuộc họp · Lịch · Bảng điều khiển · Quản lý dự án · Thanh toán · Trang quản trị · Chat trực tiếp (direct message) · Đính kèm tệp trong chat · Bạn bè · Phản hồi.

---

## 2. Quyết định công nghệ

**Chọn: Expo SDK 57 (React Native 0.86) + TypeScript.**

### Lý do

| Yếu tố | Lập luận |
|---|---|
| EAS Build xuất AAB đã ký | Yêu cầu bắt buộc của Play. Máy phát triển là Windows chưa có Android Studio/JDK; EAS quản lý keystore trên cloud, tránh rủi ro mất keystore (mất keystore = mất app vĩnh viễn) |
| Target API 36 mặc định | RN 0.81+ mặc định `targetSdk 36`; Expo 57 dùng RN 0.86 → thoả deadline 31/08/2026 ngay từ đầu |
| `expo-notifications` | Giai đoạn 1 (local notification) và Giai đoạn 2 (FCM) dùng cùng thư viện, không phải viết lại |
| `expo-secure-store` | JWT nằm trong Android Keystore, không phải AsyncStorage. Ảnh hưởng trực tiếp tới khai báo Data safety |
| Tái sử dụng TypeScript | Types API, enum trạng thái, chuỗi tiếng Việt copy được từ `FE_WEDO/src/lib/api.ts` |

### Phản biện đã ghi nhận

React Native **không** phải React DOM. Không có `div`, Tailwind CSS 4 không chạy được, routing khác hoàn toàn, Flexbox mặc định `column`. Kỹ năng chuyển giao thực tế ~60–70%, không phải 100%.

Chọn React Native **không** miễn nhiễm chính sách minimum functionality. Một app RN chỉ render WebView vẫn bị từ chối y hệt. Google xét hành vi, không xét framework.

### Phương án bị loại

- **Kotlin + Compose** — chất lượng runtime tốt nhất, nhưng đội phải học ngôn ngữ mới; ~3–4× thời gian cho cùng 3 màn hình. Play không ưu ái app native hơn app RN.
- **Flutter** — tương đương kỹ thuật, nhưng Dart là ngôn ngữ mới và không tái sử dụng gì từ web app.
- **Capacitor/Ionic bọc web app** — vi phạm chính sách minimum functionality. Loại.

### Danh sách phụ thuộc

```
expo ~57
expo-router                    điều hướng file-based
@tanstack/react-query ^5       cache, refetch, persist offline
socket.io-client ^4            PHẢI là v4 — server chạy socket.io 4.8.1
expo-secure-store              lưu JWT
expo-notifications             local notification
expo-haptics                   phản hồi rung khi nhấn giữ
@gorhom/bottom-sheet           bottom sheet native
react-native-safe-area-context BẮT BUỘC — API 36 ép edge-to-edge
date-fns + locale vi           định dạng ngày tiếng Việt
```

**Styling:** `StyleSheet` + file design token (`theme/tokens.ts`). Không dùng NativeWind — nó cần babel transform và thường là thứ vỡ đầu tiên khi nâng SDK; với 3 tính năng thì lượng style không đủ nhiều để đánh đổi rủi ro đó trước deadline Play.

**Quản lý trạng thái:** TanStack Query cho dữ liệu server. React Context cho auth và socket. Không dùng Redux/Zustand — không đủ trạng thái toàn cục để cần.

---

## 3. Yêu cầu Google Play

Tra cứu ngày 02/08/2026. Nguồn ở mục 10.

### 3.1 Yêu cầu bắt buộc

| # | Yêu cầu | Chi tiết đã xác minh |
|---|---|---|
| 1 | Minimum functionality | App phải cho *"a stable, responsive, and engaging user experience"*. App thiếu *"the basic degree of adequate utility as mobile apps"* bị cấm. Có chính sách riêng **Webviews and Affiliate Spam** xử lý app đóng gói lại website |
| 2 | Privacy Policy | URL công khai bắt buộc. **Không điền được form Data safety nếu chưa có link này** |
| 3 | Data safety | Bắt buộc với mọi app. Khai sai → chặn update hoặc gỡ app |
| 4 | Xoá tài khoản | Bắt buộc **cả hai**: (a) *"a readily discoverable option to initiate app account deletion from within your app"*, (b) web resource, *"a link to this web resource must be entered in the designated URL form field within Play Console"*. Vô hiệu hoá/đóng băng **không** tính là xoá |
| 5 | Closed testing | Tài khoản cá nhân tạo sau 13/11/2023: **12 người opt-in liên tục 14 ngày**. Rời ra rồi vào lại **không cộng dồn** — đồng hồ reset. Sau đó xin production access, review ~7 ngày |
| 6 | AAB đã ký | Kèm Play App Signing: ký bằng upload key, Google ký lại bằng app signing key |
| 7 | Target API level | **Từ 31/08/2026**: app mới và bản cập nhật phải target **Android 16 = API level 36**. Gia hạn được tới 01/11/2026 |
| 8 | Content rating (IARC) | Thông báo 15/07/2026: *"Unrated apps are not permitted on Google Play"*. Phải khai có user-generated content |
| 9 | App access | App có login **bắt buộc** khai tài khoản demo trong Play Console |
| 10 | Developer verification | Thông báo 15/07/2026: mọi app trên Play phải được đăng ký trong Play Console. Deadline **30/09/2026** |

### 3.2 Bẫy kỹ thuật: quyền báo thức chính xác

`USE_EXACT_ALARM` bị giới hạn cho app mà **chức năng lõi** là đồng hồ báo thức/hẹn giờ/lịch. App không đạt tiêu chí *"will be disallowed from publishing on Google Play"*. WeDo là app quản lý công việc → **không đủ điều kiện**.

**Quyết định:** dùng **inexact alarm** (mặc định của `expo-notifications`). Không khai `USE_EXACT_ALARM` và không khai `SCHEDULE_EXACT_ALARM`.

**Đánh đổi được chấp nhận:** dưới Doze mode, thông báo có thể trễ vài phút đến vài giờ. Đây là lập luận kỹ thuật cho Giai đoạn 2 (FCM).

### 3.3 Chính sách AI — không áp dụng

Đã kiểm tra chính sách AI-Generated Content. Phần loại trừ ghi rõ: *"Productivity apps that use AI to improve an existing feature, such as email apps with AI-suggested email drafts"*. WeDo rơi đúng vào diện loại trừ → **không bắt buộc** nút báo cáo nội dung AI.

**Vẫn làm:** nút "Đề xuất này không đúng" trên bottom sheet đề xuất. Rẻ, cải thiện sản phẩm, và là bảo hiểm nếu reviewer diễn giải khác.

### 3.4 Phân chia công việc

**Việc code:**

- Cấu hình target API 36 + xử lý edge-to-edge bằng safe-area
- Màn hình xoá tài khoản trong app (mục 6)
- Link Privacy Policy mở bằng trình duyệt hệ thống
- Xin quyền `POST_NOTIFICATIONS` (Android 13+) đúng thời điểm — sau khi user thấy giá trị, không xin ngay lần mở đầu
- Audit `AndroidManifest.xml` trong AAB đã build, gỡ quyền thừa
- Cấu hình EAS Build → AAB đã ký
- Empty state cho mọi màn hình
- Soạn bản nháp Privacy Policy (nội dung)
- Lập bảng trả lời Data safety từng ô, khớp với code thật

**Việc chủ dự án tự làm:**

| Việc | Chi phí | Thời gian |
|---|---|---|
| Mở Play Console + xác minh danh tính | $25 một lần | 1–3 ngày, cá biệt 1 tuần |
| Đăng Privacy Policy lên URL công khai (Vercel) | 0 | 1 giờ |
| Làm trang web xoá tài khoản + điền URL vào Console | 0 | 1–2 giờ |
| Điền form Data safety theo bảng ở mục 8 | 0 | 30 phút |
| Bảng hỏi Content rating IARC | 0 | 15 phút |
| Tạo tài khoản demo **có sẵn dữ liệu** + khai App access | 0 | 1 giờ |
| Ảnh store: icon 512×512, feature graphic 1024×500, ≥2 screenshot, mô tả ngắn ≤80 ký tự, mô tả đầy đủ ≤4000 | 0 | 2–4 giờ |
| Gom **15–16** người thử nghiệm (dư 3–4 người làm biên an toàn) | 0 | Gom 2–5 ngày. Chờ **14 ngày ròng, không nén được** |
| Xin production access + chờ review | 0 | tới 7 ngày |
| Kiểm tra trạng thái developer verification | 0 | 15 phút |

**Đường găng từ lúc có AAB đầu tiên đến khi công khai: 4–5 tuần.** Nhanh nhất lý thuyết 3 tuần nếu không bị từ chối lần nào.

**Khuyến nghị thứ tự:** mở Play Console và bắt đầu gom testers **song song với lúc code**, không phải sau khi code xong. 14 ngày chờ là thời gian chết không nén được.

---

## 4. Hợp đồng API đã kiểm chứng

Đọc trực tiếp từ `BE_WEDO/src` và `FE_WEDO/src/lib/api.ts`. Mọi request cần header `Authorization: Bearer <token>` trừ đăng nhập/đăng ký.

### 4.1 Kiểu dữ liệu

```ts
type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
type TaskAssignmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type NotificationType =
  | 'TASK_ASSIGNED' | 'TASK_ACCEPTED' | 'TASK_REJECTED'
  | 'TASK_SUBMITTED' | 'TASK_REVIEW_APPROVED' | 'TASK_REVIEW_REJECTED'
  | 'TASK_DEADLINE_REMINDER' | 'MEETING_SCHEDULED'
  | 'SUBSCRIPTION_RENEWAL_DUE' | 'PAYMENT_CONFIRMED';

interface ChatTaskSuggestion {
  hasTask: boolean;
  title: string;
  description?: string;
  assigneeHint?: string;
  assigneeId?: string;
  assigneeName?: string;
  dueDate?: string;     // 'YYYY-MM-DD'
  dueTime?: string;     // 'HH:mm'
  confidence: 'low' | 'medium' | 'high';
  reason?: string;
  model?: string;
}
```

Kiểu `Task`, `NotificationItem`, `UserSummary`, `ChatMessage`, `Project`, `Workspace` copy nguyên từ `FE_WEDO/src/lib/api.ts` (dòng 6–341), lược bỏ trường của tính năng ngoài phạm vi.

### 4.2 Endpoint sử dụng

**Xác thực**
```
POST /auth/register   { email, password, fullName, phone?, dob?, avatarUrl? }
                      → { message, user: {id,email,fullName,avatarUrl,platformRole}, accessToken }
POST /auth/login      { email, password }  → như trên
GET  /users/me        → UserProfile
```
Mật khẩu tối thiểu 6 ký tự (`RegisterDto`). Thông báo lỗi validation từ server đã là tiếng Việt — hiển thị nguyên văn.

**Workspace và dự án**
```
GET  /workspaces                    → Workspace[]
POST /workspaces  { name, description? }  → Workspace
GET  /projects?workspaceId=         → Project[]   (workspaceId TUỲ CHỌN)
```

**Chat**
```
GET   /projects/:projectId/chat                   → ChatMessage[]
GET   /projects/:projectId/chat/history?before=&limit=
                                                  → { items: ChatMessage[], nextCursor?: string|null }
POST  /projects/:projectId/chat  { content, replyToId? }  → ChatMessage
GET   /projects/:projectId/chat/unread-count
POST  /projects/:projectId/chat/read
POST  /projects/:projectId/chat/:messageId/ai-task-suggestion
                                   header: Idempotency-Key: <uuid>
                                                  → ChatTaskSuggestion
PATCH /projects/:projectId/chat/:messageId/task   { taskId }  → ChatMessage
```

**Công việc**
```
GET   /tasks?workspaceId=&projectId=   → Task[]
POST  /tasks   { title, description?, status?, dueDate?, workspaceId, projectId?, assigneeId? }  → Task
GET   /tasks/:id                       → Task
PATCH /tasks/:id                       → Task
POST  /tasks/:id/accept                → Task
POST  /tasks/:id/reject  { reason }    → Task     reason BẮT BUỘC, ≥3 ký tự
```

**Thông báo**
```
GET   /notifications              → NotificationItem[]
GET   /notifications/unread-count
GET   /notifications/preferences  → { notifyTaskAssignment, notifyTaskReview,
                                      notifyDeadlineReminder, notifyMeeting }
PATCH /notifications/preferences
PATCH /notifications/:id/read
POST  /notifications/read-all
```

### 4.3 Sai lệch so với mô tả ban đầu

| # | Mô tả ban đầu | Thực tế |
|---|---|---|
| 1 | `PATCH /chat/:messageId/task` tạo công việc | Chỉ nhận `{taskId}` — **gắn** task đã tồn tại. Phải gọi `POST /tasks` trước |
| 2 | — | `ai-task-suggestion` nhận header `Idempotency-Key` |
| 3 | `/chat/history` trả mảng | Trả `{ items, nextCursor }` |
| 4 | `/tasks/:id/reject` không có body | **Bắt buộc** `{reason}` ≥3 ký tự |
| 5 | — | `POST /tasks` không có trong danh sách ban đầu nhưng tồn tại và bắt buộc phải dùng |
| 6 | `/auth/google` | Nhận **Google OAuth access token**, kiểm `aud === GOOGLE_CLIENT_ID` (một client ID duy nhất). Không dùng ở bản 1 |

### 4.4 Socket.IO

Server chạy `socket.io@4.8.1` → client **phải** là `socket.io-client@4`. Xác thực bằng JWT.
Sự kiện dùng ở bản này: `join:project`, `typing:project`, `presence:online`, `presence:offline`, `presence:snapshot`.
Bỏ qua: `join:direct`, `typing:direct` (chat trực tiếp ngoài phạm vi).

---

## 5. Kiến trúc màn hình

### 5.1 Luồng khởi động

```
Mở app
  └─ Splash: đọc JWT từ SecureStore
       ├─ Không có token ──────────────────► (auth)/login
       └─ Có token → GET /users/me
            ├─ 401 → xoá token ────────────► (auth)/login
            └─ 200 → GET /workspaces
                 ├─ mảng rỗng ─────────────► (onboarding)/create-workspace
                 │                            POST /workspaces
                 └─ có workspace ──────────► (tabs)
                      lưu activeWorkspaceId vào SecureStore
```

**Interceptor toàn cục:** mọi phản hồi 401 → xoá token → về login. Cần thiết vì JWT hết hạn sau 7 ngày và không có refresh token.

**Bản 1 chỉ dùng email/mật khẩu.** Không có nút đăng nhập Google — tránh rủi ro SHA-1 / Play App Signing / client ID mismatch, những thứ chỉ vỡ đúng lúc lên production. Bổ sung ở bản 1.1 sau khi app đã được duyệt.

### 5.2 Cây điều hướng

```
app/
  _layout.tsx                    AuthProvider · QueryClientProvider · SocketProvider
  index.tsx                      splash + redirect
  (auth)/
    login.tsx
    register.tsx
  (onboarding)/
    create-workspace.tsx
  (tabs)/
    _layout.tsx                  4 tab, badge số chưa đọc
    chat/index.tsx               [TÍNH NĂNG 1] danh sách dự án
    chat/[projectId].tsx         [TÍNH NĂNG 1] khung chat + nhấn giữ
    tasks/index.tsx              [TÍNH NĂNG 2] việc của tôi
    tasks/[taskId].tsx           [TÍNH NĂNG 2] chi tiết công việc
    notifications/index.tsx      [TÍNH NĂNG 3] thông báo
    account/index.tsx            [TUÂN THỦ PLAY] tài khoản
  account/
    notification-settings.tsx
    delete-account.tsx           [BẮT BUỘC ĐỂ ĐƯỢC DUYỆT]
```

**Thanh tab:** Trò chuyện · Việc của tôi · Thông báo (badge) · Tài khoản

Tab thứ tư là **quyết định do chính sách chi phối**: Play yêu cầu đường dẫn xoá tài khoản *"readily discoverable"*. Chôn sau icon bánh răng ở header là mời gọi bị từ chối.

### 5.3 Tính năng 1 — Chat và biến tin nhắn thành công việc

**`chat/index.tsx`** — `GET /projects?workspaceId=`. Mỗi dòng: tên dự án, badge chưa đọc.

*Hiệu năng:* `/chat/unread-count` là per-project → N+1 request. Gọi song song giới hạn tối đa 6 request đồng thời, chỉ cho dòng đang hiển thị.

**`chat/[projectId].tsx`**
- `GET /chat` tải ban đầu; `GET /chat/history?before=&limit=` cuộn lên vô hạn dùng `nextCursor`
- `POST /chat` gửi tin, optimistic UI: tin hiện ngay ở trạng thái mờ, xác nhận khi server trả về, hiện nút thử lại nếu lỗi
- Socket.IO: `join:project` khi vào, rời khi ra; nhận tin mới, `typing:project`, presence
- `POST /chat/read` khi màn hình được focus
- `FlatList` inverted

**Luồng nhấn giữ → công việc** (ba bước API):

```
Nhấn giữ tin nhắn (expo-haptics)
  → Bottom sheet: "Tạo công việc từ tin nhắn này"
  → POST /chat/:messageId/ai-task-suggestion
       header Idempotency-Key: uuid sinh MỘT LẦN cho mỗi tin nhắn,
       giữ nguyên khi thử lại → mạng chập chờn không gây gọi AI hai lần
  → Skeleton loading
  → Sheet đề xuất, TẤT CẢ trường đều sửa được:
       Tiêu đề         [____________]
       Người phụ trách [chọn ▾]  ← mặc định assigneeId nếu AI trả về
       Hạn chót        [date picker native]
       + "Đề xuất này không đúng"  (mục 3.3)
  → "Tạo công việc":
       POST /tasks { title, description, workspaceId, projectId,
                     assigneeId?, dueDate? }
       PATCH /chat/:messageId/task { taskId: created.id }
  → Toast + nút "Xem công việc" → tasks/[id]
```

*Xử lý lỗi:* nếu `POST /tasks` thành công nhưng `PATCH .../task` thất bại, công việc **đã được tạo**. Báo cho người dùng đúng sự thật ("Đã tạo công việc nhưng chưa gắn được vào tin nhắn") và cho thử lại chỉ bước gắn. Không âm thầm nuốt lỗi, không tạo task trùng.

*Khi `hasTask === false`:* hiện thông báo "Tin nhắn này có vẻ không chứa công việc" nhưng **vẫn cho tạo thủ công**.

### 5.4 Tính năng 2 — Việc của tôi

`GET /tasks?workspaceId=` rồi lọc client-side `assigneeId === me`. API chỉ hỗ trợ filter `workspaceId` và `projectId` — không bịa thêm query param.

Nhóm theo hạn chót: **Quá hạn** → **Hôm nay** → **Tuần này** → **Sau đó** → **Không có hạn**.

Công việc `assignmentStatus === 'PENDING'` ghim đầu danh sách với hai nút:
- **Nhận** → `POST /tasks/:id/accept`
- **Từ chối** → mở ô nhập lý do (bắt buộc ≥3 ký tự) → `POST /tasks/:id/reject { reason }`

**`tasks/[taskId].tsx`** — `GET /tasks/:id`. Đổi trạng thái qua `PATCH /tasks/:id { status }` giữa `TODO`/`IN_PROGRESS`/`REVIEW`/`DONE`. Hiện lý do từ chối nếu có. Link ngược về tin nhắn gốc nếu `chatMessages` không rỗng.

### 5.5 Tính năng 3 — Thông báo

- `GET /notifications` — chạm để `PATCH /:id/read` + điều hướng theo `taskId`/`projectId`
- `GET /notifications/unread-count` — badge tab, refetch khi app trở lại foreground
- `POST /notifications/read-all` — nút "Đánh dấu tất cả đã đọc"
- `notification-settings.tsx` — `GET`/`PATCH /notifications/preferences`. Ẩn `notifyMeeting` vì Cuộc họp ngoài phạm vi

**Nhắc hạn chót cục bộ (Giai đoạn 1, không đụng backend):**

Sau mỗi `GET /tasks` thành công:
1. Lọc công việc của mình, có `dueDate`, `status !== 'DONE'`, `assignmentStatus !== 'REJECTED'`
2. Huỷ toàn bộ lịch cũ, lên lịch lại (đơn giản hơn diff, và số lượng nhỏ)
3. Mỗi công việc: một nhắc trước 24 giờ + một nhắc đúng giờ hạn; bỏ qua mốc đã qua
4. Giới hạn 60 lịch, ưu tiên hạn gần nhất
5. Dùng **inexact alarm** (mục 3.2)

Chỉ lên lịch khi `notifyDeadlineReminder === true` trong preferences.

Xin quyền `POST_NOTIFICATIONS` **lần đầu người dùng mở tab Thông báo**, kèm màn hình giải thích lý do trước khi gọi hộp thoại hệ thống. Không xin ở lần mở app đầu tiên.

### 5.6 Màn hình Tài khoản

- Hồ sơ từ `GET /users/me`
- Cài đặt thông báo
- **Chính sách bảo mật** → mở URL công khai bằng trình duyệt hệ thống
- Đăng xuất
- **Xoá tài khoản** → `account/delete-account.tsx` (mục 6)

### 5.7 Tầng dữ liệu

```
lib/api/client.ts       fetch wrapper · base URL từ app.config
                        gắn Bearer · 401 toàn cục → đăng xuất
lib/api/{auth,workspaces,projects,chat,tasks,notifications,account}.ts
lib/socket.ts           socket.io-client v4, auth JWT, tự reconnect
lib/notifications/scheduler.ts
lib/query.ts            QueryClient + persist AsyncStorage
theme/tokens.ts         màu, khoảng cách, kiểu chữ
```

Cache đọc được persist xuống đĩa → mở app có nội dung ngay, không màn trắng. Quan trọng với reviewer test trên mạng chập chờn.

**Không hardcode bí mật.** API base URL đưa qua `EXPO_PUBLIC_API_BASE_URL`. Không có khoá, token, mật khẩu, chuỗi kết nối nào trong mã nguồn.

---

## 6. Thay đổi backend — đã được duyệt về hướng, chờ duyệt chi tiết

**Bắt buộc để được Play duyệt.** Backend hiện không có endpoint xoá tài khoản và không có chức năng chuyển quyền sở hữu workspace.

### 6.1 Vấn đề: cascade phá dữ liệu nhóm

`prisma/schema.prisma:221`:
```prisma
owner User @relation("WorkspaceOwner", fields: [ownerId], references: [id], onDelete: Cascade)
```

`prisma.user.delete()` sẽ **xoá luôn toàn bộ workspace người đó sở hữu**, kéo theo cascade tất cả Project, Task, ChatMessage **của cả nhóm**, Meeting, Event.

Kịch bản thật: sinh viên tạo workspace cho nhóm đồ án, 5 bạn cùng dùng. Bạn đó xoá tài khoản → cả nhóm mất sạch dữ liệu, không ai được cảnh báo.

`PaymentOrder.user` cũng là `Cascade` (dòng 766) — xoá tài khoản là xoá chứng từ thanh toán.

### 6.2 Quyết định

**Chặn việc xoá cho tới khi chuyển xong quyền sở hữu.** Workspace chỉ có một mình người đó thì xoá luôn cùng tài khoản. Play chấp nhận vì tài khoản **vẫn bị xoá thật** sau khi chuyển quyền.

### 6.3 Phạm vi thay đổi

| File | Thay đổi | Ước lượng |
|---|---|---|
| `src/users/users.controller.ts` | thêm `GET me/deletion-blockers` và `DELETE me` | ~12 dòng |
| `src/users/users.service.ts` | `getDeletionBlockers()` + `deleteMe()` | ~90 dòng |
| `src/workspaces/workspaces.controller.ts` | thêm `PATCH :id/owner` | ~6 dòng |
| `src/workspaces/workspaces.service.ts` | `transferOwnership()` | ~40 dòng |
| `src/workspaces/dto/transfer-ownership.dto.ts` | mới | ~6 dòng |
| `prisma/schema.prisma` | `PaymentOrder.userId` → nullable, `onDelete: SetNull` | cần migration |

Không đụng module nào khác. Không đụng chat, tasks, notifications, auth.

**Hợp đồng:**
```
GET   /users/me/deletion-blockers
      → { blockingWorkspaces: [{ id, name, memberCount,
                                 members: [{ id, fullName, email }] }] }

PATCH /workspaces/:id/owner   { newOwnerId }   → Workspace
      chỉ chủ sở hữu hiện tại gọi được; newOwnerId phải là thành viên

DELETE /users/me
      409 nếu còn blockingWorkspaces
      200 → { ok: true }
```

**Dữ liệu giữ lại:** `PaymentOrder` được giữ với `userId = null` (chứng từ kế toán). Play cho phép với lý do "regulatory compliance" **và phải nêu rõ trong privacy policy**.

**Trang web xoá tài khoản** (yêu cầu #4b của Play): thêm route công khai trên web app Vercel, ví dụ `/xoa-tai-khoan`, cho người dùng đăng nhập rồi xoá, hoặc gửi yêu cầu xoá kèm email. URL này điền vào Play Console.

> **Cổng duyệt:** chưa đụng file backend nào cho tới khi chủ dự án duyệt mục 6.3.

---

## 7. Rủi ro bị từ chối

| # | Rủi ro | Mức | Phòng ngừa |
|---|---|---|---|
| 1 | Reviewer không qua được màn đăng nhập | 🔴 | Tài khoản demo trong App access: **không hết hạn, không 2FA**, và **nạp sẵn dữ liệu**: 1 workspace, 2 dự án, 20–30 tin nhắn tiếng Việt giống chốt việc thật, 5–8 công việc đủ trạng thái (1 chờ nhận, 1 quá hạn), 5+ thông báo chưa đọc. Tài khoản demo trống còn tệ hơn không có |
| 2 | Không có đường dẫn xoá tài khoản | 🔴 | Mục 6 |
| 3 | Bị đánh giá là app mỏng | 🟠 | Tương tác native thật: nhấn giữ + haptic, bottom sheet native, date picker hệ thống, pull-to-refresh, optimistic send, badge tab, local notification, đọc offline. **Không có WebView. Không có nút "Mở trang web WeDo" ở vị trí nổi bật** |
| 4 | Data safety khai không khớp code | 🟠 | Lập bảng mục 8 **sau khi code xong**, đối chiếu từng dòng |
| 5 | Xin quyền nhạy cảm thừa | 🟠 | Giải nén AAB, đọc `AndroidManifest.xml` **thật** trước khi upload. Tin file build ra, không tin file cấu hình |
| 6 | 12 testers không đủ 14 ngày liên tục | 🟡 | Rủ 15–16 người. Giải thích họ chỉ cần **giữ nguyên opt-in**, không cần dùng app hằng ngày. Không thêm/bớt giữa chừng |
| 7 | Vỡ UI dưới edge-to-edge API 36 | 🟡 | `react-native-safe-area-context` mọi màn hình. Test trên emulator Android 16 thật |
| 8 | Local notification trễ do Doze | 🟡 | Chấp nhận ở GĐ1. Không dùng exact alarm (mục 3.2). Nêu rõ trong mô tả tính năng |

---

## 8. Bảng khai Data safety (dự kiến)

Chốt lại sau khi code xong, đối chiếu code thật.

| Loại dữ liệu | Thu thập | Chia sẻ | Bắt buộc | Mục đích |
|---|---|---|---|---|
| Email | Có | Không | Có | Quản lý tài khoản, xác thực |
| Tên | Có | Không | Có | Quản lý tài khoản |
| Số điện thoại | Có | Không | Không | Quản lý tài khoản |
| Tin nhắn trong app | Có | Không | Có | Chức năng app |
| Hoạt động trong app | Có | Không | Có | Chức năng app |

**Mã hoá khi truyền:** Có (HTTPS)
**Cho phép yêu cầu xoá dữ liệu:** Có
**Target audience:** 13+ — **không** khai trẻ em

---

## 9. Kế hoạch kiểm chứng

Không tuyên bố "đã xong" khi chưa chạy thử. Mỗi phần phải có bằng chứng:

| Hạng mục | Cách kiểm chứng |
|---|---|
| Gọi API | Chạy trên thiết bị thật với tài khoản thật, kèm ảnh chụp màn hình |
| Target API 36 | Giải nén AAB, đọc `AndroidManifest.xml`, dẫn ra dòng `targetSdkVersion` |
| Quyền | Danh sách quyền thật trong AAB đã build |
| Local notification | Đặt hạn chót cách 2 phút, chờ, chụp thông báo hiện ra |
| Edge-to-edge | Ảnh chụp trên emulator Android 16 |
| AAB đã ký | Output EAS Build, kiểm chữ ký |

---

## 10. Nguồn tra cứu

- [Target API level requirements](https://support.google.com/googleplay/android-developer/answer/11926878)
- [App testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- [App account deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111)
- [User Data policy](https://support.google.com/googleplay/android-developer/answer/13316080)
- [Data safety section](https://support.google.com/googleplay/android-developer/answer/10787469)
- [Functionality, Content, and User Experience](https://support.google.com/googleplay/android-developer/answer/9898783)
- [AI-Generated Content policy](https://support.google.com/googleplay/android-developer/answer/14094294)
- [Policy announcement: July 15, 2026](https://support.google.com/googleplay/android-developer/answer/17134731)
- [Understanding Android developer verification](https://support.google.com/android-developer-console/answer/16561738)
- [Schedule exact alarms are denied by default](https://developer.android.com/about/versions/14/changes/schedule-exact-alarms)
- [Expo SDK 57 changelog](https://expo.dev/changelog/sdk-57)

---

## 11. Việc để lại về sau

**Giai đoạn 2 — thông báo đẩy thật (cần duyệt riêng):** bảng lưu device token, tích hợp FCM v1, đẩy từ server khi cron sinh `TASK_DEADLINE_REMINDER`. Trình bày phạm vi và chờ duyệt khi tới lúc.

**Bản 1.1:** đăng nhập Google (cần backend nhận nhiều client ID, cộng đăng ký SHA-1 của cả upload key lẫn Play App Signing key).
