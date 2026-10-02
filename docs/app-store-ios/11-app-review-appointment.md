# Chuẩn bị buổi App Review Appointment (nếu bị từ chối lần ba)

Chỉ dùng khi Apple từ chối bản 1.0.14 (4) lần thứ ba vì Guideline 3.1.1. Buổi họp là một cuộc gọi video khoảng 30 phút với một chuyên viên App Review, nói tiếng Anh.

## 1. Đặt lịch

1. Mở lại thư từ chối trong App Store Connect, bấm **App Review Appointment at Meet with Apple**. Hoặc vào developer.apple.com → **Meet with Apple** → mục **App Review** → *App Review Consultation*.
2. Đăng nhập bằng Apple ID của tài khoản nhà phát triển (Team ID `LR53W8386S`).
3. Chọn giờ vào **thứ Ba hoặc thứ Năm**, trong giờ làm việc Việt Nam. Lịch thường kín, nên đặt ngay khi có thư từ chối.
4. Khi form hỏi nội dung, điền ngắn gọn:
   > App "WeDo: Làm việc nhóm" (Apple ID 6816878767), submission fdc63797-d1e7-4ce4-b065-ff2b08d8893e, rejected under 3.1.1. The app has no paid content; we would like to understand what in the build is being read as paid content and how to resolve it.
5. Sau khi đặt, Apple gửi mail xác nhận kèm đường dẫn cuộc gọi. Ghi lại giờ vào lịch, trừ hao múi giờ.

## 2. Trước buổi gọi, chuẩn bị trong ngày hôm trước

- [ ] Kiểm trên iPhone (bản TestFlight 1.0.14) bằng tài khoản **đang có gói Team**: dòng hạn mức AI phải tính trên 20 lượt. Chụp màn hình.
- [ ] Đăng nhập sẵn app trên iPhone bằng tài khoản `wedo.review@gmail.com` (Lê Huân), mở sẵn chat dự án "Ra mắt AppleStore".
- [ ] Mở sẵn trên máy tính: App Store Connect (trang submission), và `https://wedofpt.com.vn` (để chỉ ra bảng giá chỉ nói về web).
- [ ] In hoặc mở sẵn trang tóm tắt ở mục 4 để chia sẻ màn hình.
- [ ] Tai nghe, mạng ổn, camera bật. Chuẩn bị giấy bút ghi lại lời họ nói.

## 3. Mục tiêu của buổi gọi

1. Biết **chính xác** thứ gì trong app hoặc hồ sơ khiến họ kết luận có "paid plan".
2. Được xác nhận: với trạng thái hiện tại (iPhone không nhận gì từ gói web), app **không** thuộc 3.1.1.
3. Nếu họ vẫn chưa đồng ý: hỏi rõ **phải đổi gì** để được duyệt, ghi lại từng chữ.

## 4. Trang tóm tắt một trang (chia sẻ màn hình, đọc theo)

```text
WeDo: Làm việc nhóm — App Store Connect ID 6816878767 — Submission fdc63797

WHAT THE APP IS
Free team-work app for Vietnamese university students: project chat, tasks, file submission and review, meetings, reminders, contribution board. Free to download, free to use. Also available as a web app and an Android app with the same accounts.

PAYMENTS
- No In-App Purchase. No prices, plan names, "upgrade" or "Pro" wording anywhere in the app.
- No links from the app to any pricing or payment page.
- Our website sells subscriptions for the WEB product only. Since October 2, 2026 our server gives the iOS app the same free entitlements to every account, with or without a web subscription. Nothing bought anywhere unlocks or changes anything in the iOS app.
- The only variable thing in the app is a monthly allowance of AI task suggestions. On iOS it is the same for everyone: 20 per month. When it is used up, the app says when it resets and that tasks can still be created by hand.
- Billing and renewal notifications are not delivered to iOS.

WHAT WE ASK
1. Which element of the build or the notes was read as "paid content"?
2. Does the current behaviour (no effect of any purchase on iOS) resolve 3.1.1?
3. If not, what exact change would?
```

## 5. Lời mở đầu, khoảng một phút

> Thank you for taking the time. I'm Le Huu Dai, the developer of WeDo, a free team-work app for university students in Vietnam. The submission was rejected twice under 3.1.1 for accessing paid content purchased outside the app. I'd like to understand what was identified, because the iOS app has no paid content: there is no In-App Purchase, no prices or plan names, and since October 2 our server gives every iOS account the same free entitlements regardless of any web subscription. May I show you a one-page summary and then the app?

