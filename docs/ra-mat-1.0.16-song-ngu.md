# Ra mắt bản 1.0.16: app mobile song ngữ (vi/en)

Nhánh mobile `feat/song-ngu`. Bản iOS 1.0.16 (build 6), Android 1.0.16 (versionCode 20; lần upload gần nhất lên Google Play là 19 nên 20 hợp lệ).

## Thứ tự làm

1. **Máy chủ trước.** Gộp và đưa lên nhánh `feat/ngon-ngu-nguoi-dung` của repo BE_WEDO: cột mới `User.language`, `PATCH /users/me/language`, thông báo theo ngôn ngữ từng người nhận, AI trả lời theo ngôn ngữ. Máy chủ phải lên trước vì app mới gọi endpoint này.
   - Kiểm web (FE_WEDO): web dịch tiêu đề thông báo bằng cách khớp câu tiếng Việt. Người dùng tiếng Anh sẽ nhận tiêu đề tiếng Anh nên web có thể hiện sai hoặc không dịch. Thử một tài khoản đặt tiếng Anh trước khi coi là xong.
2. **Build cả hai nền tảng từ cùng nhánh bằng EAS**: iOS 1.0.16 (6) và Android 1.0.16 (20). Bắt buộc build mới, không dùng OTA: `locales` và `CFBundleLocalizations` thay đổi vân tay native nên `eas update` không chuyển được bản này.
3. **Sau khi được duyệt**, cập nhật hai trang cửa hàng theo:
   - App Store: `docs/app-store-ios/14-app-store-tieng-anh.md` (đã bỏ câu "interface is currently in Vietnamese", có What's New 1.0.16 tiếng Anh và tiếng Việt) và dòng ngôn ngữ trong Notes ở `docs/app-store-ios/13-notes-duyet-iap.md`.
   - CH Play: `docs/chplay-tieng-anh.md`.

## Vân tay (`npx @expo/fingerprint fingerprint:generate --platform ios|android`, 09/10/2026, trên Windows)

| Nền tảng | Hash |
|---|---|
| iOS | `fe8d5cecfd2dcb56f583d3951243180ddaa4bf16` |
| Android | `995a8b2b81f2a016af45acd3b85029875d7d9796` |

Lưu ý: EAS build trên Linux với dấu xuống dòng LF. Nếu có tệp bị tính vân tay mà đang là CRLF trên Windows (git đổi LF thành CRLF khi checkout), hash tính ở đây có thể khác hash của EAS. Dùng hash chỉ để so sánh sơ bộ; hash chính thức là hash ghi trong trang build của EAS.

## Kiểm tay sau khi có bản build

- [ ] Máy đặt tiếng Việt: app mở bằng tiếng Việt. Máy đặt tiếng Anh (hoặc ngôn ngữ khác): app tiếng Anh.
- [ ] Tài khoản > Ngôn ngữ / Language: đổi vi/en, giao diện đổi ngay, mở lại app vẫn giữ.
- [ ] Thông báo đẩy: đổi ngôn ngữ trong app rồi tạo thông báo (giao việc, tin nhắn); thông báo đến đúng ngôn ngữ đã chọn.
- [ ] Các liên kết pháp lý (Điều khoản, Quyền riêng tư) mở với `?lang=en` khi app đang tiếng Anh, không có khi tiếng Việt.
- [ ] iOS: màn Nâng cấp gói hiển thị tiếng Anh đầy đủ (gói, nút khôi phục, lời giải thích tự gia hạn).
- [ ] Android: không có màn mua gói (Android không bán gì trong app).
- [ ] Web: thông báo của tài khoản tiếng Anh vẫn hiện tiêu đề đúng.
