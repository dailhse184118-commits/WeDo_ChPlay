# 00 — Tổng quan: đưa WeDo lên App Store

Thư mục này gom mọi thứ cần để nộp bản iPhone đầu tiên của WeDo lên App Store. Đọc trang này trước. Mỗi mục dẫn sang tài liệu chi tiết. Cập nhật ngày 28/09/2026.

| Tài liệu | Nội dung |
|---|---|
| [01-tai-khoan-va-build.md](01-tai-khoan-va-build.md) | Tài khoản Apple, build trên EAS, TestFlight, ảnh chụp màn hình, nộp duyệt, OTA, khoá Sign in with Apple |
| [02-thong-tin-app-store.md](02-thong-tin-app-store.md) | Chữ để dán vào App Store Connect: tên, mô tả, từ khoá, URL, độ tuổi |
| [03-app-privacy.md](03-app-privacy.md) | Nhãn quyền riêng tư (App Privacy) |
| [04-thong-tin-cho-reviewer.md](04-thong-tin-cho-reviewer.md) | Tài khoản demo, ghi chú cho người duyệt, mẫu trả lời khi bị từ chối |
| [05-chinh-sach-bao-mat.md](05-chinh-sach-bao-mat.md) | Chính sách quyền riêng tư (toàn văn) |
| [06-dieu-khoan-su-dung.md](06-dieu-khoan-su-dung.md) | Điều khoản sử dụng (toàn văn), chỗ đồng ý trong app, lời hứa 24 giờ |
| [07-trang-ho-tro.md](07-trang-ho-tro.md) | Trang Hỗ trợ (Support URL) |
| [08-sua-code-truoc-khi-nop.md](08-sua-code-truoc-khi-nop.md) | Danh sách việc mã, trạng thái, **thứ tự đưa lên (deploy)** |
| [12-in-app-purchase.md](12-in-app-purchase.md) | Tạo sản phẩm In-App Purchase, khoá và webhook trên App Store Connect, biến môi trường Azure |
| [13-notes-duyet-iap.md](13-notes-duyet-iap.md) | Notes mới cho người duyệt (bản có In-App Purchase) và các bước build, nộp bản 1.0.15 |

## Các quyết định đã chốt

- **Đăng nhập trên iPhone: Apple, Google, hoặc email và mật khẩu** (chốt lại ngày 28/09/2026). Màn Đăng nhập và Đăng ký có nút "Tiếp tục với Apple" (nút gốc của Apple, chỉ có trên iPhone) và "Tiếp tục với Google". Android và web có email và Google, không có nút Apple. App iPhone có đăng nhập Google nên Guideline 4.8 áp dụng, và **Sign in with Apple** đáp ứng điều đó. Quyết định cũ "iPhone chỉ email, ẩn Google, Apple để bản sau" đã bỏ.
- Tài khoản mới tạo bằng Apple hay Google phải qua màn **"Điều khoản sử dụng"** một lần (18+ và điều khoản) trước khi dùng app. Xoá tài khoản tạo bằng Apple thì máy chủ **thu hồi** đăng nhập Apple.
- Tuổi tối thiểu **18**. App Store Connect đặt mức 18+.
- Email hỗ trợ: **wedosupport6886@gmail.com**.
- App iPhone **miễn phí, đi kèm dịch vụ web**. Không mua trong app, không lời mời mua (Guideline 3.1.3(f)).
- Chỉ phát hành ở **Việt Nam**. Nhà phát triển cá nhân **Lê Hữu Đại**. DSA: **không phải trader**.
- Tên trang chính sách là **"Chính sách quyền riêng tư"** ở mọi nơi.
- Có báo cáo, chặn, bộ lọc từ ngữ (thay bằng `***`) và khoá tài khoản vi phạm.
- Phiên bản nộp: **1.0.14**, build iOS **3** trở lên (build 1 chưa có nút Apple và Google). Build nộp nên có sẵn commit `2b94b17`, tức build 4 trở lên (`02`, mục 17.3).

