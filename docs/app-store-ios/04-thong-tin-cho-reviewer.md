# 04 — Thông tin cho người duyệt của Apple (App Review Information)

Trang này gom mọi thứ bạn điền vào mục **App Review Information** của phiên bản iOS 1.0.13 trong App Store Connect: tài khoản demo, thông tin liên hệ, ghi chú cho người duyệt (Notes), tệp đính kèm. Cuối trang là cách trả lời khi bị từ chối.

Chỗ điền: App Store Connect → Apps → WeDo → phiên bản iOS 1.0.13 → kéo xuống mục **App Review Information**.

Quy ước:

- `[NGOẶC VUÔNG]` là chỗ bạn phải tự điền. Trước khi dán, tìm ký tự `[` để chắc không còn sót.
- **⚠ Giả định:** là chỗ dựa trên quyết định chưa chốt. Bạn đổi được.
- Đường dẫn tệp: `M` = app mobile, nhánh `ios` ở `D:\WeDo_ChPlay-ios`; `BE` = máy chủ, nhánh `ios-backend` ở `D:\WEDO_PC\BE_WEDO-ios`; `FE` = web, nhánh `ios-web` ở `D:\WEDO_PC\FE_WEDO-ios`. Chỗ nào ghi số dòng mà không nói nhánh là số dòng đọc trên nhánh chính lúc kiểm tra, có thể lệch vài dòng.
- Văn bản người duyệt của Apple đọc thì viết bằng tiếng Anh. Bản dịch tiếng Việt nằm ngay dưới, chỉ để bạn đối chiếu, không dán.

---

## 0. Tóm tắt nhanh

1. Đăng nhập **không** bị chặn bởi xác minh email hay OTP. Đã kiểm trong mã (mục 2).
2. Dùng **3 tài khoản demo**. B làm chủ không gian làm việc. A là Leader của dự án nhưng **không** làm chủ, nên A xoá tài khoản được ngay. C dùng để thử xoá (mục 4).
3. Không đăng ký A và C trên web: web tự tạo không gian trống cho người chưa có. Đăng ký hai tài khoản này trong app bản iOS mới (mục 4.2, bước 1).
4. Apple giới hạn ô Notes ở **4.000 byte** (không phải 4.000 ký tự). Khối Notes ở mục 6 dài **3.674 ký tự, 3.850 byte** và đã **gộp sẵn** đoạn 1.2 của tài liệu 06. Đừng dán thêm đoạn đó.
5. Mọi tính năng Notes mô tả **đã có trong mã** trên nhánh `ios`, `ios-backend`, `ios-web` (`08-sua-code-truoc-khi-nop.md`, mục Đã làm). Nhưng chúng **chưa lên production**. Chỉ dựng tài khoản demo và nộp sau khi máy chủ và web mới đã chạy (`08`, mục Thứ tự đưa lên), và sau khi đã thử trên iPhone thật (mục 8).
6. Tài khoản nào tạo công việc, cuộc họp là quan trọng: việc tự giao cho mình thì tự "đã nhận", còn cuộc họp bị xoá theo người tạo. Làm đúng thứ tự ở mục 4.2.
7. Đăng nhập trên iPhone chỉ có email và mật khẩu. Không có Sign in with Apple ở bản này, nên Notes không nhắc tới nó.

---

## 1. Các quyết định và giả định trong trang này

- Đã chốt và đã làm: màn Đăng nhập và Đăng ký trên iPhone **chỉ có email và mật khẩu**. Nút Google bị ẩn trên iPhone (`08`, IOS-02), Android và web vẫn giữ. Vì vậy **không có Sign in with Apple** ở bản này, và Guideline 4.8 không áp dụng.
- Đã chốt và đã làm: tuổi tối thiểu **18**. Màn đăng ký có ô bắt buộc "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư". Nút **Đăng ký** bị tắt tới khi đánh dấu ô (`08`, IOS-06). App Store Connect đặt mức 18+.
- Đã chốt và đã làm: **bộ lọc từ ngữ** tiếng Việt và tiếng Anh cho tin nhắn và tên hiển thị. Bộ lọc **che** từ phản cảm bằng `***`, không chặn cả tin (`08`, IOS-03).
- Đã làm: nhấn giữ tin của người khác mở bảng thao tác gồm **"Tạo công việc bằng AI"** (chỉ Leader dự án và chủ không gian làm việc), **"Báo cáo tin nhắn"**, **"Chặn người này"**. Nút ba chấm ở đầu tin nhắn riêng và ở mỗi dòng trong màn Bạn bè có **"Báo cáo người này"**, **"Chặn người này"**. Bỏ chặn ở **Tài khoản → Người đã chặn**. Màn đồng ý một lần có nút **"Đồng ý và tiếp tục"** (`08`, IOS-04, IOS-06).
- Đã làm: **hộp thoại xin đồng ý** trước lần dùng AI đầu tiên, tiêu đề "Dùng AI để gợi ý công việc?", nút **"Đồng ý"** và **"Không, cảm ơn"**. Rút lại bằng công tắc **"Cho phép dùng AI"** trong tab Tài khoản (`08`, IOS-08). ⚠ Hộp thoại hiện ghi nhà cung cấp là "Google Gemini hoặc OpenAI". Ô `[TÊN NHÀ CUNG CẤP AI]` trong Notes phải khớp với câu đó và với cấu hình thật (mục 6.1).
- Cam kết **xử lý báo cáo trong 24 giờ** nằm trong điều khoản và trong Notes. Công cụ đã có: thư báo tới `REPORT_NOTIFY_EMAIL` và trang quản trị "Báo cáo vi phạm" (Gỡ nội dung, Khoá tài khoản). Còn thiếu người trực (tài liệu 06, mục 7).
- Đã chốt: email hỗ trợ và liên hệ là `wedosupport6886@gmail.com`. Tên trang chính sách là **"Chính sách quyền riêng tư"** ở mọi nơi.
- ⚠ Giả định: app iOS miễn phí, không mua hàng trong app, không lời mời mua ở nơi khác (Guideline 3.1.3(f)). Đã làm: nút "Xem đầy đủ trên web" ở Bảng đóng góp bị ẩn trên iPhone; thông báo gói và thanh toán bị ẩn trên iPhone.
- ⚠ Giả định: tên người, tên dự án và nội dung mẫu ở mục 4 là gợi ý. Đổi tên dự án thì sửa cả trong ghi chú.

---

## 2. Đăng nhập có bị chặn bởi xác minh email hay OTP không?

**Kết luận: không.** Người duyệt gõ email và mật khẩu là vào thẳng app. Bảng dưới là những gì đã kiểm trong mã.

| Bước | Kết quả | Nguồn |
|---|---|---|
| Đăng ký | Không xác minh email. Phải đánh dấu ô "Tôi đủ 18 tuổi và đồng ý…" thì nút Đăng ký mới bật. Máy chủ tạo tài khoản, ghi mốc đồng ý và trả token ngay; app báo "Đăng ký thành công" rồi vào thẳng. | `BE src/auth/auth.service.ts` (`register`); `M src/app/(auth)/register.tsx:37-80`, `:178-185` |
| Màn Điều khoản một lần | Tài khoản chưa có mốc đồng ý (tạo trên web, tạo bằng Google, tạo trước khi có ô) gặp màn "Điều khoản sử dụng" ngay sau khi đăng nhập, trước mọi tab. Đánh dấu ô rồi bấm "Đồng ý và tiếp tục" là vào. | `M src/components/auth/CongDieuKhoan.tsx`; `M src/app/_layout.tsx:123-125`; `BE src/users/users.controller.ts` (`POST /users/me/accept-terms`) |
| Tài khoản bị khoá | Tài khoản bị quản trị viên khoá không đăng nhập được. App hiện câu "Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng…". | `BE src/auth/tai-khoan-bi-khoa.ts`; `M src/lib/api/client.ts` |
| Đăng nhập email | Chỉ so mật khẩu. Không OTP, không xác thực hai bước, không CAPTCHA. | `BE src/auth/auth.service.ts:60-65`, `:125-142` |
| Mật khẩu | Tối thiểu 6 ký tự khi đăng ký. App cũng chặn ngay ở màn đăng nhập nếu ngắn hơn. | `M src/app/(auth)/login.tsx:32`; `BE src/auth/dto/auth.dto.ts:9` (`RegisterDto`, `MinLength(6)`) |
| Ô email trên iPhone | Không tự viết hoa chữ đầu, không tự sửa chính tả. Người duyệt gõ sao, app gửi vậy (chỉ cắt khoảng trắng hai đầu). | `M src/components/ui/TextField.tsx:30`, `:64-65`; `M src/app/(auth)/login.tsx:40` |
| Chữ hoa, chữ thường trong email | **Có phân biệt.** Máy chủ tìm email đúng từng ký tự, không đổi về chữ thường. Gõ `Demo@...` thay cho `demo@...` là báo sai mật khẩu. | `BE prisma/schema.prisma:146`; `BE src/auth/auth.service.ts:125-133` |
| Tài khoản quản trị | Tài khoản có `platformRole = ADMIN` bị từ chối trên app. Tài khoản demo phải là người dùng thường. | `BE src/auth/auth.service.ts:307-311` |
| Giới hạn tần suất | 30 lần gọi `POST /auth/*` mỗi phút cho mỗi địa chỉ IP. Không cản người duyệt. Vượt thì app báo "Bạn thao tác quá nhanh". | `BE src/common/request-rate-limit.guard.ts:93-94` |
| Cổng phiên bản | iPhone đọc bộ biến riêng `MOBILE_IOS_*`. App chặn **cả màn đăng nhập** chỉ khi `MOBILE_IOS_MINIMUM_VERSION` lớn hơn phiên bản đang duyệt **và** `MOBILE_IOS_STORE_URL` là đường dẫn App Store. Hai biến Android không ảnh hưởng iPhone. | `M src/lib/version/use-phien-ban.ts`; `M src/lib/version/mo-cua-hang.ts`; `BE src/app.service.ts` |
| Xin quyền thông báo | iPhone **không** hỏi quyền lúc đăng nhập. Tab Thông báo có thẻ "Nhắc bạn trước khi việc đến hạn" với nút "Bật thông báo"; chạm nút đó mới hiện hộp thoại hệ thống. Không cho phép vẫn dùng app bình thường. | `M src/lib/notifications/push-token.ts` (`coQuyenThongBao`); `M src/app/(tabs)/notifications/index.tsx` |
| Tài khoản mới tinh | Phải tạo không gian làm việc trước khi thấy các tab. | `M src/app/(tabs)/_layout.tsx:92-95` |
| Quên mật khẩu | Mã 6 chữ số gửi qua email. Chỉ chạy khi người dùng tự chọn. | `M src/app/(auth)/forgot-password.tsx` |
| Tài khoản tạo bằng Google | Có mật khẩu ngẫu nhiên người dùng không biết. "Quên mật khẩu" tìm tài khoản theo email, không phân biệt cách đăng ký, rồi ghi mật khẩu mới; đăng nhập email dùng được ngay, còn Google trên web vẫn chạy. Notes nói điều này ở dòng SIGN IN. | `BE src/auth/auth.service.ts:81`, `:125-140`; `BE src/auth/password-reset.service.ts:43`, `:123-128` |

