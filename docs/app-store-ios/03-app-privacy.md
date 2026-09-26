# 03 — Phiếu trả lời App Privacy (nhãn quyền riêng tư) cho WeDo trên iOS

Cập nhật 26/09/2026. Dùng cho lần nộp App Store đầu tiên, bundle `vn.wedo.app`, phiên bản 1.0.13, build 1.

Tài liệu này là bảng trả lời để bạn điền vào **App Store Connect → Apps → (ứng dụng WeDo) → App Privacy** (cột trái). Apple gọi phần này là "privacy nutrition label": nó hiện trên trang App Store của app, dưới mục "App Privacy".

Mỗi câu trả lời dưới đây dựa trên mã nguồn thật, có dẫn tệp và số dòng. Ký hiệu đường dẫn:

- `M` = app mobile. Mã của bản iOS nằm trên nhánh `ios` ở `D:\WeDo_ChPlay-ios`.
- `BE` = máy chủ NestJS. Mã mới nằm trên nhánh `ios-backend` ở `D:\WEDO_PC\BE_WEDO-ios`.
- `FE` = web. Mã mới nằm trên nhánh `ios-web` ở `D:\WEDO_PC\FE_WEDO-ios`.
- `nm` = `node_modules` của app mobile.

Số dòng không ghi nhánh là đọc trên nhánh chính lúc kiểm tra, có thể lệch vài dòng. Trạng thái từng việc mã nằm ở `08-sua-code-truoc-khi-nop.md`. Mọi mã mới **chưa lên production**. Nhãn này mô tả bản iOS sẽ nộp, chạy với máy chủ mới.

Ba điều cần biết trước:

1. **Account Holder** (chính bạn, vì đăng ký cá nhân) sửa được mục này. Apple cũng cho vai trò **Admin** và **App Manager** sửa. Vai trò **Marketing** chỉ sửa được hai URL ở mục 1. Nếu giao cho thành viên khác trong nhóm, cấp Admin hoặc App Manager.
2. **Sửa câu trả lời không cần build mới.** Bạn đổi lúc nào cũng được, bấm Publish là xong. Nhưng phải Publish nhãn **trước** lần gửi duyệt đầu tiên. Riêng hai URL ở mục 1 thì khác: Apple ghi rằng đổi URL chỉ có hiệu lực cùng phiên bản app kế tiếp.
3. Apple tính **cả dữ liệu mà mã của WeDo gửi sang bên thứ ba**: Sentry, Expo, Google, Gemini/OpenAI, Azure… Không được bỏ qua chỉ vì "đó là dịch vụ của người khác".

---

## 0. Giả định và điều kiện phải xong trước khi bấm Publish

### Các giả định

Bảng trả lời được viết cho **bản iOS sẽ nộp**, không phải bản Android đang chạy. Các điểm dưới đây đã có trong mã trên nhánh iOS (`08`, mục Đã làm), trừ chỗ ghi khác. Nếu bạn đổi quyết định, xem cột "Nếu khác đi".

| Giả định | Ảnh hưởng tới nhãn | Nếu khác đi |
|---|---|---|
| Đã chốt: **iPhone chỉ đăng nhập bằng email và mật khẩu**. Nút Google ẩn trên iPhone. **Không có Sign in with Apple** ở bản này (Bản sau 1.1). | Không thêm ô mới. App iOS không gọi Google Sign-In hay Apple. Tên, email, ảnh hồ sơ Google của tài khoản đã tạo bằng Google trên web hoặc Android vẫn nằm trong hồ sơ và hiện trong app, nên các ô Name, Email Address, Photos or Videos giữ nguyên. | Khi làm Sign in with Apple ở bản sau: vẫn không thêm ô mới. Tên, email (kể cả email chuyển tiếp `@privaterelay.appleid.com`) và mã `sub` của Apple rơi vào Name, Email Address, User ID. Sửa lại mục 6 và chính sách. |
| Đã làm: **báo cáo vi phạm, chặn người dùng, bộ lọc từ ngữ và khoá tài khoản** (Guideline 1.2). | Không thêm ô mới. Lý do và ghi chú báo cáo vào Other User Content. Máy chủ lưu kèm **bản chụp nội dung bị báo cáo** (tối đa 2.000 ký tự, kèm tên tệp) và gửi nó qua thư tới hộp thư vận hành: thuộc Emails or Text Messages. Danh sách chặn vào Contacts. Người báo cáo và người bị báo cáo vào User ID. Trạng thái khoá tài khoản (thời điểm, lý do) vào Other Data Types. Bộ lọc chạy trên máy chủ, thay từ phản cảm bằng `***` rồi lưu bản đã che, không lưu thêm gì. | — |
| Đã làm: **hộp thoại xin đồng ý trước lần dùng AI đầu tiên** (5.1.2(i)) và ô 18+ khi đăng ký. | Không thêm ô mới. Hộp thoại là yêu cầu riêng; nhãn vẫn phải khai dữ liệu gửi sang AI. Máy chủ lưu thời điểm đồng ý AI, đồng ý điều khoản và xác nhận đủ 18 tuổi (`aiConsentAt`, `termsAcceptedAt`, `adultConfirmedAt`): thuộc Other Data Types (đã tick). | — |
| ⚠ Giả định: app iOS **không bán gì, không có lời mời mua ở nơi khác** (3.1.3(f)). Đã làm: nút "Xem đầy đủ trên web" ở `M src/app/(tabs)/account/contributions.tsx` bị ẩn trên iPhone (commit `1adf6b5`). | Purchase History = Không. Browsing History = Không. PostHog của web không chạy trong app. | Giữ nút thì **nhãn phải đổi**. Nút mở web WeDo ngay trong app (`WebBrowser.openBrowserAsync`, dòng 164). Apple ghi rõ: dữ liệu thu qua web trong app phải khai, trừ khi người dùng đang lướt web tự do. Trên web, PostHog ghi trang đã mở, thao tác, vị trí gần đúng suy từ IP, và quay lại phiên có cả tên công việc, tin nhắn (`FE public/privacy.html:57,76-89`). Máy chủ WeDo cũng ghi lượt truy cập và trang đã xem của web (`FE src/lib/traffic.ts:101-120`). Khi đó phải khai thêm **Coarse Location**, và thêm mục đích Analytics cho **Emails or Text Messages**, **Other User Content**. Web còn có mục Nâng cấp (`FE src/App.tsx:66`), nên nút này cũng có thể bị coi là lời mời mua ở nơi khác (3.1.3(f)). |
| ⚠ Giả định: khoá `GEMINI_API_KEY` thuộc dự án Google Cloud **có tài khoản Cloud Billing đang hoạt động**. Google gọi đó là "Paid Services", kể cả khi chưa phát sinh tiền. | Mục đích chỉ là App Functionality. | Nếu là gói miễn phí ("Unpaid Services"), Google được dùng dữ liệu để cải tiến sản phẩm của họ, và người của Google có thể đọc dữ liệu gửi đi. Khi đó thêm **Other Purposes** cho Name, Emails or Text Messages, Customer Support, Other User Content. Máy chủ mới không gửi email cho AI, nên Email Address không cần. Cách tốt hơn: bật thanh toán. |