## Ba nhánh, ba thư mục

Mọi việc cho iPhone làm trên nhánh riêng, trong thư mục riêng. Nhờ vậy bản CH Play đang chạy và OTA Android trên `main` không bị đụng tới. Lý do chính: sửa `app.json` hay thêm gói native là đổi vân tay OTA.

| Phần | Thư mục chính | Thư mục làm iOS | Nhánh | Trạng thái |
|---|---|---|---|---|
| App mobile | `D:\WeDo_ChPlay` (`main`) | `D:\WeDo_ChPlay-ios` | `ios` | Tới `2b94b17`. Chưa gộp vào `main` |
| Máy chủ | `D:\WEDO_PC\BE_WEDO` (`backend`, Azure tự deploy) | `D:\WEDO_PC\BE_WEDO-ios` | `ios-backend` | Đã gộp, `backend` = `3d24e39`, **đang chạy** |
| Web | `D:\WEDO_PC\FE_WEDO` (`main`, Vercel tự deploy) | `D:\WEDO_PC\FE_WEDO-ios` | `ios-web` | Đã gộp, `main` = `056d3b0`, **đang chạy** |

Máy chủ và web đã lên production ngày 27–28/09/2026, đúng thứ tự **máy chủ → web → build iOS**. Chi tiết ở `08`, mục Thứ tự đưa lên.

## Bảng trạng thái

### Đã xong

