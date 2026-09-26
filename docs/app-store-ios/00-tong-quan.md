# 00 — Tổng quan: đưa WeDo lên App Store

Thư mục này gom mọi thứ cần để nộp bản iPhone đầu tiên của WeDo lên App Store. Đọc trang này trước. Mỗi mục dẫn sang tài liệu chi tiết. Cập nhật ngày 26/09/2026.

| Tài liệu | Nội dung |
|---|---|
| [01-tai-khoan-va-build.md](01-tai-khoan-va-build.md) | Tài khoản Apple, build trên EAS, TestFlight, ảnh chụp màn hình, nộp duyệt, OTA |
| [02-thong-tin-app-store.md](02-thong-tin-app-store.md) | Chữ để dán vào App Store Connect: tên, mô tả, từ khoá, URL, độ tuổi |
| [03-app-privacy.md](03-app-privacy.md) | Nhãn quyền riêng tư (App Privacy) |
| [04-thong-tin-cho-reviewer.md](04-thong-tin-cho-reviewer.md) | Tài khoản demo, ghi chú cho người duyệt, mẫu trả lời khi bị từ chối |
| [05-chinh-sach-bao-mat.md](05-chinh-sach-bao-mat.md) | Chính sách quyền riêng tư (toàn văn) |
| [06-dieu-khoan-su-dung.md](06-dieu-khoan-su-dung.md) | Điều khoản sử dụng (toàn văn), chỗ đồng ý trong app, lời hứa 24 giờ |
| [07-trang-ho-tro.md](07-trang-ho-tro.md) | Trang Hỗ trợ (Support URL) |
| [08-sua-code-truoc-khi-nop.md](08-sua-code-truoc-khi-nop.md) | Danh sách việc mã, trạng thái, **thứ tự đưa lên (deploy)** |

## Các quyết định đã chốt

- iPhone bản 1 chỉ đăng nhập bằng **email và mật khẩu**. Nút Google ẩn trên iPhone. Chưa có Sign in with Apple.
- Tuổi tối thiểu **18**. App Store Connect đặt mức 18+.
- Email hỗ trợ: **wedosupport6886@gmail.com**.
- App iPhone **miễn phí, đi kèm dịch vụ web**. Không mua trong app, không lời mời mua (Guideline 3.1.3(f)).
- Chỉ phát hành ở **Việt Nam**. Nhà phát triển cá nhân **Lê Hữu Đại**. DSA: **không phải trader**.
- Tên trang chính sách là **"Chính sách quyền riêng tư"** ở mọi nơi.
- Có báo cáo, chặn, bộ lọc từ ngữ (thay bằng `***`) và khoá tài khoản vi phạm.

## Ba nhánh, ba thư mục

Mọi việc cho iPhone làm trên nhánh riêng, trong thư mục riêng. Nhờ vậy bản CH Play đang chạy và OTA Android trên `main` không bị đụng tới. Lý do chính: sửa `app.json` là đổi vân tay OTA của cả Android.

| Phần | Thư mục chính (đang chạy, không đụng) | Thư mục làm iOS | Nhánh |
|---|---|---|---|
| App mobile | `D:\WeDo_ChPlay` (`main`) | `D:\WeDo_ChPlay-ios` | `ios` |
| Máy chủ | `D:\WEDO_PC\BE_WEDO` (`backend`, Azure tự deploy) | `D:\WEDO_PC\BE_WEDO-ios` | `ios-backend` |
| Web | `D:\WEDO_PC\FE_WEDO` (`main`, Vercel tự deploy) | `D:\WEDO_PC\FE_WEDO-ios` | `ios-web` |

**Chưa nhánh nào được gộp. Chưa có gì lên production.** Thứ tự bắt buộc: **máy chủ → web → build iOS**. App mới cần máy chủ mới: màn đăng ký mới bị máy chủ cũ từ chối. Chi tiết ở `08`, mục Thứ tự đưa lên.

## Bảng trạng thái

### Đã xong (mã trên nhánh iOS, chưa lên production)