Bản tiếng Việt để nắm ý: *Cảm ơn anh/chị đã dành thời gian. Tôi là Lê Hữu Đại, người làm WeDo, app làm việc nhóm miễn phí cho sinh viên Việt Nam. Bản nộp bị từ chối hai lần theo 3.1.1 vì "dùng nội dung trả phí mua ngoài app". Tôi muốn hiểu rõ họ thấy gì, vì app iPhone không có nội dung trả phí: không có IAP, không giá, không tên gói, và từ 2/10 máy chủ trả cùng một quyền miễn phí cho mọi tài khoản iOS, bất kể gói trên web. Tôi xin chia sẻ một trang tóm tắt rồi mở app.*

## 6. Câu hỏi họ có thể hỏi và cách trả lời

| Họ hỏi | Trả lời (tiếng Anh) | Ý tiếng Việt |
|---|---|---|
| Your website sells subscriptions. What do they unlock? | They unlock features of the web product only: a higher monthly AI allowance and, later, web-only tools. The iOS app ignores subscriptions entirely; every iOS account gets the same free entitlements. | Gói chỉ cho bản web. App iOS bỏ qua gói hoàn toàn. |
| So a paying customer gets more in the iOS app? | No. Since October 2, 2026 the server serves the iOS app with the free entitlements for every account. A paying customer sees exactly what a free user sees. We can show it live with a paying account. | Không. Khách trả tiền thấy y như người dùng miễn phí; có thể mở ngay cho họ xem. |
| Why is there a monthly limit at all? | AI calls cost us money, so every account has a free monthly allowance of 20 AI task suggestions. It is a free-tier limit, the same for everyone on iOS, not a paid tier. | Giới hạn là của gói miễn phí, ai cũng như nhau. |
| Will you add In-App Purchase later? | We may add In-App Purchase in a future version if we decide to sell anything on iOS. If we do, it will go through StoreKit. Today nothing is sold or unlocked on iOS. | Có thể sau này, qua StoreKit. Hiện không bán gì. |
| Does the app link to your website? | Only to our Terms of Use, Privacy Policy and Support pages. None of them links to pricing or payment. | Chỉ ba trang pháp lý, không dẫn tới bảng giá. |
| Is the account shared with the web? | Yes, one account works on web, Android and iOS. Account sharing is normal; what matters is that nothing bought on the web changes the iOS app, and it doesn't. | Dùng chung tài khoản, nhưng không có gì mua trên web ảnh hưởng iOS. |
| What about the Android app? | Android is distributed through Google Play under Google's rules. It is not relevant to this submission, but we are happy to describe it. | Android theo luật Google, không liên quan bản nộp này. |
| Why did your notes mention a web subscription raising limits? | That described the behaviour before October 2. We have changed the server since, and the notes were updated to match. I apologise for the confusion it caused. | Đó là mô tả trước 2/10; đã đổi và cập nhật Notes. |
| Can you show it? | Yes. *(Mở app, vào chat dự án, chỉ dòng hạn mức AI; nếu có thể, đăng nhập bằng tài khoản có gói Team và chỉ ra con số vẫn là 20.)* | Mở app cho xem trực tiếp. |

## 7. Những điều KHÔNG làm trong buổi gọi

- Không tranh luận lại về 3.1.3(f). Lập luận đó đã bị bác hai lần; nhắc lại chỉ mất thời gian.
- Không dùng các từ "paid plan", "upgrade", "premium", "Pro" khi nói về app iOS. Dùng "free entitlements", "the same for everyone".
- Không hứa thời điểm làm In-App Purchase.
- Không nói "the reviewer was wrong". Nói "we want to understand what was identified".
- Không đọc mật khẩu tài khoản demo thành tiếng; nếu họ cần, nói nó nằm trong App Review Information.

## 8. Nếu họ vẫn nói phải có In-App Purchase

Hỏi đúng ba câu, ghi lại nguyên văn câu trả lời:
1. "Which specific content or feature in the iOS app do you consider purchased outside the app?"
2. "If we remove the AI suggestion feature from iOS entirely, would the app comply as a free app?"
3. "If we keep AI with a fixed free allowance for everyone, what exactly would still be non-compliant?"

Câu 2 là đường lùi cuối: bỏ hẳn AI khỏi bản iOS thì app chắc chắn chỉ còn tính năng miễn phí. Chỉ làm khi họ xác nhận đó là điều kiện đủ.

## 9. Sau buổi gọi

1. Trong vòng một giờ, viết vào Resolution Center một thư ngắn tóm tắt những gì hai bên đã thống nhất, để có bằng chứng bằng văn bản gắn với submission.
2. Gửi tôi ghi chép (họ nói gì, yêu cầu gì) để tôi làm phần kỹ thuật, nếu có.
3. Nếu họ xác nhận hiện trạng là ổn: nộp lại bản 1.0.14 (4), không cần build mới.
