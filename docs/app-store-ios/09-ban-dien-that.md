# 09 — Bản điền thật cho lần nộp đầu (28/09/2026)

Tài liệu `02` và `04` soạn trước khi có dữ liệu demo, nên dựng theo ba tài khoản A, B, C và dự án "Dự án mẫu". Lần nộp thật dùng dữ liệu chủ dự án đã dựng. Trang này ghi lại đúng những gì được dán vào App Store Connect.

## Khác với 02 và 04

| Mục | Kế hoạch trong 02/04 | Lần nộp thật |
|---|---|---|
| Build | 3 | **4** (`b1588ef` trên nhánh `ios`). Build 3 dựng từ `df0c255`, chưa có `2b94b17`. Người duyệt cài mới sẽ chạy mã gốc trong bản cài ở lần mở đầu, nên OTA không đủ. |
| Version | 1.0.14 | 1.0.14 (ô Version tạo sẵn là "1.0", phải sửa, nếu không build không hiện ở Add Build) |
| Tài khoản chính | A "Nguyễn Minh Anh" | `wedo.review@gmail.com`, "Lê Huân", Leader dự án "Ra mắt AppleStore" trong không gian "Duyệt Apple thành công" |
| Tài khoản phụ | B "Trần Quốc Bảo" | `dieulinh@gmail.com`, "Diệu Linh", Member |
| Tài khoản để xoá | C "Phạm Thu Chi" | Không có. Notes xin người duyệt tự đăng ký tài khoản mới để thử xoá |
| Tin để thử AI | tin số 10 có chữ "slide" | Tin mới nhất của Diệu Linh. Tin "slide" cũ đã thành công việc khi chụp ảnh, AI không đề xuất lại |
| Hộp thoại đồng ý AI | tự hiện lần đầu | Lê Huân đã đồng ý khi chụp ảnh (`aiConsentAt` lưu trên máy chủ). Phải tắt "Cho phép dùng AI" trước khi nộp để người duyệt thấy hộp thoại |
| Nhà cung cấp AI | `[TÊN NHÀ CUNG CẤP AI]` | Ghi cả ba tên, đúng như hộp thoại trong app |
| Báo cáo vi phạm | "email and admin console" | Chỉ nhắc trang quản trị, vì `REPORT_NOTIFY_EMAIL` trên Azure chưa chắc có giá trị |

Mật khẩu hai tài khoản demo do chủ dự án giữ và tự gõ vào App Store Connect. Không ghi vào đây.

## Việc phải xong trước khi bấm Submit

- [ ] Build 4 đã xử lý xong trên App Store Connect và được chọn ở mục Build.
- [ ] Web đã đẩy `ios-web` (`3a7920c` … `7bbf0c1`), để Chính sách quyền riêng tư có đoạn Đăng nhập bằng Apple.
- [ ] Diệu Linh gửi một tin mới có việc cần làm trong "Ra mắt AppleStore".
- [ ] Lê Huân tắt "Cho phép dùng AI" trong tab Tài khoản.
- [ ] Thay `[MAT KHAU DIEU LINH]` trong Notes.

## Notes đã dán

> Đã thay thế từ 08/10/2026 bằng Notes ở chương 13 §1 (bản IAP 1.0.15).

3.702 ký tự, 3.880 byte (tính cả chỗ trống 22 byte), đếm theo NFC.

```text
WeDo is a free team-work app for Vietnamese students, the iPhone companion to https://wedofpt.com.vn. The app is in Vietnamese; English meanings are in brackets.

DEMO ACCOUNTS (email + password; no email verification, no OTP)
Main: the account in the Sign-In fields, "Lê Huân", Leader of the project "Ra mắt AppleStore".
Teammate: dieulinh@gmail.com / [MAT KHAU DIEU LINH] - "Diệu Linh", Member, for real-time chat on a second device.
Please type the emails in lowercase. Projects are created on the web; sample data is pre-loaded. Please keep these two accounts.

SIGN IN: the sign-in screen also offers Tiếp tục với Apple (Sign in with Apple) and Tiếp tục với Google; try them with your own account. A new account agrees to the Terms once, then sees Tạo không gian làm việc (Create workspace): type any name.

HOW TO TEST (as Lê Huân)
1. Chat: Trò chuyện (Chat tab) > Dự án (Projects) > "Ra mắt AppleStore".
2. AI (Leaders only): long-press Diệu Linh's latest message > Tạo công việc bằng AI (Create task with AI). A first-time consent dialog says what goes to the AI provider (Google Gemini, Azure OpenAI or OpenAI): the message, nearby messages and member names, never emails or phone numbers. Đồng ý (Agree) > review the draft > Tạo công việc (Create task). Không, cảm ơn (No, thanks) sends nothing. Switch: Tài khoản > Cho phép dùng AI (Allow AI).
3. DMs: Trò chuyện > Tin nhắn (Messages). Friends: people icon at the top right.
4. Tasks: Công việc (Tasks tab) > + creates a task with a deadline and assignee. In a task: Nhận việc (Accept), Nộp tài liệu (Attach file), Gửi duyệt (Submit); the Leader sees Duyệt bài (Approve) and Trả lại (Return).
5. Meetings: Cuộc họp (Meetings tab) > Tạo cuộc họp (Create meeting). Vào phòng họp (Join) opens Daily.co in the browser; the app never uses the microphone.

ACCOUNT DELETION
Please use a new account: Đăng ký (Sign up) or Sign in with Apple, create any workspace, then Tài khoản > Xoá tài khoản (Delete account) > type XOA > Xoá tài khoản vĩnh viễn > confirm. Immediate and permanent; uploaded photos and files are deleted too, and for Apple accounts we revoke the Apple token. The app shows Đã xoá tài khoản (Account deleted) and returns to sign-in. An account that owns a workspace with other members is first asked to hand ownership to one of them.

USER-GENERATED CONTENT
- Terms: Đăng ký (Sign up) stays disabled until the user ticks "I am 18 or older and agree to the Terms of Use and Privacy Policy". Minimum age 18, so the rating is 18+. Apple, Google and older accounts get a one-time Terms screen: Đồng ý và tiếp tục (Agree and continue). The Terms state zero tolerance for objectionable content and abusive users: https://wedofpt.com.vn/dieu-khoan.html
- Filter: objectionable Vietnamese and English words in messages and display names become *** automatically.
- Report: long-press someone else's message > Báo cáo tin nhắn (Report message) > a reason > Gửi báo cáo (Send). Report a person: ⋯ at the top of a DM, or ⋮ on any row in Friends > Báo cáo người này.
- Block: the same menus > Chặn người này (Block) > Chặn. Instant: no DMs or friend requests either way, and their messages are hidden. Unblock: Tài khoản > Người đã chặn (Blocked users).
- Reports appear at once in our admin console. Within 24 hours we remove the content and suspend the poster, who then cannot sign in. Contact: wedosupport6886@gmail.com

PAYMENTS: free; no in-app purchases, prices or links to buy. Paid plans exist only on our website and are never mentioned in the app. AI use has a monthly limit.

PERMISSIONS: camera and photos only for chat pictures and the avatar. Notifications are requested only after tapping Bật thông báo (Turn on notifications).
```