### Việc phải xong để câu trả lời "Không" còn đúng

| # | Việc | Ai làm | Nếu chưa làm |
|---|---|---|---|
| 1 | Trong Sentry, ở **cả hai** project (mobile và backend): Project Settings → Security & Privacy → bật **Prevent Storing of IP Addresses**, giữ bật **Data Scrubber**. Sau đó kiểm một sự kiện thật từ bản TestFlight: mở sự kiện, xem khung User. Không được có IP Address, cũng không được có Geography (quốc gia, thành phố). | Chủ dự án, 10 phút | Chưa làm thì đừng để ba ô Diagnostics là "Not linked"; đổi chúng sang **Linked: Yes** (xem 7B). Mã JS đã báo Sentry không suy IP (`nm @sentry/react-native/dist/js/client.js:29-30`), nhưng báo cáo crash native thì chưa kiểm chứng được. Công tắc trên **chưa đủ**: tài liệu Sentry ghi rằng vị trí địa lý vẫn được suy từ IP kể cả khi đã bật nó. Nếu sự kiện vẫn có Geography, tick thêm **Coarse Location** (Linked: No, Tracking: No, App Functionality). |
| 2 | Thêm `beforeBreadcrumb` vào cấu hình Sentry mobile để **cắt phần `?query=` khỏi URL**. Từ khoá tìm bạn đang nằm trên URL (`M src/lib/api/friends.ts:27`). | Code mobile | Tick thêm **Search History**, Linked: No, Tracking: No, mục đích App Functionality. |
| 3 | Sửa lỗi ảnh HEIC bằng cách **đổi sang JPEG ngay trên máy** (`preferredAssetRepresentationMode: Compatible`, và mã hoá lại mọi ảnh iPhone không phải JPEG/PNG). **Đã làm** (commit `0cc5b3b`). Còn phải thử trên iPhone thật. | Code mobile (đã làm) | Với ảnh HEIC, WEBP, TIFF, AVIF, thư viện chọn ảnh trả **nguyên tệp gốc**, giữ cả EXIF và toạ độ GPS (`nm expo-image-picker/ios/ImageUtils.swift:120-152`). HEIC hiện bị máy chủ từ chối nên chưa lọt; WEBP thì lọt được (`image/webp` có trong danh sách cho phép, `BE src/chat/chat.service.ts:672`). Nếu không sửa thì phải xoá EXIF ở máy chủ, hoặc tick **Precise Location**. |
| 4 | Ẩn nút "Xem đầy đủ trên web" trên iOS (`08-sua-code-truoc-khi-nop.md`, IOS-11). **Đã làm** (commit `1adf6b5`). | Code mobile (đã làm) | Xem giả định ở bảng trên. |
| 5 | Xác nhận dự án Google Cloud chứa khoá Gemini có Cloud Billing đang hoạt động. | Chủ dự án | Xem giả định ở bảng trên. |
| 6 | Sửa `FE public/privacy.html` cho khớp nhãn: thêm iOS vào phạm vi, nêu tên các bên thứ ba (lấy từ bảng ở mục 6 của tài liệu này), bỏ chữ "máy ảnh" khỏi hộp "KHÔNG thu thập", nói đúng dữ liệu gửi AI. Thêm đủ ba ý mà 5.1.1(i) bắt buộc: mọi bên thứ ba bảo vệ dữ liệu ngang mức chính sách này; thời gian lưu và cách xoá; cách rút lại đồng ý. **Đã làm** trên nhánh `ios-web` (commit `c4b98c2`, tên mới "Chính sách quyền riêng tư"). Còn phải đưa lên production (`08`, Bước B). | Web (đã làm, chờ deploy) | Nhãn vẫn đúng, nhưng chính sách mâu thuẫn với nhãn hoặc thiếu các ý trên là lý do từ chối theo 5.1.1(i). |

---

## 1. Privacy Policy URL và User Privacy Choices URL

Ở trang App Privacy, phần **Privacy Policy**, bấm **Edit**.

**Privacy Policy URL** (bắt buộc) — 35 ký tự:

```text
https://wedofpt.com.vn/privacy.html
```

- Trang đang sống: HTTP 200, kiểm lại ngày 26/09/2026. Nội dung giống hệt `FE public/privacy.html`, cũng có ở `https://fe-wedo.vercel.app/privacy.html`.
- **Bản đang chạy chưa đủ cho iOS.** Trang đang sống ghi chỉ áp dụng cho "web WeDo và ứng dụng Android", ghi "KHÔNG thu thập: … máy ảnh", và nói chỉ gửi tin được chọn cho AI (máy chủ gửi thêm tối đa 12 tin gần nhất). Bản viết lại, tên "Chính sách quyền riêng tư", đã có trên nhánh `ios-web` (commit `c4b98c2`). Phải đưa lên trước khi nộp.
- URL này điền được riêng cho từng ngôn ngữ. Bản đầu chỉ có tiếng Việt, nên điền một lần cho tiếng Việt là đủ.
- Link trong app nằm ở dòng "Chính sách quyền riêng tư" của tab Tài khoản, và ở ô đồng ý khi đăng ký. `M src/lib/legal-links.ts` đọc `EXPO_PUBLIC_PRIVACY_URL` trước, thiếu thì dùng `https://wedofpt.com.vn/privacy.html`, nên dòng này không còn biến mất. Nếu biến có trên EAS thì biến thắng: chạy `npx eas-cli env:list --environment production` để xem giá trị. Tệp `.env` ở máy đang để `https://fe-wedo.vercel.app/privacy.html`; nên đặt `wedofpt.com.vn` cho đồng bộ.

**User Privacy Choices URL** (không bắt buộc). Apple mô tả đây là trang để người dùng biết mình có những lựa chọn gì về dữ liệu và cách thực hiện, ví dụ xem dữ liệu, yêu cầu xoá. Để trống cũng được; tài liệu `02-thong-tin-app-store.md` hiện để trống. Nếu muốn điền:

⚠ Giả định: dùng trang xoá tài khoản vì nó đang sống (HTTP 200) và nói rõ cách xoá — 41 ký tự:

```text
https://wedofpt.com.vn/xoa-tai-khoan.html
```

Cách tốt hơn về sau: trỏ tới mục 11 "Quyền của bạn" của bản viết lại. Mục đó liệt kê: tắt thông báo, rút lại đồng ý dùng AI, chặn, xoá tài khoản, gửi email yêu cầu. Bản trên nhánh `ios-web` đặt mốc neo cho các mục dạng `#muc-11`; mở trang sau khi đăng để chắc mốc neo chạy. URL dưới đây dài 42 ký tự.

```text
https://wedofpt.com.vn/privacy.html#muc-11
```

Lưu ý: trang `xoa-tai-khoan.html` đang sống cũng chỉ nhắc web và Android. Bản sửa đã có trên nhánh `ios-web` (commit `2d02fa7`), lên cùng lúc với `privacy.html`.

Email liên hệ quyền riêng tư đang công bố: `wedosupport6886@gmail.com` (`FE public/privacy.html:140`). Nhãn App Privacy không hỏi email, nhưng chính sách phải có.

---

## 2. Câu hỏi đầu tiên

> **Do you or your third-party partners collect data from this app?**

Chọn: **Yes, we collect data from this app**

Vì sao: app gửi lên máy chủ tên, email, tin nhắn, ảnh, tệp, push token, và gửi báo cáo lỗi sang Sentry. Apple định nghĩa "collect" là gửi dữ liệu ra khỏi máy, theo cách mà bạn hoặc đối tác của bạn truy cập được lâu hơn thời gian cần để trả lời yêu cầu ngay lúc đó. Tất cả những thứ trên đều được lưu lại.

---

## 3. Bảng trả lời đầy đủ — mỗi loại dữ liệu của Apple một dòng

Cột "Mục đích" dùng đúng tên trong App Store Connect: App Functionality, Analytics, Product Personalization, Developer's Advertising or Marketing, Third-Party Advertising, Other Purposes.

"Tracking" theo nghĩa của Apple: ghép dữ liệu từ app với dữ liệu của công ty khác để quảng cáo nhắm mục tiêu hoặc đo quảng cáo, hoặc chia sẻ cho data broker. WeDo không làm việc nào trong số đó, nên **mọi dòng đều Tracking = Không**.

### Contact Info

| Loại (tên trong ASC) | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Name | **Có** | Có | Không | App Functionality | `BE prisma/schema.prisma:148` (fullName); nhập ở `M src/app/(auth)/register.tsx:26,50`; sửa ở `M src/app/account/profile.tsx:32,92`; lấy từ Google `BE src/auth/auth.service.ts:73-88`; hiện ở tiêu đề thông báo `BE src/chat/chat-push.service.ts:68-70`; gửi AI (tên thành viên, tên người viết tin) `BE src/chat/chat.service.ts`, hàm `thanhVienChoAi`, `tacGiaChoAi` (nhánh `ios-backend`); tên người báo cáo và người bị báo cáo trong thư báo cáo vi phạm `BE src/mail/mail.service.ts` (`sendReportNotice`) |
| Email Address | **Có** | Có | Không | App Functionality | `BE prisma/schema.prisma:146`; `M src/app/(auth)/register.tsx:27,50`; thư gửi cho người dùng chỉ có mã đặt lại mật khẩu qua Brevo `BE src/mail/mail.service.ts:73`. Máy chủ mới **không** gửi email cho AI nữa (commit `3386c52`). Tìm bạn chỉ khớp khi gõ đủ email, và không trả email của người chưa là bạn |
| Phone Number | **Có** (tuỳ chọn) | Có | Không | App Functionality | `BE prisma/schema.prisma:149`; `M src/app/account/profile.tsx:33,139-147`; tìm bạn chỉ khớp khi gõ đủ số, và không trả số của người chưa là bạn (`BE src/friends/friends.service.ts`, `search`, nhánh `ios-backend`) |
| Physical Address | Không | — | — | — | Bảng User không có địa chỉ (`BE prisma/schema.prisma:144-151`). `invoiceAddress` (`:815`) chỉ có ở thanh toán web; app chặn đường thanh toán `M src/lib/web-link.ts:37-39,70-81` |
| Other User Contact Info | Không | — | — | — | Không có trường liên hệ khác trong `BE prisma/schema.prisma:144-151` |

### Health & Fitness

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Health | Không | — | — | — | Không có HealthKit trong `M package.json:16-56` và `M app.json` |
| Fitness | Không | — | — | — | Như trên, không có API chuyển động |

### Financial Info

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Payment Info | Không | — | — | — | Không có mua hàng trong app; đường `checkout`/`payment` bị chặn `M src/lib/web-link.ts:37-39` |
| Credit Info | Không | — | — | — | Không có |
| Other Financial Info | Không | — | — | — | Đơn hàng `PaymentOrder` (`BE prisma/schema.prisma:796-815`) chỉ sinh ra từ web qua PayOS |

### Location

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Precise Location | Không | — | — | — | Không có quyền vị trí trong `M app.json:52-84` và `M locales/vi.json:2-6`. Ảnh gửi trong trò chuyện nén lại ở 0.7 (`M src/lib/images/pick-images.ts:18,62-65,82-87`) nên ảnh JPEG được mã hoá lại qua `UIImage` và mất EXIF (`nm expo-image-picker/ios/ImageUtils.swift:153-158`, `nm expo-image-picker/ios/MediaHandler.swift:205`). Ảnh đại diện mã hoá lại qua image-manipulator (`M src/lib/images/anh-dai-dien.ts:40-48`). Xem điều kiện số 3 |
| Coarse Location | Không | — | — | — | IP chỉ làm khoá giới hạn tần suất trong bộ nhớ (`BE src/common/request-rate-limit.guard.ts:32`); mã máy chủ không ghi IP vào đâu khác. Sentry JS báo "không suy IP" (`nm @sentry/react-native/dist/js/client.js:29-30`). Xem điều kiện số 1 |

### Sensitive Info

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Sensitive Info | Không | — | — | — | Schema không có trường nhạy cảm (`BE prisma/schema.prisma:144-163`). App không dùng sinh trắc học; chuỗi quyền Face ID đã tắt (`"faceIDPermission": false`, `M app.json:62-67`) |