Việc bạn cần làm từ bảng này:

- Đăng ký email demo **toàn chữ thường**, và ghi đúng như vậy vào App Store Connect.
- Để trống `MOBILE_IOS_MINIMUM_VERSION` (hoặc không cao hơn phiên bản đang duyệt) trong suốt thời gian Apple duyệt.
- Không dùng tài khoản quản trị làm tài khoản demo.
- Mỗi tài khoản demo đăng nhập app một lần và qua màn Điều khoản (nếu gặp) trước khi nộp, để người duyệt vào thẳng.

---

## 3. Sign-In Information

Bật ô **Sign-in required**, rồi điền:

```text
User name: [EMAIL DEMO]
Password: [MẬT KHẨU DEMO]
```

- `[EMAIL DEMO]`: email của tài khoản A, toàn chữ thường. Nên là hộp thư bạn đọc được, để còn tự đặt lại mật khẩu khi cần.
- `[MẬT KHẨU DEMO]`: 10–16 ký tự, gồm chữ và số. Không dấu tiếng Việt, không khoảng trắng, để người duyệt gõ không sai.
- Apple yêu cầu tài khoản demo không hết hạn. Tài khoản WeDo không tự hết hạn. Đừng đổi mật khẩu, đừng xoá tài khoản cho tới khi được duyệt.
- Tài khoản B và C ghi trong Notes (mục 6).

---

## 4. Chuẩn bị tài khoản demo trên hệ thống thật

Mọi bước làm trên **hệ thống production**, **sau khi** máy chủ `ios-backend` và web `ios-web` đã lên (`08`, mục Thứ tự đưa lên): web `https://wedofpt.com.vn` và app WeDo bản iPhone qua TestFlight. App không tạo được dự án (`M src/lib/api/projects.ts` chỉ có `listProjects`), nên phần dự án và thành viên phải làm trên web.

### 4.1. Vì sao 3 tài khoản, và vì sao B làm chủ

| Tài khoản | Vai trò | Để làm gì |
|---|---|---|
| **A** — tài khoản chính | Thành viên không gian làm việc, **Leader** của dự án. **Không** làm chủ không gian nào. | Người duyệt đăng nhập bằng A. Leader mới dùng được AI (`BE src/chat/chat.service.ts:752-763`), tạo cuộc họp và duyệt bài. |
| **B** — đồng đội | **Chủ** không gian làm việc, Leader dự án. | Tạo dữ liệu mẫu, nhắn tin với A, nộp bài để A duyệt. Người duyệt đăng nhập B ở máy thứ hai để thấy tin nhắn tới ngay lập tức. |
| **C** — tài khoản để xoá | Thành viên thường (Member) của dự án. | Người duyệt thử xoá tài khoản mà không làm mất dữ liệu mẫu của A. |

Lý do B làm chủ: máy chủ **từ chối xoá** tài khoản đang làm chủ một không gian làm việc còn thành viên khác (`BE src/users/users.service.ts:74-129`). A không làm chủ gì, nên người duyệt xoá A hay C đều được ngay. Chi tiết ở mục 4.4.

⚠ Giả định: tên gợi ý cho ba tài khoản là A = "Nguyễn Minh Anh", B = "Trần Quốc Bảo", C = "Phạm Thu Chi". Nội dung mẫu ở mục 4.3 gọi theo các tên này. Đổi tên thì sửa cả nội dung mẫu.

### 4.2. Các bước, theo đúng thứ tự

**Bước 1 — Tạo ba tài khoản (email + mật khẩu, không dùng Google)**

- [ ] B: đăng ký trên web. Web tự tạo cho B một không gian tên "Workspace của tôi" (`FE src/lib/api.ts:1617-1630`). Giữ nó, hoặc đổi tên thành "WeDo Demo" cho dễ nhìn. Web chưa có ô đồng ý điều khoản, nên lần đầu B đăng nhập app sẽ gặp màn "Điều khoản sử dụng": đánh dấu ô, bấm **Đồng ý và tiếp tục**.
- [ ] A và C: đăng ký **trong app iPhone bản TestFlight**, không đăng ký trên web và không dùng bản Android 1.0.13 (bản đó chưa có ô đồng ý). Đánh dấu ô "Tôi đủ 18 tuổi và đồng ý…" rồi bấm Đăng ký. Đăng ký xong, app hiện màn "Tạo không gian làm việc". **Không tạo**, tắt app. Lý do: web tự tạo không gian riêng cho người chưa có không gian nào. A mà có thêm không gian riêng thì app của người duyệt có thể mở nhầm không gian trống (`M src/lib/workspace/active-workspace.ts:7-21` chọn không gian đầu danh sách, mà danh sách xếp theo lần cập nhật gần nhất, `BE src/workspaces/workspaces.service.ts:26`).
- [ ] Đừng đăng nhập **web** bằng A hoặc C trước khi B thêm họ vào dự án ở bước 2.
- [ ] Nếu A lỡ có không gian riêng: xoá không gian đó trên web (chủ không gian mới xoá được, `BE src/workspaces/workspaces.service.ts:76-80`). Không xoá được thì đăng ký lại A bằng email khác.
- [ ] Cả ba email viết **toàn chữ thường**. Không tài khoản nào là quản trị viên.

**Bước 2 — Không gian làm việc và dự án (đăng nhập web bằng B)**

- [ ] Tạo dự án **"Dự án mẫu (Demo Project)"**. Người tạo tự thành Leader (`BE src/projects/projects.service.ts:26-42`).
- [ ] Thêm A với vai trò **Leader**. Thêm C với vai trò **Member**. Ô thêm thành viên nhận email, số điện thoại hoặc ID; nút vai trò ghi "Leader" và "Member" (`FE src/views/WorkspaceView.tsx:1155-1185`). Thêm vào dự án là tự thêm vào không gian làm việc (`BE src/projects/projects.service.ts:107-114`).
- [ ] (Tuỳ chọn) Tạo dự án thứ hai "Báo cáo cuối kỳ (Final Report)", thêm A làm Leader, để danh sách dự án trông thật hơn.
- [ ] Mở app bằng A: phải vào thẳng các tab, tiêu đề "Chào Anh", dưới tiêu đề là tên không gian của B.

**Bước 3 — Bạn bè**

- [ ] B gửi lời mời kết bạn cho A (web: màn Trò chuyện; app: Trò chuyện → biểu tượng người ở góc trên → gõ ít nhất 3 ký tự của tên → "Kết bạn"). A bấm "Duyệt".
- [ ] C gửi lời mời kết bạn cho A. **Để nguyên, không duyệt.** Người duyệt sẽ thấy "Lời mời đang chờ bạn (1)" với hai nút "Duyệt" và "Từ chối".

**Bước 4 — Trò chuyện dự án "Dự án mẫu"**

- [ ] Dán lần lượt 10 tin ở mục 4.3, đúng người gửi, đúng thứ tự. Tin cuối cùng là tin có chữ "slide". Đó là tin người duyệt sẽ nhấn giữ để thử AI.
- [ ] Tin thứ 4 gửi kèm **một ảnh JPG hoặc PNG** (web hoặc app Android).
- [ ] Không biến tin "slide" thành công việc khi thử. Muốn thử AI thì thử trên tin thứ 5.

**Bước 5 — Tin nhắn riêng A ↔ B**

- [ ] Dán 4 tin ở mục 4.3, có một ảnh.

**Bước 6 — Công việc (trong "Dự án mẫu")**

Đặt hạn chót tính từ **ngày bạn bấm nộp**, không tính từ hôm nay. Apple duyệt có khi vài ngày, bị từ chối thì kéo dài thêm.

Ai tạo việc nào là quan trọng. Chỉ Leader mới tạo được việc trong dự án (`BE src/tasks/tasks.service.ts:55-57`). Việc tự giao cho chính mình thì máy chủ ghi luôn là "đã nhận", không qua "Chờ nhận" (`BE src/tasks/tasks.service.ts:59-78`). Vì vậy: **B tạo việc giao cho A, A tạo việc giao cho B.** A và B đều là Leader nên cả hai tạo được, trên web hoặc bằng nút + trong app.

- [ ] T1 "Viết phần mở đầu báo cáo": **B tạo**, giao cho A, hạn +10 ngày. **Để nguyên ở "Chờ nhận"**, người duyệt sẽ bấm "Nhận việc" hoặc "Từ chối".
- [ ] T2 "Tổng hợp tài liệu tham khảo": **B tạo**, giao cho A, hạn +7 ngày. A bấm "Nhận việc" (trên web hoặc app). **Không nộp tệp**, để người duyệt thử "Nộp tài liệu" rồi "Gửi duyệt".
- [ ] T3 "Khảo sát 30 sinh viên": **A tạo**, giao cho B, hạn +5 ngày. B nhận việc, nộp một tệp PDF nhỏ, bấm "Gửi duyệt". Việc chuyển sang chờ duyệt; A thấy "Duyệt bài" và "Trả lại" (`M src/lib/tasks/task-permissions.ts:55-56`).
- [ ] Làm T3 **sau khi** A đã vào dự án. Lúc B gửi duyệt, máy chủ gửi thông báo "Task đã được gửi review" cho mọi thành viên dự án trừ B, trong đó có A (`BE src/tasks/tasks.service.ts:401-407`, `:696-701`). Người duyệt mở T3 từ tab **Thông báo**, vì tab Công việc chỉ hiện việc giao cho chính mình (`M src/lib/tasks/deadline-groups.ts:43-45`). Kiểm tra trong app bằng A: tab Thông báo có dòng này, chạm vào mở đúng T3.
- [ ] T4 "Chọn tên và logo nhóm": **A tạo**, giao cho B. B nhận việc, nộp bài, A duyệt xong. Nhờ vậy Bảng đóng góp có số liệu "Hoàn thành".
- [ ] (Tuỳ chọn) T5 "Nộp đề cương cho giảng viên": **B tạo**, giao cho A, hạn đã qua 1–2 ngày, để ô "Quá hạn" có số. Web không cho chọn ngày đã qua thì bỏ qua bước này.

