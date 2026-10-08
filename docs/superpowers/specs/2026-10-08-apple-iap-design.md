# Thanh toán In-App Purchase (Apple) cho WeDo iOS — thiết kế

Ngày: 08/10/2026. Chủ dự án chốt sau khi Apple từ chối lần ba theo Guideline 3.1.1 (bản 1.0.14 (4), 04/10/2026).

## 1. Mục tiêu và phạm vi

- App iPhone bán được gói Personal Pro và Team Growth qua In-App Purchase (IAP) của Apple, chấp nhận Apple thu phần của họ (30%, hoặc 15% nếu đăng ký App Store Small Business Program).
- Giá trên iPhone bằng giá web.
- Kiểu đăng ký: tự gia hạn (auto-renewable).
- Máy chủ là nguồn sự thật duy nhất về gói; Apple báo về máy chủ qua App Store Server Notifications V2.
- Không dùng bên thứ ba (RevenueCat…).
- Ngoài phạm vi: Android (giữ nguyên, chưa bán trong app), dùng thử miễn phí, giảm giá nhập môn, mã khuyến mãi.

## 2. Nhánh và thư mục

| Phần | Nhánh làm việc | Thư mục | Nhánh gốc |
|---|---|---|---|
| Mobile | `ios` | `D:\WeDo_ChPlay-ios` | — |
| Máy chủ | `feat/apple-iap-backend` (tạo từ `backend`, là nhánh production, hiện `69ffb70`) | `D:\WEDO_PC\BE_WEDO-ios` (đang ở `sua-toan-dien`, phải chuyển) | `backend` |
| Web | `feat/apple-iap-web` (tạo từ `main`) | `D:\WEDO_PC\FE_WEDO-ios` | `main` |

`D:\WeDo_ChPlay` luôn ở `main` (phát OTA Android).

## 3. Sản phẩm trên App Store Connect

Một subscription group "WeDo", 4 sản phẩm tự gia hạn. Mã sản phẩm Apple trùng mã trong `src/payments/payment-catalog.ts` của máy chủ, nên không cần bảng dịch:

| Product ID | Gói máy chủ | Chu kỳ | Giá |
|---|---|---|---|
| `pro_monthly` | `PERSONAL_PRO` | tháng | mốc Apple gần 39.000 đ |
| `pro_yearly` | `PERSONAL_PRO` | năm | mốc Apple gần 390.000 đ |
| `team_monthly` | `TEAM_GROWTH` | tháng | mốc Apple gần 129.000 đ |
| `team_yearly` | `TEAM_GROWTH` | năm | mốc Apple gần 1.290.000 đ |

- Thứ hạng trong nhóm: Team Growth (cấp 1) trên Personal Pro (cấp 2). Pro → Team là nâng cấp, có hiệu lực ngay, Apple tự tính tiền thừa; Team → Pro là hạ cấp, hiệu lực kỳ sau.
- Team Growth mua trên iPhone gắn vào một workspace mà người mua là chủ (owner).
- Việc chủ dự án làm trên ASC (hướng dẫn từng bước ở `docs/app-store-ios/11-in-app-purchase.md`, viết trong kế hoạch):
  1. Ký Paid Apps Agreement: khai thuế (W-8BEN, cá nhân Việt Nam), tài khoản ngân hàng nhận tiền.
  2. Tạo subscription group và 4 sản phẩm: tên hiển thị tiếng Việt, mô tả, ảnh xem xét, giá theo mốc.
  3. Tạo khoá In-App Purchase (Users and Access → Integrations → In-App Purchase): giữ file `.p8`, ghi Key ID và Issuer ID. Claude không giữ nội dung khoá.
  4. Bật App Store Server Notifications V2 cho cả Production và Sandbox, URL `https://<máy chủ>/payments/webhook/apple`.
  5. Tạo Sandbox tester để thử.
  6. Tuỳ chọn: đăng ký Small Business Program.

## 4. App iPhone

Thư viện: `expo-iap` (StoreKit 2, có config plugin cho Expo SDK 57). Thêm module native nên cần build mới (1.0.15, buildNumber 5); vân tay iOS và Android đều đổi.

### 4.1 Màn Nâng cấp — `src/app/account/nang-cap.tsx`

- Vào từ tab Tài khoản, hàng "Nâng cấp gói" chỉ hiện khi `Platform.OS === 'ios'`.
- Hai thẻ Personal Pro và Team Growth, mỗi thẻ có chọn tháng/năm. Tên, giá, đơn vị tiền lấy từ `fetchProducts` của StoreKit; không ghi cứng giá.
- Quyền lợi của gói hiển thị từ cùng bảng với máy chủ (chép `subscription-entitlements` sang `src/lib/payments/quyen-loi.ts`: lượt AI/tháng, dung lượng, số thành viên).
- Team: phải chọn workspace mình là chủ; không có workspace nào là chủ thì thẻ Team mờ, kèm câu "Tạo workspace rồi mới mua Team Growth".
- Mua: `requestPurchase({ sku, appAccountToken })` → StoreKit hiện bảng Apple → nhận giao dịch qua `purchaseUpdatedListener` → gửi `POST /payments/apple/transactions` `{ jws, workspaceId? }` → máy chủ trả gói mới → app làm mới query `entitlements` → `finishTransaction`.
  - `appAccountToken` = UUID v5 sinh từ `userId` (hàm trong `src/lib/payments/app-account-token.ts`), để Apple gắn giao dịch với người dùng WeDo.
  - Máy chủ hỏng hoặc mất mạng: **không** `finishTransaction`; hiện "Đã thanh toán, đang kích hoạt gói…". StoreKit đưa lại giao dịch ở lần mở sau; app gửi lại.
  - Người dùng huỷ bảng Apple: đóng bảng, không báo lỗi.
