# Mời vào nhóm bằng link/QR/mã và mẫu dự án dựng sẵn

Ngày: 02/10/2026. Chủ dự án đã duyệt các quyết định ở mục 1.

Đây là hướng 1 trong lộ trình. Hướng 2 là xuất báo cáo đóng góp, hướng 3 là Export lịch/công việc và AI Daily Planner.

## 1. Mục tiêu và quyết định đã chốt

**Mục tiêu.** Một nhóm mới phải vào được đông đủ và có việc để làm trong vài phút. Hiện nay Leader phải gõ email hay số điện thoại của từng người đã có tài khoản, và dự án mới thì trống trơn.

**Quyết định của chủ dự án:**
1. Mở link mời là **vào thẳng**, không chờ Leader duyệt. Leader tắt hoặc tạo lại link bất cứ lúc nào. Link tự hết hạn sau **7 ngày**.
2. App điện thoại làm luôn đợt này, nhưng **chỉ phần phát được qua OTA** (không đổi dấu vân tay Android):
   - Leader có nút "Mời vào nhóm" để chia sẻ link;
   - mọi người có ô "Nhập mã mời".

   Phần tự mở app khi bấm link (universal/app link) và phần hiện hay quét QR trong app chờ bản build mới.
3. Mẫu dự án là **bộ mẫu cố định do WeDo soạn**, chỉ dùng được trên web, vì app chưa tạo được dự án. Bộ gồm 6 mẫu, xem mục 5.

**Ngoài phạm vi:**
- universal/app link;
- QR trên app;
- giới hạn số thành viên theo gói;
- mẫu do người dùng tự lưu;
- tạo dự án trên app;
- nhiều link cho một dự án.

## 2. Dữ liệu

Thêm bảng `ProjectInvite`. Migration chỉ thêm bảng mới và một giá trị enum, chạy an toàn trên bảng đang có dữ liệu.

```prisma
model ProjectInvite {
  id          String    @id @default(uuid())
  code        String    @unique          // 8 ký tự, xem 3.1
  projectId   String
  createdById String?                    // SetNull khi người tạo xoá tài khoản
  createdAt   DateTime  @default(now())
  expiresAt   DateTime                   // createdAt + 7 ngày
  revokedAt   DateTime?
  useCount    Int       @default(0)
  project     Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy   User?     @relation(fields: [createdById], references: [id], onDelete: SetNull)
  @@index([projectId, revokedAt])
}
```

- Mỗi dự án có **tối đa một link còn hiệu lực**. Link còn hiệu lực là link `revokedAt IS NULL` và `expiresAt > now`.
- Tạo link mới thì máy chủ đặt `revokedAt` cho link cũ trong **cùng một giao dịch**.
- Thêm `NotificationType.PROJECT_MEMBER_JOINED`, bằng câu `ALTER TYPE … ADD VALUE`.
  - Trước khi ghi loại thông báo mới, kế hoạch phải kiểm rằng app cũ hiển thị được một loại thông báo lạ: Android 1.0.13 trên `main`, iOS 1.0.14 trên nhánh `ios`, và nhánh `sua-mobile-dot-2`.
  - App cũ vỡ màn Thông báo vì loại lạ thì **không ghi dòng Notification**, chỉ gửi socket và push.

## 3. Link mời

### 3.1 Mã
- Gồm 8 ký tự lấy từ `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` (bỏ 0, O, 1, I), sinh bằng `crypto.randomInt`. Khoảng 40 bit ngẫu nhiên.
- Hiển thị dạng `7K3M-9QXA`.
- Khi nhận vào, máy chủ chuẩn hoá trước khi so: viết hoa, bỏ khoảng trắng và dấu gạch. Mã không có 0, O, 1, I, nên người gõ nhầm các ký tự này chỉ nhận lỗi "mã không đúng", không bao giờ vào nhầm dự án khác.
- Link có dạng `https://wedofpt.com.vn/#/moi/7K3M9QXA`. Gốc lấy từ `FRONTEND_URL`.

### 3.2 API (backend, mọi trường đều mới)

| Phương thức và đường dẫn | Ai gọi | Kết quả |
|---|---|---|
| `GET /projects/:id/invite` | chủ workspace hoặc Leader dự án | `{ code, url, expiresAt, useCount }` hoặc `null` |
| `POST /projects/:id/invite` | như trên | Tạo link mới, link cũ hết hiệu lực. Trả về như trên |
| `DELETE /projects/:id/invite` | như trên | Tắt link. Trả `{ ok: true }` |
| `GET /invites/:code` | **không cần đăng nhập** | `{ projectName, workspaceName, leaderName, memberCount, expiresAt }`. Không có email, số điện thoại hay id người dùng |
| `POST /invites/:code/join` | người đã đăng nhập | `{ projectId, workspaceId, alreadyMember }` |

