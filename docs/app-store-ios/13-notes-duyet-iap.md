# 13 — Notes cho người duyệt (bản có In-App Purchase) và các bước build, nộp bản 1.0.15

Việc cuối của đợt In-App Purchase. Chương này thay dòng `PAYMENTS: none` trong Notes ở [chương 04](04-thong-tin-cho-reviewer.md) và thay cách trả lời "không bán gì trong app" ở [chương 10](10-tra-loi-3.1.1.md) (đường 2 không còn là kế hoạch). Sản phẩm, khoá và biến Azure làm theo [chương 12](12-in-app-purchase.md).

## 1. Notes mới (tiếng Anh, dán vào App Review Information → Notes)

Dài 2778 ký tự (2792 byte), dưới giới hạn 4.000 byte của Apple. Dán **nguyên khối**, thay cho Notes cũ (khối cũ ở chương 04 mục 6 có dòng `PAYMENTS: none`, không được để lại). Mật khẩu **không** ghi trong khối này: nhập ở ô Password của mục Sign-In Information.

```text
Hello,

WeDo is a team-collaboration app (project chat, direct messages, tasks, meetings, AI task suggestions). Version 1.0.15 (5) sells two plans through auto-renewable In-App Purchase, as discussed in our earlier review.

IN-APP PURCHASE
- Subscription group "WeDo", 4 products: pro_monthly and pro_yearly (Personal Pro), team_monthly and team_yearly (Team Growth).
- Plans raise the monthly AI-suggestion allowance and, for Team Growth, workspace limits. Core features remain free for everyone.
- Prices and currency are read from StoreKit; nothing is hard-coded.

DEMO ACCOUNT
- Email: wedo.review@gmail.com
- Password: see App Store Connect demo account field.
- Sign in with the email and password on the login screen. (Sign in with Apple and Google are also offered; the email account is enough for review.)

HOW TO REACH THE UPGRADE SCREEN (iPhone only)
1. Open the Account tab.
2. Tap "Nâng cấp gói" (Upgrade plan). This row appears on iOS only.
3. The screen lists Personal Pro and Team Growth, each with a monthly/yearly selector, the localized StoreKit price and the plan benefits.
4. Tap the subscribe button to open the standard Apple purchase sheet. Sandbox purchases are supported.
5. At the bottom: "Khôi phục mua hàng" (Restore Purchases), "Quản lý đăng ký" (Manage Subscription, opens Apple subscription settings), the auto-renewal disclosure (price, period, automatic renewal, how to cancel) and links to the Privacy Policy and Terms of Use.
- Team Growth is bought for a workspace the user owns, so the demo account needs an owned workspace to buy it; Personal Pro has no such requirement.

SUBSCRIPTIONS BOUGHT ON THE WEB (Guideline 3.1.3(b))
Our service is multiplatform and the same plans are sold on our website. A subscription bought on the web remains usable in the iOS app, because the same plans can now also be purchased in the app via In-App Purchase. The app contains no link to, or promotion of, any outside purchase page.

SERVER-SIDE VALIDATION
Every transaction is verified on our server with the App Store Server API (signed transactions, bundle ID vn.wedo.app). Renewals, expirations, refunds and revocations are processed through App Store Server Notifications V2. The server grants and removes plan benefits from this data, never from the client alone.

LEGAL
The Privacy Policy (https://wedofpt.com.vn/privacy.html) and Terms of Use are linked from the Upgrade screen. They will be updated with a paragraph on Apple subscriptions (billing through the Apple ID, automatic renewal, cancellation in Apple ID settings, refunds handled by Apple).

EVERYTHING ELSE
User-generated content moderation (Guideline 1.2), account deletion, AI consent and sign-in are unchanged from the previous submission.

Thank you for reviewing WeDo.
Le Huu Dai
```

Hai điểm cần biết trước khi dán:

- ⚠ Đoạn LEGAL nói "sẽ được cập nhật". Chương 05 (Chính sách quyền riêng tư) và chương 06 (Điều khoản) **chưa có** đoạn về thuê bao Apple. Hãy thêm đoạn đó vào hai trang rồi đăng lên web **trước khi nộp**; khi đã đăng, đổi câu LEGAL thành "include a paragraph on Apple subscriptions".
- Khối này chỉ nói phần IAP và những gì chương 04 đã kiểm. Nếu muốn giữ nguyên các mục "HOW TO TEST" và "USER-GENERATED CONTENT" của chương 04, ghép chúng vào, nhưng tổng phải dưới 4.000 byte.

## 2. Các bước của chủ dự án

1. **Chụp ảnh Review Screenshot** của màn "Nâng cấp gói" trên iPhone thật (Tài khoản → Nâng cấp gói), thấy cả hai thẻ gói và giá. Một ảnh dùng cho cả 4 sản phẩm (mục Review Information của từng sản phẩm, như chương 12 mục 3). Ảnh phải từ bản build có màn này, nên làm sau bước 5 qua TestFlight, hoặc từ bản dev.
2. **Đưa máy chủ và web lên trước khi build.** Bạn tự gộp hai nhánh: máy chủ `feat/apple-iap-backend`, web `feat/apple-iap-web`. Sau đó đưa lên theo thứ tự thường lệ (máy chủ trước, web sau).
3. **Đặt `APPLE_IAP_ENVIRONMENT=Production`** trên Azure (viết đúng chữ; chương 12 mục 6), khởi động lại. Máy chủ tự thử Sandbox khi người duyệt mua bằng tài khoản Sandbox (chương 12 mục 6, phần "Sandbox hay Production").
4. **Kiểm bốn sản phẩm** ở App Store Connect → Monetization → Subscriptions đều ở trạng thái **Ready to Submit** (đủ giá, bản địa hoá, Review Screenshot).
5. **Build** từ thư mục `D:\WeDo_ChPlay-ios` (nhánh `ios`, bản 1.0.15, build 5):
   - `google-services.json` là tệp không nằm trong git; thư mục worktree này phải có bản chép của nó (chép từ `D:\WeDo_ChPlay`). Thiếu là build hỏng.
   - Chạy `npx expo install --check` trước và sửa mọi phiên bản lệch.
   - Rồi `eas build -p ios --profile production`.
6. **Nộp lên App Store Connect:** `eas submit -p ios` (chọn build vừa xong). Chờ build xử lý xong trong TestFlight.
7. **Trong App Store Connect**, mở phiên bản **1.0.15**:
   1. Mục Build: gắn **build 5**.
   2. Mục **In-App Purchases and Subscriptions**: bấm dấu cộng, **chọn cả 4 sản phẩm**. Lần đầu tiên, sản phẩm phải được nộp cùng bản app; thiếu thì sản phẩm không được duyệt.
   3. App Review Information → Notes: dán khối ở mục 1. Kiểm email demo và mật khẩu còn đúng.
   4. Vào **Resolution Center**, trả lời lần từ chối 3.1.1: ngắn gọn rằng bản 1.0.15 đã dùng In-App Purchase cho cả hai gói (mô tả theo Notes ở trên), rồi **Submit for Review**.
8. **Sau khi được duyệt:** không đổi gì. `APPLE_IAP_ENVIRONMENT` giữ nguyên `Production`. Nếu chọn "Manually release", **thử một lần mua Sandbox thật** (tài khoản Sandbox, chương 12 mục 5 và 8) trước khi bấm Release.
