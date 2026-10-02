# Trả lời Apple: Guideline 3.1.1 (01/10/2026)

Submission ID `fdc63797-d1e7-4ce4-b065-ff2b08d8893e`, bản 1.0.14 (4).

**Apple nói:** app cho dùng "paid plan" mua ở ngoài app mà không bán qua In-App Purchase. Apple dẫn 3.1.3(b), luật cho dịch vụ chạy trên nhiều nền tảng.

**Vì sao bị bắt:** dòng PAYMENTS trong Notes tự khai "Paid plans exist only on our website" và "AI use has a monthly limit". Người duyệt nối hai ý đó thành "gói mua trên web mở thêm lượt AI trong app".

**Cách trả lời:** viện dẫn 3.1.3(f), luật cho app miễn phí đi kèm một công cụ web trả phí. Đây đúng là cách app được thiết kế từ đầu, và code nhánh `ios` đã làm đủ các điều kiện của luật này:
- không có chỗ mua trong app;
- không có giá, không có tên gói;
- không có nút hay đường dẫn sang trang mua;
- thông báo gói và thanh toán bị ẩn trên iPhone.

## Thư trả lời (dán vào Reply to App Review)

```text
Hello,

Thank you for the review. We would like to ask you to reconsider this under Guideline 3.1.3(f), Free Stand-alone Apps.

WeDo for iPhone is a free companion to the WeDo web service (https://wedofpt.com.vn), a team workspace that groups manage mainly on the web, in the same way that cloud storage or email apps accompany their web service. The app is free to download and every feature in it works for every user without paying: project chat, direct messages, tasks, meetings and creating tasks with AI.

The app contains no purchasing and no calls to action for purchase outside the app:
- no In-App Purchase, prices, plan names, "upgrade" or "Pro" wording anywhere in the app;
- no buttons or links to our website's pricing or payment pages; the only web pages the app opens are our Terms of Use, Privacy Policy and Support pages, and none of them links to pricing or payment;
- billing and renewal notifications are hidden on iOS, so the app never reminds anyone to pay or renew;
- the App Store description and screenshots do not mention plans or prices.

The only thing a web subscription changes is a usage limit, for example how many AI task suggestions a workspace can create each month. Every user, paying or not, gets AI suggestions in the app; when the monthly limit is reached the app only says when it resets and that tasks can still be created by hand. It never suggests buying anything.

We understand 3.1.3(f) as allowing exactly this arrangement: a free app accompanying a paid web-based tool, with no purchasing inside the app and no calls to action to buy elsewhere. If you see any screen in the app that offers or promotes a purchase, please tell us where it is and we will remove it right away.

Thank you,
Le Huu Dai
```

## Câu thay cho dòng PAYMENTS trong App Review Information → Notes

Thay dòng `PAYMENTS: ...` cũ bằng dòng sau. Câu này dài hơn câu cũ khoảng 150 ký tự. Notes hiện là 3.702 ký tự, giới hạn của ô là 4.000, nên vẫn vừa.

```text
PAYMENTS (Guideline 3.1.3(f)): free companion to our web service. No purchasing, prices, plan names or links to buy anywhere in the app; billing notifications are hidden on iOS. All features work for every user; a web subscription only raises usage limits such as monthly AI suggestions.
```

## Nếu Apple vẫn giữ quyết định

Còn hai đường, chủ dự án phải chọn một:

1. **Thêm In-App Purchase**, tức gói thuê bao bán qua Apple.
   - Phải ký Paid Apps Agreement và khai ngân hàng, thuế trong App Store Connect. Chủ dự án tự làm phần này.
   - Phải tạo sản phẩm thuê bao trên App Store Connect.
   - App cần màn mua.
   - Máy chủ cần kiểm giao dịch qua App Store Server API và nhận thông báo App Store Server Notifications v2.
   - Apple thu 15% nếu đăng ký Small Business Program.
   - Ước chừng 3–5 ngày code, cộng thêm một lượt duyệt.
2. **Bản iPhone không mở thêm gì nhờ gói web.** Trên iOS, mọi người dùng chịu hạn mức như gói miễn phí. Cách này nhanh, nhưng người đã trả tiền trên web sẽ thấy ít lượt AI hơn khi dùng iPhone.

---

# Lần từ chối thứ hai (02/10/2026, 17:28) và cách xử lý đã chọn

Apple giữ nguyên quyết định sau thư viện dẫn 3.1.3(f). Chủ dự án chọn **đường 2** (02/10/2026): bản iPhone không nhận bất cứ thứ gì gói web mở thêm.

**Thực tế trong app:** thứ duy nhất gói trả phí mở thêm là hạn mức AI (miễn phí 20 lượt/tháng, Pro 300, Team 1000). Mọi tính năng khác ai cũng dùng được.

**Sửa ở máy chủ, không cần build mới:** máy chủ nhận ra yêu cầu từ app iPhone (header `x-wedo-platform: ios` ở bản sau; bản 1.0.14 (4) chưa gửi header nên dựa vào User-Agent `CFNetwork/Darwin` của fetch trên iOS) và luôn tính hạn mức gói miễn phí, bỏ qua mọi gói đang có của người dùng hay workspace. Web và Android giữ nguyên. Nhánh `fix/ios-han-muc-mien-phi`.

## Thư trả lời lần hai (gửi SAU khi máy chủ đã deploy)

```text
Hello,

Thank you for the clarification. We have resolved this on our side: the iOS app no longer accesses anything purchased outside the app.

- Subscriptions sold on our website apply to the web product only. Our server now serves the iOS app with the same free entitlements for every account, whether or not that account has a web subscription. There is no content, feature or limit in the iOS app that a purchase anywhere could unlock or change.
- The app has no In-App Purchase, no prices or plan names, no upgrade prompts and no links to any purchase page. Billing and renewal notifications are not delivered to iOS.
- Every iOS user gets identical features: project chat, direct messages, tasks, meetings and AI task suggestions, with the same monthly AI allowance for everyone.

This is a server-side change, so the build you already have, 1.0.14 (4), behaves this way now. We have updated the App Review notes to match. Please re-review the submission.

Thank you,
Le Huu Dai
```

## Dòng PAYMENTS mới trong App Review Information → Notes

```text
PAYMENTS: none. No In-App Purchase, no paid content and no paid features in this app. Nothing purchased anywhere, including on our website, unlocks or changes anything in the iOS app: every account gets the same features and the same monthly AI allowance. No prices, plan names or purchase links appear in the app.
```

## Nếu bị từ chối lần ba

Đặt lịch **App Review Appointment** (Meet with Apple, thứ Ba hoặc thứ Năm theo giờ Việt Nam) từ đường dẫn trong thư của Apple, để nói chuyện trực tiếp với người duyệt. Chuẩn bị: tài khoản demo không có gói, màn hình hạn mức AI, và câu khẳng định "no purchase anywhere changes the iOS app".
