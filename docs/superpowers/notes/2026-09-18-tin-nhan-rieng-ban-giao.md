# Tin nhắn riêng — đợt 1 — bàn giao

Ngày 18/09/2026. Kế hoạch: `docs/superpowers/plans/2026-09-18-tin-nhan-rieng-dot-1.md`.
Thiết kế: `docs/superpowers/specs/2026-09-18-tin-nhan-rieng-va-ket-ban-design.md`.

## Trạng thái

Task 1–7 **đã xong và commit**. Task 8 (nghiệm thu trên máy thật) **chưa làm** —
cần hai tài khoản trên hai máy, trợ lý không đăng nhập tài khoản thật.

`npx tsc --noEmit` sạch. **499/499 test qua, 58/58 bộ.** Backend: 182/182 test
qua, 33/33 bộ.

| Commit | Nội dung |
|---|---|
| `c08f444` | Tạo thêm không gian làm việc |
| `7bd714e` | Tầng API tin nhắn riêng |
| `bd037f7` | Hàm thuần `doiPhuong` |
| `9898489` | Thanh chuyển Dự án / Tin nhắn + danh sách hội thoại |
| `2443dd6` | Màn luồng tin nhắn riêng |
| `435db9d` | Nhận tin nhắn theo thời gian thực |

Trong `BE_WEDO`: `2c273c9` — nới điều kiện `startDirectConversation`.

## Ba điều phát hiện khi làm, đáng nhớ

**1. `render` trong repo này trả về Promise.** Mọi test component phải viết
`const { getByText } = await render(...)` và callback của `it` phải `async`.
Quên `await` thì mọi truy vấn báo `getByText is not a function` — thông báo lỗi
không gợi ý gì tới nguyên nhân thật. Mất một lượt chạy mới lần ra.

**2. `MessageBubble` không dùng lại nguyên được như thiết kế ban đầu viết.** Nó
nhận `ChatMessage`, mà tin nhắn riêng gọi người gửi là `sender` và không có
`projectId` lẫn `workspaceId`. Đã thay bằng kiểu cấu trúc tối thiểu
`BongBongMessage` gồm đúng sáu trường component thật sự đọc tới. `ChatMessage`
thoả kiểu đó nên chỗ gọi cũ không phải sửa.

**3. `gop-hoi-thoai.ts` nêu trong thiết kế đã bị bỏ.** Phần realtime làm mới
bằng cách vô hiệu hoá khoá truy vấn của react-query, nên hàm gộp thủ công không
có chỗ nào gọi tới. Thiết kế đã cập nhật theo.

## Còn phải làm trước khi lên bản build

**Nghiệm thu trên máy thật.** Cần hai tài khoản **chung một không gian làm việc**
nhưng **chưa kết bạn** — đó chính là trường hợp mà thay đổi backend vừa mở ra.

- [ ] Thanh chuyển "Dự án | Tin nhắn" hiện trên header, chạm đổi qua lại được
- [ ] Mục Tin nhắn hiện trạng thái rỗng đúng chữ khi chưa có hội thoại nào
- [ ] Tạo được hội thoại với người chung workspace mà không phải kết bạn
- [ ] Gửi tin ở máy A thì máy B thấy **ngay**, không cần kéo làm mới
- [ ] Huy hiệu số chưa đọc tăng ở máy B khi B không mở hội thoại đó
- [ ] Mở hội thoại ở máy B thì huy hiệu tắt
- [ ] Chấm xanh hiện khi người kia đang mở app, tắt sau khi họ thoát
- [ ] Bàn phím không che ô soạn tin
- [ ] Dòng "+ Tạo không gian mới" hiện ở cuối sheet, kể cả khi chỉ có một không gian
- [ ] Tạo xong không gian mới thì Modal đóng và app chuyển sang không gian vừa tạo
- [ ] Mở được sheet đổi không gian từ cả ba tab Trò chuyện, Việc của tôi và Lịch
- [ ] Bật cỡ chữ hệ thống lớn nhất: nhãn thanh chuyển không bị cắt, tên trong
      dòng hội thoại không tràn, huy hiệu không xén chữ số

**Deploy backend.** Thay đổi `startDirectConversation` mới chỉ commit, **chưa
deploy**. Chưa deploy thì máy chủ vẫn chặn và không ai tạo được hội thoại với
người chưa kết bạn — toàn bộ tính năng này sẽ trông như hỏng.

**Tăng phiên bản.** `app.json` vẫn là `1.0.8` / `versionCode 10`. Bản kế tiếp
phải là `1.0.9` / `versionCode 11`. Cố ý chưa tăng: chỉ tăng một lần ngay trước
khi build.

## Đợt 2 — chưa động tới

Kết bạn đầy đủ (`chat/friends.tsx`, tìm người, gửi lời mời, hộp lời mời,
duyệt/từ chối), tệp đính kèm, cảm xúc, chuyển tiếp, thu hồi, tìm trong hội
thoại, phân trang lịch sử, và chỉ báo "đang gõ" cho tin nhắn riêng.