- Quyền tạo, xem và tắt link dùng chung hàm `ensureProjectManager` đang có (chủ workspace hoặc Leader dự án).
- **Tham gia (`join`):**
  1. Tìm link còn hiệu lực. Không thấy thì trả 404 `INVITE_NOT_FOUND`. Đã hết hạn thì 410 `INVITE_EXPIRED`. Đã bị tắt thì 410 `INVITE_REVOKED`.
  2. Dự án có trạng thái `ARCHIVED` thì trả 410 `INVITE_PROJECT_CLOSED`.
  3. Người tạo link không còn là Leader hay chủ workspace thì link coi như đã tắt, trả 410 `INVITE_REVOKED`.
  4. Người gọi có quan hệ chặn với người tạo link, theo bất kỳ chiều nào, thì trả 404 `INVITE_NOT_FOUND`, giống như không tìm thấy, để không lộ chuyện chặn.
  5. Người gọi đã là thành viên dự án thì trả `alreadyMember: true` và không làm gì thêm.
  6. Còn lại: dùng chung logic upsert WorkspaceMember (MEMBER) và ProjectMember (MEMBER) với `addMember`. Hàm này đã có sẵn trong `projects.service.ts`, chỉ tách ra để dùng lại, không chép code. Tăng `useCount`. Gửi socket `project:member-added` như hiện nay. Báo Leader và chủ workspace bằng push và thông báo `PROJECT_MEMBER_JOINED`: "{tên} đã tham gia dự án {dự án} qua link mời".
- **Giới hạn tần suất** (`request-rate-limit.guard`):
  - `GET /invites/:code`: 30 lần mỗi phút theo IP.
  - `POST /invites/:code/join`: 10 lần mỗi phút theo người dùng, kèm 30 lần mỗi phút theo IP.
  - Tạo, tắt link: vào nhóm ghi chung đang có.
- Mọi thông báo lỗi trả về bằng tiếng Việt kèm `code`. Web dịch các mã này sang tiếng Anh qua bảng mã lỗi của i18n.

### 3.3 Web (FE_WEDO)
- **Leader, trong dự án** (ProjectBoardView và màn quản lý thành viên): nút **"Mời vào nhóm"** mở hộp thoại gồm:
  - link và nút **Sao chép**;
  - **mã QR**, dùng thư viện thuần JS `qrcode`, vẽ bằng canvas hoặc SVG, có nút tải ảnh PNG để in hay chiếu;
  - mã 8 ký tự in to;
  - ngày hết hạn và số người đã tham gia;
  - nút **Tạo link mới** (hỏi xác nhận vì link cũ sẽ hết hiệu lực) và nút **Tắt link**.
- **Đường dẫn mới `#/moi/:code`.** Đây là đường dẫn đầu tiên có tham số, nên thêm bộ đọc tham số cho nó và để các đường dẫn khác chạy như cũ.
  - Trang xem trước: "Bạn được mời vào dự án **X** (workspace Y, Leader Z, N thành viên)", có nút **Tham gia**.
  - Chưa đăng nhập: lưu mã vào localStorage khoá `wedo:loi-moi-cho` (bọc try/catch), rồi đưa sang Đăng nhập hoặc Đăng ký. `vaoSauDangNhap` thấy mã đang chờ thì quay lại trang mời, giống cách luồng thanh toán giữ `wedo:kiem-tra-don`. Xoá mã sau khi tham gia xong hoặc khi link báo lỗi.
  - Tham gia xong: chọn đúng workspace rồi mở bảng của dự án đó.
- Mọi chữ có trong cả hai từ điển vi và en; `npm run kiem-dich` phải về 0.

### 3.4 App (Expo, nhánh mobile kế tiếp; OTA cho Android 1.0.13)
- **Leader:** trong màn chat dự án, menu ở đầu màn có mục **"Mời vào nhóm"**.
  - Gọi `GET` (chưa có link thì `POST`) rồi mở bảng chia sẻ của hệ điều hành (`Share.share` của React Native).
  - Nội dung chia sẻ: "Tham gia dự án X trên WeDo: {link}. Hoặc nhập mã 7K3M-9QXA trong app."
  - Cùng chỗ đó có thêm "Tạo link mới" và "Tắt link".