- Cấu hình iOS trong `app.json`: bundle ID `vn.wedo.app`, biểu tượng, build 1, tiếng Việt, chỉ iPhone.
- Ẩn Google trên iPhone. Người dùng Google đặt mật khẩu qua "Quên mật khẩu?".
- Báo cáo tin nhắn và người dùng (6 lý do), chặn và bỏ chặn (Tài khoản → Người đã chặn), ẩn tin của người đã chặn, lỗi 403 `BLOCKED` khi nhắn riêng hay kết bạn.
- Bộ lọc từ ngữ che bằng `***`. Trang quản trị "Báo cáo vi phạm" với Gỡ nội dung và Khoá tài khoản. Tài khoản bị khoá không đăng nhập được.
- Ô 18+ khi đăng ký, màn "Điều khoản sử dụng" một lần cho tài khoản cũ.
- Hộp thoại xin đồng ý trước lần đầu dùng AI (chỉ trên app), công tắc "Cho phép dùng AI". Máy chủ không gửi email cho AI nữa.
- Xoá tài khoản xoá luôn tệp trên Azure Blob.
- Tìm bạn: từ 3 ký tự, không lộ email và số điện thoại của người lạ.
- iPhone: nút cập nhật mở App Store, ẩn nút "Xem đầy đủ trên web", ẩn thông báo gói và thanh toán, ảnh HEIC đổi sang JPEG, chỉ hỏi quyền thông báo khi bấm "Bật thông báo".
- Bốn trang web: Chính sách quyền riêng tư, Điều khoản sử dụng, Hỗ trợ, Xoá tài khoản.

