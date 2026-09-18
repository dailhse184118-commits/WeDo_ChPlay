# Bàn giao: kết bạn + tin nhắn riêng (1.0.11 / versionCode 13)

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

## Việc phải làm theo đúng thứ tự

1. Chờ EAS build xong, tải `.aab`.
2. Đăng bản `1.0.11 (13)` lên CH Play, kênh thử nghiệm kín.
3. **Sau khi Play đã phát hành xong**, mới đổi biến môi trường trên Azure:
   - `MOBILE_LATEST_VERSION` → `1.0.11`
   - `MOBILE_UPDATE_NOTES` → `Thêm kết bạn, và sửa lỗi tin nhắn riêng không hiện ngay.`

   Đổi trước khi Play phát hành thì người dùng 1.0.10 thấy banner "có bản mới"
   rồi bấm sang CH Play mà chẳng thấy bản nào.
