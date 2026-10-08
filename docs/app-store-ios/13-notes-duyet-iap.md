# 13 — Notes cho người duyệt (bản có In-App Purchase) và các bước build, nộp bản 1.0.15

Việc cuối của đợt In-App Purchase. Chương này thay dòng `PAYMENTS: none` trong Notes ở [chương 04](04-thong-tin-cho-reviewer.md) và thay cách trả lời "không bán gì trong app" ở [chương 10](10-tra-loi-3.1.1.md) (đường 2 không còn là kế hoạch). Sản phẩm, khoá và biến Azure làm theo [chương 12](12-in-app-purchase.md).

## 1. Notes mới (tiếng Anh, dán vào App Review Information → Notes)

Đây là **văn bản thay thế hoàn chỉnh** cho Notes cũ (khối đã dán ở [chương 09](09-ban-dien-that.md) có dòng `PAYMENTS: free; no in-app purchases`, không được để lại). Tài khoản demo theo chương 09: A `wedo.review@gmail.com` ("Lê Huân", Leader dự án "Ra mắt AppleStore"), B `dieulinh@gmail.com` ("Diệu Linh", Member). Không có tài khoản C: người duyệt tự đăng ký tài khoản mới để thử xoá. HOW TO TEST và USER-GENERATED CONTENT rút gọn từ Notes ở chương 09, giữ nguyên các sự thật.

**Dài 3,774 ký tự, 3,921 byte UTF-8 (đếm theo NFC), tính cả mật khẩu B giả định dài 16 ký tự, dưới giới hạn 4.000 byte của Apple**. Mật khẩu A **không** ghi trong khối: nhập ở ô Password của Sign-In Information. Mật khẩu B ghi vào Notes (xem dưới).

```text
WeDo is a team-work app for Vietnamese students, the iPhone companion to https://wedofpt.com.vn. The app is in Vietnamese; English meanings are in brackets. Version 1.0.15 (5) sells two plans through auto-renewable In-App Purchase.

DEMO ACCOUNTS (email + password; no email verification, no OTP)
Main: wedo.review@gmail.com, "Lê Huân", Leader of the project "Ra mắt AppleStore". Password: see App Store Connect demo account field.
Teammate B: dieulinh@gmail.com, "Diệu Linh", Member, for real-time chat on a second device. Password: <OWNER PASTES HERE BEFORE SUBMITTING>
Please keep these two accounts. Sign in with Apple and Google are also offered; a new account agrees to the Terms once, then creates a workspace (any name).

IN-APP PURCHASE (Guideline 3.1.1)
Subscription group "WeDo": pro_monthly, pro_yearly (Personal Pro), team_monthly, team_yearly (Team Growth). Plans raise the monthly AI allowance and workspace limits; core features are free.
Upgrade screen (iPhone only): Tài khoản (Account tab) > Nâng cấp gói (Upgrade plan). It lists Personal Pro and Team Growth with a monthly/yearly selector and the price from StoreKit, then the Apple purchase sheet. Reviewers may purchase with a Sandbox account; the server accepts Sandbox receipts. At the bottom: Khôi phục mua hàng (Restore Purchases), Quản lý đăng ký (Manage Subscription) and the auto-renewal disclosure with Privacy Policy and Terms links.
Guideline 3.1.3(b): our service is multiplatform. A subscription bought on our website stays usable in the app, because the same plans can now also be bought in the app. The app links to no outside purchase page.
Server: each transaction is verified with the App Store Server API (bundle ID vn.wedo.app); renewals, expirations, refunds and revocations arrive via App Store Server Notifications V2.
The Privacy Policy and Terms will be updated with a paragraph on Apple subscriptions.

HOW TO TEST (as Lê Huân)
1. Chat: Trò chuyện (Chat tab) > Dự án (Projects) > "Ra mắt AppleStore".
2. AI (Leaders only): long-press Diệu Linh's latest message > Tạo công việc bằng AI (Create task with AI). A first-time consent dialog says what goes to the AI provider (Google Gemini, Azure OpenAI or OpenAI): the message, nearby messages and member names, never emails or phone numbers. Đồng ý (Agree) > review > Tạo công việc. Không, cảm ơn (No, thanks) sends nothing. Switch: Tài khoản > Cho phép dùng AI.
3. DMs: Trò chuyện > Tin nhắn (Messages). Friends: people icon, top right.
4. Tasks: Công việc (Tasks tab): Nhận việc (Accept), Nộp tài liệu (Attach file), Gửi duyệt (Submit); the Leader sees Duyệt bài (Approve) and Trả lại (Return).
5. Meetings: Cuộc họp (Meetings tab). Vào phòng họp (Join) opens Daily.co in the browser; no microphone use.

ACCOUNT DELETION
Please use a new account (Đăng ký or Sign in with Apple): Tài khoản > Xoá tài khoản (Delete account) > type XOA > Xoá tài khoản vĩnh viễn > confirm. Immediate and permanent; the Apple token is revoked. A workspace owner must hand over ownership first.

USER-GENERATED CONTENT
- Sign up needs the tick "I am 18 or older and agree to the Terms of Use and Privacy Policy" (rating 18+). Terms state zero tolerance for objectionable content: https://wedofpt.com.vn/dieu-khoan.html
- Filter: objectionable Vietnamese and English words in messages and names become ***.
- Report: long-press someone else's message > Báo cáo tin nhắn (Report message) > reason > Gửi báo cáo. A person: ⋯ in a DM, or ⋮ in Friends > Báo cáo người này.
- Block: same menus > Chặn người này (Block). Instant. Unblock: Tài khoản > Người đã chặn.
- Reports reach our admin console at once. Within 24 hours we remove the content and suspend the poster. Contact: wedosupport6886@gmail.com

PERMISSIONS: camera and photos only for chat pictures and the avatar.
```