- Nút **Khôi phục mua hàng**: `getAvailablePurchases` → gửi giao dịch mới nhất lên cùng endpoint.
- Nút **Quản lý đăng ký**: `deepLinkToSubscriptions` (trang quản lý của Apple).
- Dưới màn: dòng chữ Apple bắt buộc cho gói tự gia hạn (tự gia hạn trừ khi huỷ trước 24 giờ, quản lý trong Cài đặt), kèm link Điều khoản và Chính sách riêng tư hiện có.

### 4.2 Màn Tài khoản

- Hàng "Gói hiện tại": `Personal Pro · đến 09/11/2026 · qua App Store` hoặc `Miễn phí`. Nguồn: `GET /payments/entitlements` trả thêm `subscription`.
- Gói `provider = PAYOS` trên iPhone: hiện "qua web", không có nút gì thêm.

### 4.3 Hết lượt AI

`src/lib/ai/han-muc.ts`: lời nhắn hết lượt thêm nút "Nâng cấp" (chỉ iOS) dẫn tới màn Nâng cấp.

### 4.4 Lá chắn cũ

- `src/lib/web-link.ts`: giữ bộ lọc chặn đường dẫn thanh toán và việc ẩn nút mở web trên iOS; sửa chú thích cho đúng (iPhone đã có IAP, nhưng vẫn không dẫn ra trang thanh toán ngoài).
- `src/lib/notifications/thanh-toan.ts`: giữ ẩn thông báo gói/thanh toán trên iOS (nội dung nói về payOS).

## 5. Máy chủ NestJS

### 5.1 Dữ liệu (migration `2026100xxxxx_apple_iap`)

- `Subscription.provider`: enum `SubscriptionProvider { PAYOS, APPLE }`, mặc định `PAYOS`.
- Bảng `AppleTransaction`:

| Cột | Ý nghĩa |
|---|---|
| `originalTransactionId` (unique) | định danh một đăng ký Apple |
| `transactionId` | giao dịch mới nhất đã ghi |
| `productId` | mã sản phẩm |
| `environment` | `Sandbox` / `Production` |
| `appAccountToken` | UUID gắn người dùng |
| `status` | enum `AppleSubscriptionStatus { ACTIVE, EXPIRED, BILLING_RETRY, GRACE_PERIOD, REVOKED }` |
| `expiresAt`, `purchasedAt` | từ Apple |
| `autoRenew` | người dùng còn bật gia hạn không |
| `userId`, `workspaceId`, `subscriptionId` | gắn khi đã xác định được |
| `lastNotificationType`, `lastSignedPayload` | để truy vết |

- Không sửa bảng `PaymentOrder`.

### 5.2 Module `src/payments/apple/`

- `apple-verifier.ts`: bọc `SignedDataVerifier` và `AppStoreServerAPIClient` của `@apple/app-store-server-library`. Cấu hình từ biến môi trường `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`, `APPLE_IAP_ENVIRONMENT` (`Sandbox`/`Production`); `bundleId` cố định `vn.wedo.app`; chứng chỉ gốc Apple tải và cache trong bộ nhớ.
- `apple-mapping.ts` (thuần hàm, test đơn vị): `productId` → gói + chu kỳ qua `payment-catalog`; trạng thái Apple → trạng thái nội bộ:

| Trạng thái Apple | `AppleTransaction.status` | `Subscription.status` | `currentPeriodEnd` |
|---|---|---|---|
| 1 Active | ACTIVE | ACTIVE | `expiresDate` |
| 4 Grace period | GRACE_PERIOD | ACTIVE | `gracePeriodExpiresDate` |
| 3 Billing retry | BILLING_RETRY | ACTIVE tới `expiresDate` + 16 ngày | `expiresDate` + 16 ngày |
| 2 Expired | EXPIRED | EXPIRED | giữ |
| 5 Revoked (hoàn tiền/thu hồi) | REVOKED | CANCELLED | now |

