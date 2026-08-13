# Đăng nhập bằng Google — bàn giao sang phiên sau

Ngày 11/08/2026. Viết cho phiên làm việc kế tiếp: phần backend đã xong, phần ứng dụng chưa bắt đầu.

## Vì sao có việc này

Người kiểm thử báo bốn điểm ngày 11/08. Ba cái đầu đã xử lý xong; cái thứ tư là **thiếu đăng nhập bằng Google** — không phải lỗi mà là tính năng còn thiếu, chủ dự án yêu cầu bổ sung ngay trong đợt kiểm thử.

## Ràng buộc kỹ thuật quyết định cách làm

`auth.service.ts` đối chiếu `aud` của token với **một** `GOOGLE_CLIENT_ID` — chính là client dạng **Web** mà bản web đang dùng.

Trên Android, thư viện đăng nhập Google cấp access token gắn với OAuth client dạng **Android**, nên `aud` khác và máy chủ sẽ từ chối. Nhưng **ID token** thì được cấp cho `webClientId` mà ứng dụng khai báo, nên `aud` khớp đúng. Đây là lý do chọn đường ID token.

Client dạng Web cũng **không** cho khai redirect URI kiểu `wedo://`, nên hướng `expo-auth-session` bị loại.

## Backend — ĐÃ XONG, chưa deploy

Sửa 2 file trong `BE_WEDO`, đã `tsc` sạch phần `src/auth` và **101/101 test qua**:

- `src/auth/dto/auth.dto.ts` — `GoogleLoginDto` nhận thêm `idToken`; cả hai trường thành tuỳ chọn.
- `src/auth/auth.service.ts` — thêm `verifyGoogleCredential` phân luồng, và `verifyGoogleIdToken` xác thực qua `tokeninfo?id_token=`.

Đường `accessToken` của web **giữ nguyên**, không đụng gì.

**Một cái bẫy đã xử lý sẵn:** endpoint `tokeninfo` trả `email_verified` dưới dạng **chuỗi** `"true"`, không phải boolean. So thẳng `=== true` sẽ luôn sai và chặn nhầm mọi người dùng hợp lệ.

Lỗi `tsc` duy nhất còn lại của repo backend là cái có sẵn trong `payments/entitlements.service.spec.ts`, không liên quan.

## Cấu hình Google — chủ dự án làm

| Hạng mục | Giá trị |
|---|---|
| Project Cloud | `My First Project` (`alert-rush-501204-b6`), tổ chức fpt.edu.vn |
| Client ID **Web** (app sẽ dùng làm `webClientId`) | `108450458549-b3g83it3kjnpihupihmj9kvd23fj8am3.apps.googleusercontent.com` |
| Client Android (khoá tải lên EAS) | Đã tạo — SHA-1 `10:65:B4:04:55:70:98:41:13:0B:C5:9E:FB:96:05:06:C5:A2:FB:AE` |
| Client Android (khoá ký của Play) | Đã tạo 13/08 — SHA-1 `43:DA:0B:69:AA:99:B2:0E:89:0E:…`, lấy từ **khoá cổ điển** chứ không phải khoá hậu lượng tử |
| User type | External |
| Publishing status | **In production** — không còn giới hạn test users |

Cấu hình phía Google đã xong hoàn toàn. Không còn việc gì phải làm trong Cloud Console.

Hai client Android **không đi vào mã nguồn**. Chúng chỉ để Google cho phép gói `vn.wedo.app` ký bằng hai chứng chỉ đó được xin token. Cái đi vào mã là client ID **Web**.

## Việc phần ứng dụng — CHƯA LÀM

1. Cài `@react-native-google-signin/google-signin` (module native, bắt buộc build lại).
2. Khai `webClientId` bằng client ID Web ở trên, nên đặt qua biến `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` trên EAS thay vì nhúng cứng.
3. Thêm hàm `loginWithGoogle(idToken)` vào `src/lib/api/auth.ts` gọi `POST /auth/google` với `{ idToken }`.
4. Thêm `signInWithGoogle` vào `auth-context`, tái dùng `establishSession` sẵn có — phần lưu token và chuyển hướng chạy y hệt luồng thường.
5. Dựng nút "Tiếp tục với Google" trên `(auth)/login.tsx` và `(auth)/register.tsx`.
6. Build lại rồi **chủ dự án tự bấm thử** — trợ lý không đăng nhập tài khoản Google thật.