**Bước 7 — Cuộc họp (trong "Dự án mẫu")**

Cả hai cuộc họp do **B tạo** (B là Leader). Lý do: xoá một tài khoản là xoá luôn các cuộc họp tài khoản đó tạo (`BE prisma/schema.prisma:617`, `onDelete: Cascade`). Người duyệt có thể xoá A; họp do B tạo thì vẫn còn.

- [ ] M1 "Họp chốt nội dung thuyết trình": B tạo, ngày +3 đến +10 ngày, nội dung dự kiến "Xem lại slide và phân công tập thuyết trình." Người duyệt sẽ thấy nút "Vào phòng họp".
- [ ] Thử "Vào phòng họp" một lần trên web hoặc Android. Nút này tạo phòng Daily.co trên máy chủ; khoá Daily trên Azure hỏng thì người duyệt gặp lỗi.
- [ ] M2 "Họp phân công tuần 1": B tạo trên web, bấm **"Kết thúc cuộc họp"**, dán đoạn transcript ở mục 4.3 vào ô "Nội dung transcript", bấm **"Tạo biên bản bằng AI"** (`FE src/views/MeetingView.tsx:1113-1134`). Kiểm tra Tóm tắt, Quyết định, Hạng mục hành động đã hiện. Việc này tốn 1 lượt AI của B. Không muốn dùng AI thì gõ tay vào ô "Tóm tắt cuộc họp" rồi bấm "Lưu biên bản".
- [ ] Mở M2 trong app bằng A: phải thấy các khối "Tóm tắt", "Quyết định", "Hạng mục hành động" (`M src/app/(tabs)/meetings/[id].tsx:225-243`).

**Bước 8 — Hồ sơ và ảnh đại diện**

- [ ] Đặt ảnh đại diện cho B và C (dùng ảnh minh hoạ, không dùng ảnh người thật).
- [ ] A có thể để trống ảnh, người duyệt sẽ thử chạm ảnh đại diện để chọn ảnh.

**Bước 9 — Hạn mức AI và gói**

- [ ] Cả ba tài khoản ở gói **miễn phí**. Không mua gói cho tài khoản demo. Máy chủ mới đã bỏ chữ "Gia hạn" khỏi thông báo sắp hết gói, không đẩy thông báo gói và thanh toán xuống iPhone, và app iPhone ẩn các thông báo đó (`08`, IOS-21). Giữ gói miễn phí vẫn là cách chắc nhất.
- [ ] Gói miễn phí có 20 lượt AI mỗi tháng cho **mỗi tài khoản** (`BE src/payments/subscription-entitlements.ts:39`; `BE src/payments/entitlements.service.ts:356`), tính chung cho tóm tắt cuộc họp và đề xuất công việc. Khi chuẩn bị, A chỉ nên dùng tối đa 3–5 lượt.
- [ ] Nếu vào tháng mới trong lúc Apple duyệt, lượt AI tự đầy lại.

**Bước 10 — Chạy thử toàn bộ trên iPhone thật (TestFlight)**

- [ ] Cài bản TestFlight, đăng nhập A, làm lần lượt 6 bước "HOW TO TEST" và mọi dòng "USER-GENERATED CONTENT" trong Notes. Chỗ nào không khớp chữ trên màn hình thì sửa Notes.
- [ ] Không thấy chữ "CH Play" ở đâu. Không có dải "Có bản cập nhật mới".
- [ ] Gửi được **ảnh từ thư viện iPhone** (ảnh HEIC) trong trò chuyện dự án và tin nhắn riêng (mục 8).
- [ ] Gửi thử một tin có từ phản cảm bằng tài khoản D tạm: người nhận thấy `***`. Báo cáo tin đó: thư tới hộp thư ở `REPORT_NOTIFY_EMAIL`, và báo cáo hiện ở trang quản trị "Báo cáo vi phạm". Xử lý xong báo cáo thử (Bỏ qua).
- [ ] "Nộp tài liệu" mở ứng dụng Tệp (Files) của iPhone và nộp được một tệp PDF nhỏ (`M src/lib/files/pick-documents.ts:22-30`). Máy của người duyệt có thể không sẵn tệp nào; nếu vậy họ chỉ thử được "Nhận việc" và "Duyệt bài".
- [ ] Thử xoá tài khoản bằng một tài khoản **D tạm** (đăng ký mới, tạo không gian, rồi xoá). Không xoá C, để C còn nguyên cho người duyệt.
- [ ] Đăng xuất khỏi A trên máy của bạn khi xong. Không bắt buộc, nhưng tránh vô tình thao tác lên dữ liệu mẫu.

### 4.3. Nội dung mẫu để dán

Trò chuyện dự án "Dự án mẫu", từ cũ tới mới. Chỉ tin số 10 có chữ "slide".

```text
1. Bảo: Chào cả nhóm! Tuần này mình chốt đề cương báo cáo cuối kỳ nhé.
2. Minh Anh: Ok Bảo. Mình chia 3 phần: nghiên cứu, thiết kế, thuyết trình.
3. Chi: Mình nhận phần khảo sát người dùng.
4. Bảo: (kèm ảnh) Ảnh bảng ý tưởng buổi họp hôm qua.
5. Minh Anh: Chi gửi bản nháp câu hỏi khảo sát trước 21:00 thứ Năm này nhé.
6. Chi: Được nha, mình gửi sớm.
7. Bảo: Ai xong phần nào thì nộp file trên WeDo để Minh Anh duyệt nha.
8. Minh Anh: Sáng thứ Bảy 9:00 họp online 30 phút để chốt nội dung.
9. Chi: Ok, mình vào đúng giờ.
10. Bảo: Minh Anh làm giúp slide phần thiết kế, hạn 20:00 thứ Sáu tuần này nhé.
```

Tin nhắn riêng A ↔ B:

```text
1. Bảo: Minh Anh ơi, tối nay bạn xem giúp mình phần mở đầu được không?
2. Minh Anh: Được, 8 giờ tối mình gọi nhé.
3. Bảo: (kèm ảnh) Mình gửi bản phác thảo trang bìa.
4. Minh Anh: Đẹp đó! Giữ tông xanh này nha.
```

Transcript cho cuộc họp M2 (dán vào ô "Nội dung transcript" trên web):

```text
Bảo: Hôm nay mình chốt nội dung thuyết trình cuối kỳ.
Minh Anh: Mình đề xuất 10 slide, chia 3 phần: vấn đề, giải pháp, kết quả khảo sát.
Chi: Khảo sát đã có 30 phản hồi, mình tổng hợp biểu đồ trước tối thứ Tư.
Bảo: Mình lo phần demo sản phẩm và quay video 2 phút.
Minh Anh: Vậy chốt: 20:00 thứ Sáu gửi bản slide hoàn chỉnh lên nhóm.
Bảo: Đồng ý. Chủ nhật 19:00 cả nhóm tập thuyết trình.
```

### 4.4. Xoá tài khoản: vì sao dựng như vậy

Máy chủ làm gì:

- Trước khi xoá, máy chủ tìm các không gian làm việc mà người này **làm chủ và còn thành viên khác**. Có một cái là từ chối, báo "Bạn đang là chủ sở hữu của không gian làm việc còn thành viên khác. Hãy chuyển quyền sở hữu trước khi xoá tài khoản." (`BE src/users/users.service.ts:74-129`).
- Không vướng thì xoá hẳn tài khoản trong cơ sở dữ liệu, kéo theo tin nhắn, tin nhắn riêng, bạn bè, thông báo, tệp đã nộp, cuộc họp người đó tạo và các không gian chỉ có một mình người đó (`BE src/users/users.service.ts:131`; quan hệ `onDelete: Cascade` trong `BE prisma/schema.prisma`, ví dụ `:368`, `:437`, `:490`, `:617`).
- Máy chủ mới (`ios-backend`, commit `3386c52`) còn xoá tệp trên Azure Blob Storage: tệp đính kèm trò chuyện và tệp nộp bài người đó tải lên, cùng mọi tệp trong các không gian bị xoá theo. Việc xoá tệp chạy ngay sau khi xoá tài khoản; lỗi thì máy chủ ghi log. Tệp người khác đã chuyển tiếp vẫn còn. Ảnh đại diện nằm ngay trong dòng tài khoản nên mất cùng dòng đó. Máy chủ cũ đang chạy **chưa** xoá tệp; chỉ nộp khi máy chủ mới đã lên.

App làm gì:

- Màn "Xoá tài khoản" liệt kê dữ liệu sẽ bị xoá, trong đó có dòng "Tin nhắn riêng, danh sách bạn bè, ảnh và tệp bạn đã tải lên". Màn hiện một thẻ đỏ cho mỗi không gian đang vướng, liệt kê thành viên để chạm chọn người nhận quyền chủ (`M src/app/account/delete-account.tsx`).
- Ô gõ **XOA** và nút "Xoá tài khoản vĩnh viễn" **chỉ hiện khi không còn vướng**. Sau đó app hỏi lại một lần ("Xoá tài khoản vĩnh viễn?"), chạm "Xoá tài khoản" là xong.
- Đường đi đầy đủ: tab **Tài khoản** → dòng **Xoá tài khoản** (gần cuối, ngay trên Đăng xuất) → gõ **XOA** → **Xoá tài khoản vĩnh viễn** → **Xoá tài khoản** trong hộp xác nhận (`M src/app/(tabs)/account/index.tsx:355-362`).

Với cách dựng ở mục 4.1:

- A và C không làm chủ không gian chung nào, nên ô XOA hiện ngay.
- B làm chủ, nên người duyệt thử bằng B sẽ phải chuyển quyền trước. Notes đã nói rõ điều này và xin người duyệt dùng C.
- Nếu người duyệt vẫn chuyển quyền của B cho A rồi xoá B: A thành chủ không gian chung, từ đó A không xoá ngay được nữa. Tin nhắn, tệp và cuộc họp của B cũng mất. Trước lần nộp sau phải dựng lại cả bộ theo mục 4.2.
- Nếu người duyệt xoá A: tin A đã gửi, tin nhắn riêng và tệp A đã nộp đều mất, việc của A thành chưa giao. Không gian, dự án, cuộc họp của B còn nguyên. Trước lần nộp sau phải dựng lại A theo mục 4.2.
- Máy chủ lỗi lúc mở màn này thì app hiện "Không tải được thông tin tài khoản." cùng nút **"Thử lại"**. Chưa tải được thì chưa có nút xoá. Giữ máy chủ chạy ổn định suốt thời gian duyệt.

### 4.5. Giữ tài khoản demo sống suốt thời gian duyệt