- `apple-iap.service.ts`:
  - `ghiNhanGiaoDich(userId, jws, workspaceId?)`: xác minh chữ ký và `bundleId`; gọi `getAllSubscriptionStatuses(originalTransactionId)` để lấy trạng thái thật; kiểm `appAccountToken` khớp `userId` (không có token thì chấp nhận và gắn); Team thì kiểm `userId` là owner của `workspaceId` và workspace chưa gắn `originalTransactionId` khác; tạo/cập nhật `AppleTransaction` và `Subscription` (`provider = APPLE`). Idempotent theo `transactionId`.
  - `xuLyThongBao(signedPayload)`: xác minh, đọc `notificationType` + `subtype`, tìm `AppleTransaction` theo `originalTransactionId`, không có thì tìm người theo `appAccountToken`, không có nữa thì lưu dòng chưa gắn người. Loại xử lý: `SUBSCRIBED`, `DID_RENEW`, `DID_CHANGE_RENEWAL_STATUS`, `DID_CHANGE_RENEWAL_PREF`, `DID_FAIL_TO_RENEW`, `GRACE_PERIOD_EXPIRED`, `EXPIRED`, `REFUND`, `REVOKE`, `TEST`. Loại khác: ghi log, bỏ qua.
  - Xung đột: người đang có `Subscription` `PAYOS` còn hạn mà gửi giao dịch Apple → 409 `SUBSCRIPTION_CONFLICT` kèm `currentPeriodEnd`; `originalTransactionId` đã thuộc `userId` khác → 409 `TRANSACTION_OWNED_BY_OTHER_USER`.
- `apple-iap.controller.ts`: `POST /payments/apple/transactions` (JWT) và `POST /payments/webhook/apple` (không JWT; luôn trả 200 sau khi ghi, lỗi xử lý thì log để Apple gửi lại).

### 5.3 Quyền lợi

- `EntitlementsService` giữ logic: đọc `Subscription` còn hạn như cũ.
- Bỏ middleware "iPhone luôn hạn mức miễn phí" (nhận diện theo User-Agent CFNetwork/Darwin, thêm ở lần từ chối thứ hai, commit `cd6943b`).
- `GET /payments/entitlements` trả thêm `subscription: { provider, plan, billingCycle, currentPeriodEnd } | null`.

### 5.4 Biến môi trường Azure (chủ dự án đặt)

`APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`, `APPLE_IAP_ENVIRONMENT`. Thiếu biến thì module Apple tắt: endpoint trả 503 `APPLE_IAP_DISABLED`, webhook trả 200 và log.

## 6. Web

`src/components/billing/BillingCenterPanel.tsx`: gói `provider === 'APPLE'` hiện hộp "Gói này đăng ký qua App Store. Gia hạn, đổi hay huỷ trong Cài đặt → Apple ID → Đăng ký trên iPhone." và ẩn nút Gia hạn/Nâng cấp qua payOS. Trang quản trị doanh thu không đổi (đơn Apple không phải `PaymentOrder`); thêm sau nếu cần.

## 7. Tình huống lỗi

- Máy chủ chưa xác minh được sau khi Apple đã thu tiền: app giữ giao dịch chưa finish và gửi lại ở lần mở sau; webhook `SUBSCRIBED` cũng tự kích hoạt gói.
- Webhook tới trước app: xử lý bằng `appAccountToken`; giao dịch khôi phục từ máy cũ không có token thì lưu chưa gắn, gắn khi app gửi.
- Hoàn tiền/thu hồi: gói về FREE ngay; lượt AI đã dùng trong tháng vẫn tính.
- Một máy, nhiều tài khoản WeDo: gói gắn theo tài khoản đang đăng nhập lúc gửi; đăng ký Apple đã thuộc tài khoản khác thì từ chối.
- Sandbox và Production dùng chung endpoint, phân biệt bằng `environment`; dữ liệu sandbox vẫn tạo `Subscription` thật (chỉ dùng tài khoản thử).

## 8. Kiểm thử

- Máy chủ: test đơn vị `apple-mapping`, idempotent, xung đột payOS/Apple, quyền chủ workspace, từng loại thông báo bằng payload ký với chứng chỉ test của thư viện Apple; bộ test payOS hiện có vẫn xanh.
- App: test với mock `expo-iap` cho màn Nâng cấp (hiện giá từ StoreKit, mua, khôi phục, giữ giao dịch khi máy chủ hỏng, Team cần workspace là chủ); bộ 1008 test cũ vẫn xanh.
- Tay trên Sandbox: mua Pro tháng, nâng Team, gia hạn tự động (sandbox gia hạn mỗi 5 phút), huỷ, khôi phục trên máy thứ hai, web hiện "qua App Store".

## 9. Thứ tự đưa lên

1. ASC: Paid Apps Agreement, sản phẩm, khoá IAP, Notifications V2, sandbox tester (chủ dự án).
2. Máy chủ: migration + module Apple + biến Azure, lên trước (webhook phải sẵn).
3. Web: hộp "qua App Store".
4. App: build iOS 1.0.15 (5), nộp cùng 4 sản phẩm IAP (lần đầu phải nộp kèm bản app) và Notes mới cho người duyệt (có tài khoản demo, nêu rõ gói mua bằng IAP, gói web cũ vẫn dùng được theo 3.1.3(b)).
5. Android: không đổi đợt này; khi gộp `ios` vào `main` phải build Android mới vì vân tay đổi.
