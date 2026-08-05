# Hồ sơ nộp Google Play — WeDo

Cập nhật 05/08/2026. Gói `vn.wedo.app`, versionCode 1, version 1.0.0.

## Phần mã đã xong

| Yêu cầu của Play | Trạng thái |
|---|---|
| Xoá tài khoản **ngay trong app** | Xong — `Tài khoản → Xoá tài khoản` |
| Chặn xoá khi còn dữ liệu của người khác | Xong — buộc chuyển quyền sở hữu trước |
| Không xin quyền nhạy cảm thừa | Xong — đã chặn `SYSTEM_ALERT_WINDOW` |
| Không xin `USE_EXACT_ALARM` | Xong — dùng báo thức không chính xác |
| Không phải app bọc WebView | Xong — giao diện gốc React Native |
| Liên kết chính sách bảo mật trong app | **Chờ biến môi trường** — xem mục dưới |

### Nghiệm thu màn xoá tài khoản, 05/08/2026

Chạy trên máy ảo với **backend production đã deploy** (không phải máy chủ giả):

- `GET /users/me/deletion-blockers` trên máy chủ thật trả **401** khi chưa đăng nhập — route tồn tại. Trước khi deploy nó trả 404.
- Mở màn hình: không có banner lỗi, tức lệnh gọi thành công và tài khoản thử nghiệm không vướng workspace nào.
- Nút xoá ở trạng thái **tắt** cho tới khi gõ đúng `XOA`, gõ xong mới chuyển sang đỏ đậm.
- Dòng "Chính sách bảo mật" **bị giấu** đúng như thiết kế vì `EXPO_PUBLIC_PRIVACY_URL` chưa đặt.

**Không bấm nút xoá.** Cổng chặn đã kiểm chứng tới bước cuối cùng trước hành động không hoàn tác được.

### Hai trang web đã lên

`FE_WEDO/public/privacy.html` và `FE_WEDO/public/xoa-tai-khoan.html`, đã deploy qua Vercel. Là file tĩnh trong `public/` nên Vite copy thẳng vào bản build, không đi qua lõi điều hướng của SPA — frontend chuyển view bằng state chứ không theo URL, nên đây là cách duy nhất không phải sửa lõi.

## Ba endpoint backend đã thêm

Sửa 4 file, thêm 1 file trong `BE_WEDO`. **Chưa deploy.**

- `GET /users/me/deletion-blockers` — liệt kê không gian làm việc đang chặn.
- `DELETE /users/me` — xoá vĩnh viễn; trả `409` kèm danh sách chặn nếu chưa gỡ hết.
- `PATCH /workspaces/:id/owner` — chuyển quyền sở hữu cho một thành viên.

**Vì sao phải chặn.** `schema.prisma` khai báo `Workspace.owner ... onDelete: Cascade`. Xoá một chủ sở hữu là xoá theo cả không gian làm việc: dự án, công việc, tin nhắn của **mọi** thành viên. Không được để một người tự tay xoá dữ liệu của cả nhóm.

**Hệ quả cần biết trước khi công bố.** `ChatMessage.author` cũng là `onDelete: Cascade`, nên xoá tài khoản sẽ xoá luôn mọi tin nhắn người đó từng gửi — lịch sử hội thoại của nhóm thủng lỗ chỗ. Đây là hành vi của lược đồ hiện tại, không phải thứ tôi thêm vào. Muốn giữ lại tin nhắn dưới dạng "Người dùng đã xoá" thì phải đổi sang `SetNull` và cho `authorId` nhận null — một migration riêng, nằm ngoài phạm vi đã duyệt.

## Biểu mẫu Data safety

Khai theo đúng những gì app thật sự làm.

**Có thu thập:**

| Loại dữ liệu | Mục đích | Bắt buộc? | Chia sẻ với bên thứ ba? |
|---|---|---|---|
| Tên, địa chỉ email | Quản lý tài khoản | Có | Không |
| Nội dung do người dùng tạo (tin nhắn, công việc) | Chức năng của app | Có | Không |

**Không thu thập:** vị trí, danh bạ, máy ảnh, micro, SMS, nhật ký cuộc gọi, danh sách app đã cài, thông tin tài chính, sức khoẻ.

**Các câu trả lời khác:**

- Dữ liệu có được mã hoá khi truyền không? **Có** (HTTPS).
- Người dùng có yêu cầu xoá dữ liệu được không? **Có** — ngay trong app và qua trang web.
- Có thu thập cho quảng cáo không? **Không.**
- Có dùng dịch vụ AI của bên thứ ba không? **Có** — nội dung tin nhắn được gửi tới nhà cung cấp mô hình để đề xuất công việc. Khai ở mục "Nội dung do người dùng tạo", mục đích "Chức năng của app". *Chính sách AI-Generated Content của Play không áp dụng: app năng suất có tính năng được AI hỗ trợ nằm trong diện loại trừ.*

## Việc còn lại — chủ dự án làm

1. **Trang chính sách bảo mật.** Dựng một trang công khai trên web WeDo, rồi đặt biến môi trường để app hiện liên kết:
   ```
   npx eas-cli env:create --name EXPO_PUBLIC_PRIVACY_URL --value https://... --environment production
   ```
   Chưa đặt thì app **giấu** dòng đó đi — cố tình như vậy, vì một liên kết hỏng trong bản nộp sẽ bị từ chối.
2. **Trang xoá tài khoản trên web.** Play đòi **cả hai**: đường trong app (đã xong) và một URL công khai người dùng vào được mà không cần cài app.
3. **Tài khoản demo** cho mục "App access", có sẵn dữ liệu mẫu để người duyệt thấy được đủ ba tính năng.
4. **Ảnh chụp màn hình cửa hàng** — tối thiểu 2, khuyến nghị 4–8.
5. **Bảng phân loại nội dung.**
6. **Tuyển 12 người thử nghiệm**, tham gia liên tục 14 ngày. Nên mời 15–16 để dự phòng người bỏ giữa chừng.
7. **Xác minh danh tính nhà phát triển** — đang chờ Google duyệt.

## Mốc thời gian bắt buộc

- **31/08/2026** — hạn cuối phải nhắm API 36. Bản này đã đạt.
- **30/09/2026** — hạn cuối xác minh nhà phát triển.