- **Mọi người:** tab Trò chuyện → Dự án có nút **"Nhập mã mời"**.
  - Ô nhập tự viết hoa và tự thêm gạch giữa khi gõ.
  - Bấm vào thì xem trước bằng `GET /invites/:code`, xác nhận rồi `join`.
  - Xong thì tải lại danh sách dự án (và workspace nếu cần), chuyển sang đúng workspace, mở chat dự án vừa vào.
  - Thông báo lỗi dịch theo mã lỗi.
- Bấm push `PROJECT_MEMBER_JOINED` thì mở chat dự án đó. Thêm luôn xử lý cho push `PROJECT_MEMBER_ADDED` đang có (hiện bấm vào không làm gì).
- **Không thêm** thư viện native và không sửa `app.json`, `package.json` hay `eas.json`. Kiểm `npx expo-updates fingerprint:generate --platform android`: kết quả phải bằng `82cd9900…` khi đo ở một checkout thật của `main`.
- Code nằm trên nhánh mobile kế tiếp, nối sau `sua-mobile-dot-2`. Khi Apple duyệt bản 1.0.14 thì cherry-pick sang nhánh `ios`.

## 4. Bảo mật và quyền riêng tư
- Trang xem trước công khai chỉ trả các thông tin ở mục 3.2, đủ để người nhận biết mình được mời vào đâu.
- Tài khoản bị đình chỉ không đăng nhập được nên không tham gia được.
- Mã có 40 bit ngẫu nhiên, cộng với giới hạn tần suất, nên không dò ra được.
- Tham gia qua link vẫn giữ nguyên quy tắc hiện có: email chỉ hiện giữa hai người là bạn bè.
- Người vào bằng link chỉ có vai trò MEMBER. Leader nâng vai trò bằng cách hiện có.

## 5. Mẫu dự án

### 5.1 Máy chủ
- Danh mục mẫu nằm trong code, tệp `src/projects/mau-du-an.ts`, không cần bảng mới.
- Mỗi mẫu có: `id`, tên và mô tả bằng vi và en, và danh sách việc. Mỗi việc gồm `{ title{vi,en}, description{vi,en}, offsetDays }`.
- `GET /project-templates?lang=vi|en` trả `[{ id, name, description, tasks: [{ title, offsetDays }] }]`.
- `POST /projects` nhận thêm ba trường **không bắt buộc**:
  - `templateId`: phải là một id có thật;
  - `startDate`: ngày `YYYY-MM-DD`, mặc định là hôm nay theo giờ Việt Nam;
  - `lang`: `vi` hoặc `en`, mặc định `vi`.
- Có `templateId` thì tạo dự án và toàn bộ việc trong **một giao dịch**. Mỗi việc có:
  - `status TODO`, `assigneeId null`, `creatorId` là người tạo dự án, `workspaceId` và `projectId` của dự án mới;
  - `dueDate` = `startDate + offsetDays`, lúc **23:59 giờ Asia/Ho_Chi_Minh**;
  - không gửi thông báo giao việc, vì việc chưa giao cho ai.
- Không có `templateId` thì `POST /projects` chạy y như hiện nay.

### 5.2 Web
- Hộp thoại tạo dự án có hai thẻ: **"Dự án trống"** và **"Bắt đầu từ mẫu"**.
- Chọn mẫu thì hiện danh sách việc kèm ngày hạn tính sẵn theo ngày bắt đầu đang chọn. Đổi ngày bắt đầu thì danh sách cập nhật ngay.
- Workspace chưa có dự án nào thì Tổng quan hiện thẻ **"Bắt đầu nhanh với mẫu"**.

### 5.3 Bộ 6 mẫu (số trong ngoặc là ngày tính từ ngày bắt đầu)

Tên tiếng Anh viết lúc làm, cùng giọng với từ điển i18n.

1. **EXE101 – Ý tưởng khởi nghiệp:**
   - Lập nhóm và chia vai trò (3)
   - Chọn ý tưởng (7)
   - Xác định vấn đề và khách hàng mục tiêu (14)
   - Phỏng vấn khách hàng (21)
   - Phân tích đối thủ (28)
   - Lean Canvas (35)
   - Làm prototype (49)
   - Thử với khách hàng (56)
   - Slide pitching (66)
   - Nộp báo cáo cuối kỳ (70)
2. **EXE201 – MVP và thị trường:**
   - Chốt mô hình kinh doanh (7)
   - Xây MVP (28)
   - Ra mắt, có người dùng đầu tiên (35)
   - Kế hoạch marketing (42)
   - Đo lường chỉ số (56)
   - Bằng chứng doanh thu (63)
   - Báo cáo tài chính (70)
   - Demo day / pitching (77)