Trước khi dán:

- **Trước khi dán Notes, thay chỗ `<OWNER PASTES HERE BEFORE SUBMITTING>` bằng mật khẩu của B** (Notes được phép chứa mật khẩu tài khoản demo; tài liệu này thì không). Ô Sign-In Information của App Store Connect chỉ có một cặp tài khoản/mật khẩu (dùng cho A), nên mật khẩu B phải nằm trong Notes.
- Làm lại các việc ở chương 09, mục "Việc phải xong trước khi bấm Submit": Diệu Linh gửi một tin mới có việc cần làm; Lê Huân tắt "Cho phép dùng AI" để người duyệt thấy hộp thoại đồng ý.
- Câu cuối mục IN-APP PURCHASE ("will be updated") đúng khi đoạn ở mục 3 chưa lên web. Khi hai trang đã đăng, đổi thành "include a paragraph on Apple subscriptions".

## 2. Các bước của chủ dự án

1. **Đưa máy chủ và web lên trước khi build.** Bạn tự gộp hai nhánh: máy chủ `feat/apple-iap-backend`, web `feat/apple-iap-web`. Sau đó đưa lên theo thứ tự thường lệ (máy chủ trước, web sau).
2. **Đặt `APPLE_IAP_ENVIRONMENT=Production`** trên Azure (viết đúng chữ; chương 12 mục 6), khởi động lại. Máy chủ tự thử Sandbox khi người duyệt mua bằng tài khoản Sandbox (chương 12 mục 6, phần "Sandbox hay Production").
3. **Kiểm bốn sản phẩm** ở App Store Connect → Monetization → Subscriptions đủ giá và bản địa hoá. Trạng thái **Ready to Submit** sẽ có sau khi tải Review Screenshot ở bước 6.
4. **Build** từ thư mục `D:\WeDo_ChPlay-ios` (nhánh `ios`, bản 1.0.15, build 5):
   - `google-services.json` là tệp không nằm trong git; thư mục worktree này phải có bản chép của nó (chép từ `D:\WeDo_ChPlay`). Thiếu là build hỏng.
   - Chạy `npx expo install --check` trước và sửa mọi phiên bản lệch.
   - Rồi `eas build -p ios --profile production`.
5. **Nộp lên App Store Connect:** `eas submit -p ios` (chọn build vừa xong). Chờ build xử lý xong trong TestFlight.
6. **Chụp ảnh Review Screenshot** của màn "Nâng cấp gói" trên iPhone thật (Tài khoản → Nâng cấp gói), thấy cả hai thẻ gói và giá. Một ảnh dùng cho cả 4 sản phẩm (mục Review Information của từng sản phẩm, như chương 12 mục 3). Làm sau khi build 5 đã xử lý xong và cài lên iPhone qua TestFlight (bước 5); sau đó tải ảnh lên Review Screenshot của cả 4 sản phẩm. Bốn sản phẩm chỉ thành Ready to Submit khi đã có ảnh này.
7. **Trong App Store Connect**, mở phiên bản **1.0.15**:
   1. Mục Build: gắn **build 5**.
   2. Mục **In-App Purchases and Subscriptions**: bấm dấu cộng, **chọn cả 4 sản phẩm**. Lần đầu tiên, sản phẩm phải được nộp cùng bản app; thiếu thì sản phẩm không được duyệt.
   3. App Review Information → Notes: dán khối ở mục 1. Kiểm email demo và mật khẩu còn đúng.
   4. Vào **Resolution Center**, trả lời lần từ chối 3.1.1: ngắn gọn rằng bản 1.0.15 đã dùng In-App Purchase cho cả hai gói (mô tả theo Notes ở trên), rồi **Submit for Review**.