- Không đổi mật khẩu, không xoá, không đổi vai trò ba tài khoản.
- Giữ backend Azure chạy liên tục. Nếu gói App Service có tuỳ chọn **Always On**, bật nó để lần gọi đầu không bị chậm.
- Mỗi lần nộp lại: kiểm hạn chót còn ở tương lai, lượt AI còn, A và C còn tồn tại, T1 còn ở "Chờ nhận", T3 còn chờ duyệt, tin "slide" chưa thành công việc, lời mời kết bạn của C còn chờ, không ai đang bị chặn. Cái nào người duyệt đã dùng thì dựng lại (tin "slide" đã dùng thì B gửi lại một tin giống tin số 10, rồi sửa Notes thành `the last message containing "slide"`).
- Được duyệt rồi vẫn giữ các tài khoản này. Mỗi bản cập nhật sau đều qua duyệt lại và dùng lại chúng.

---

## 5. Contact Information

Người Apple liên hệ khi cần hỏi. Không hiện công khai trên App Store.

```text
First name: [TÊN]
Last name: [HỌ]
Phone number: [SỐ ĐIỆN THOẠI]
Email: wedosupport6886@gmail.com
```

- `[TÊN]`, `[HỌ]`: ⚠ Giả định: người liên hệ là chủ tài khoản nhà phát triển, Lê Hữu Đại. Ví dụ: First name = Đại, Last name = Lê Hữu. Viết không dấu (Dai, Le Huu) cũng được, người duyệt đọc dễ hơn.
- `[SỐ ĐIỆN THOẠI]`: số bạn nghe máy được, dạng quốc tế, **bắt đầu bằng dấu +** rồi mã nước 84, bỏ số 0 đầu. Ví dụ dạng: `+84 9xx xxx xxx`. Ô này không nhận số viết liền không có dấu +.
- Email: `wedosupport6886@gmail.com`, email hỗ trợ đã chốt. Điều kiện đọc thư hằng ngày ghi ở `07-trang-ho-tro.md` mục 0.

---

## 6. Notes — ghi chú cho người duyệt

### 6.1. Đọc trước khi dán

- Apple giới hạn ô Notes ở **4.000 byte**, viết bằng ngôn ngữ nào cũng được (trang "Platform version information" của App Store Connect). Chữ tiếng Anh tốn 1 byte, chữ tiếng Việt có dấu tốn 2–3 byte, ký hiệu `⋯` và `⋮` tốn 3 byte. Khối dưới đây là **toàn bộ** ghi chú, đã gộp đoạn "User-generated content (Guideline 1.2)" của tài liệu 06 (mục 9). **Đừng dán thêm đoạn của tài liệu 06**, sẽ trùng ý và vượt giới hạn.
- Thay 7 chỗ trống trước khi dán: `[EMAIL DEMO]`, `[MẬT KHẨU DEMO]`, `[EMAIL DEMO B]`, `[MẬT KHẨU DEMO B]`, `[EMAIL DEMO C]`, `[MẬT KHẨU DEMO C]`, `[TÊN NHÀ CUNG CẤP AI]`. Email hỗ trợ đã điền sẵn.
- `[TÊN NHÀ CUNG CẤP AI]`: xem biến môi trường của backend trên Azure. Máy chủ ưu tiên theo thứ tự này (`BE src/chat/chat.service.ts`, khoảng dòng 1072–1103): có `GEMINI_API_KEY` thì ghi `Google Gemini`; không có mà đủ ba biến `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT` thì ghi `Azure OpenAI`; không có cả hai mà có `OPENAI_API_KEY` thì ghi `OpenAI`.
- Hộp thoại xin đồng ý trong app nêu đủ cả ba "(Google Gemini, Azure OpenAI hoặc OpenAI)" và "khoảng 12 tin nhắn gần nhất" (`M src/lib/ai/dong-y-ai.ts`, commit `608d06c`). Khi đã biết nhà cung cấp thật, ghi đúng tên đó vào Notes; tên trong Notes phải nằm trong ba tên của hộp thoại và của Chính sách quyền riêng tư.
- Dòng "Reports reach our team at once (email and admin console)" chỉ đúng khi biến `REPORT_NOTIFY_EMAIL` trên Azure đã có giá trị (`08`, Bước A2).
- Mọi dòng dưới đây đã khớp với mã trên nhánh iOS. Nếu sau này đổi chữ trên màn hình, sửa Notes theo. Không bao giờ để ghi chú hứa thứ app chưa có.

### 6.2. Khối để dán (tiếng Anh)

```text
WeDo is a free team-work app for Vietnamese students, the iPhone companion to https://wedofpt.com.vn. The app is in Vietnamese; English meanings are in brackets.

DEMO ACCOUNTS (email + password; no email verification, no OTP)
A, main: [EMAIL DEMO] / [MẬT KHẨU DEMO] - Leader of the sample project.
B, teammate: [EMAIL DEMO B] / [MẬT KHẨU DEMO B] - for real-time chat on a second device.
C, for the deletion test: [EMAIL DEMO C] / [MẬT KHẨU DEMO C]
Please type the emails in lowercase. Projects are created on the web, so the sample data is pre-loaded.

SIGN IN: email and password only; no third-party or social login, so Guideline 4.8 does not apply. Google users from our website first set a password via "Quên mật khẩu?" (Forgot password?).

HOW TO TEST (as A)
1. Chat: Trò chuyện (Chat tab) > Dự án (Projects) > "Dự án mẫu (Demo Project)". The camera and photo icons send pictures.
2. AI (Leaders only): long-press the message containing "slide" > Tạo công việc bằng AI (Create task with AI). A first-time consent dialog says what goes to [TÊN NHÀ CUNG CẤP AI]: the message, nearby messages and member names, never emails or phone numbers. Đồng ý (Agree) > review the draft > Tạo công việc (Create task). Không, cảm ơn (No, thanks) sends nothing. Switch: Tài khoản > Cho phép dùng AI (Allow AI).
3. DMs: Trò chuyện > Tin nhắn (Messages). Friends: people icon at the top right; Kết bạn (Add), Duyệt (Accept), Từ chối (Decline). Search needs 3+ characters.
4. Tasks: Công việc (Tasks tab) > a task: Nhận việc (Accept), Nộp tài liệu (Attach file), Gửi duyệt (Submit). Review B's work via Thông báo (Notifications): Duyệt bài (Approve), Trả lại (Return).
5. Meetings: Cuộc họp (Meetings tab) > a meeting: summary, decisions, action items. Vào phòng họp (Join) opens Daily.co in the browser; the app never uses the microphone.
6. Tài khoản (Account tab): tap the avatar to change it. Terms, privacy policy, support and contact rows are here.

ACCOUNT DELETION
Tài khoản > Xoá tài khoản (Delete account) > type XOA > Xoá tài khoản vĩnh viễn > confirm. Immediate and permanent; uploaded photos and files are deleted too. Please use C; B owns the shared workspace and must hand it over first.

USER-GENERATED CONTENT
- Terms: sign-up requires ticking "I am 18 or older and agree to the Terms of Use and Privacy Policy"; Đăng ký (Sign up) stays disabled until then. Minimum age 18, so the rating is 18+. Accounts that have not agreed get a one-time Terms screen: Đồng ý và tiếp tục (Agree and continue). The Terms state zero tolerance for objectionable content and abusive users: https://wedofpt.com.vn/dieu-khoan.html
- Filter: objectionable Vietnamese and English words in messages and display names are replaced with *** automatically.
- Report: long-press a message > Báo cáo tin nhắn (Report message) > a reason > Gửi báo cáo (Send). Report a person: ⋯ at the top of a DM, or ⋮ on any row in Friends, requests included > Báo cáo người này.
- Block: the same menus > Chặn người này (Block) > Chặn. Instant: no DMs or friend requests either way, and their messages are hidden. Unblock: Tài khoản > Người đã chặn (Blocked users).
- Reports reach our team at once (email and admin console). Within 24 hours we remove the content and suspend the poster, who then cannot sign in. Contact: wedosupport6886@gmail.com

PAYMENTS: free; no in-app purchases, prices, upgrade buttons or links to buy. Optional paid plans exist only on our website and are never mentioned in the app (3.1.3(f)). AI use has a monthly limit.

PERMISSIONS: camera and photos only for chat pictures and the avatar. Notification permission is asked only via Bật thông báo (Turn on notifications) in Thông báo.
```

**Số ký tự: 3.674 / 4.000. Số byte UTF-8: 3.850 / 4.000** (3.880 byte nếu mỗi lần xuống dòng tính 2 byte), đếm theo NFC, tính cả 7 chỗ trống. Bảy chỗ trống đang chiếm 110 ký tự, 126 byte. Tính theo cách chặt nhất, 7 giá trị thật được dùng tổng cộng tối đa **246 byte**. Ba email, ba mật khẩu không dấu và tên nhà cung cấp AI thường chỉ khoảng 110–140 byte, còn dư. Dán xong, xem App Store Connect có báo vượt giới hạn không.

### 6.3. Bản dịch tiếng Việt (để đối chiếu, không dán)