### Contacts

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Contacts | **Có** (danh sách bạn bè và thành viên dự án trong app, **không** phải danh bạ máy) | Có | Không | App Functionality | Bảng `Friendship` `BE prisma/schema.prisma:533`, `ProjectMember` `:316`; `M src/lib/api/friends.ts:13-44`. Danh sách người đã chặn (bảng `UserBlock`, `08` IOS-03, đã làm) cũng thuộc ô này |

### User Content

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Emails or Text Messages | **Có** | Có | Không | App Functionality | `ChatMessage` `BE prisma/schema.prisma:418`, `DirectMessage` `:476`; bản xem trước tối đa 120 ký tự đi qua Expo tới APNs `BE src/chat/chat-push.service.ts:6,68-70`, `BE src/notifications/expo-push.service.ts:4`; tin được chọn + tối đa 12 tin gần nhất của dự án gửi AI, kèm tên người viết, không kèm email (`BE src/chat/chat.service.ts`, nhánh `ios-backend`); bản chụp tin bị báo cáo, tối đa 2.000 ký tự, lưu trong `ContentReport.contentSnapshot` và gửi qua thư tới hộp thư vận hành (`BE src/moderation/reports.service.ts`) |
| Photos or Videos | **Có** | Có | Không | App Functionality | Chụp `M src/lib/images/pick-images.ts:54-71`; chọn từ thư viện `:81-93`; ảnh trong trò chuyện lưu ở Azure Blob `BE src/chat/chat-storage.service.ts:120-131`; ảnh đại diện 256px lưu dạng base64 trong `User.avatarUrl` `M src/lib/images/anh-dai-dien.ts:29-60`; ảnh hồ sơ Google `BE src/auth/auth.service.ts:88`. Bộ chọn ảnh chỉ lấy ảnh (`mediaTypes: ['images']`), nhưng tệp nộp bài nhận mọi định dạng (`BE src/tasks/tasks.controller.ts:72-75`), nên video vẫn có thể được tải lên dưới dạng tệp |
| Audio Data | Không | — | — | — | `microphonePermission: false` ở `M app.json:80`; cuộc họp mở bằng trình duyệt ngoài app `M src/app/(tabs)/meetings/[id].tsx:104-117` |
| Gameplay Content | Không | — | — | — | Không có |
| Customer Support | **Có** | Có | Không | App Functionality, Analytics | Form "Góp ý cho WeDo" `M src/lib/api/feedback.ts:22-27`; `UserFeedback.userId @unique` `BE prisma/schema.prisma:243-251`; nhận xét gửi AI dạng ẩn danh để tóm tắt cho quản trị `BE src/feedback/feedback.service.ts:477-493` |
| Other User Content | **Có** | Có | Không | App Functionality | `Task` `BE prisma/schema.prisma:329`, `TaskSubmission` `:356`, `ChatAttachment` `:549`, `Event` `:569`, `Meeting` `:584`, kết quả AI `AiUsageEvent` `:719-731`; chọn tệp nộp bài `M src/lib/files/pick-documents.ts:23-29` (dùng ở `M src/app/(tabs)/tasks/[taskId].tsx:232`); tạo cuộc họp `M src/lib/api/meetings.ts:95`; lý do từ chối việc và lý do trả bài `M src/lib/api/tasks.ts:51,105`. Lý do và ghi chú báo cáo vi phạm (bảng `ContentReport`, `08` IOS-03, đã làm) cũng thuộc ô này |

### Browsing History

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Browsing History | Không | — | — | — | App không có trình duyệt tự do. Nút web ở `M src/app/(tabs)/account/contributions.tsx` đã ẩn trên iPhone (commit `1adf6b5`). Trình duyệt trong app chỉ mở vài trang tĩnh cố định (chính sách, điều khoản, hỗ trợ) |

### Search History

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Search History | Không | — | — | — | Từ khoá tìm bạn (tối thiểu 3 ký tự) chỉ dùng để trả kết quả ngay, không ghi vào cơ sở dữ liệu: `M src/lib/api/friends.ts`, `BE src/friends/friends.service.ts` (`search`). Xem điều kiện số 2 |

### Identifiers

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| User ID | **Có** | Có | Không | App Functionality, Analytics | `User.id` `BE prisma/schema.prisma:145`; bảng đo hoạt động đếm người dùng khác nhau theo `userId` của từng hành động `BE src/admin/admin-activity.service.ts:68-85` |
| Device ID | **Có** (Expo push token) | Có | Không | App Functionality | `M src/lib/notifications/push-token.ts:22-27,54-61`; `M src/lib/api/notifications.ts:27-35`; bảng `PushToken` có `userId` `BE prisma/schema.prisma:405-416` |

### Purchases

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Purchase History | Không | — | — | — | App chỉ **đọc** hạn mức AI của gói (`M src/lib/api/entitlements.ts:29`), không mua, không gửi dữ liệu mua hàng |

### Usage Data

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Product Interaction | **Có** | Có | Không | App Functionality, Analytics | Máy chủ dựng hoạt động hằng ngày từ mốc thời gian của từng hành động (gửi tin, phản hồi và hoàn thành việc, nộp bài, tạo cuộc họp, dùng AI) `BE src/admin/admin-activity.service.ts:68-85`; đánh dấu đã đọc tin nhắn `M src/lib/api/chat.ts:63`, `BE prisma/schema.prisma:520`; đánh dấu đã đọc thông báo `M src/lib/api/notifications.ts:50-54` |
| Advertising Data | Không | — | — | — | Không có SDK quảng cáo trong `M package.json:16-56` |
| Other Usage Data | Không | — | — | — | Không có |

### Diagnostics

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Crash Data | **Có** | **Không** | Không | App Functionality | Sentry chỉ bật ở bản build thật, tắt khi chạy dev (`enabled: !dangPhatTrien`), `sendDefaultPii: false`, không gọi `Sentry.setUser` (`M src/lib/observability/sentry.ts:28-51,60-73`) |
| Performance Data | **Có** | **Không** | Không | App Functionality | Theo dõi app treo mặc định bật trên iOS (`nm @sentry/react-native/dist/js/options.d.ts:106-115`); backend lấy mẫu 10% yêu cầu API (`BE src/observability/sentry-config.ts:43`) |
| Other Diagnostic Data | **Có** | **Không** | Không | App Functionality | Phiên sử dụng cho release health (`nm @sentry/react-native/dist/js/options.d.ts:38`), breadcrumb, đời máy, phiên bản iOS |

### Surroundings và Body

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Environment Scanning | Không | — | — | — | Không có ARKit hay camera quét môi trường |
| Hands | Không | — | — | — | Không có |
| Head | Không | — | — | — | Không có |

### Other Data