**Rủi ro lớn nhất không nằm ở mã mà ở cấu hình.** Sai SHA-1 hoặc chưa Publish app thì máy chủ trả *"Google token không thuộc ứng dụng WEDO"*, hoặc Google chặn ngay ở màn đồng ý — mã đúng nhưng vẫn không đăng nhập được.

## Ba bản vá khác đã xong, chưa build

Nằm trong cây làm việc của `WeDo_ChPlay`, `tsc` sạch và 243/243 test qua:

- **Đăng nhập xong bị đơ.** `app/index.tsx` chỉ điều hướng khi người dùng đứng ở route gốc; vào `/login` rồi thì không còn ai lắng nghe. Đã thêm chuyển hướng vào `(auth)/_layout.tsx`.
- **Thiếu báo đăng ký thành công.** Đã thêm hộp thoại chào mừng trong `register.tsx`.
- Ba bản vá trước đó (khoá chống trùng, hai banner mâu thuẫn, kiểm tra chính tả) đã có trong AAB `a8363cea`.

Bản build kế tiếp nên gộp: hai bản vá trên + đăng nhập Google. Nhớ **tăng `versionCode` lên 2** trong `app.json`, vì `1` đã nộp lên kênh alpha.

## Yêu cầu mới của chủ dự án, ngày 13/08 — CHƯA LÀM

**Giao diện co giãn theo kích thước máy.** Hiện nhiều chỗ đang dùng số pixel cố định: `sizes.control = 48`, `profileAvatar = 80`, `TAB_BAR_HEIGHT = 60`, `CARD_OVERLAP = 12`, cỡ chữ trong `fontSize`. Trên máy nhỏ như 5 inch hoặc máy đặt cỡ chữ hệ thống lớn, bố cục sẽ chật hoặc tràn.

Hướng nên đi:
- Dùng `useWindowDimensions()` thay vì hằng số, và bậc thang theo bề rộng màn hình.
- Rà lại các `numberOfLines` — chữ to là cắt mất nội dung.
- Thử ở ba mức: máy nhỏ (360dp), máy thường (411dp), máy tablet; và bật cỡ chữ hệ thống lớn nhất trong Cài đặt Android.
- Nên chạy kèm `/design:design-system` để soát tính nhất quán của token trước khi sửa rải rác.

Chưa động tới vì phiên 13/08 đã cạn ngữ cảnh. Đây là việc lớn, nên làm sau khi đăng nhập Google xong và đã lên được một bản build ổn định.

## Quy ước đánh số phiên bản — chủ dự án chốt ngày 13/08

Mỗi bản build nộp lên Play phải tăng **cả hai** số trong `app.json`:

- `expo.version` (versionName) — tăng số cuối mỗi lần sửa lỗi: `1.0.0` → `1.0.1` → `1.0.2`. Đây là số người dùng nhìn thấy.
- `expo.android.versionCode` — tăng thêm 1 mỗi lần build. Google **bắt buộc** cái này tăng, nộp lại số cũ là từ chối thẳng.

Đã nộp: `1.0.0 (versionCode 1)` và `1.0.0 (versionCode 2)`.

**Bản kế tiếp phải là `1.0.1` với `versionCode 3`.** Google chỉ ép versionCode, nên `1.0.0 (2)` vẫn được nhận; nhưng từ đây theo quy ước trên cho dễ lần dấu vết.

## Trạng thái phát hành

Kênh **alpha** đã có bản `1 (1.0.0)`, **12 người kiểm thử đã tham gia**, đồng hồ 14 ngày chạy từ 11/08 — dự kiến mở khoá xin phát hành công khai khoảng **25/08/2026**.

Tải bản mới lên kênh alpha **không làm đồng hồ đếm lại**; điều kiện chỉ là giữ đủ 12 người tham gia liên tục.
