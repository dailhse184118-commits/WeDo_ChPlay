# Ra mắt bản 1.0.16: app mobile song ngữ (vi/en)

Nhánh mobile `feat/song-ngu`. Bản iOS 1.0.16 (build 7), Android 1.0.16 (versionCode 21; lần upload gần nhất lên Google Play là 19 nên 21 hợp lệ). Đi kèm tính năng quét và hiện QR mời vào nhóm (`docs/superpowers/specs/2026-10-09-quet-qr-vao-nhom-design.md`).

## Thứ tự làm

1. **Máy chủ trước.** Gộp và đưa lên nhánh `feat/ngon-ngu-nguoi-dung` của repo BE_WEDO: cột mới `User.language`, `PATCH /users/me/language`, thông báo theo ngôn ngữ từng người nhận, AI trả lời theo ngôn ngữ. Máy chủ phải lên trước vì app mới gọi endpoint này.
   - Kiểm web (FE_WEDO): web dịch tiêu đề thông báo bằng cách khớp câu tiếng Việt. Người dùng tiếng Anh sẽ nhận tiêu đề tiếng Anh nên web có thể hiện sai hoặc không dịch. Thử một tài khoản đặt tiếng Anh trước khi coi là xong.
2. **Build cả hai nền tảng từ cùng nhánh bằng EAS**: iOS 1.0.16 (7) và Android 1.0.16 (21). Bắt buộc build mới, không dùng OTA: `locales`, `CFBundleLocalizations` và hai thư viện native mới cho QR (`expo-camera`, `react-native-svg`) thay đổi vân tay native nên `eas update` không chuyển được bản này.
3. **Sau khi được duyệt**, cập nhật hai trang cửa hàng theo:
   - App Store: `docs/app-store-ios/14-app-store-tieng-anh.md` (đã bỏ câu "interface is currently in Vietnamese", có What's New 1.0.16 tiếng Anh và tiếng Việt) và dòng ngôn ngữ trong Notes ở `docs/app-store-ios/13-notes-duyet-iap.md`.
   - CH Play: `docs/chplay-tieng-anh.md`.

## Vân tay (`npx @expo/fingerprint fingerprint:generate --platform ios|android`, 09/10/2026, trên Windows)

Tính lại sau khi thêm QR (`expo-camera`, `react-native-svg`, `react-native-qrcode-svg`, plugin `expo-camera` trong `app.json`, câu xin quyền máy ảnh mới).

| Nền tảng | Build | Hash |
|---|---|---|
| iOS | 7 | `210dc4b94ab45df728dfc395b9bc58557909b370` |
| Android | 21 | `4bf6fcd104b5e0a05d53dbe774b4eb626432e4c2` |

Hash cũ trước khi thêm QR (iOS `9617f10d…`, Android `90966cea…`) không còn đúng.

Lưu ý: EAS build trên Linux với dấu xuống dòng LF. Nếu có tệp bị tính vân tay mà đang là CRLF trên Windows (git đổi LF thành CRLF khi checkout), hash tính ở đây có thể khác hash của EAS. Dùng hash chỉ để so sánh sơ bộ; hash chính thức là hash ghi trong trang build của EAS.

## Kiểm tay sau khi có bản build

- [ ] Máy đặt tiếng Việt: app mở bằng tiếng Việt. Máy đặt tiếng Anh (hoặc ngôn ngữ khác): app tiếng Anh.
- [ ] Tài khoản > Ngôn ngữ / Language: đổi vi/en, giao diện đổi ngay, mở lại app vẫn giữ.
- [ ] Thông báo đẩy: đổi ngôn ngữ trong app rồi tạo thông báo (giao việc, tin nhắn); thông báo đến đúng ngôn ngữ đã chọn.
- [ ] Các liên kết pháp lý (Điều khoản, Quyền riêng tư) mở với `?lang=en` khi app đang tiếng Anh, không có khi tiếng Việt.
- [ ] iOS: màn Nâng cấp gói hiển thị tiếng Anh đầy đủ (gói, nút khôi phục, lời giải thích tự gia hạn).
- [ ] Android: không có màn mua gói (Android không bán gì trong app).
- [ ] Web: thông báo của tài khoản tiếng Anh vẫn hiện tiêu đề đúng.

### QR mời vào nhóm

- [ ] Leader mở Mời vào nhóm: có link thì thấy QR (nền trắng, khoảng 200 pt) và dòng "Bạn bè mở WeDo → Nhập mã mời → Quét mã QR"; tắt link thì QR biến mất; tạo link mới thì QR đổi theo.
- [ ] Máy khác: Nhập mã mời → Quét QR. Lần đầu hệ điều hành hỏi quyền máy ảnh, câu xin quyền nói rõ chụp ảnh gửi trong chat và quét mã QR mời vào nhóm (kiểm cả máy tiếng Việt và tiếng Anh).
- [ ] Quét QR trên máy Leader: màn quét tự đóng, ô mã điền sẵn, hiện xem trước dự án; chưa vào nhóm cho tới khi bấm Tham gia.
- [ ] Quét QR của web (hộp Mời vào nhóm trên wedofpt.com.vn) cũng vào được.
- [ ] Quét một QR khác (Wi-Fi, link lạ): báo "Mã QR này không phải lời mời WeDo", không mở link, vẫn quét tiếp được.
- [ ] Từ chối quyền máy ảnh rồi mở lại màn quét: thấy câu giải thích và nút Mở Cài đặt; bật quyền trong Cài đặt rồi quay lại quét được.
- [ ] Gửi ảnh trong chat (chụp bằng máy ảnh) vẫn chạy như cũ.
- [ ] Android: trang CH Play không mất thiết bị so với bản trước (máy không có camera vẫn cài được; `uses-feature` camera vẫn `required="false"`), và không có quyền ghi âm (`RECORD_AUDIO`).