| Loại | Thu thập? | Gắn danh tính? | Tracking? | Mục đích | Bằng chứng |
|---|---|---|---|---|---|
| Other Data Types | **Có** (ngày sinh, cài đặt thông báo, mốc đồng ý, trạng thái khoá tài khoản) | Có | Không | App Functionality | `dob` `BE prisma/schema.prisma:150`; `M src/app/account/profile.tsx:34,151`; bốn cờ `notify*` `BE prisma/schema.prisma:160-163`, `M src/lib/api/notifications.ts:12-24`; mốc đồng ý `aiConsentAt`, `termsAcceptedAt`, `adultConfirmedAt` và trạng thái khoá `suspendedAt`, `suspensionReason` (migration `202609260001_moderation_consent`, nhánh `ios-backend`) |

---

## 4. Bấm trong App Store Connect, từng bước

1. App Privacy → **Get Started**.
2. Câu hỏi đầu: chọn **Yes, we collect data from this app** → Next.
3. Tick đúng 15 ô sau, bỏ trống các ô còn lại → **Save**.

```text
Contact Info:      [x] Name  [x] Email Address  [x] Phone Number  [ ] Physical Address  [ ] Other User Contact Info
Health & Fitness:  [ ] Health  [ ] Fitness
Financial Info:    [ ] Payment Info  [ ] Credit Info  [ ] Other Financial Info
Location:          [ ] Precise Location  [ ] Coarse Location
Sensitive Info:    [ ] Sensitive Info
Contacts:          [x] Contacts
User Content:      [x] Emails or Text Messages  [x] Photos or Videos  [ ] Audio Data  [ ] Gameplay Content  [x] Customer Support  [x] Other User Content
Browsing History:  [ ] Browsing History
Search History:    [ ] Search History
Identifiers:       [x] User ID  [x] Device ID
Purchases:         [ ] Purchase History
Usage Data:        [x] Product Interaction  [ ] Advertising Data  [ ] Other Usage Data
Diagnostics:       [x] Crash Data  [x] Performance Data  [x] Other Diagnostic Data
Surroundings:      [ ] Environment Scanning
Body:              [ ] Hands  [ ] Head
Other Data:        [x] Other Data Types
```

4. Mỗi ô đã tick sẽ có nút **Set Up**. Với từng ô, trả lời ba câu: mục đích (tick nhiều được), "linked to the user's identity?", "used for tracking purposes?". Theo bảng sau:

```text
Name                     | App Functionality             | Linked: Yes | Tracking: No
Email Address            | App Functionality             | Linked: Yes | Tracking: No
Phone Number             | App Functionality             | Linked: Yes | Tracking: No
Contacts                 | App Functionality             | Linked: Yes | Tracking: No
Emails or Text Messages  | App Functionality             | Linked: Yes | Tracking: No
Photos or Videos         | App Functionality             | Linked: Yes | Tracking: No
Customer Support         | App Functionality, Analytics  | Linked: Yes | Tracking: No
Other User Content       | App Functionality             | Linked: Yes | Tracking: No
User ID                  | App Functionality, Analytics  | Linked: Yes | Tracking: No
Device ID                | App Functionality             | Linked: Yes | Tracking: No
Product Interaction      | App Functionality, Analytics  | Linked: Yes | Tracking: No
Crash Data               | App Functionality             | Linked: No  | Tracking: No
Performance Data         | App Functionality             | Linked: No  | Tracking: No
Other Diagnostic Data    | App Functionality             | Linked: No  | Tracking: No
Other Data Types         | App Functionality             | Linked: Yes | Tracking: No
```

5. Điền Privacy Policy URL (mục 1) → **Save**.
6. Xem bản xem trước ở cột phải. Nó phải giống mục 5 bên dưới.
7. Bấm **Publish**. Nhớ làm xong 6 việc ở mục 0 trước.

Không tick mục đích nào ngoài App Functionality và Analytics. Cụ thể: **không** Product Personalization, **không** Developer's Advertising or Marketing, **không** Third-Party Advertising, **không** Other Purposes (trừ trường hợp Gemini gói miễn phí, xem mục 0).

---

## 5. Nhãn sẽ hiện trên App Store (xem trước)

- **Data Used to Track You:** không có mục này (không loại nào dùng để tracking).
- **Data Linked to You:** Contact Info, Contacts, User Content, Identifiers, Usage Data, Other Data.
- **Data Not Linked to You:** Diagnostics.

Vì không có tracking, app **không cần** hộp thoại App Tracking Transparency và không cần chuỗi `NSUserTrackingUsageDescription`.

---

## 6. Bên thứ ba nhận dữ liệu từ luồng của app iOS

Bảng này để đối chiếu: mọi dữ liệu mà các bên dưới nhận đều đã có ô tương ứng ở mục 3.