Bảng đầy đủ kèm commit: [08, Bảng trạng thái](08-sua-code-truoc-khi-nop.md#bảng-trạng-thái).

### Đang chờ chủ dự án

- Đăng ký Apple Developer Program và tạo bản ghi App Store Connect ([08, IOS-01](08-sua-code-truoc-khi-nop.md#ios-01--tài-khoản-apple-developer-app-id-và-bản-ghi-app-store-connect); [01, Bước 1–2, 7](01-tai-khoan-va-build.md)).
- Kiểm bốn bí mật migration trên GitHub, đặt biến Azure, đưa máy chủ rồi web lên ([08, Thứ tự đưa lên](08-sua-code-truoc-khi-nop.md#thứ-tự-đưa-lên-deploy)).
- Xem nhà cung cấp AI trên Azure và gói Gemini; phân công người đọc hộp thư và xử lý báo cáo trong 24 giờ.
- Tạo tài khoản demo, khoá APNs, ảnh chụp màn hình, điền App Store Connect.

### Còn phải làm (mã)

- Trước build: `eas.json` cho submit (cần Apple ID số và Team ID), `fingerprint.config.js`, tăng `versionCode` nếu build Play cùng lúc.
- Nên làm: bàn phím iPhone ở năm màn còn lại.
- Làm sau: web hỏi trước khi tự gửi tin Leader cho AI, ô 18+ khi đăng ký trên web, giới hạn tần suất tìm bạn, chặn gửi lại lời mời 30 ngày, chặn thêm vào dự án, đọc biên nhận push, cắt `?query=` khỏi Sentry, các mục thấp của vòng review máy chủ.

Chi tiết: [08, Còn lại trước khi nộp](08-sua-code-truoc-khi-nop.md#còn-lại-trước-khi-nộp).

## Việc của chủ dự án, theo thứ tự tới lúc bấm "Submit for Review"

1. **Đăng ký Apple Developer Program** dạng cá nhân (99 USD/năm), chờ Apple duyệt. Chấp nhận thoả thuận. Khai DSA "This is not a trader account" (01, Bước 1–2).
2. **Tạo bản ghi app** trong App Store Connect: tên `WeDo: Làm việc nhóm`, tiếng Việt, bundle `vn.wedo.app`, SKU `wedo-ios`. Chỉ Việt Nam, giá Free. Ghi lại **Apple ID số của app** và **Team ID** (01, Bước 7.1–7.2).
3. **Đưa máy chủ lên** (08, Bước A):
   - Mở GitHub repo `dailhse184118-commits/FE_WEDO` → Settings → Secrets and variables → Actions. Phải có đủ `PRODUCTION_MIGRATION_URL`, `PRODUCTION_DATABASE_HOST`, `PRODUCTION_DATABASE_USER`, `PRODUCTION_DATABASE_NAME`. Thiếu thì migration bị bỏ qua và mọi yêu cầu có đăng nhập trả lỗi 500.
   - Đặt biến Azure: `REPORT_NOTIFY_EMAIL`, `MOBILE_ANDROID_STORE_URL`; để trống `MOBILE_IOS_LATEST_VERSION`, `MOBILE_IOS_MINIMUM_VERSION`, `MOBILE_IOS_UPDATE_NOTES`, `MOBILE_IOS_STORE_URL` tới khi lên kệ.
   - Gộp `ios-backend` vào `backend`, đẩy lên. Xem log có bước migration. Thử web và bản Android đang chạy.
4. **Đưa web lên** (08, Bước B): gộp `ios-web` vào `main`. Kiểm bốn trang trả 200 và trang quản trị "Báo cáo vi phạm" mở được.
5. **Biến EAS**: chạy `npx eas-cli env:list --environment production` trong `D:\WeDo_ChPlay-ios`. Nếu có `EXPO_PUBLIC_PRIVACY_URL`, đặt `https://wedofpt.com.vn/privacy.html` (01, Bước 5).
6. **Gửi Claude Apple ID số và Team ID để làm Đợt 2**: `eas.json` với Apple ID số và Team ID, `fingerprint.config.js`, `versionCode` 18 nếu build Play cùng lúc (08, Đợt còn lại).
7. **Build iOS** trong `D:\WeDo_ChPlay-ios`: `npx eas-cli build --platform ios --profile production`. Trả lời **Yes** khi hỏi cài push (khoá APNs). Rồi `npx eas-cli submit --platform ios --latest` (01, Bước 6–7).
8. **Thử trên TestFlight**: danh sách ở 01 Bước 8.2 và 08 mục Chưa kiểm chứng. Có lỗi thì sửa, tăng `buildNumber`, build lại.
9. **Tạo tài khoản demo** A, B, C và dữ liệu mẫu trên hệ thống thật. A và C đăng ký trong app TestFlight; B đăng ký trên web rồi qua màn "Điều khoản sử dụng" một lần trên app (04, mục 4).
10. **Chụp ảnh màn hình** bộ 6,9 inch bằng tài khoản demo (01, Bước 9).
11. **Điền App Store Connect**: trang phiên bản và App Information theo `02`; App Privacy theo `03` rồi bấm Publish; App Review Information theo `04` (tài khoản demo, số điện thoại, Notes, video). Age Rating chọn 18+.
12. **Nộp**: chọn build, "Manually release this version", **Add for Review** → **Submit to App Review** (01, Bước 10). Trong lúc duyệt: không phát OTA, không đặt `MOBILE_IOS_MINIMUM_VERSION`, giữ máy chủ chạy.

## Câu hỏi còn mở

1. **Nhà cung cấp AI nào đang chạy trên production?** Xem Azure → `api-wedo-backend-dai` → Environment variables: `GEMINI_API_KEY`, nhóm `AZURE_OPENAI_*` hay `OPENAI_API_KEY`. Nếu là Gemini: dự án Google Cloud chứa khoá **đã bật Cloud Billing chưa**? Hộp thoại trong app đã nêu đủ ba tên "Google Gemini, Azure OpenAI hoặc OpenAI", nên không phải sửa app. Câu trả lời quyết định chữ trong Notes, chính sách mục 8.4 và nhãn App Privacy.
2. **Ai đọc hộp thư `wedosupport6886@gmail.com` và trang "Báo cáo vi phạm" mỗi ngày**, kể cả cuối tuần và lễ, để xử lý báo cáo trong 24 giờ? `REPORT_NOTIFY_EMAIL` đặt địa chỉ nào?
3. **Bốn bí mật `PRODUCTION_*` đã có trên GitHub chưa?** Nếu chưa: khai thêm, hay chạy migration bằng tay trước khi gộp?
4. **Số điện thoại cho App Review** (dạng `+84 …`, số nghe máy được).
5. **Tài khoản demo**: email (toàn chữ thường) và mật khẩu của A, B, C.
6. **Phiên bản nộp: `1.0.13` build 1 hay `1.0.14`?** Có build bản Play versionCode 18 từ cùng commit không? Đổi số thì sửa `01`–`04`.
7. **Giá trị chính sách chưa biết**: vùng kho tệp Azure, vùng Supabase (máy gợi ý Tokyo, chưa xác nhận), số ngày sao lưu, số ngày nhật ký máy chủ, gói Sentry, thời hạn PostHog, thời hạn giữ báo cáo vi phạm (máy chủ hiện không tự xoá), máy chủ thư là Brevo hay P.A Việt Nam. Trang web đang dùng câu trung tính (`05`, mục 2.1).
8. **Web**: có thêm bước hỏi trước khi tự gửi tin của Leader cho AI, và ô 18+ khi đăng ký trên web không? Chính sách hiện nói thật là web chưa hỏi.
9. **Có công bố địa chỉ và số điện thoại trong Điều khoản không?** Bản web hiện chỉ có email; chỉ bắt buộc nếu dùng EULA riêng (`06`, mục 8).
10. **Bản quyền**: Copyright ghi `2026 Lê Hữu Đại`, còn chân trang web ghi `© 2026 WeDo Team`. Có sửa cho khớp không (`02`, mục 12)?
