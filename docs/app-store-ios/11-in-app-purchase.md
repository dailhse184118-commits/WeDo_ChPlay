# 11 — Tạo sản phẩm In-App Purchase, khóa và webhook (App Store Connect + Azure)

Tài liệu này dành cho chủ dự án. Các bước dưới đây chỉ chủ tài khoản Apple Developer làm được, code đã xong ở phía máy chủ, web và app.

Thông tin dùng xuyên suốt:
- Bundle ID: `vn.wedo.app`
- Apple ID của app: `6816878767`
- Team ID: `LR53W8386S`

Làm theo đúng thứ tự 1 → 8. Mục 1 phải xong (trạng thái Active) thì các sản phẩm mới bán được.

## 1. Hợp đồng, thuế, ngân hàng (Paid Apps)

1. Vào App Store Connect → **Business** (hoặc **Agreements, Tax, and Banking**).
2. Ở dòng **Paid Apps**, bấm **Request** rồi đồng ý điều khoản.
3. Điền **Contact Info**: người liên hệ pháp lý và tài chính, pháp nhân là cá nhân Lê Hữu Đại.
4. **Tax Forms**: chọn mẫu **W-8BEN** (không phải công dân hay cư dân Mỹ, không có mã số thuế Mỹ). Khai theo giấy tờ thật của bạn.
5. **Bank Accounts**: thêm tài khoản ngân hàng VND, nhập số tài khoản và mã **SWIFT** của ngân hàng.
6. Chờ Apple duyệt. Khi dòng **Paid Apps** chuyển sang **Active**, mục 1 xong. Có thể mất vài ngày.

## 2. Khóa In-App Purchase (tệp .p8)

1. Vào **Users and Access** → **Integrations** → **In-App Purchase**.
2. Bấm **Generate In-App Purchase Key**, đặt tên (ví dụ `WeDo IAP`).
3. Bấm **Download** để tải tệp `AuthKey_XXXXXXXXXX.p8`.
   - **Chỉ tải được MỘT lần.** Mất tệp thì phải tạo khóa mới.
4. Ghi lại **Key ID** (chuỗi 10 ký tự cạnh tên khóa).
5. Ghi lại **Issuer ID** (chuỗi dạng UUID ở đầu trang).
6. Cất tệp `.p8` cùng chỗ với `AuthKey_U9G7RAS2LZ.p8`. Không gửi qua chat, không đưa vào git.

## 3. Nhóm đăng ký và bốn sản phẩm

1. Vào **Apps** → **WeDo** → **Monetization** → **Subscriptions**.
2. Bấm **Create** ở **Subscription Groups**, đặt **Reference Name** là `WeDo`.
3. Trong nhóm `WeDo`, tạo lần lượt bốn subscription bằng nút **Create**:

| Reference Name | Product ID | Duration | Giá web (VND) |
|---|---|---|---|
| Personal Pro Monthly | `pro_monthly` | 1 Month | 39.000 |
| Personal Pro Yearly | `pro_yearly` | 1 Year | 390.000 |
| Team Growth Monthly | `team_monthly` | 1 Month | 129.000 |
| Team Growth Yearly | `team_yearly` | 1 Year | 1.290.000 |

   Product ID gõ đúng từng ký tự, tạo xong không sửa được.
4. Với từng sản phẩm, mục **Subscription Prices** → **Add Subscription Price**: chọn quốc gia gốc Vietnam, chọn mốc giá VND **gần nhất** với giá web ở bảng trên. Apple chỉ cho các mốc cố định nên có thể lệch chút. Ghi lại mốc đã chọn để đối chiếu với web.
5. Mục **App Store Localization** → thêm ngôn ngữ **Vietnamese**:
   - **Subscription Display Name**: `Personal Pro` cho hai gói Pro, `Team Growth` cho hai gói Team.
   - **Description**: một câu ngắn nói gói đem lại gì, ví dụ "Mở thêm lượt AI và tính năng nâng cao cho cá nhân."
6. Mục **Review Information**: tải **Screenshot** là ảnh màn hình Nâng cấp trong app (chụp từ bản build có màn hình này), và ghi chú ngắn cách tới màn đó.
7. Quay về trang nhóm `WeDo`, mục **Subscription Group Localization** thêm tên nhóm tiếng Việt. Ở phần xếp hạng (**Subscription Ranking**) đặt:
   - **Team Growth**: level **1** (cao nhất)
   - **Personal Pro**: level **2**

   Hai bản tháng/năm của cùng một gói để cùng level.
8. Trạng thái mỗi sản phẩm phải là **Ready to Submit**. Khi nộp bản app, chọn các sản phẩm này ở mục **In-App Purchases and Subscriptions** của phiên bản.

## 4. Webhook App Store Server Notifications

