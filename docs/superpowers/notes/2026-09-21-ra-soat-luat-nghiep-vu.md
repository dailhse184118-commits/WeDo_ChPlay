# Rà soát luật nghiệp vụ: máy chủ ↔ mobile ↔ web (21/09/2026)

Cách làm: lấy **máy chủ làm chuẩn** (nơi luật thật được chốt), đối chiếu từng
luật với mobile (`WeDo_ChPlay`) và web (`FE_WEDO`). Chỉ ghi những gì đọc thẳng
từ mã nguồn — không suy đoán.

## A. Mâu thuẫn thật (hai bên nói hai luật khác nhau)

### A1. Định nghĩa "leader" — web khác máy chủ và mobile  ⚠ CAO
| Bên | Ai được coi là leader |
|---|---|
| Máy chủ (`tasks.service.hasProjectLeaderAccess`, `chat.service.ensureProjectLeader`) | **Chủ workspace** HOẶC thành viên vai trò `LEADER` |
| Mobile (`lib/tasks/task-permissions.ts`) | Giống máy chủ |
| Web `ProjectBoardView.canManageProjectTasks` | Chỉ `LEADER` hoặc `ADMIN` — **không tính chủ workspace**; `ADMIN` là vai trò **không tồn tại** trong schema (`ProjectRole = LEADER | MEMBER`) |
| Web `ChatView.isProjectLeader` | Chỉ `LEADER` — không tính chủ workspace |

Hệ quả: chủ workspace không phải `LEADER` của dự án → mobile hiện đủ nút tạo /
giao / duyệt việc và tạo việc từ chat; **web ẩn hết**. Cùng một người, hai nền
tảng hai quyền. Đây chính là họ lỗi "chọn rồi mà không đổi" của chị Quyên.

Sửa: web dùng một hàm duy nhất `laLeader = workspace.ownerId === me || member.role === 'LEADER'`,
bỏ `ADMIN`. Chỉ đụng web, không cần OTA. Rủi ro thấp.

### A2. Chuyển trạng thái công việc — máy chủ không chốt luật  ⚠ CAO (cần quyết định chính sách)
- Máy chủ `tasks.service.update()` **không kiểm gì về `status`**: ai sửa được task
  là đặt được `DONE`, bỏ qua luồng nộp → duyệt.
- Web: leader **kéo thả** sang cột bất kỳ, kể cả `DONE` (và `REVIEW → TODO`).
- Mobile: **không có đường nào** đổi trạng thái ngoài nộp → gửi duyệt → duyệt.

Hệ quả: việc "Xong" trên web có thể chưa từng qua duyệt; bảng đóng góp
(`tinhDongGop`, dựa trên `soBaiDaNop`/`soLanBiTraLai`) mất nghĩa; mobile không
làm được điều web làm. Luật thật đang do **giao diện** quyết định thay vì máy chủ.

Đề xuất (sau 30/09): máy chủ chỉ cho `DONE` qua `approveReview`; nếu leader cần
đóng nhanh thì thêm hành động tường minh "Đánh dấu xong, không cần duyệt" — cả
hai nền tảng cùng có, và ghi rõ vào task để bảng đóng góp phân biệt được.

### A3. Không gian mặc định lần đầu (chưa có lựa chọn lưu)  · THẤP
- Mobile: phần tử đầu danh sách (máy chủ sắp `updatedAt desc` → hoạt động gần nhất).
- Web: điểm cao nhất (thành viên×1000 + việc×100 + dự án).
Cùng tài khoản mở lần đầu trên hai nền tảng có thể thấy hai không gian khác nhau.
Đề xuất: thống nhất một luật (nghiêng về web: điểm hoạt động).

### A4. Gửi nhiều ảnh kèm chú thích  · THẤP (đánh đổi đã biết)
- Web: **một** tin nhắn nhiều ảnh + chú thích.
- Mobile: **N** tin nhắn, chú thích ở tin đầu (hệ quả bản vá FormData 19/09).
Cả hai đầu đều hiển thị đúng tin của nhau (mobile render mảng `attachments`).

## B. Lệch tính năng (một bên có, bên kia không → người dùng bên kia thấy thiếu)

| # | Tính năng | Web | Mobile | Hệ quả |
|---|---|---|---|---|
| B1 | Trả lời tin nhắn (`replyToId`, cả nhóm & riêng) | Có | **Không hiển thị trích dẫn** (`MessageBubble` không render `replyTo`), không soạn được | Người mobile thấy câu trả lời như tin rời, mất ngữ cảnh |
| B2 | Bày tỏ cảm xúc (`reactions`) | Có | **Không hiển thị** | Thả tim trên web, mobile không thấy gì |
| B3 | Thu hồi / hành động trên tin nhắn RIÊNG | Có | `onLongPress={() => undefined}` — không có hành động nào | Mobile chỉ hiển thị được tin đã thu hồi, không tự thu hồi được trong DM |
| B4 | Tạo việc từ tin nhắn | Ẩn với người không phải leader | Ai cũng nhấn giữ được, rồi ăn 403 từ máy chủ | Lỗi thay vì ẩn nút |

Đề xuất thứ tự sau 30/09: B1 + B2 **hiển thị trước** (đọc được là đủ để không
mất ngữ cảnh), soạn sau; B4 dùng lại `laLeader` của `task-permissions.ts`.

## C. Kiểm tra phía client lệch nhau (máy chủ vẫn chặn — chỉ khác trải nghiệm)

| Luật máy chủ | Mobile | Web |
|---|---|---|
| Tin nhắn ≤ 2000 ký tự (DTO) | `maxLength={2000}` tại ô nhập | Không chặn → dán dài nhận 400 |
| Tệp chat: ≤5 tệp, ≤10MB, loại cho phép | Kiểm trước cả ba | Chỉ lọc loại (`accept` khớp máy chủ); không kiểm số & dung lượng |
| Tệp nộp bài: ≤10 tệp, ≤20MB | Kiểm trước | Không kiểm |

Sửa: web thêm ba kiểm tra nhỏ, chỉ đụng web. Rủi ro thấp.

## D. Đã khớp — không cần đụng
- Luồng nhận việc: chỉ người được giao; chỉ khi `PENDING` (cả ba bên).
- Nộp tài liệu: người được giao + `ACCEPTED` + `IN_PROGRESS` (web `canSubmit`, mobile `nopTaiLieu`, máy chủ `ensureTaskAssigneeCanSubmit`).
- Gửi duyệt cần ≥1 tệp; duyệt/trả chỉ leader và task đang `REVIEW`.
- Lý do từ chối ≥3 ký tự: DTO + cả hai client.
- Ai nhắn riêng được ai: bạn bè **hoặc** chung workspace — máy chủ chốt; web vào từ bạn bè/tìm kiếm, mobile từ bạn bè/thành viên, đều hợp lệ.
- Kết bạn: không tự mời mình, không mời trùng, chỉ người nhận được phản hồi.

## E. Nguyên tắc rút ra
1. **Một luật, một chỗ.** Mobile đã gom quyền vào `task-permissions.ts` và chép
   đúng máy chủ. Web đang có ba định nghĩa leader rải ba nơi — đó là nguồn mâu thuẫn.
2. **Máy chủ phải chốt luật nghiệp vụ**, client chỉ quyết định hiện nút nào.
   A2 hỏng vì máy chủ thả lỏng nên hai client tự lớn theo hai hướng.
3. Tính năng chat mới (reply, reaction) phải **hiển thị được ở cả hai nền tảng**
   trước khi cho soạn ở một nền tảng — nếu không, một nửa người dùng đọc thiếu.