8. **Sau khi được duyệt:** không đổi gì. `APPLE_IAP_ENVIRONMENT` giữ nguyên `Production`. Nếu chọn "Manually release", **thử một lần mua Sandbox thật** (tài khoản Sandbox, chương 12 mục 5 và 8) trước khi bấm Release.


## 3. Đoạn cần thêm vào Điều khoản và Chính sách

Từ bản 1.0.15, app bán thuê bao qua Apple, nên hai trang web cần thêm đoạn dưới đây (web song ngữ, thêm cả hai bản). Không đặt giá hay nút nâng cấp vào hai trang này; chỉ mô tả cách thuê bao hoạt động. Đăng lên web **trước khi nộp**.

### 3.1. Điều khoản sử dụng (chương 06): mục mới "Thuê bao qua App Store"

Tiếng Việt:

```text
Thuê bao qua App Store
Trên ứng dụng iPhone, bạn có thể mua gói Personal Pro hoặc Team Growth bằng thuê bao tự động gia hạn qua App Store. Khoản tiền được tính vào Apple ID của bạn khi bạn xác nhận mua. Thuê bao tự động gia hạn theo từng kỳ (tháng hoặc năm) bằng đúng giá đã hiển thị lúc mua (Apple sẽ thông báo và xin bạn đồng ý trước khi tăng giá), trừ khi bạn tắt gia hạn ít nhất 24 giờ trước khi kỳ hiện tại kết thúc. Bạn quản lý và huỷ thuê bao trong Cài đặt → [tên của bạn] → Thuê bao trên iPhone. Việc hoàn tiền cho khoản mua qua App Store do Apple xử lý theo chính sách của Apple; WeDo không hoàn tiền thay Apple. Gói mua qua App Store dùng được trên cả ứng dụng và web WeDo của cùng tài khoản.
```

English:

```text
Subscriptions through the App Store
In the iPhone app you can buy Personal Pro or Team Growth as an auto-renewable subscription through the App Store. Payment is charged to your Apple ID account when you confirm the purchase. The subscription renews automatically each period (monthly or yearly) at the price shown at purchase (Apple notifies you and asks for your consent before any price increase), unless you turn off auto-renewal at least 24 hours before the current period ends. You manage and cancel subscriptions in Settings → [your name] → Subscriptions on your iPhone. Refunds for App Store purchases are handled by Apple under Apple's policies; WeDo does not refund in Apple's place. A plan bought through the App Store works in both the app and the WeDo website for the same account.
```

### 3.2. Chính sách quyền riêng tư (chương 05): thêm vào mục dữ liệu thanh toán

Tiếng Việt:

```text
Thuê bao mua qua App Store: Apple xử lý khoản thanh toán và giữ thông tin thanh toán của bạn; WeDo không nhận số thẻ hay thông tin thanh toán. Khi bạn mua, máy chủ WeDo chỉ lưu các mã giao dịch Apple cấp (mã giao dịch gốc, mã giao dịch, mã sản phẩm), kỳ thuê bao, trạng thái gia hạn và một mã ngẫu nhiên do WeDo cấp để gắn giao dịch với tài khoản của bạn. WeDo xác minh giao dịch với Apple để mở và gỡ quyền lợi gói. Apple xử lý dữ liệu của bạn theo chính sách quyền riêng tư của Apple.
```

English:

```text
Subscriptions bought through the App Store: Apple processes the payment and keeps your payment details; WeDo does not receive card numbers or payment details. When you buy, the WeDo server stores only the identifiers Apple issues (original transaction ID, transaction ID, product ID), the subscription period, the renewal status, and a random identifier WeDo issues to link the transaction to your account. WeDo verifies transactions with Apple to grant and remove plan benefits. Apple processes your data under Apple's privacy policy.
```