1. Vào **Apps** → **WeDo** → **App Information**, kéo xuống **App Store Server Notifications**.
2. Ở **Production Server URL** nhập: `https://<máy chủ Azure>/payments/webhook/apple`
3. Ở **Sandbox Server URL** nhập đúng cùng địa chỉ.
4. Chọn **Version 2** cho cả hai ô, bấm **Save**.

Ghi chú: các tài liệu trong thư mục này chỉ ghi tên miền web `wedofpt.com.vn`, không ghi tên miền của máy chủ Azure (backend). Hãy thay `<máy chủ Azure>` bằng tên miền backend thật (xem trong Azure App Service → Overview → Default domain, hoặc tên miền riêng nếu đã gắn).

## 5. Tài khoản thử Sandbox

1. Vào **Users and Access** → **Sandbox** → **Testers**, bấm dấu **+**.
2. Điền họ tên, **một email mới chưa từng dùng làm Apple ID**, mật khẩu và vùng (Vietnam). Email và mật khẩu do bạn tự chọn và tự giữ.
3. Trên iPhone: **Settings** → **App Store** → kéo xuống **Sandbox Account** → đăng nhập bằng tài khoản vừa tạo.
   - Đừng đăng nhập tài khoản này ở phần Apple ID chính của máy.

## 6. Biến môi trường trên Azure

1. Mở Azure Portal → App Service của backend WeDo → **Settings** → **Environment variables** (giao diện cũ gọi là **Configuration** → **Application settings**).
2. Thêm bốn biến:

| Tên | Giá trị |
|---|---|
| `APPLE_IAP_KEY_ID` | Key ID ở mục 2 |
| `APPLE_IAP_ISSUER_ID` | Issuer ID ở mục 2 |
| `APPLE_IAP_PRIVATE_KEY` | Nội dung tệp `.p8`, xem bên dưới |
| `APPLE_IAP_ENVIRONMENT` | `Sandbox` khi thử, `Production` khi nộp duyệt |

3. Cách điền `APPLE_IAP_PRIVATE_KEY`: mở tệp `.p8` bằng Notepad, chép toàn bộ nội dung (gồm dòng BEGIN PRIVATE KEY và END PRIVATE KEY), rồi **thay mỗi dấu xuống dòng bằng đúng hai ký tự `\n`** để thành một dòng duy nhất. Máy chủ tự đổi `\n` về xuống dòng thật.
4. Bấm **Apply** / **Save**, xác nhận khởi động lại ứng dụng.
5. Đừng dán giá trị khóa vào chat, ghi chú hay git.

### Sandbox hay Production khi nộp duyệt

Người duyệt của Apple luôn mua trong Sandbox, kể cả khi họ cài đúng bản production. Máy chủ đã xử lý việc này: khi `APPLE_IAP_ENVIRONMENT=Production` mà Apple báo giao dịch không có ở Production, máy chủ tự thử lại ở Sandbox. Vì vậy:
- Lúc thử nghiệm của bạn: đặt `Sandbox`.
- Lúc nộp duyệt và khi bán thật: đặt `Production`. Đây là giá trị đúng, không cần đổi thêm cho người duyệt.

## 7. Tùy chọn: Small Business Program

Nếu doanh thu App Store dưới 1 triệu USD mỗi năm, có thể giảm hoa hồng Apple từ 30% xuống 15%:
1. Vào **Business** (hoặc **Agreements, Tax, and Banking**) → **Small Business Program**.
2. Bấm **Enroll**, đọc và đồng ý điều khoản.

## 8. Sau khi cấu hình: cách thử

1. Đặt `APPLE_IAP_ENVIRONMENT=Sandbox`, cài bản TestFlight hoặc bản dev có IAP lên iPhone.
2. Đăng nhập tài khoản sandbox ở **Settings** → **App Store** → **Sandbox Account** (mục 5).
3. Mở app WeDo, vào màn Nâng cấp, mua **Personal Pro** gói tháng. Màn thanh toán có chữ Sandbox và không tính tiền thật.
4. Xác nhận:
   - app hiện gói **Personal Pro**;
   - trang thanh toán trên web (đăng nhập cùng tài khoản WeDo) cũng hiện gói này;
   - log của App Service trên Azure (**Monitoring** → **Log stream**) có dòng `apple.transaction.recorded`.
5. Lưu ý thời gian trong Sandbox: đăng ký chạy nhanh. Gói **tháng = 5 phút**, tự gia hạn và hết hạn sau **6 lần gia hạn**. Vì vậy sau khoảng 30 phút gói sẽ tự hết, muốn thử tiếp thì mua lại.
6. Nếu không thấy gói hiện: kiểm tra Product ID đúng từng ký tự (mục 3), webhook đã lưu Version 2 (mục 4), bốn biến Azure đã Apply và ứng dụng đã khởi động lại (mục 6).