```text
WeDo là ứng dụng làm việc nhóm miễn phí cho sinh viên Việt Nam, là bản iPhone đi kèm https://wedofpt.com.vn. Ứng dụng chỉ có tiếng Việt; nghĩa tiếng Anh ghi trong ngoặc.

TÀI KHOẢN DEMO (email + mật khẩu; không xác minh email, không OTP)
A, tài khoản chính: [EMAIL DEMO] / [MẬT KHẨU DEMO] - Leader của dự án mẫu.
B, đồng đội: [EMAIL DEMO B] / [MẬT KHẨU DEMO B] - dùng trên máy thứ hai để thấy tin nhắn tới ngay lập tức.
C, để thử xoá tài khoản: [EMAIL DEMO C] / [MẬT KHẨU DEMO C]
Vui lòng gõ email bằng chữ thường. Dự án được tạo trên web, nên dữ liệu mẫu đã nạp sẵn.

ĐĂNG NHẬP: chỉ email và mật khẩu; không có đăng nhập qua bên thứ ba hay mạng xã hội, nên Guideline 4.8 không áp dụng. Người đã đăng ký bằng Google trên web thì đặt mật khẩu trước bằng "Quên mật khẩu?".

CÁCH THỬ (bằng A)
1. Trò chuyện dự án: tab Trò chuyện > Dự án > "Dự án mẫu (Demo Project)". Biểu tượng máy ảnh và ảnh để gửi hình.
2. AI (chỉ Leader): nhấn giữ tin nhắn có chữ "slide" > Tạo công việc bằng AI. Lần đầu, hộp thoại xin đồng ý nói rõ dữ liệu nào gửi cho [TÊN NHÀ CUNG CẤP AI]: tin được chọn, vài tin xung quanh và tên thành viên, không bao giờ gửi email hay số điện thoại. Đồng ý > xem bản nháp > Tạo công việc. Chọn "Không, cảm ơn" thì không gửi gì. Công tắc: Tài khoản > Cho phép dùng AI.
3. Tin nhắn riêng: Trò chuyện > Tin nhắn. Bạn bè: biểu tượng người ở góc trên bên phải; Kết bạn, Duyệt, Từ chối. Tìm cần gõ ít nhất 3 ký tự.
4. Công việc: tab Công việc > một việc: Nhận việc, Nộp tài liệu, Gửi duyệt. Duyệt bài của B từ tab Thông báo: Duyệt bài hoặc Trả lại.
5. Cuộc họp: tab Cuộc họp > một cuộc họp: tóm tắt, quyết định, hạng mục hành động. Vào phòng họp mở phòng Daily.co trong trình duyệt; ứng dụng không bao giờ dùng micro.
6. Tab Tài khoản: chạm ảnh đại diện để đổi. Các dòng Điều khoản sử dụng, Chính sách quyền riêng tư, Hỗ trợ và Liên hệ nằm ở đây.

XOÁ TÀI KHOẢN
Tài khoản > Xoá tài khoản > gõ XOA > Xoá tài khoản vĩnh viễn > xác nhận. Xoá ngay và vĩnh viễn; ảnh và tệp đã tải lên cũng bị xoá. Vui lòng dùng C; B là chủ không gian làm việc chung và phải chuyển quyền trước.

NỘI DUNG DO NGƯỜI DÙNG TẠO
- Điều khoản: để đăng ký phải đánh dấu ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư"; nút Đăng ký tắt cho tới lúc đó. Tuổi tối thiểu 18, nên mức tuổi là 18+. Tài khoản chưa đồng ý sẽ gặp màn Điều khoản một lần: Đồng ý và tiếp tục. Điều khoản nói rõ không khoan nhượng với nội dung phản cảm và người dùng lạm dụng: https://wedofpt.com.vn/dieu-khoan.html
- Bộ lọc: từ ngữ phản cảm tiếng Việt và tiếng Anh trong tin nhắn và tên hiển thị tự động bị thay bằng ***.
- Báo cáo: nhấn giữ tin nhắn > Báo cáo tin nhắn > chọn lý do > Gửi báo cáo. Báo cáo một người: nút ⋯ ở đầu tin nhắn riêng, hoặc nút ⋮ ở bất kỳ dòng nào trong màn Bạn bè, kể cả lời mời > Báo cáo người này.
- Chặn: cùng các trình đơn đó > Chặn người này > Chặn. Có tác dụng ngay: hai bên không nhắn riêng hay gửi lời mời kết bạn được, và tin nhắn của họ bị ẩn. Bỏ chặn: Tài khoản > Người đã chặn.
- Báo cáo tới đội ngũ ngay (qua email và trang quản trị). Trong 24 giờ, chúng tôi gỡ nội dung và khoá tài khoản đã đăng; tài khoản bị khoá không đăng nhập được. Liên hệ: wedosupport6886@gmail.com

THANH TOÁN: miễn phí; không mua hàng trong ứng dụng, không hiện giá, không nút nâng cấp, không đường dẫn để mua. Gói trả phí tuỳ chọn chỉ có trên web và ứng dụng không bao giờ nhắc tới (3.1.3(f)). Dùng AI có giới hạn theo tháng.

QUYỀN: máy ảnh và ảnh chỉ để gửi hình trong trò chuyện và đặt ảnh đại diện. Quyền thông báo chỉ được hỏi khi người dùng chạm "Bật thông báo" ở tab Thông báo.
```

---

## 7. Attachment — tệp đính kèm

Không bắt buộc, nhưng nên có. Một đoạn quay màn hình ngắn giúp người duyệt thấy ngay những chỗ khó tìm: nhấn giữ tin nhắn, báo cáo, chặn, xoá tài khoản. Tải tệp lên ô **Attachment** trong mục App Review Information. Tệp đính kèm không tự chuyển sang phiên bản sau: mỗi lần nộp phiên bản mới phải tải lại.

Gợi ý quay (1–2 phút, iPhone thật, bản TestFlight, dọc):

1. Đăng nhập bằng A.
2. Trò chuyện → Dự án mẫu → nhấn giữ **tin số 5** → Tạo công việc bằng AI → hộp thoại "Dùng AI để gợi ý công việc?" → Đồng ý → bản nháp → Tạo công việc. Nếu A đã đồng ý từ trước (hộp thoại không hiện), tắt công tắc "Cho phép dùng AI" trong Tài khoản rồi quay lại. Không dùng tin "slide": tin đã thành công việc thì AI không đề xuất lại, mà tin đó để dành cho người duyệt.
3. Nhấn giữ một tin khác → Báo cáo tin nhắn → chọn lý do → Gửi báo cáo → "Đã gửi báo cáo…". Nhấn giữ tin của C → Chặn người này → Chặn: tin của C biến mất. Tài khoản → Người đã chặn → Bỏ chặn. Mở màn Bạn bè, chạm nút ⋮ ở một dòng để thấy "Báo cáo người này".
4. Đăng xuất. Màn Đăng nhập chỉ có email và mật khẩu, không có nút Google. Đăng ký tài khoản **D tạm**: khi chưa đánh dấu ô "Tôi đủ 18 tuổi…" thì nút Đăng ký tắt; đánh dấu rồi mới bấm được.
5. D tạo không gian → Tài khoản → Xoá tài khoản → gõ XOA → Xoá tài khoản vĩnh viễn → xác nhận.

Cách quay: Trung tâm điều khiển → nút Ghi màn hình. Cắt bớt trong ứng dụng Ảnh rồi xuất tệp `.mov` hoặc `.mp4`. Đặt đuôi tệp bằng chữ thường (`.mp4`, không phải `.MP4`): trên diễn đàn Apple Developer có người báo tải lên lỗi vì đuôi viết hoa.

Lưu ý khi quay:

- Chỉ dùng tài khoản demo. **Không** quay kết quả tìm bạn bè có người dùng thật. Máy chủ mới giấu email của người chưa là bạn, nhưng danh sách bạn bè vẫn hiện email của bạn bè.
- Quay trên bản build đã nối máy chủ mới (sau `08`, Bước A). Không dựng cảnh.
- Quay xong: bỏ chặn C, và kiểm lại mục 4.5 (tin "slide" chưa thành công việc, lượt AI còn).

---

## 8. Trước khi bấm Submit for Review: kiểm để ghi chú nói đúng sự thật

Mỗi dòng dưới đây là một câu trong Notes. Cột giữa nói mã đã có chưa (đọc trên ba nhánh iOS ngày 26/09/2026). Cột cuối là việc còn phải làm để câu đó đúng **trên bản đang nộp và máy chủ đang chạy**. Mã có trên nhánh chưa đủ: máy chủ và web phải lên production trước (`08`, mục Thứ tự đưa lên).

| # | Notes nói | Trạng thái mã | Việc còn phải làm |
|---|---|---|---|
| 1 | SIGN IN: chỉ email và mật khẩu, không có đăng nhập bên thứ ba. | Đã làm: nút Google và dòng "hoặc" ẩn trên iPhone, app không gọi SDK Google trên iPhone (`08`, IOS-02). | Thử trên TestFlight: không thấy nút ở cả hai màn. |
| 2 | Tài khoản tạo bằng Google trên web đặt mật khẩu qua "Quên mật khẩu?". | Đúng với mã máy chủ (mục 2). | Thử một lần trên TestFlight với một tài khoản Google thật của nhóm. |
| 3 | Nhấn giữ → "Tạo công việc bằng AI"; lần đầu có hộp thoại xin đồng ý; "Không, cảm ơn" không gửi gì; công tắc "Cho phép dùng AI". | Đã làm (`08`, IOS-08). Máy chủ mới không gửi email cho AI (IOS-09). | Máy chủ mới lên production. Điền đúng `[TÊN NHÀ CUNG CẤP AI]`, khớp với câu trong hộp thoại (mục 6.1). |
| 4 | Báo cáo tin nhắn, Báo cáo người này, Chặn người này, Người đã chặn. | Đã làm (`08`, IOS-03, IOS-04). | Máy chủ mới lên production. Thử trọn luồng trên TestFlight. |
| 5 | Ô 18+, nút Đăng ký tắt khi chưa đánh dấu, màn Điều khoản một lần "Đồng ý và tiếp tục", trang `dieu-khoan.html`. | Đã làm: app, máy chủ và trang web (`08`, IOS-06). | Máy chủ mới và web mới lên production. `https://wedofpt.com.vn/dieu-khoan.html` trả 200. |
| 6 | Bộ lọc thay từ phản cảm bằng `***`. | Đã làm (`08`, IOS-03). | Máy chủ mới lên production. Gửi thử một tin có từ phản cảm. |
| 7 | Báo cáo tới đội ngũ ngay (email, trang quản trị); xử lý trong 24 giờ; khoá tài khoản vi phạm. | Đã làm: thư báo, trang "Báo cáo vi phạm", khoá tài khoản (`08`, IOS-03, IOS-05). | Đặt `REPORT_NOTIFY_EMAIL` trên Azure. Web mới lên production. Phân công người trực mỗi ngày (tài liệu 06, mục 7). |
| 8 | Biểu tượng ảnh gửi được hình. | Đã làm: ảnh HEIC đổi sang JPEG trước khi gửi (`08`, IOS-13). | Thử gửi ảnh từ thư viện trên iPhone thật. |
| 9 | Dòng Điều khoản sử dụng, Chính sách quyền riêng tư, Hỗ trợ, Liên hệ trong tab Tài khoản. | Đã làm: bốn dòng luôn hiện, chính sách có đường dẫn dự phòng (`08`, IOS-07, IOS-15). | Web mới lên production, để `ho-tro.html` và `dieu-khoan.html` không trả 404. |
| 10 | Không có đường dẫn để mua; ứng dụng không nhắc gói trả phí. | Đã làm: ẩn "Xem đầy đủ trên web"; ẩn thông báo gói và thanh toán; máy chủ bỏ chữ "Gia hạn" (`08`, IOS-11, IOS-21). | Chạy lệnh kiểm chữ ở `08` (IOS-22) trước khi build. |
| 11 | (Ngầm hiểu) App không nhắc tới Google Play. | Đã làm: iPhone đọc `MOBILE_IOS_*`, nút mở App Store; thiếu đường dẫn App Store thì không hiện gì (`08`, IOS-12). | Để trống `MOBILE_IOS_MINIMUM_VERSION` và `MOBILE_IOS_LATEST_VERSION` trong lúc duyệt. |
| 12 | Xoá tài khoản xoá ngay, kể cả ảnh và tệp đã tải lên. | Đã làm: máy chủ mới xoá tệp trên Azure Blob (`08`, IOS-20). | Máy chủ mới lên production. Thử xoá một tài khoản tạm có ảnh. |
| 13 | Quyền thông báo chỉ hỏi khi chạm "Bật thông báo". | Đã làm (`08`, IOS-29). | Thử trên máy cài mới. |
| 14 | Máy chủ đang chạy; AI, phòng họp chạy được. | Phụ thuộc biến môi trường trên Azure. | Thử AI, "Vào phòng họp" và xoá tài khoản ngay trước khi nộp. |