- **Tài khoản Apple:** Apple Developer Program dạng cá nhân đã duyệt (28/09/2026), Team ID `LR53W8386S`. Bản ghi App Store Connect "WeDo: Làm việc nhóm", Apple ID `6816878767`, SKU `wedo-ios`, bundle `vn.wedo.app`. Khai DSA: không phải trader.
- **Máy chủ và web mới đang chạy** (`3d24e39`, `056d3b0`). Migration đã chạy: `202609260001_moderation_consent`, `202609280001_apple_sign_in`.
- **Build iOS 1.0.14:** build 1 đã lên TestFlight. Build 3 có nút Apple và Google, đã thử trên iPhone thật.
- **Sign in with Apple** (máy chủ `64a0a5a` … `3d24e39`; app `a5cfb2e`, `5db415d`, `b016c3f`): `POST /auth/apple` kiểm identity token bằng khoá công khai của Apple, tìm tài khoản theo mã Apple, rồi theo email đã xác minh, chưa có thì tạo mới. Khoá Sign in with Apple `U9G7RAS2LZ` và năm biến Azure `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `GOOGLE_IOS_CLIENT_ID` đã đặt.
- **Google trên iPhone** (`2d1606f`, `336cebb`, `df0c255`): client iOS riêng; máy chủ nhận token của client Web và client iOS.
- **Xoá tài khoản:** xoá cả tệp trên Azure Blob, thu hồi đăng nhập Apple. Đã thử trên iPhone thật ngày 28/09/2026: xoá xong, WeDo biến khỏi Cài đặt → Đăng nhập bằng Apple. Xoá xong app báo "Đã xoá tài khoản" và về màn Đăng nhập (`2b94b17`).
- Báo cáo tin nhắn và người dùng (6 lý do), chặn và bỏ chặn (Tài khoản → Người đã chặn), ẩn tin của người đã chặn, lỗi 403 `BLOCKED` khi nhắn riêng hay kết bạn.
- Bộ lọc từ ngữ che bằng `***`. Trang quản trị "Báo cáo vi phạm" với Gỡ nội dung và Khoá tài khoản. Tài khoản bị khoá không đăng nhập được.
- Ô 18+ khi đăng ký, màn "Điều khoản sử dụng" một lần cho tài khoản cũ và tài khoản Apple, Google mới.
- Hộp thoại xin đồng ý trước lần đầu dùng AI (chỉ trên app), công tắc "Cho phép dùng AI". Máy chủ không gửi email cho AI nữa.
- Tìm bạn: từ 3 ký tự, không lộ email và số điện thoại của người lạ.
- iPhone: nút cập nhật mở App Store, ẩn nút "Xem đầy đủ trên web", ẩn thông báo gói và thanh toán, ảnh HEIC đổi sang JPEG, chỉ hỏi quyền thông báo khi bấm "Bật thông báo".
- `eas.json` có `ascAppId`, `appleTeamId`; `fingerprint.config.js` (`962517f`, `801c266`).
- Bốn trang web đang chạy: Chính sách quyền riêng tư, Điều khoản sử dụng, Hỗ trợ, Xoá tài khoản.

Bảng đầy đủ kèm commit: [08, Bảng trạng thái](08-sua-code-truoc-khi-nop.md#bảng-trạng-thái).

### Đang chờ chủ dự án

- **Đẩy lại web** khi bốn trang có đoạn về Sign in with Apple và Google trên iPhone (`05`, `06`, `07`). Chính sách phải khớp app trước khi nộp.
- **Tài khoản demo** email và mật khẩu, có dữ liệu mẫu (`04`, mục 4). Không dùng tài khoản Apple hay Google làm tài khoản demo.
- Ảnh chụp màn hình, điền App Store Connect, số điện thoại cho App Review.
- Xem nhà cung cấp AI trên Azure và gói Gemini; phân công người đọc hộp thư và xử lý báo cáo trong 24 giờ.
- Kiểm thông báo đẩy trên iPhone (khoá APNs).

### Còn phải làm

- **Email chuyển tiếp của Apple (SAU-04):** người chọn "Ẩn địa chỉ email" có địa chỉ `…@privaterelay.appleid.com`. Thư WeDo gửi tới đó (mã đặt lại mật khẩu, thư trả lời từ hộp thư hỗ trợ) có thể không tới, vì nơi gửi thư của WeDo **chưa** được đăng ký ở "Sign in with Apple for Email Communication". Người đã ẩn email nên tiếp tục dùng nút Apple. Cách làm ở `01`, mục B.3, và `08`, SAU-04.
- Thử trên iPhone thật: màn Đăng ký có hai nút, câu "Đã xoá tài khoản" (bản có `2b94b17`), ảnh HEIC, bàn phím (`08`, mục Chưa kiểm chứng).
- Nên làm: bàn phím iPhone ở năm màn còn lại.
- Làm sau: web hỏi trước khi tự gửi tin Leader cho AI, ô 18+ khi đăng ký trên web, nút Apple trên web, giới hạn tần suất tìm bạn, chặn gửi lại lời mời 30 ngày, chặn thêm vào dự án, đọc biên nhận push, cắt `?query=` khỏi Sentry, các mục thấp của vòng review máy chủ.

Chi tiết: [08, Còn lại trước khi nộp](08-sua-code-truoc-khi-nop.md#còn-lại-trước-khi-nộp).

## Việc của chủ dự án, theo thứ tự tới lúc bấm "Submit for Review"

Bước 1 tới 7 của bản trước (tài khoản Apple, bản ghi app, đưa máy chủ và web lên, `eas.json`, build, TestFlight) đã xong. Còn lại:

1. **Đẩy lại web** trong `D:\WEDO_PC\FE_WEDO`: gộp `ios-web` (`3a7920c` … `7bbf0c1`, bốn trang pháp lý có đoạn về Apple và Google) vào `main`. Kiểm bốn trang trả 200, và trang chính sách có đoạn về Sign in with Apple.
2. **Thử build 3 trên TestFlight** theo `01`, Bước 8.2, và `08`, mục Chưa kiểm chứng. Có lỗi native thì tăng `buildNumber` (3 → 4) và build lại trong `D:\WeDo_ChPlay-ios`. Lỗi JavaScript thì phát OTA **chỉ cho iOS** (`--platform ios`).
3. **Tạo tài khoản demo** A, B, C (email và mật khẩu) và dữ liệu mẫu trên hệ thống thật. A và C đăng ký trong app TestFlight; B đăng ký trên web rồi qua màn "Điều khoản sử dụng" một lần trên app (04, mục 4).
4. **Chụp ảnh màn hình** bộ 6,9 inch bằng tài khoản demo (01, Bước 9).
5. **Điền App Store Connect**: trang phiên bản và App Information theo `02`; App Privacy theo `03` rồi bấm Publish; App Review Information theo `04` (tài khoản demo, số điện thoại, Notes, video). Age Rating chọn 18+.
6. **Nộp**: chọn build có commit `2b94b17` (nên là **1.0.14 (4)** trở lên: build 3 được build trước commit này, OTA chỉ chạy từ lần mở app sau; `02`, mục 17.3), "Manually release this version", **Add for Review** → **Submit to App Review** (01, Bước 10). Trong lúc duyệt: không phát OTA, không đặt `MOBILE_IOS_MINIMUM_VERSION`, giữ máy chủ chạy.
7. Khi rảnh: đăng ký nơi gửi thư với Apple cho email chuyển tiếp (`01`, mục B.3).

## Câu hỏi còn mở

1. **Nhà cung cấp AI nào đang chạy trên production?** Xem Azure → `api-wedo-backend-dai` → Environment variables: `GEMINI_API_KEY`, nhóm `AZURE_OPENAI_*` hay `OPENAI_API_KEY`. Nếu là Gemini: dự án Google Cloud chứa khoá **đã bật Cloud Billing chưa**? Hộp thoại trong app đã nêu đủ ba tên "Google Gemini, Azure OpenAI hoặc OpenAI", nên không phải sửa app. Câu trả lời quyết định chữ trong Notes, chính sách mục 8.4 và nhãn App Privacy.
2. **Ai đọc hộp thư `wedosupport6886@gmail.com` và trang "Báo cáo vi phạm" mỗi ngày**, kể cả cuối tuần và lễ, để xử lý báo cáo trong 24 giờ? `REPORT_NOTIFY_EMAIL` đặt địa chỉ nào?
3. **Số điện thoại cho App Review** (dạng `+84 …`, số nghe máy được).
4. **Tài khoản demo**: email (toàn chữ thường) của A, B, C. Mật khẩu chủ dự án tự dán vào App Store Connect.
5. **Máy chủ gửi thư từ địa chỉ nào** (`MAIL_FROM` trên Azure)? Nếu là `@gmail.com` thì khó đăng ký với Apple cho email chuyển tiếp; nên chuyển sang địa chỉ trên tên miền riêng (`08`, SAU-04).
6. **Giá trị chính sách chưa biết**: vùng kho tệp Azure, vùng Supabase (máy gợi ý Tokyo, chưa xác nhận), số ngày sao lưu, số ngày nhật ký máy chủ, gói Sentry, thời hạn PostHog, thời hạn giữ báo cáo vi phạm (máy chủ hiện không tự xoá), máy chủ thư là Brevo hay P.A Việt Nam. Trang web đang dùng câu trung tính (`05`, mục 2.1).
7. **Web**: có thêm bước hỏi trước khi tự gửi tin của Leader cho AI, và ô 18+ khi đăng ký trên web không? Chính sách hiện nói thật là web chưa hỏi.
8. **Có công bố địa chỉ và số điện thoại trong Điều khoản không?** Bản web hiện chỉ có email; chỉ bắt buộc nếu dùng EULA riêng (`06`, mục 8).
9. **Bản quyền**: Copyright ghi `2026 Lê Hữu Đại`, còn chân trang web ghi `© 2026 WeDo Team`. Có sửa cho khớp không (`02`, mục 12)?
