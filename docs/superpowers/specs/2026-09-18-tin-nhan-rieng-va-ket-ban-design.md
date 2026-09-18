# Tin nhắn riêng và kết bạn trên mobile — thiết kế

Ngày 18/09/2026. Chủ dự án yêu cầu thêm ba tính năng vào WeDo mobile: kết bạn,
nhắn tin giữa bạn bè, và tạo thêm không gian làm việc.

## Vấn đề

Hai vấn đề chồng lên nhau, và cái thứ hai mới là lý do làm việc này bây giờ.

**Thiếu tính năng.** Backend đã có sẵn đầy đủ `friends` và `chat/direct` từ lâu,
web đang dùng, nhưng mobile chưa có dòng nào gọi tới. Người dùng mobile chỉ trò
chuyện được trong dự án.

**Chỉ số sử dụng gần bằng không.** Đơn xin phát hành công khai bị Google từ chối
hai lần (29/08 và 16/09), cùng một lý do "cần thử nghiệm thêm". Số liệu Play
Console ngày 18/09 giải thích vì sao:

| Chỉ số | Giai đoạn 21/08–17/09 |
|---|---|
| Người dùng đã cài đặt | 12–16, ổn định |
| Người dùng hoạt động hằng ngày | đỉnh 5, phần lớn ngày 0–2 |

12 người cài đủ, gần như không ai mở. App hiện chỉ chứa việc nhóm — không có gì
khiến một sinh viên mở nó ra vào buổi tối. Nhắn tin riêng là thứ tạo được lý do
đó, nên tính năng này vừa là yêu cầu sản phẩm vừa là cách gỡ mốc 30/09.

## Ràng buộc quyết định phạm vi

`ChatService.startDirectConversation` chặn cứng:

```ts
const friendship = await this.prisma.friendship.findUnique({ where: { pairKey } });
if (!friendship || friendship.status !== 'ACCEPTED') {
  throw new ForbiddenException('Hai người cần kết bạn trước khi bắt đầu trò chuyện riêng.');
}
```

Nghĩa là **kết bạn là điều kiện chặn của nhắn tin**, hai tính năng không độc
lập. Nếu giữ nguyên, đường đi của người thử nghiệm là: tìm người → gửi lời mời →
chờ duyệt → mới nhắn được câu đầu. Ba bước và một lần chờ trước khi thấy giá trị
nào — quá nhiều ma sát cho thứ đang cần kéo người dùng quay lại mỗi ngày.

Chủ dự án chốt **làm cả hai**: nới cho người chung workspace nhắn thẳng, đồng
thời vẫn làm kết bạn đầy đủ cho người ngoài workspace.

## Hướng đã chọn

Gộp vào tab **Trò chuyện** bằng một thanh chuyển, không thêm tab thứ sáu.

Hai hướng đã cân nhắc rồi loại:

- **Thêm tab "Tin nhắn"** — dễ thấy nhất, một chạm là tới, tốt cho DAU. Loại vì
  thanh tab đang có 5 mục và `sizes.tabBar` tính theo `theoBeRongVaCoChu(60)`;
  mục thứ sáu trên máy 360dp bật cỡ chữ lớn sẽ chật và cắt nhãn — đúng lớp lỗi
  mà đợt giao diện co giãn 14/08 vừa dọn xong.
- **Đặt trong tab Tài khoản** — nhanh nhất, không đụng gì đang chạy. Loại vì
  chôn sâu hai lớp thì gần như không ai tìm ra, mà mục tiêu số một là được mở.

## Kiến trúc

### Điều hướng

Thanh chuyển hai mục đặt ngay dưới header của `chat/index.tsx`, icon người trên
header mở màn Bạn bè.

| Route | Trạng thái |
|---|---|
| `(tabs)/chat/index.tsx` | Sửa — thêm thanh chuyển, hiện danh sách dự án **hoặc** danh sách hội thoại |
| `(tabs)/chat/[projectId].tsx` | Giữ nguyên |
| `(tabs)/chat/dm/[conversationId].tsx` | Mới — luồng tin nhắn riêng |
| `(tabs)/chat/friends.tsx` | Mới — bạn bè, lời mời đến, lời mời đã gửi, tìm người |

Hai màn mới khai `href: null` trong `(tabs)/_layout.tsx`, theo đúng cách repo
đang làm với `tasks/new` và `account/contributions`.

Thanh chuyển giữ trạng thái ở `useState` cục bộ, không đẩy vào URL. Người dùng
rời tab rồi quay lại thì về mặc định "Dự án" — đơn giản, và không sinh thêm một
nguồn sự thật nữa cạnh `expo-router`.