---

## 9. Nếu bị từ chối

### 9.0. Cách trả lời

1. Đọc kỹ thư của Apple. Thư ghi số guideline, mô tả lỗi, đôi khi có ảnh chụp màn hình.
2. Xác định loại việc:
   - **Cần build mới** (sửa mã): tăng `ios.buildNumber` trong `M app.json` (1 → 2 → 3...), build và tải lên bằng EAS, chọn build mới cho phiên bản 1.0.13 trong App Store Connect rồi gửi duyệt lại.
   - **Chỉ sửa thông tin** (Notes, ảnh, mô tả): sửa trong App Store Connect rồi trả lời. Apple cho nộp lại đúng build cũ khi lỗi chỉ nằm ở phần thông tin.
   - **Apple hiểu nhầm**: trả lời giải thích, chỉ đúng đường đi trong app, kèm video.
3. Chỗ trả lời (trang "Reply to App Review messages" của Apple): App Store Connect → Apps → chọn WeDo → bấm dòng báo có vấn đề chưa giải quyết ở đầu trang → mục In Progress → **Resolve** cạnh lần nộp → **Reply to App Review**. Nhiều người vẫn gọi chỗ này là Resolution Center. Ô trả lời giới hạn **4.000 ký tự**. Đính kèm ảnh, video bằng nút **Attach File**.
4. Viết tiếng Anh, lịch sự, ngắn. Trả lời đúng từng ý Apple nêu. Ghi số build mới nếu có. Kèm video hoặc ảnh khi nói về chỗ khó tìm.
5. Không dùng EAS Update (cập nhật qua mạng) để vá trong lúc Apple đang duyệt. Người duyệt có thể thấy app khác với build đã nộp. Hãy nộp build mới.
6. Nếu thật sự cho rằng Apple sai: trả lời giải thích kèm bằng chứng trước. Vẫn không được thì gửi kháng nghị (appeal) qua trang liên hệ của Apple Developer, như mục "Appeals" cuối App Review Guidelines hướng dẫn.
7. Sau mỗi lần trả lời, kiểm lại dữ liệu demo (mục 4.5). Người duyệt có thể đã xoá A hoặc C, đã dùng hết lượt AI, đã chặn ai đó.

Mọi mẫu dưới đây có chỗ trống `[SỐ BUILD]`, `[HỌ TÊN]`. Mọi tính năng các mẫu nhắc tới đã có trong mã trên nhánh iOS; chỉ gửi khi build đang duyệt có chúng và máy chủ mới đã chạy. Ô trả lời giới hạn 4.000 ký tự; các mẫu dưới dài từ 228 đến 1.472 ký tự (đếm cả chỗ trống), còn dư nhiều.

### 9.1. Guideline 4.8 — Login Services (nếu Apple vẫn nhắc)

- **Apple thường nói:** app có đăng nhập Google nhưng không có lựa chọn đăng nhập tương đương giữ kín email, như Sign in with Apple.
- **Vì sao WeDo ít khả năng dính:** bản iPhone đã ẩn nút Google (`08`, IOS-02), nên app chỉ dùng tài khoản riêng của WeDo. Guideline 4.8 miễn cho app chỉ dùng hệ tài khoản và đăng nhập của chính mình. Nguy cơ còn lại: build nộp vẫn còn nút Google (quên IOS-02), hoặc người duyệt đọc chữ "Google" trong mô tả hay Notes rồi hiểu nhầm.
- **Làm gì:** mở build đã nộp trên iPhone, kiểm màn Đăng nhập và Đăng ký không có nút Google. Còn nút thì sửa, nộp build mới. Không còn thì trả lời bằng mẫu dưới, kèm video hai màn đó. Nếu Apple vẫn đòi, làm Sign in with Apple theo mục Bản sau của `08` (SAU-01, SAU-02, khoảng 5–6 ngày công).

```text
Hello App Review team,

Thank you for your review. The iPhone app uses only our own account system: users sign in with the email and password of their WeDo account. It offers no third-party or social login, and there is no Google button on the Sign in (Đăng nhập) or Sign up (Đăng ký) screen. Under Guideline 4.8, an app that exclusively uses its own account setup and sign-in system does not need to offer Sign in with Apple.

Google sign-in exists only on our website. People who created their account that way first set a password with "Quên mật khẩu?" (Forgot password?) on the iPhone sign-in screen.

A short screen recording of both screens is attached. Could you please review build [SỐ BUILD] again?

Best regards,
[HỌ TÊN]
```

Số ký tự: 731 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn đã xem xét. Ứng dụng iPhone chỉ dùng hệ tài khoản riêng của chúng tôi: người dùng đăng nhập bằng email và mật khẩu của tài khoản WeDo. Ứng dụng không có đăng nhập qua bên thứ ba hay mạng xã hội, và không có nút Google ở màn Đăng nhập hay Đăng ký. Theo Guideline 4.8, ứng dụng chỉ dùng hệ tài khoản và đăng nhập của chính mình thì không cần Sign in with Apple. Đăng nhập Google chỉ có trên web. Người tạo tài khoản theo cách đó đặt mật khẩu trước bằng "Quên mật khẩu?" ở màn đăng nhập trên iPhone. Có kèm video hai màn. Nhờ xem lại build [SỐ BUILD].

### 9.2. Guideline 1.2 — User-Generated Content (báo cáo, chặn)

- **Apple thường nói:** app có nội dung do người dùng tạo nhưng thiếu cơ chế phòng lạm dụng. Guideline 1.2 đòi bốn thứ: cách lọc nội dung phản cảm, cách báo cáo kèm phản hồi kịp thời, cách chặn người dùng lạm dụng, thông tin liên hệ công khai. Thư từ chối 1.2 của Apple thường liệt kê thêm: người dùng phải đồng ý điều khoản (EULA) nói rõ không khoan nhượng, và nhà phát triển xử lý báo cáo trong 24 giờ. Hai ý sau là theo thư từ chối hay gặp, không phải nguyên văn guideline.
- **Vì sao WeDo vẫn có thể dính:** có trò chuyện dự án, tin nhắn riêng, ảnh, lời mời kết bạn, tìm được người khác theo tên. Đủ bốn thứ đã có trong mã (`08`, IOS-03 … IOS-07). Nguy cơ còn lại: người duyệt không tìm thấy nút (nhấn giữ, nút ba chấm), hoặc máy chủ đang chạy chưa phải bản mới.
- **Làm gì:** kiểm máy chủ đang chạy là bản mới, rồi trả lời bằng mẫu dưới, kèm ảnh chụp bảng thao tác, phiếu báo cáo, màn Người đã chặn, màn đăng ký có ô đồng ý và màn đồng ý một lần.

```text
Hello App Review team,

Thank you for your feedback. Build [SỐ BUILD] includes these safety features for user-generated content:

1. Terms: every user must confirm they are 18 or older and accept our Terms of Use (https://wedofpt.com.vn/dieu-khoan.html), which state zero tolerance for objectionable content and abusive users. New users tick a required box on the Đăng ký (Sign up) screen; accounts that have not agreed see a one-time Terms screen.
2. Filter: objectionable Vietnamese and English words in messages and display names are replaced with *** automatically.
3. Report: long-press any message in a project chat or direct message > Báo cáo tin nhắn (Report message), then pick a reason. A person can be reported from the ⋯ menu of a direct message or the ⋮ button on the Bạn bè (Friends) screen > Báo cáo người này (Report user).
4. Block: the same menus > Chặn người này (Block this user). It takes effect immediately in both directions. Unblock in Tài khoản > Người đã chặn (Blocked users).
5. Action: every report reaches our team at once by email and in our admin console. We review it within 24 hours, remove the content and suspend the account that posted it. Suspended accounts cannot sign in.
6. Contact: wedosupport6886@gmail.com, shown in the app (Tài khoản > Liên hệ) and published in our Terms of Use, Privacy Policy and support page.

Screenshots and a screen recording are attached. Could you please review build [SỐ BUILD]?

Best regards,
[HỌ TÊN]
```

Số ký tự: 1.472 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn góp ý. Build [SỐ BUILD] có các tính năng an toàn sau cho nội dung do người dùng tạo: (1) Điều khoản: mọi người dùng phải xác nhận đủ 18 tuổi và chấp nhận Điều khoản sử dụng, trong đó nói rõ không khoan nhượng với nội dung phản cảm và người dùng lạm dụng. Người dùng mới đánh dấu ô bắt buộc ở màn Đăng ký; tài khoản chưa đồng ý gặp màn Điều khoản một lần. (2) Bộ lọc: từ ngữ phản cảm tiếng Việt và tiếng Anh trong tin nhắn và tên hiển thị tự động bị thay bằng ***. (3) Báo cáo: nhấn giữ tin nhắn trong trò chuyện dự án hoặc tin nhắn riêng > Báo cáo tin nhắn, rồi chọn lý do. Báo cáo một người từ trình đơn ⋯ của tin nhắn riêng hoặc nút ⋮ ở màn Bạn bè > Báo cáo người này. (4) Chặn: cùng các trình đơn đó > Chặn người này; có tác dụng ngay theo cả hai chiều; bỏ chặn ở Tài khoản > Người đã chặn. (5) Xử lý: mọi báo cáo tới đội ngũ ngay qua email và trang quản trị; chúng tôi xem trong 24 giờ, gỡ nội dung và khoá tài khoản đã đăng; tài khoản bị khoá không đăng nhập được. (6) Liên hệ: wedosupport6886@gmail.com, hiện trong app (Tài khoản > Liên hệ) và công bố trong Điều khoản, Chính sách quyền riêng tư và trang hỗ trợ. Có kèm ảnh và video. Nhờ xem lại build [SỐ BUILD].