| Bên thứ ba | Nhận gì | Đã khai ở ô | Bằng chứng |
|---|---|---|---|
| Sentry (DSN của mobile trỏ về `ingest.us.sentry.io`, máy chủ ở Mỹ) | Báo cáo crash, app treo, phiên sử dụng, breadcrumb, đời máy, phiên bản iOS. Không tên, không email | Crash Data, Performance Data, Other Diagnostic Data | `M src/lib/observability/sentry.ts:28-51`; `BE src/observability/sentry-config.ts:43-49` |
| Expo Push Service → Apple APNs | Push token, tên người gửi, tên dự án, tối đa 120 ký tự tin nhắn, tiêu đề và nội dung thông báo hệ thống (công việc, cuộc họp, nhắc hạn). Máy chủ mới không đẩy thông báo gói và thanh toán tới iPhone (commit `55a69f1`) | Device ID, Name, Emails or Text Messages, Other User Content | `BE src/notifications/expo-push.service.ts:4`; `BE src/chat/chat-push.service.ts:6,68-70,106-110`; `BE src/tasks/tasks.service.ts:600-602`; `BE src/notifications/notifications.service.ts:142-152` |
| Expo EAS Update | Mã cài đặt ngẫu nhiên, phiên bản, nền tảng (để tải bản cập nhật) | Device ID (không đổi câu trả lời) | `M app.json:94-99` |
| Google Sign-In | **Không chạy trong app iOS**: nút ẩn trên iPhone và app không gọi SDK Google trên iPhone (`08` IOS-02, commit `c013903`). Chỉ web và Android gọi Google. Tài khoản tạo bằng Google ở đó đã có tên, email, ảnh hồ sơ Google trong hồ sơ, và app iOS hiển thị lại | Name, Email Address, Photos or Videos (dữ liệu hồ sơ, không phải luồng của app iOS) | `M src/app/(auth)/login.tsx:129-140` (nút sẽ ẩn trên iOS); `BE src/auth/auth.service.ts:73-88` |
| Apple, Sign in with Apple | **Không có ở bản này** (Bản sau 1.1). Khi làm: Apple trả về tên (chỉ lần đầu), email thật hoặc email chuyển tiếp, mã người dùng `sub` | — (khi làm: Name, Email Address, User ID) | Chưa có mã |
| Google Gemini (ưu tiên), Azure OpenAI, OpenAI (dự phòng) | Tên dự án; tên, vai trò thành viên; tin được chọn và tối đa 12 tin gần nhất kèm tên tác giả (máy chủ mới không gửi email); nhận xét góp ý ẩn danh; biên bản họp (khởi động từ web). Trên web, tin Leader vừa gửi được tự đưa cho AI; trong app iPhone chỉ sau khi người dùng đồng ý | Name, Emails or Text Messages, Other User Content, Customer Support | `BE src/chat/chat.service.ts:156-167,800-815,874-893,955-993`; `BE src/feedback/feedback.service.ts:477-493`; `BE src/meetings/meetings.service.ts:1086,1294-1332` |
| Daily.co | Máy chủ WeDo chỉ gửi tên phòng, sinh từ mã cuộc họp. Âm thanh và hình đi thẳng từ trình duyệt của máy tới Daily, ngoài app. Daily chép lời khi có người bật ghi biên bản trên web; máy chủ lấy bản chép lời về để AI tóm tắt | Không có ô riêng. Bản chép lời và tóm tắt nằm trong Other User Content (xem lý do G ở mục 7) | `BE src/meetings/meetings.service.ts:209-233,1421-1437`; `M src/app/(tabs)/meetings/[id].tsx:104-117` |
| Microsoft Azure (App Service East Asia, Blob Storage) | Toàn bộ dữ liệu API, ảnh và tệp | Mọi ô đã tick | `BE src/chat/chat-storage.service.ts:120-131` |
| Supabase (PostgreSQL, AWS Tokyo) | Cơ sở dữ liệu | Mọi ô đã tick | `BE docs/on-tap-cong-nghe-backend.md:9`; vùng Tokyo đọc từ tệp cấu hình ở máy `BE .env.remote.local:8` (`aws-1-ap-northeast-1.pooler.supabase.com`). Xác nhận vùng trong Supabase Dashboard trước khi ghi vào chính sách |
| Brevo (SMTP) | Email và mã đặt lại mật khẩu. Thư báo cáo vi phạm gửi tới hộp thư vận hành của WeDo (`REPORT_NOTIFY_EMAIL`): tên người báo cáo, tên người bị báo cáo, lý do, ghi chú, bản chụp nội dung | Email Address, Name, Emails or Text Messages, Other User Content | `BE src/mail/mail.service.ts:73`; `BE .env.example:54` |
| PostHog | **Chỉ web.** App iOS không nhúng SDK này | Không khai. Nút "Xem đầy đủ trên web" đã ẩn trên iPhone (commit `1adf6b5`); các trang pháp lý mở trong app là trang tĩnh, không có mã PostHog | Web: `FE src/lib/analytics/posthog.ts:46-67`. Backend chỉ dùng ở `BE src/payments/payments.service.ts:18` (sự kiện thanh toán trên web) |
| PayOS | **Chỉ web**, thanh toán gói | Không khai | App chặn đường thanh toán `M src/lib/web-link.ts:37-39` |

---

## 7. Vì sao trả lời như vậy (những chỗ dễ nhầm)

**A. Tracking = Không, cho mọi loại.** Tracking theo Apple là ghép dữ liệu của app với dữ liệu từ app hay web của công ty khác để quảng cáo nhắm mục tiêu hoặc đo lường quảng cáo, hoặc chia sẻ cho data broker. App không có SDK quảng cáo hay SDK phân tích nào. Trong `M package.json:16-56`, ngoài các thư viện giao diện và lưu trữ, chỉ có Sentry, các module Expo, Google Sign-In, socket.io. Không dùng IDFA. Gửi dữ liệu cho Gemini, Sentry, Expo để **chạy tính năng** thì không phải tracking.

**B. Diagnostics = Không gắn danh tính.** Apple cho phép "Not linked" khi đã bỏ định danh trực tiếp trước khi gửi đi và không tìm cách ghép lại. Sentry mobile có `sendDefaultPii: false` (`M src/lib/observability/sentry.ts:50`), không gọi `Sentry.setUser`, không cấu hình Session Replay. Mã cài đặt ngẫu nhiên của Sentry không phải mã tài khoản. Điều kiện: làm việc số 1 và số 2 ở mục 0. Lưu ý: Apple ghi rằng "Personal Information" và "Personal Data" theo luật bảo vệ dữ liệu đều được coi là đã gắn với người dùng. Vì thế IP hay từ khoá tìm bạn lọt vào báo cáo lỗi sẽ làm câu "Not linked" sai. Nếu chưa kịp làm hai việc đó, cách an toàn là đổi ba ô Diagnostics sang **Linked: Yes**. Khai thận trọng hơn thực tế thì an toàn hơn khai thiếu.

**C. Contacts = Có, dù app không đọc danh bạ máy.** Định nghĩa của Apple cho Contacts gồm cả "social graph". Danh sách bạn bè và lời mời kết bạn (`BE prisma/schema.prisma:533`) là social graph. App không xin quyền danh bạ nên người dùng sẽ không thấy hộp thoại nào; nhãn chỉ nói có lưu quan hệ bạn bè.

**D. Device ID = Có.** Expo push token là mã cấp theo thiết bị, lưu kèm `userId` (`BE prisma/schema.prisma:405-416`). Khai thận trọng để không ai bắt bẻ được.

**E. Location = Không.** App không xin quyền vị trí. Mã máy chủ chỉ dùng IP trong bộ nhớ để giới hạn tần suất, không ghi vào cơ sở dữ liệu. Ảnh bị mã hoá lại nên mất EXIF. Hai chỗ có thể làm câu này sai: Sentry suy ra quốc gia, thành phố từ IP (làm việc số 1 và kiểm một sự kiện thật), và ảnh HEIC hoặc WEBP gốc giữ nguyên GPS (làm việc số 3). Tệp người dùng tự chọn qua bộ chọn tài liệu được gửi nguyên trạng; app không đọc hay dùng vị trí trong đó, nên đây là nội dung người dùng (Other User Content), không phải thu thập vị trí.

