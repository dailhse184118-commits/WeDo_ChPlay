# Bàn giao: kết bạn, avatar và gửi ảnh (1.0.11 → 1.0.12)

Ngày 18/09/2026.

## Đã làm

### Kết bạn (mobile)

- `src/lib/api/friends.ts` — bốn lượt gọi: danh sách, tìm người, gửi lời mời,
  duyệt/từ chối. Từ khoá dưới 2 ký tự trả mảng rỗng mà không gọi máy chủ.
- `src/lib/friends/quan-he.ts` — `trangThaiKetBan` quyết định hiện nút gì.
  `REJECTED` cố ý coi như chưa có gì: máy chủ dùng `upsert` nên gửi lại được.
- `src/lib/friends/danh-sach.ts` — đổi `GET /friends` thành ba nhóm dòng.
  Dòng nào không xác định được người kia thì bỏ, không làm sập cả màn.
- `src/components/friends/FriendRow.tsx` — một component cho cả bốn trạng thái.
- `src/app/(tabs)/chat/friends.tsx` — màn Bạn bè.
- `src/lib/use-debounced-value.ts` — ô tìm kiếm chờ người dùng ngừng gõ 300ms.

Lối vào: nút hình người trên header màn Trò chuyện, kèm chấm đỏ khi có lời mời
đang chờ duyệt. Không có chấm thì lời mời nằm im và không ai vào xem.

### Sửa lỗi realtime tin nhắn riêng (backend)

`BE_WEDO` commit `c0f7c69`, đã đẩy lên nhánh `backend`.

Socket chỉ được cho vào phòng `direct:<id>` đúng một lần, lúc kết nối. Hội
thoại sinh ra sau đó thì **cả hai bên đều đứng ngoài phòng**, nên tin nhắn đầu
tiên của mọi cuộc trò chuyện mới không tới được ai — người nhận phải kéo làm
mới bằng tay mới thấy. Đúng ngay luồng "kết bạn rồi nhắn tin cho nhau".

Vá bằng cách bắn kèm vào phòng `user:<id>`: phòng này tham gia ngay lúc kết nối
và không bao giờ hết hạn.

### Sửa bẫy trong bộ test

RNTL 14 trên React 19 mở một `act()` bất đồng bộ mỗi lần bắn sự kiện. Hai lần
`fireEvent` không `await` trong cùng một test làm chồng `act()`, và lần render
của test kế tiếp mount ra **cây rỗng** — test đó đậu giả nếu nó chỉ kiểm tra
"không có gì". Đã thêm `await` cho mọi lời gọi `fireEvent` trong repo.

## Còn thiếu, có chủ ý

- **Lời mời kết bạn không có thông báo đẩy.** Người nhận chỉ thấy chấm đỏ khi
  mở tab Trò chuyện. Đủ cho đợt thử nghiệm kín; thêm push là việc của đợt sau.
- **Không có nút huỷ lời mời đã gửi.** Máy chủ chưa có đường xoá.
- **Không có nút xoá bạn.** Cùng lý do.


## Bản 1.0.12 (14) — avatar và gửi ảnh trong chat

### Avatar

- `src/components/ui/Avatar.tsx` — ảnh tròn, tự lùi về vòng tròn chữ cái đầu.
  Phần lớn tài khoản WeDo đăng ký bằng email nên KHÔNG có ảnh; đường lùi này là
  trạng thái thường gặp, không phải ngoại lệ.
- `src/lib/chat/nhom-tin.ts` — `idsHienAvatar` (tin CUỐI chuỗi) và `idsHienTen`
  (tin ĐẦU chuỗi). Gắn avatar cho mọi tin thì bốn tin liên tiếp thành bốn khuôn
  mặt xếp dọc. Bỏ hẳn avatar giữa chuỗi mà không chừa chỗ thì các bong bóng
  lệch nhau theo bậc thang — nên vẫn dựng một ô trống đúng bề rộng.
- Áp cho cả chat dự án và tin nhắn riêng.

### Gửi ảnh

- `src/lib/images/pick-images.ts` — `chupAnh` (xin quyền máy ảnh trước) và
  `chonAnh` (KHÔNG xin quyền kho ảnh).
- `src/lib/api/chat-files.ts` — gói `FormData` dùng chung; `sendProjectFiles`
  và `sendDirectFiles` chỉ khác đường dẫn.
- Ô soạn có hai nút máy ảnh/thư viện, dải ảnh xem trước kèm dấu X. Chú thích đi
  CÙNG tin ảnh chứ không tách thành tin riêng.
- Máy chủ đã có sẵn `POST /projects/:id/chat/files` và
  `POST /chat/direct/conversations/:id/files` — không phải deploy gì thêm.

### Xem ảnh

- `src/lib/chat/use-header-tep.ts` — đường `/chat/attachments/:id` nằm sau
  `JwtAuthGuard`, nên `<Image>` trỏ thẳng vào đó sẽ nhận 401 và hiện ô trống.
  Hook này lấy token để gắn vào `source.headers` của `expo-image`.
- `src/components/chat/ImageViewer.tsx` — chạm ảnh mở toàn màn hình, nút back
  cứng của Android cũng đóng được.

### Quyền Android

`expo-image-picker` chỉ thêm `CAMERA`. Hai quyền storage nó khai đều chặn ở
`maxSdkVersion=32` nên trơ trên Android 13+. Đã tắt `RECORD_AUDIO` bằng
`microphonePermission: false`.

KHÔNG có `READ_MEDIA_IMAGES`, nên **không phải khai báo "Photo and Video
Permissions"** với Google Play.

## Việc phải làm theo đúng thứ tự

1. Đăng `1.0.11 (13)` lên CH Play, kênh thử nghiệm kín. (`.aab` đã ở Desktop.)
2. Chờ EAS build `1.0.12 (14)` xong, đăng tiếp.
3. **Sau khi Play đã phát hành xong bản cuối**, mới đổi biến môi trường trên
   Azure:
   - `MOBILE_LATEST_VERSION` → `1.0.12`
   - `MOBILE_UPDATE_NOTES` → `Thêm kết bạn, avatar trong chat và gửi ảnh.`

   Đổi trước khi Play phát hành thì người dùng bản cũ thấy banner "có bản mới"
   rồi bấm sang CH Play mà chẳng thấy bản nào.

## Nghiệm thu trên máy thật (phần phải tự tay làm)

Máy ảnh và thư viện ảnh không có cách nào kiểm bằng test tự động. Sau khi cài
bản 14, làm đúng các bước sau trên hai máy khác nhau:

1. Mở một cuộc trò chuyện, bấm nút máy ảnh → Android hỏi quyền → bấm **Cho
   phép** → chụp → ảnh thu nhỏ hiện trên ô soạn → bấm **Gửi**.
2. Bấm lại nút máy ảnh, chụp, rồi bấm dấu **X** → ảnh biến mất, không gửi.
3. Bấm nút thư viện, chọn **hai** ảnh cùng lúc → gửi → cả hai nằm trong một
   bong bóng.
4. Gõ chữ rồi mới chọn ảnh → gửi → chữ và ảnh nằm CÙNG một bong bóng.
5. Chạm vào ảnh trong bong bóng → mở toàn màn hình → bấm nút back cứng của máy
   → chỉ đóng ảnh, KHÔNG thoát màn chat.
6. Máy còn lại phải thấy ảnh hiện ra ngay, không cần kéo làm mới.
7. Từ chối quyền máy ảnh một lần → bấm nút máy ảnh → phải thấy băng đỏ chỉ
   đường vào Cài đặt, không phải nút bấm im lặng.