### `src/lib/api/friends.ts` — file mới

```
listFriends()                      → GET  /friends
searchUsers(query)                 → GET  /friends/search?query=
sendFriendRequest(targetUserId)    → POST /friends/requests
respondToRequest(id, accept)       → POST /friends/requests/:id/accept | /reject
```

`GET /friends` trả về ba nhóm trong một lượt gọi: `friends`, `incoming`,
`outgoing`. Giữ nguyên hình dạng đó thay vì tách ba query — máy chủ đã gom sẵn,
tách ra chỉ tốn thêm hai vòng mạng.

`searchUsers` trả chuỗi rỗng khi từ khoá dưới 2 ký tự, khớp với chặn phía máy
chủ, để không bắn lượt gọi chắc chắn trả về mảng rỗng.

### `src/lib/api/direct-chat.ts` — file mới

```
listConversations()                        → GET  /chat/direct/conversations
startConversation({ targetUserId })        → POST /chat/direct/conversations
getDirectMessages(conversationId)          → GET  /chat/direct/conversations/:id/messages
sendDirectMessage(conversationId, content) → POST /chat/direct/conversations/:id/messages
markConversationRead(conversationId)       → POST /chat/direct/conversations/:id/read
```

Dùng `/messages` chứ không `/history`. `/history` có phân trang bằng con trỏ và
cần cả hạ tầng cuộn ngược; v1 lấy phần gần nhất là đủ, thêm phân trang sau mà
không phải sửa gì ở tầng giao diện.

### `src/lib/types.ts` — thêm bốn kiểu

`Friendship`, `FriendsList`, `DirectConversation`, `DirectMessage`.

`DirectConversation` kèm `unreadCount` — máy chủ tính sẵn trong
`getDirectConversations`, không phải đếm lại ở máy.

### `src/lib/chat/` — hàm thuần, có test

- `doi-phuong.ts` — từ `DirectConversation` và id người đang đăng nhập, rút ra
  người đối thoại. Hội thoại trả về cả hai người tham gia, mọi chỗ hiển thị đều
  cần "người kia là ai"; để logic này rải trong component là lặp ba lần.
- `gop-hoi-thoai.ts` — chèn tin nhắn tới từ socket vào danh sách hội thoại, đẩy
  hội thoại đó lên đầu và cộng `unreadCount`. Tách ra để kiểm được mà không cần
  dựng socket thật.

`message-list.ts`, `local-id.ts`, `typing-state.ts` đã có sẵn và dùng lại nguyên.

### Backend — đúng một thay đổi

`startDirectConversation` trong `BE_WEDO/src/chat/chat.service.ts`:

```ts
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

Chỉ nới đường **tạo** hội thoại. Mọi đường đọc và gửi vẫn đi qua
`ensureDirectConversationParticipant` như cũ, nên không mở thêm lối vào dữ liệu
người khác.

Kèm `.spec.ts` phủ ba nhánh: đã kết bạn, chung workspace, không thuộc nhóm nào.

### Realtime

Gateway tự cho người dùng vào mọi phòng `direct:*` **ngay trong
`handleConnection`**, nên hội thoại cũ không cần gọi `join:direct`. Chỉ hội
thoại vừa tạo trong phiên hiện tại mới phải xin vào phòng.

Nghe thêm trong `use-realtime-sync.ts`:

| Sự kiện | Xử lý |
|---|---|
| `message:direct` | Làm mới danh sách hội thoại và luồng đang mở |
| `message:direct:updated` | Làm mới luồng đang mở |
| `read:direct` | Làm mới trạng thái đã đọc |
| `typing:direct` | Đưa vào `typing-state.ts` sẵn có |

`sync-rules.ts` đã là hàm thuần ánh xạ tên sự kiện sang query key cần vô hiệu
hoá; thêm bốn dòng vào đó, test đi kèm.

### Chấm online — sẵn có, chưa ai dùng

`socket-context.tsx` đã theo dõi `onlineUserIds` qua `presence:snapshot`,
`presence:online`, `presence:offline`. Không màn nào trong app đọc tới. Danh
sách hội thoại và màn Bạn bè đọc thẳng `Set` đó để chấm xanh — không thêm lượt
gọi mạng, không thêm trạng thái.

### Tạo thêm không gian làm việc

Phần nhỏ nhất trong ba yêu cầu, và gần như đã xong sẵn: `createWorkspace` có
trong `src/lib/api/workspaces.ts`, `CreateWorkspaceForm` có trong
`src/components/workspace/`, `WorkspaceProvider.create()` đã lưu id và chuyển
sang workspace mới. Thiếu đúng một thứ: **chỗ bấm**.

Hiện `CreateWorkspaceForm` chỉ xuất hiện ở màn onboarding khi người dùng chưa có
workspace nào. Có rồi thì không còn đường tạo thêm.

Thêm một dòng **"+ Tạo không gian mới"** ở cuối `WorkspaceSwitcher`, ngăn cách
với danh sách bằng một đường kẻ. Chạm vào thì đóng sheet và mở
`CreateWorkspaceForm` trong một `Modal`.

Đặt ở đây vì đó đã là chỗ người dùng tìm tới khi muốn đổi không gian — "tạo
thêm" là ý nghĩ liền kề. Và sau bản vá ngày 18/09, sheet này mở được từ cả ba
tab Trò chuyện, Việc của tôi và Lịch, nên không phải thêm lối vào ở đâu nữa.

Một thay đổi kèm theo: `coTheDoiWorkspace = workspaces.length > 1` đang chặn
không cho mở sheet khi người dùng chỉ có một workspace. Nay sheet còn mang chức
năng tạo mới, nên bỏ chặn — người có đúng một nhóm mới là người cần tạo thêm
nhất. Ba màn dùng cờ này phải sửa cùng lúc.

## Phạm vi lần giao này

Gồm cả hai đợt bên dưới. "Đợt 1" và "đợt 2" chỉ là thứ tự phát hành, không phải
hai mức phạm vi.

**Có:** gửi và nhận văn bản, nhận realtime, chỉ báo đang gõ, đếm chưa đọc, đánh
dấu đã đọc, chấm online, tạo hội thoại mới, kết bạn đầy đủ, tạo thêm không gian
làm việc.

**Để sau:** tệp đính kèm, cảm xúc, chuyển tiếp, thu hồi, tìm trong hội thoại,
phân trang lịch sử. Backend có sẵn cả — cắt ở tầng giao diện, thêm lúc nào cũng
được mà không phải sửa tầng API.

`MessageBubble` và `MessageComposer` dùng lại nguyên, không viết mới.

## Hai đợt phát hành

| Đợt | Nội dung | Mốc |
|---|---|---|
| 1 | Nhắn tin với người chung workspace, realtime, chấm online, nới điều kiện backend | Trước 30/09/2026 |
| 2 | Kết bạn đầy đủ: tìm người, gửi lời mời, hộp lời mời, duyệt và từ chối | Sau 30/09/2026 |

Đợt 1 tự đứng được: 12 người thử nghiệm đều chung một workspace, mở app là nhắn
nhau được ngay, không chờ ai duyệt. Đợt 2 không sửa lại gì của đợt 1, chỉ thêm
màn hình và mở rộng nguồn người đối thoại.

Chia đợt là để giảm rủi ro ra mắt, **không phải để cắt phạm vi** — cả hai đợt
đều nằm trong lần giao việc này.

## Rủi ro

**Sập app giữa đợt thử nghiệm.** Android vitals ghi lại mọi sự cố, và hồ sơ xin
phát hành có nhìn vào đó. Giảm thiểu bằng cách giữ v1 mỏng, dùng lại component
đã chạy ổn, và để `ErrorBoundary` ở `app/_layout.tsx` đỡ phần còn lại.

**Mốc 30/09 không kịp.** Phạm vi "làm cả hai" gần gấp đôi phương án tối thiểu.
Chia hai đợt là để đợt 1 vẫn ra kịp ngay cả khi đợt 2 trễ.

**Không ai nhắn.** Tính năng chạy đúng vẫn có thể không kéo nổi DAU nếu nhóm
không chuyển thói quen từ Zalo sang. Đây là rủi ro ngoài phạm vi kỹ thuật, xử lý
bằng trang hướng dẫn đã gửi cho người thử nghiệm.

## Kiểm thử

Theo đúng quy ước repo: hàm thuần và component có test, màn hình trong `(tabs)`
thì không.

- `src/lib/chat/__tests__/doi-phuong.test.ts`
- `src/lib/chat/__tests__/gop-hoi-thoai.test.ts`
- `src/lib/api/__tests__/friends.test.ts`
- `src/lib/api/__tests__/direct-chat.test.ts`
- `src/lib/realtime/__tests__/sync-rules.test.ts` — bổ sung bốn sự kiện mới
- Test cho hai component mới của danh sách hội thoại và dòng bạn bè
- `BE_WEDO` — `.spec.ts` cho ba nhánh của `startDirectConversation`

Cổng nghiệm thu mỗi đợt: `npx tsc --noEmit` sạch và toàn bộ bộ test qua.