### 9.3. Guideline 5.1.1(v) — Account Sign-In (xoá tài khoản)

- **Apple thường nói:** không tìm thấy cách xoá tài khoản trong app, hoặc xoá không được, hoặc app bắt liên hệ hỗ trợ mới xoá được.
- **Vì sao WeDo có thể dính:** app đã có đường xoá thật (mục 4.4). Nguy cơ chính là người duyệt thử bằng B (làm chủ không gian chung), gặp thẻ đỏ bắt chuyển quyền, và hiểu là không xoá được. Bản này không có Sign in with Apple, nên không có việc thu hồi token Apple.
- **Làm gì:** không cần build mới nếu app đã đúng. Trả lời bằng mẫu dưới, kèm video quay đủ đường đi với một tài khoản tạm. Câu "including uploaded photos and files" chỉ đúng khi máy chủ mới (xoá tệp trên Azure Blob, `08` IOS-20) đang chạy. Nếu vì lý do nào đó máy chủ đang chạy là bản cũ, thay câu đầu của đoạn thứ ba bằng `The account is deleted from our servers right away.`

```text
Hello App Review team,

Thank you for your review. Users can delete their account inside the app, without contacting us:

Tài khoản (Account tab) > Xoá tài khoản (Delete account) > type XOA > Xoá tài khoản vĩnh viễn (Delete account permanently) > confirm.

The account and its personal data, including uploaded photos and files, are deleted from our servers right away. One case needs an extra step: if the user owns a workspace that still has other members, the same screen first asks them to hand ownership to one of those members, so the team's shared projects are not deleted for everyone. The delete button appears right after that.

Demo account C ([EMAIL DEMO C] / [MẬT KHẨU DEMO C]) owns no shared workspace and can be deleted at once.

A screen recording of the full flow is attached.

Best regards,
[HỌ TÊN]
```

Số ký tự: 817 (đếm cả chỗ trống). Dùng câu thay thế ở trên thì còn 756.

> Bản dịch: Cảm ơn đã xem xét. Người dùng xoá được tài khoản ngay trong app, không cần liên hệ chúng tôi: Tài khoản > Xoá tài khoản > gõ XOA > Xoá tài khoản vĩnh viễn > xác nhận. Tài khoản và dữ liệu cá nhân, kể cả ảnh và tệp đã tải lên, bị xoá khỏi máy chủ ngay. Có một trường hợp thêm một bước: nếu người dùng làm chủ một không gian làm việc còn thành viên khác, chính màn này yêu cầu chuyển quyền chủ cho một thành viên, để dự án chung của nhóm không bị xoá theo. Nút xoá hiện ngay sau đó. Tài khoản demo C không làm chủ không gian chung nào, xoá được ngay. Có kèm video toàn bộ đường đi.

### 9.4. Guideline 5.1.2(i) — Data Use and Sharing (dữ liệu gửi cho AI bên thứ ba)

- **Apple thường nói:** app gửi dữ liệu cá nhân cho dịch vụ AI bên thứ ba mà không nói rõ và không xin phép trước. Nguyên văn 5.1.2(i) có nhắc tới "third-party AI".
- **Vì sao WeDo vẫn có thể dính:** app đã hỏi trước lần gửi đầu (`08`, IOS-08), và máy chủ mới không gửi email cho AI (IOS-09). Nguy cơ còn lại: tên nhà cung cấp trong hộp thoại ("Google Gemini hoặc OpenAI") không khớp với cấu hình thật; máy chủ vẫn gửi tối đa 12 tin gần nhất, có thể do người khác viết; và trên **web** (không phải app iPhone), tin Leader vừa gửi được tự đưa cho AI mà không hỏi. Chính sách quyền riêng tư đã nói thật cả ba điều.
- **Làm gì:** kiểm tên nhà cung cấp khớp ba nơi (hộp thoại, Notes, chính sách), rồi trả lời bằng mẫu dưới, kèm video: hộp thoại hiện ra, bấm "Không, cảm ơn" thì không có gì xảy ra, và công tắc "Cho phép dùng AI" trong Tài khoản.

```text
Hello App Review team,

Thank you for your feedback. Build [SỐ BUILD] asks for explicit permission before any personal data is shared with a third-party AI service:

- The first time a user taps Tạo công việc bằng AI (Create task with AI), a consent dialog explains that the selected message, a few nearby messages from the same project and the names of project members are sent to [TÊN NHÀ CUNG CẤP AI] to draft a task. Email addresses and phone numbers are never sent.
- Nothing is sent until the user taps Đồng ý (Agree). If they tap Không, cảm ơn (No, thanks), no data is sent and they can still create tasks by hand.
- Users can withdraw consent at any time with the Cho phép dùng AI (Allow AI) switch in the Tài khoản (Account) tab.
- Our Privacy Policy (https://wedofpt.com.vn/privacy.html) names the AI providers and lists the data sent.

A screen recording is attached. Could you please review build [SỐ BUILD]?

Best regards,
[HỌ TÊN]
```

Số ký tự: 944 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn góp ý. Build [SỐ BUILD] xin phép rõ ràng trước khi chia sẻ dữ liệu cá nhân với dịch vụ AI bên thứ ba. Lần đầu người dùng chạm Tạo công việc bằng AI, hộp thoại xin đồng ý giải thích rằng tin được chọn, vài tin xung quanh trong cùng dự án và tên thành viên dự án được gửi cho [TÊN NHÀ CUNG CẤP AI] để soạn công việc. Email và số điện thoại không bao giờ được gửi. Không gửi gì cho tới khi người dùng chạm Đồng ý. Chạm "Không, cảm ơn" thì không gửi dữ liệu và vẫn tạo công việc bằng tay được. Người dùng rút lại đồng ý bất cứ lúc nào bằng công tắc "Cho phép dùng AI" ở tab Tài khoản. Chính sách quyền riêng tư nêu tên các nhà cung cấp AI và liệt kê dữ liệu gửi đi. Có kèm video. Nhờ xem lại build [SỐ BUILD].

### 9.5. Guideline 3.1.1 / 3.1.3 — In-App Purchase (mua ngoài app)

- **Apple thường nói:** app mở khoá tính năng trả phí mà không qua mua hàng trong app, hoặc có nút, đường dẫn dẫn ra chỗ mua khác. Ngoài cửa hàng Mỹ, 3.1.1(a) cấm nút, đường dẫn và lời kêu gọi mua ở nơi khác. Apple cũng có thể gửi câu hỏi (2.1 Information Needed) về nội dung trả phí.
- **Vì sao WeDo có thể dính:** hai chỗ cũ đã sửa trên nhánh iOS: nút "Xem đầy đủ trên web" (mở trang có mục thanh toán) đã ẩn trên iPhone, và thông báo gói, thanh toán không còn tới iPhone (`08`, IOS-11, IOS-21). Chỗ còn lại: gói trả phí trên web (Personal Pro, Team Growth) nâng số lượt AI dùng trong app từ 20 lên 300 hoặc 1.000 lượt mỗi tháng (`BE src/payments/subscription-entitlements.ts:39`, `:57`, `:75`). Máy chủ chỉ áp hạn mức lượt AI theo gói; ngoài ra không khoá tính năng nào của app theo gói (`BE src/payments/entitlements.service.ts:69`, `:101`).
- **Làm gì:** gỡ chỗ Apple chỉ ra, nộp build mới, trả lời bằng mẫu dưới. Nếu Apple vẫn đòi mua hàng trong app cho phần lượt AI, đó là quyết định kinh doanh: hoặc thêm gói trả phí qua App Store (việc lớn: StoreKit, máy chủ nhận thông báo của Apple, khôi phục giao dịch), hoặc hỏi Apple cách làm để giữ app dạng miễn phí đi kèm. Đừng tự hứa trong thư điều chưa quyết.

```text
Hello App Review team,

Thank you for your review. WeDo for iPhone is a free stand-alone companion to our web service, as described in Guideline 3.1.3(f):

- The app sells nothing. It shows no prices, plans, upgrade buttons or links to buy.
- In build [SỐ BUILD] we removed [CHỖ APPLE CHỈ RA], so the app no longer opens any web page that offers purchases.
- Optional paid plans are sold only on our website. The app does not mention or link to them. An account on a paid plan gets a higher monthly AI limit; every feature in the app also works on a free account.

Could you please review build [SỐ BUILD]? If another screen still looks like a call to action, please tell us where and we will remove it.

Best regards,
[HỌ TÊN]
```

Số ký tự: 727 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn đã xem xét. WeDo trên iPhone là ứng dụng miễn phí đi kèm dịch vụ web, đúng như Guideline 3.1.3(f). App không bán gì, không hiện giá, gói, nút nâng cấp hay đường dẫn để mua. Trong build [SỐ BUILD] chúng tôi đã gỡ [CHỖ APPLE CHỈ RA], nên app không còn mở trang web nào có chỗ mua. Gói trả phí tuỳ chọn chỉ bán trên web; app không nhắc tới và không dẫn tới. Tài khoản có gói trả phí được nhiều lượt AI mỗi tháng hơn; mọi tính năng trong app đều dùng được với tài khoản miễn phí. Nhờ xem lại build [SỐ BUILD]. Nếu còn màn nào trông như lời mời mua, xin chỉ giúp, chúng tôi sẽ gỡ.

`[CHỖ APPLE CHỈ RA]`: viết bằng tiếng Anh, ví dụ `the "Xem đầy đủ trên web" (View on web) link on the contribution board`.

### 9.6. Guideline 2.1 — App Completeness (tài khoản demo, lỗi)

**Trường hợp 1: Apple không đăng nhập được, hoặc hỏi tài khoản demo.**

- **Nguyên nhân hay gặp:** gõ email có chữ hoa (máy chủ phân biệt, mục 2); `MOBILE_IOS_MINIMUM_VERSION` lớn hơn phiên bản đang duyệt (và `MOBILE_IOS_STORE_URL` có giá trị) nên app chặn ngay màn đăng nhập; tài khoản demo bị khoá nhầm ở trang "Báo cáo vi phạm"; máy chủ Azure tắt hoặc khởi động chậm; tài khoản đã bị xoá hoặc đổi mật khẩu.
- **Làm gì:** tự đăng nhập bằng đúng thông tin trên iPhone thật, sửa nguyên nhân, rồi trả lời. Không cần build mới.

```text
Hello App Review team,

Sorry for the trouble. Please use this demo account:

Email: [EMAIL DEMO]
Password: [MẬT KHẨU DEMO]

Sign in on the first screen (Đăng nhập = Sign in) with email and password. There is no email verification, one-time code or two-factor step. Please type the email in lowercase, exactly as shown. We signed in with this account on [NGÀY KIỂM] using build [SỐ BUILD] on an iPhone; the sample project, chats, tasks and meetings are in place and our server is running.

A second account to see real-time chat: [EMAIL DEMO B] / [MẬT KHẨU DEMO B].

Best regards,
[HỌ TÊN]
```

