# Đăng nhập Google và giao diện co giãn — bàn giao sang phiên sau

Ngày 14/08/2026. Nối tiếp `2026-08-11-dang-nhap-google-ban-giao.md`. Cả hai việc
đã viết xong mã trên nhánh `feat/dang-nhap-google`, **chưa build, chưa ai bấm thử
trên máy thật**.

## Trạng thái

`tsc` sạch, **320/320 test qua** (trước là 243). Bốn commit:

| Commit | Nội dung |
|---|---|
| `9dacf10` | đăng nhập bằng Google |
| `f982632` | thiết kế giao diện co giãn |
| `0dc1945` | tầng token co giãn |
| `290a532` | áp token vào toàn bộ màn hình |

## Đăng nhập Google

Đường đi: `GoogleButton` → `signInWithGoogle` (auth-context) → `getGoogleIdToken`
(`src/lib/auth/google-signin.ts`) → `loginWithGoogle` → `POST /auth/google`.

Gửi **ID token** chứ không phải access token, vì máy chủ đối chiếu `aud` với một
`GOOGLE_CLIENT_ID` duy nhất là client dạng Web.

Web client ID đọc từ `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, **có giá trị dự phòng
nhúng sẵn** trong `google-signin.ts`. Client ID Web không phải bí mật, nên cách
này tránh được cảnh quên khai biến trên EAS là hỏng cả bản build.

**Hai cái bẫy đã gỡ, đừng dựng lại:**

1. `expo install` tự thêm plugin `"@react-native-google-signin/google-signin"`
   vào `app.json` **không kèm tuỳ chọn**. Dạng không tuỳ chọn đi nhánh Firebase;
   nhánh đó không có `android.googleServicesFile` thì không làm gì cả — vô hại,
   cứ để nguyên. Đừng thêm `iosUrlScheme`: dự án không có client iOS, và chỉ phát
   hành Android.
2. Chỉ *import* gói thật trong Jest là ném `RNGoogleSignin could not be found`.
   `__mocks__/@react-native-google-signin/google-signin.js` ở gốc dự án chặn việc
   đó cho mọi test. `jest.mock` cục bộ trong từng file **không cứu được**:
   automock vẫn nạp module thật để dò hình dạng.

`expo lint` chưa từng được cấu hình trong repo. Chạy nó là nó tự cài eslint và
sinh `eslint.config.js`. Đã gỡ sạch. Đừng chạy lại nếu chưa định thêm eslint thật.

## Giao diện co giãn

Hướng: token tự tính **một lần lúc nạp app**, không phải hook. Nhờ vậy mọi
`StyleSheet.create` trong repo vẫn là hằng số tĩnh.

- `src/theme/responsive.ts` — hàm thuần: bậc thang bề rộng, trần cỡ chữ, chiều
  cao dòng, bề rộng nội dung tối đa.
- `src/theme/build-tokens.ts` — hàm thuần `buildTokens(width, fontScale)`.
- `src/theme/tokens.ts` — đọc số đo máy đúng một lần rồi gọi xuống.

**Phát hiện quan trọng nhất:** repo có **22 chỗ nhúng cứng `lineHeight`**. React
Native phóng `fontSize` theo cỡ chữ hệ thống nhưng **không** phóng `lineHeight` —
nó là dp cố định. Ở cỡ chữ 200%, chữ cao gấp đôi mà khoảng dòng đứng yên nên chữ
chồng lên nhau rồi bị cắt, dù hộp chứa có co giãn đến mấy. Đây mới là nguyên nhân
gốc của lỗi, không phải mấy con số `sizes.control = 48`. Nay là token
`lineHeight`, nhân theo cỡ chữ hệ thống **thật** chứ không phải cỡ chữ đã chặn.

Hai nhóm kích cỡ phân biệt rạch ròi, đừng trộn:

- **hình vuông/tròn** (avatar, ô icon, chấm) — chỉ nhân theo bề rộng máy. Nhân
  theo cỡ chữ là avatar phình méo so với hàng chữ bên cạnh.
- **hộp chứa chữ** (`sizes.control`, `sizes.tabBar`, chip, nút phụ) — nhân cả
  hai, và phải đặt vào `minHeight` chứ không phải `height`.

Cỡ chữ chặn ở 130% cho phần khung không cuộn được: nhãn thanh tab (`TabLabel`) và
tiêu đề `GradientHeader`. Nội dung người dùng đọc thì phóng hết cỡ.

Lưu ý ngược đời nhưng đúng: chỗ nào đã chặn cỡ chữ thì **đừng** đặt thêm
`lineHeight`. Token `lineHeight` nới theo cỡ chữ thật, ghép với chữ bị chặn ở
130% thì ở mức 200% khoảng dòng rộng gấp rưỡi chữ, trông như bị hở.

`ScreenContainer` kẹp bề rộng ở 520dp và căn giữa trên tablet. Đây là chỗ **duy
nhất** trong app dùng `useWindowDimensions`.

## Việc còn lại — CHƯA LÀM

1. **Build và tự bấm thử.** Trợ lý không đăng nhập tài khoản Google thật. Rủi ro
   lớn nhất của đăng nhập Google **không nằm ở mã mà ở cấu hình**: sai SHA-1 hoặc
   chưa Publish thì máy chủ trả *"Google token không thuộc ứng dụng WEDO"*.
2. **Thử giao diện ở ba mức máy** (360dp, 411dp, tablet) và **bật cỡ chữ hệ thống
   lớn nhất** trong Cài đặt Android. Jest không dựng được bố cục thật.
3. `app.json` đã để sẵn **`1.0.1` / `versionCode 3`**. Đừng tăng lại nếu chưa nộp.

## Chưa bàn tới

Yêu cầu thứ ba của chủ dự án — **app chỉ hiện một không gian làm việc** — chưa
đụng gì, kể cả đọc mã. Phiên sau tự dựng phương án.

## Hai điểm bộ token còn lệch, cố ý chưa sửa

- `colors.surface` (`#f5f7fa`) **tối hơn** `colors.background` (`#ffffff`), ngược
  quy ước "surface nổi trên background". Đổi tên chạm khoảng 20 file và không
  phục vụ việc co giãn.
- `sizes` trộn tên theo ý nghĩa (`iconTile`, `projectAvatar`) với tên chung
  (`control`, `icon`).