**F. Search History = Không.** Apple chỉ tính là "collect" khi dữ liệu được lưu lâu hơn lúc cần để trả lời. Từ khoá tìm bạn không được ghi vào cơ sở dữ liệu. Chỗ duy nhất nó có thể bị lưu là breadcrumb URL của Sentry khi có lỗi xảy ra ngay sau đó; việc số 2 xoá khả năng này.

**G. Audio Data = Không, dù có cuộc họp và biên bản AI.** App tắt quyền micro (`M app.json:80`). Nút vào phòng họp mở trình duyệt của máy, thường là Safari (`M src/app/(tabs)/meetings/[id].tsx:104-117`). Âm thanh đi từ trình duyệt tới Daily.co, ngoài app. Việc bật ghi biên bản cũng làm trên web: app không gọi API bắt đầu ghi (`BE src/meetings/meetings.service.ts:209-233`). App chỉ **hiển thị** bản tóm tắt đã có. Tóm tắt, quyết định, hạng mục hành động nằm trong Other User Content. Nếu sau này nhúng phòng họp vào app thì phải xem lại Audio Data (biên bản sinh ra từ giọng nói trong app), và bật quyền micro. Photos or Videos đã khai sẵn.

**H. Customer Support = Có.** Apple cho phép không khai form góp ý khi đủ **cả bốn** điều kiện. Một trong số đó là tên hoặc tài khoản người gửi phải hiện rõ ngay trên form. Form góp ý của WeDo (`M src/app/account/feedback.tsx`) không hiện tên, trong khi máy chủ vẫn gắn mỗi góp ý với tài khoản (`userId @unique`), đưa vào bảng quản trị và gửi AI tóm tắt. Không đủ điều kiện miễn, nên khai. Mục đích Analytics vì góp ý dùng để quyết định cải tiến sản phẩm.

**I. Product Interaction = Có, dù app không có SDK phân tích.** Bảng "Hoạt động người dùng" của quản trị đếm người hoạt động mỗi ngày từ mốc thời gian gửi tin, phản hồi và hoàn thành việc, nộp bài, tạo cuộc họp, dùng AI (`BE src/admin/admin-activity.service.ts:68-85`). Đó là dùng dữ liệu tương tác để đo lường, tức Analytics. Trạng thái "đã đọc" dùng cho huy hiệu chưa đọc là App Functionality.

**J. Purchase History và Financial Info = Không, dù web bán gói Personal Pro và Team Growth.** Nhãn chỉ nói về dữ liệu **app iOS** thu thập. App không bán gì, không có form thanh toán, chỉ đọc hạn mức AI của gói để hiện "Còn N lượt AI trong tháng này" (`M src/lib/ai/han-muc.ts:65`). ⚠ Giả định: giữ đúng như vậy (3.1.3(f)). Nếu sau này thêm mua trong app (IAP), phải tick Purchase History.

**K. AI của bên thứ ba không phải một loại dữ liệu riêng.** Apple không có ô "AI". Dữ liệu gửi cho Gemini/OpenAI được khai theo **loại** của nó (Name, Email Address, Emails or Text Messages…) với mục đích App Functionality. Việc xin đồng ý trước khi gửi (5.1.2(i)) là yêu cầu khác, nằm trong app, không nằm trong nhãn. Máy chủ mới đã bỏ email khỏi dữ liệu gửi AI (commit `3386c52`). Nhãn vẫn giữ ô Email Address vì email vẫn được thu thập để đăng nhập.

**L. Số điện thoại và ngày sinh không bắt buộc vẫn phải khai.** "Tuỳ chọn" không có nghĩa là được miễn. Cả hai được lưu lâu dài trong hồ sơ và gắn với tài khoản. Ngày sinh không có ô riêng nên vào Other Data Types.

**M. Sign in with Apple: không có ở bản này.** Đã chốt: iPhone chỉ đăng nhập bằng email và mật khẩu, nút Google ẩn, nên không cần Sign in with Apple (Guideline 4.8 không áp dụng). Ghi chú cho bản sau (1.1): làm thêm cũng không thêm ô mới. Apple chỉ đưa tên (một lần duy nhất), email và mã `sub`. Email chuyển tiếp `@privaterelay.appleid.com` vẫn là Email Address. Mã `sub` là User ID. Identity token chỉ dùng để xác minh, không phải loại dữ liệu cần khai.

**N. Báo cáo, chặn và bộ lọc từ ngữ không thêm ô mới.** Đã làm. Bộ lọc đọc tin nhắn và tên hiển thị lúc gửi, thay từ phản cảm bằng `***`, không lưu thêm dữ liệu nào. Nội dung báo cáo (lý do, ghi chú) là Other User Content; bản chụp tin bị báo cáo là Emails or Text Messages; danh sách người đã chặn là Contacts (social graph); người báo cáo và người bị báo cáo là User ID. Báo cáo được giữ cả khi tài khoản liên quan bị xoá, nhưng không còn gắn với tài khoản đó; chính sách phải nói điều này. Mục đích là App Functionality: Apple xếp "phòng chống gian lận, biện pháp an toàn" vào nhóm này. Nếu sau này dùng báo cáo để làm thống kê, thêm Analytics cho Other User Content.

**O. Face ID không phải dữ liệu thu thập.** App không gọi xác thực sinh trắc học, và Face ID không bao giờ rời máy. Chuỗi xin quyền Face ID mà plugin `expo-secure-store` mặc định chèn vào đã được tắt bằng `"faceIDPermission": false` (`M app.json:62-67`). Giữ nguyên như vậy để người duyệt khỏi hỏi.

**P. Không chọn Product Personalization.** App không gợi ý nội dung theo người dùng. Đề xuất công việc bằng AI chỉ chạy khi người dùng tự nhấn giữ một tin nhắn, chọn "Tạo công việc bằng AI" và đã đồng ý. App chỉ hiện mục này cho Leader dự án hoặc chủ không gian làm việc, và máy chủ cũng chỉ cho những người đó dùng. Đó là tính năng, không phải cá nhân hoá.

**Q. Không chọn Developer's Advertising or Marketing.** Thư máy chủ gửi cho người dùng chỉ có mã đặt lại mật khẩu (`BE src/mail/mail.service.ts:73`). Thư báo cáo vi phạm gửi cho nhóm vận hành, không gửi cho người dùng. Không có email quảng bá. Có một loại thông báo liên quan tới gói: "Gói … sắp hết hạn", gửi cho người đã mua trên web. Máy chủ mới đã bỏ câu "Gia hạn sớm…", không đẩy loại này tới iPhone, và app iPhone ẩn nó (`08`, IOS-21). Đó là thông báo về dịch vụ người dùng đang dùng, không phải quảng bá, nên không đổi nhãn.