3. **Đồ án môn học:**
   - Lập kế hoạch và chia việc (3)
   - Nghiên cứu tài liệu (10)
   - Phân tích yêu cầu (14)
   - Thiết kế (21)
   - Thực hiện (42)
   - Kiểm thử, hoàn thiện (49)
   - Viết báo cáo (53)
   - Slide và tập thuyết trình (56)
4. **Thuyết trình nhóm:**
   - Chọn chủ đề và dàn ý (2)
   - Tìm tư liệu (5)
   - Làm slide từng phần (8)
   - Ghép và chỉnh slide (10)
   - Tập thuyết trình (12)
   - Thuyết trình (14)
5. **Nghiên cứu khoa học:**
   - Chọn đề tài và câu hỏi nghiên cứu (7)
   - Tổng quan tài liệu (21)
   - Thiết kế phương pháp (28)
   - Thu thập dữ liệu (49)
   - Phân tích dữ liệu (63)
   - Viết bài (77)
   - Xin góp ý và chỉnh sửa (84)
   - Nộp hoặc báo cáo (90)
6. **Sự kiện / CLB:**
   - Mục tiêu và ý tưởng (3)
   - Kế hoạch và ngân sách (7)
   - Địa điểm và giấy phép (10)
   - Tìm nhà tài trợ (14)
   - Truyền thông (14)
   - Hậu cần (21)
   - Tổng duyệt (27)
   - Tổ chức sự kiện (28)
   - Tổng kết, báo cáo (31)

Mỗi việc có một câu mô tả gợi ý ngắn: làm gì, và nộp gì thì coi là xong. Mốc thời gian của EXE101 và EXE201 ước theo một kỳ khoảng 10 tuần. Chủ dự án có đề cương thật thì chỉnh lại sau.

## 6. Tương thích ngược
- Mọi API, trường dữ liệu và loại thông báo đều mới. Không đổi hay bỏ thứ gì app Android 1.0.13/1.0.14, iOS 1.0.14 và web cũ đang đọc.
- `POST /projects` vẫn nhận đúng nội dung cũ. Chỉ thêm trường không bắt buộc, và ValidationPipe (`forbidNonWhitelisted`) vẫn chặn trường lạ như trước.
- Loại thông báo mới: xem điều kiện ở mục 2.

## 7. Kiểm thử
- **Backend, bằng jest.** Phải có test thất bại khi chưa có code:
  - sinh mã và chuẩn hoá mã;
  - tạo, tạo lại, tắt link, mỗi dự án chỉ một link còn hiệu lực;
  - các lỗi hết hạn, đã tắt, dự án đóng, người tạo mất quyền, quan hệ chặn;
  - tham gia lần hai trả `alreadyMember`, không tăng `useCount`;
  - phân quyền ở các API Leader;
  - giới hạn tần suất;
  - trang xem trước không lộ email hay id;
  - tạo dự án từ mẫu: số việc, hạn lúc 23:59 giờ Việt Nam khi máy chủ chạy UTC, chạy trong một giao dịch, `templateId` sai trả 400;
  - `POST /projects` không có mẫu chạy y như cũ.

  Kiểm migration bằng một PostgreSQL tạm trong Docker.
- **Web, bằng node:test:**
  - đọc tham số `#/moi/:code`;
  - lưu và lấy lại mã đang chờ qua bước đăng nhập;
  - chuẩn hoá mã nhập tay;
  - tính ngày hạn khi xem trước mẫu;
  - từ điển đủ cả hai ngôn ngữ.

  Cộng với `lint`, `build` và `kiem-dich`.
- **App, bằng jest:**
  - chỉ Leader thấy nút mời;
  - ô nhập mã tự định dạng;
  - tham gia xong mở đúng màn;
  - dịch mã lỗi;
  - bấm push mở đúng màn.

  Cộng với `tsc` và kiểm dấu vân tay Android.

## 8. Thứ tự đưa lên
1. **Backend:** migration chỉ thêm, nên lần chạy tự động sau khi push đi qua được cổng chặn thay đổi cấu trúc. Kiểm `/health/ready`, rồi thử `GET /invites/<mã sai>` phải trả 404.
2. **Web.**
3. **App:** gộp vào `main` → đo dấu vân tay ở checkout thật → chủ dự án chạy `eas update` cho Android. Bản iOS và Android 20 có tính năng này khi build lần tới.