Số ký tự: 589 (đếm cả chỗ trống).

> Bản dịch: Xin lỗi vì bất tiện. Vui lòng dùng tài khoản demo này. Đăng nhập ở màn đầu tiên (Đăng nhập) bằng email và mật khẩu. Không có xác minh email, mã dùng một lần hay xác thực hai bước. Vui lòng gõ email bằng chữ thường, đúng như trên. Chúng tôi đã đăng nhập bằng tài khoản này ngày [NGÀY KIỂM] với build [SỐ BUILD] trên iPhone; dự án mẫu, trò chuyện, công việc và cuộc họp đều có sẵn, máy chủ đang chạy. Tài khoản thứ hai để xem tin nhắn tới ngay lập tức: [EMAIL DEMO B] / [MẬT KHẨU DEMO B].

**Trường hợp 2: Apple gặp lỗi khi dùng** (ví dụ gửi ảnh báo "File không hợp lệ", app văng).

- **Làm gì:** làm lại đúng các bước Apple mô tả trên iPhone thật, sửa, nộp build mới, trả lời bằng mẫu dưới. `[MÔ TẢ LỖI BẰNG TIẾNG ANH]` viết một câu ngắn, ví dụ `sending a photo from the photo library failed`.

```text
Hello App Review team,

Thank you for reporting this. We reproduced the problem ([MÔ TẢ LỖI BẰNG TIẾNG ANH]) and fixed it in build [SỐ BUILD]. Before uploading, we repeated the same steps on an iPhone with iOS [PHIÊN BẢN iOS], and they now work. Could you please review the new build?

Best regards,
[HỌ TÊN]
```

Số ký tự: 308 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn đã báo lỗi. Chúng tôi đã làm lại được lỗi ([mô tả]) và sửa trong build [SỐ BUILD]. Trước khi tải lên, chúng tôi làm lại đúng các bước đó trên iPhone chạy iOS [phiên bản] và giờ đã chạy đúng. Nhờ xem lại build mới.

### 9.7. Guideline 4.2 — Minimum Functionality (app quá mỏng)

- **Apple thường nói:** app không đủ tính năng riêng của một ứng dụng, giống một trang web gói lại, hoặc phần lớn việc phải làm ở nơi khác.
- **Vì sao WeDo có thể dính:** tài khoản mới vào là thấy "Chưa có dự án nào ... Tạo dự án trên web WeDo" (`M src/app/(tabs)/chat/index.tsx:365`); tạo dự án và thêm thành viên chỉ có trên web; tóm tắt cuộc họp chỉ tạo trên web (`M src/app/(tabs)/meetings/[id].tsx:252`); phòng họp mở ngoài app, trong trình duyệt (`:117`).
- **Làm gì:** trước hết trả lời bằng mẫu dưới, liệt kê tính năng chạy thật trong app. Nếu Apple vẫn từ chối, cách chắc nhất là thêm "Tạo dự án" và "Thêm thành viên" vào app: máy chủ đã có sẵn `POST /projects` và `POST /projects/:id/members` (`BE src/projects/projects.controller.ts:18-21`, `:38-42`). Câu cuối của mẫu chỉ giữ khi đã làm việc này.

```text
Hello App Review team,

Thank you for your review. We would like to explain what WeDo does on iPhone. It is not a website in a wrapper; all its screens are native:

- Real-time project chat and direct messages, with photos from the camera or library.
- Push notifications for new tasks, reviews, meetings, messages and friend requests, and deadline reminders scheduled on the device.
- Tasks: create, accept or decline, attach files, submit, approve or return.
- AI that turns a chat message into a draft task.
- Meetings: create, read the summary, decisions and action items, and join the video room.
- Workspaces, a calendar of deadlines and meetings, a contribution board, friends, a profile and account deletion.
- Recently loaded data stays readable offline.

Today, projects are created on the web, which is why the demo account comes with a sample project. Build [SỐ BUILD] also lets users create a project and add members inside the app.

Best regards,
[HỌ TÊN]
```

Số ký tự: 969 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn đã xem xét. Chúng tôi xin giải thích WeDo làm được gì trên iPhone. Đây không phải trang web gói lại; mọi màn hình đều viết bằng mã gốc: trò chuyện dự án và tin nhắn riêng theo thời gian thực, gửi ảnh từ máy ảnh hoặc thư viện; thông báo đẩy khi có việc mới, bài chờ duyệt, cuộc họp, tin nhắn, lời mời kết bạn, cùng lời nhắc hạn chót đặt ngay trên máy; công việc: tạo, nhận hoặc từ chối, đính tệp, nộp, duyệt hoặc trả lại; AI biến tin nhắn thành bản nháp công việc; cuộc họp: tạo, đọc tóm tắt, quyết định, hạng mục hành động, vào phòng video; không gian làm việc, lịch, bảng đóng góp, bạn bè, hồ sơ, xoá tài khoản; dữ liệu đã tải vẫn đọc được khi mất mạng. Hiện dự án được tạo trên web, vì vậy tài khoản demo có sẵn dự án mẫu. (Câu cuối, chỉ khi đã làm:) Build [SỐ BUILD] còn cho tạo dự án và thêm thành viên ngay trong app.

Cơ sở cho các ý trong mẫu: nhắc hạn trên máy `M src/lib/notifications/local.ts`; dữ liệu ngoại tuyến `M src/lib/query.ts` (lưu bộ nhớ đệm truy vấn xuống máy); tạo không gian `M src/components/workspace/CreateWorkspaceForm.tsx`.

### 9.8. Thêm: Guideline 2.3.10 — nhắc tới nền tảng khác

Ít khả năng xảy ra: bản iOS đã đọc bộ biến `MOBILE_IOS_*` riêng và nút cập nhật mở App Store (`08`, IOS-12). Chỉ xảy ra nếu build nộp lấy nhầm từ nhánh `main`. Câu thứ hai của mẫu đúng với mã hiện tại. Nếu lúc đó `MOBILE_IOS_STORE_URL` còn trống, lời nhắc không hiện trên iPhone; khi đó thay câu thứ hai bằng `The update prompt is no longer shown on iPhone.`

```text
Hello App Review team,

Thank you. Build [SỐ BUILD] removes every mention of Google Play from the iPhone app. The update prompt now opens our App Store page instead. Could you please review the new build?

Best regards,
[HỌ TÊN]
```

Số ký tự: 228 (đếm cả chỗ trống).

> Bản dịch: Cảm ơn. Build [SỐ BUILD] gỡ mọi chỗ nhắc tới Google Play trong app iPhone. Lời nhắc cập nhật giờ mở trang App Store của chúng tôi. Nhờ xem lại build mới.

---

## 10. Nguồn

Trong mã (đọc ngày 26/09/2026):

- Tab và nhãn: `M src/app/(tabs)/_layout.tsx` (Trò chuyện, Công việc, Cuộc họp, Thông báo, Tài khoản); `M src/app/(tabs)/chat/index.tsx` (Dự án, Tin nhắn, nút Bạn bè); `M src/components/friends/FriendRow.tsx` (Nhắn tin, Kết bạn, Duyệt, Từ chối, nút ⋮); `M src/app/(tabs)/tasks/[taskId].tsx:343-352` (Nhận việc, Từ chối); `M src/components/tasks/TaskSubmissionPanel.tsx:97-131` (Nộp tài liệu, Gửi duyệt, Duyệt bài, Trả lại); `M src/app/(tabs)/meetings/index.tsx:71-93` (Lịch, Tạo cuộc họp); `M src/app/(tabs)/meetings/[id].tsx:188` (Vào phòng họp); `M src/app/(tabs)/account/index.tsx:230-370` (các dòng của tab Tài khoản).
- Báo cáo, chặn: `M src/components/moderation/BangThaoTac.tsx`, `PhieuBaoCao.tsx`; `M src/lib/moderation/noi-dung.ts` (lý do, câu xác nhận); `M src/app/account/blocked.tsx`; `BE src/moderation/*`.
- Điều khoản, 18+: `M src/components/auth/ODongYDieuKhoan.tsx`, `CongDieuKhoan.tsx`; `M src/lib/legal-links.ts`.
- Đồng ý AI: `M src/lib/ai/dong-y-ai.ts`; `BE src/users/users.controller.ts`.
- Đăng nhập, đăng ký: `M src/app/(auth)/login.tsx`, `register.tsx`; `M src/lib/auth/auth-context.tsx`; `BE src/auth/auth.service.ts`; `BE src/auth/dto/auth.dto.ts`; `BE src/common/request-rate-limit.guard.ts`.
- Xoá tài khoản: `M src/app/account/delete-account.tsx`; `BE src/users/users.service.ts` (`deleteMe`, `gomTepCanDon`, `donTepSauKhiXoa`).
- AI: `M src/app/(tabs)/chat/[projectId].tsx` (`batDauGoiYAI`, `moThaoTacTin`); `BE src/chat/chat.service.ts` (`thanhVienChoAi`, `tacGiaChoAi`, chọn nhà cung cấp khoảng dòng 1072–1103); hạn mức `BE src/payments/subscription-entitlements.ts`, `BE src/payments/entitlements.service.ts`.
- Dự án, thành viên, không gian: `BE src/projects/projects.service.ts`; `BE src/workspaces/workspaces.service.ts`; `FE src/lib/api.ts:1617-1630`; `FE src/views/WorkspaceView.tsx`; `FE src/views/MeetingView.tsx`.
- Bản kiểm tra sẵn sàng iOS (90 phát hiện, đã bỏ các phát hiện bị bác bỏ): tệp `ios-audit.json` của phiên làm việc này.

Trang của Apple (đọc ngày 26/09/2026):

- App Review Guidelines: `https://developer.apple.com/app-store/review/guidelines/` (1.2, 2.1, 2.3.10, 3.1.1, 3.1.3(f), 4.2, 4.8, 5.1.1(v), 5.1.2(i)).
- Xoá tài khoản trong app: `https://developer.apple.com/support/offering-account-deletion-in-your-app/`.
- Các trường App Review Information (Notes tối đa 4.000 byte; tài khoản demo không được hết hạn; số điện thoại có dấu +): `https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/`.
- Trả lời App Review (ô trả lời 4.000 ký tự, nút Attach File): `https://developer.apple.com/help/app-store-connect/manage-submissions-to-app-review/reply-to-app-review-messages/`.