**R. Mở trang chính sách hay điều khoản ngay trong app không đổi nhãn.** Apple bắt khai dữ liệu thu qua trang web mở trong app. Bốn trang `privacy.html`, `dieu-khoan.html`, `ho-tro.html` và `xoa-tai-khoan.html` trên nhánh `ios-web` là trang tĩnh, không có thẻ `<script>` nào, nên không thu gì. App mở chúng trong trình duyệt trong app (`expo-web-browser`, `M src/lib/legal-links.ts`), từ ô đồng ý khi đăng ký, màn đồng ý một lần và tab Tài khoản. Nếu sau này dựng các trang đó trong ứng dụng web (có PostHog) thì phải xem lại giống nút "Xem đầy đủ trên web".

---

## 8. Chênh lệch với Google Play Data safety

Câu trả lời Data safety được ghi lại ở `M docs/superpowers/notes/2026-08-05-ho-so-nop-google-play.md:43-62`. Ghi chú đó chỉ khai **Tên, email** và **Nội dung do người dùng tạo**, và ghi "Không thu thập: … danh bạ, máy ảnh…" (dòng 54). ⚠ Giả định: biểu mẫu thật trong Play Console giống ghi chú này. Mở Play Console → App content → Data safety để đối chiếu trước khi sửa. Bản Android chạy cùng mã nguồn, nên thu thập gần như đúng những thứ ở mục 3. Hai cửa hàng nên nói cùng một điều, nên sửa Play cho khớp.

| Mục trong Play Console | Play đang khai | Thực tế | Cần sửa thành |
|---|---|---|---|
| Personal info › Name, Email address | Có, "Quản lý tài khoản" | Còn dùng cho thông báo đẩy và gửi AI | Giữ; thêm mục đích **App functionality** |
| Personal info › Phone number | Không khai | Có, tuỳ chọn (`BE prisma/schema.prisma:149`) | Thêm; Optional; App functionality, Account management |
| Personal info › User IDs | Không khai | Có (`BE prisma/schema.prisma:145`) | Thêm; Required; App functionality, Analytics |
| Personal info › Other info | Không khai | Ngày sinh, tuỳ chọn (`BE prisma/schema.prisma:150`) | Thêm; Optional; App functionality |
| Messages › Other in-app messages | Gộp vào "Nội dung do người dùng tạo" | Trò chuyện dự án và tin nhắn riêng | Khai đúng mục Messages; App functionality |
| Photos and videos › Photos | Ghi "không thu thập máy ảnh" | Ảnh gửi trong trò chuyện (chụp hoặc chọn), ảnh đại diện | Thêm; Optional; App functionality |
| Files and docs | Không khai | Tệp nộp bài chọn qua bộ chọn tệp (`M src/lib/files/pick-documents.ts:23-29`, dùng ở `M src/app/(tabs)/tasks/[taskId].tsx:232`). Trò chuyện trên app chỉ gửi ảnh | Thêm; Optional; App functionality |
| Contacts | Ghi "không thu thập danh bạ" | Danh sách bạn bè. Định nghĩa Contacts của Google có "social graph information" | Thêm cho khớp với Apple; App functionality |
| App activity › App interactions | Không khai | Bảng đo hoạt động, trạng thái đã đọc (`BE src/admin/admin-activity.service.ts:68-85`) | Thêm; Required; Analytics, App functionality |
| App activity › Other user-generated content | Gộp chung | Công việc, bài nộp, cuộc họp, góp ý, và báo cáo vi phạm (đã chốt làm) | Tách rõ; App functionality (góp ý thêm Analytics) |
| App info and performance › Crash logs, Diagnostics | Không khai | Sentry (`M src/lib/observability/sentry.ts:60-73`) | Thêm; Required; App functionality, Analytics |
| Device or other IDs | Không khai | Expo push token (`BE prisma/schema.prisma:405-416`) | Thêm; Optional (chỉ khi cho phép thông báo); App functionality |
| Data shared (chia sẻ) | "Không" | Gemini, Sentry, Expo, Azure… là **nhà cung cấp dịch vụ** xử lý thay WeDo | Giữ "Không" **nếu** Gemini ở gói trả phí. Gói miễn phí thì Google dùng dữ liệu cho mục đích riêng, lúc đó phải khai "Shared" |
| Câu về AI (dòng 61) | "Nội dung tin nhắn được gửi tới nhà cung cấp mô hình" | Thêm tên, vai trò thành viên và tối đa 12 tin gần nhất kèm tên người viết. Máy chủ mới không gửi email | Viết lại cho đúng, khớp mục 8 của chính sách mới |
| Users can request deletion | "Có" | Đúng. Máy chủ mới xoá cả tệp trên Azure Blob khi xoá tài khoản (commit `3386c52`) | Giữ "Có" sau khi máy chủ mới lên production |

Không cần khai Calendar › Calendar events: app không đọc lịch của máy; lịch hạn chót trong app sinh từ công việc và cuộc họp, đã nằm trong "Other user-generated content".

Sửa Data safety trong Play Console không cần build mới. Google duyệt lại biểu mẫu riêng.

---

## 9. Khi nào phải sửa lại nhãn

Mở lại App Privacy và sửa (không cần build mới) khi có một trong những thay đổi sau:

- Thêm SDK phân tích vào app (ví dụ PostHog cho React Native): kiểm lại Product Interaction, Device ID, có thể thêm Other Usage Data.
- Nhúng phòng họp Daily.co vào app: xem lại Audio Data, bật quyền micro (Photos or Videos đã khai sẵn).
- Giữ nút "Xem đầy đủ trên web" trên iOS: khai thêm dữ liệu PostHog của web (xem mục 0).
- Thêm mua trong app: tick Purchase History (và có thể Payment Info nếu tự xử lý thanh toán).
- Bật `sendDefaultPii`, gọi `Sentry.setUser`, hoặc bật Session Replay: đổi Diagnostics sang Linked: Yes.
- Cho phép tải ảnh HEIC gốc hoặc giữ EXIF: tick Precise Location, hoặc xoá EXIF trước khi lưu.
- Đổi nhà cung cấp AI, hoặc nhà cung cấp dùng dữ liệu để huấn luyện: thêm Other Purposes cho các ô liên quan.
- Thêm bất kỳ quyền mới nào (vị trí, danh bạ, micro, lịch).

Mỗi lần sửa nhãn, sửa luôn `FE public/privacy.html` (trang "Chính sách quyền riêng tư") và biểu mẫu Data safety của Google Play cho ba nơi nói cùng một điều.
