# 08 — Sửa mã và cấu hình trước khi nộp App Store

Tài liệu này gom kết quả kiểm tra sẵn sàng iOS thành danh sách việc trong mã và cấu hình, kèm **trạng thái** của từng việc. Mỗi việc có mã `IOS-xx`. Bốn việc về đăng nhập Apple và Google mang mã `SAU-xx` (trước để bản sau, nay đã làm SAU-01 … SAU-03). Trang tổng quan cho chủ dự án nằm ở `00-tong-quan.md`.

Ngày lập: 26/09/2026. Cập nhật ngày 28/09/2026: máy chủ và web đã lên production; iPhone có đăng nhập Apple và Google (SAU-01 … SAU-03); build iOS 1.0.14 (3). Nguồn gốc danh sách: `ios-audit.json` (90 phát hiện, 5 vùng kiểm tra và một vòng phản biện).

## Cách đọc

**Trạng thái** của mỗi việc là một trong ba loại. Một việc có nhiều phần thì mỗi phần ghi một trạng thái.

| Trạng thái | Nghĩa |
|---|---|
| **Đã làm** + commit + nhánh | Mã đã có trên nhánh iOS. Phần máy chủ và web đã lên production ngày 28/09/2026. Phần app có trong build iOS 1.0.14 (3), tới người dùng khi Apple duyệt. |
| **Còn lại** | Việc mã hay cấu hình chưa ai làm. |
| **Chủ dự án làm** | Việc chỉ chủ tài khoản làm được: Apple, Azure, GitHub, EAS, Google Cloud. |

**Ba repo, mỗi repo hai thư mục.** Mọi việc cho iOS làm trên nhánh riêng, trong thư mục riêng. Nhờ vậy bản CH Play và OTA Android trên `main` không bị đụng tới.

| Tiền tố | Repo | Thư mục chính, không đụng | Thư mục làm iOS | Commit iOS |
|---|---|---|---|---|
| `M` | App mobile, Expo SDK 57 | `D:\WeDo_ChPlay`, nhánh `main`: bản CH Play và OTA Android | `D:\WeDo_ChPlay-ios`, nhánh `ios` | Từ `dbbd5f0` tới `2b94b17`. Chưa gộp vào `main` |
| `BE` | Máy chủ NestJS + Prisma | `D:\WEDO_PC\BE_WEDO`, nhánh `backend`: đẩy lên là Azure tự deploy | `D:\WEDO_PC\BE_WEDO-ios`, nhánh `ios-backend` | Từ `f508184` tới `3d24e39`. Đã gộp vào `backend` và đang chạy |
| `FE` | Web, Vercel | `D:\WEDO_PC\FE_WEDO`, nhánh `main`: Vercel tự deploy | `D:\WEDO_PC\FE_WEDO-ios`, nhánh `ios-web` | Từ `f65b1dd` tới `056d3b0`. Đã gộp vào `main` và đang chạy |

Xem lại danh sách commit bằng ba lệnh sau, mỗi lệnh chạy trong thư mục làm iOS tương ứng:

```text
git log --oneline main..ios
git log --oneline backend..ios-backend
git log --oneline main..ios-web
```

Máy chủ và web nằm chung một repo GitHub là `dailhse184118-commits/FE_WEDO`: nhánh `main` là web, nhánh `backend` là máy chủ. Bí mật GitHub Actions khai ở repo đó.

Đường dẫn tệp ghi theo tiền tố repo, ví dụ `M src/app/(auth)/login.tsx`. Số dòng ở mục Đã làm đọc trên nhánh iOS. Số dòng ở mục Còn lại và Làm sau đọc trên nhánh chính lúc kiểm tra, có thể lệch vài dòng trên nhánh iOS.

**Số phát hiện `#n`** là thứ tự trong `ios-audit.json`: ios-config #1–18, review-guidelines #19–36, backend #37–52, privacy-inventory #53–65, listing-facts #66–79, critic #80–90.

| Mức | Nghĩa |
|---|---|
| blocker | Không build được, không nộp được, hoặc gần như chắc bị từ chối |
| high | Rất dễ bị từ chối, hoặc hỏng chức năng chính trên iPhone |
| medium | Nên sửa trước khi ra mắt, ít khả năng làm trượt lần duyệt |
| low | Làm sau được |

**Công sức** tính cho một người: **S** là nửa ngày trở xuống, **M** là 1–3 ngày, **L** là hơn 3 ngày.

## Các quyết định đã chốt

Chủ dự án chốt ngày 26/09/2026, sửa điểm 1 ngày 28/09/2026:

1. **Đăng nhập trên iPhone: Apple, Google, hoặc email và mật khẩu.** Màn Đăng nhập và Đăng ký có nút "Tiếp tục với Apple" (nút gốc của Apple, chỉ trên iPhone) và "Tiếp tục với Google" (iPhone và Android). Web có email và Google. App iPhone có Google nên Guideline 4.8 áp dụng, và Sign in with Apple đáp ứng điều đó (SAU-01 … SAU-03). Quyết định cũ "iPhone chỉ email, ẩn Google" (IOS-02) đã bỏ.
2. **Tuổi tối thiểu 18.** Ghi 18 ở chính sách, điều khoản, trang hỗ trợ và App Store Connect (Override to Higher Age Rating → 18+). Màn đăng ký có ô bắt buộc xác nhận đủ 18 tuổi.
3. **DSA của EU: This is not a trader account**, vì chỉ phát hành ở Việt Nam.
4. **Email hỗ trợ: `wedosupport6886@gmail.com`**, dùng ở mọi nơi.
5. **Tên app: `WeDo: Làm việc nhóm`.** Tên dự phòng theo `02-thong-tin-app-store.md` mục 4.
6. **Có bộ lọc từ ngữ phản cảm**, cùng báo cáo và chặn (Guideline 1.2). Bộ lọc đã làm theo kiểu **che từ bằng `***`**, không từ chối cả tin (xem IOS-03).
7. **Tên trang chính sách là "Chính sách quyền riêng tư"** ở mọi nơi: app, web, tài liệu. Tên cũ "Chính sách bảo mật" không dùng nữa.
8. **App iOS miễn phí, đi kèm dịch vụ web.** Không mua hàng trong ứng dụng, không lời mời mua (Guideline 3.1.3(f)).
9. **Nhà phát triển cá nhân: Lê Hữu Đại.** Chỉ phát hành ở Việt Nam.
10. **Mọi việc cho iOS làm trên nhánh riêng**, theo bảng ở mục Cách đọc.

Các điểm dưới đây chưa chốt hoặc chưa kiểm được. Đổi điểm nào thì sửa các mục có nhắc tới nó.

- ⚠ Giả định: miễn phí, **chỉ iPhone** (`supportsTablet: false`), ngôn ngữ chính **tiếng Việt**.
- Đã chốt: bundle ID `vn.wedo.app`, phiên bản `1.0.14` cho cả hai nền tảng (`962517f`). Build iOS mới nhất là `3`.
- ⚠ Chưa biết: nhà cung cấp AI đang chạy thật. Mã ưu tiên Gemini khi có `GEMINI_API_KEY`, rồi Azure OpenAI, rồi OpenAI. Không có biến nào thì máy chủ dùng luật đơn giản, không gửi cho bên thứ ba. Chưa ai xem được biến thật trên Azure. Hộp thoại xin đồng ý trong app nêu đủ ba tên (`608d06c`).

## Đọc nhanh

- 90 phát hiện gộp lại thành **36 việc cho bản 1.0** (`IOS-01` … `IOS-36`), **4 việc về đăng nhập Apple và Google** (`SAU-01` … `SAU-04`; ba việc đầu đã làm) và **8 việc cấu hình trong `app.json`**.
- **Phần mã bắt buộc đã làm xong trên ba nhánh iOS.** Gồm: đăng nhập Apple và Google trên iPhone, thu hồi token Apple khi xoá tài khoản, báo cáo, chặn, bộ lọc, đình chỉ tài khoản, trang quản trị "Báo cáo vi phạm", ô 18+ và màn đồng ý điều khoản, hộp thoại đồng ý AI, bốn trang web pháp lý, kiểm tra phiên bản theo nền tảng, ảnh HEIC, xoá tệp khi xoá tài khoản. Bảng đầy đủ ở mục [Bảng trạng thái](#bảng-trạng-thái).
- **Đã lên production ngày 28/09/2026:** máy chủ `backend` = `3d24e39` (gồm mọi commit của `ios-backend`, hai migration `202609260001_moderation_consent` và `202609280001_apple_sign_in`), web `main` = `056d3b0` (gồm `ios-web`). Build iOS 1.0.14 (1) đã lên TestFlight; build 3 có Apple và Google, đã thử trên iPhone thật.
- **Việc chủ dự án còn làm:** tài khoản demo (IOS-14), ảnh chụp màn hình, kiểm khoá APNs (IOS-17), điền App Store Connect, và gửi Apple nơi gửi thư cho email chuyển tiếp (SAU-04).
- **Việc mã còn lại:** không có việc chặn nộp. Nên làm thêm: bàn phím ở năm màn còn lại (IOS-18).
- **Vân tay (runtime version):** nhánh `ios` có `expo-apple-authentication` và `usesAppleSignIn`, nên vân tay native khác bản Android đang chạy. OTA từ `D:\WeDo_ChPlay-ios` luôn kèm `--platform ios`. OTA cho bản Android đang chạy phát theo đúng nhánh đã build ra bản đó.

---

## Thứ tự đưa lên (deploy)

> **Trạng thái 28/09/2026:** Bước A, B, C đã làm. Máy chủ: `57fa904` lên Azure ngày 27/09, rồi `3d24e39` (đăng nhập Apple) ngày 28/09; cả hai lần migration đều chạy. Web: `056d3b0` lên Vercel ngày 28/09, bốn trang pháp lý trả 200. Build iOS 1.0.14 đã lên TestFlight. Phần dưới giữ lại để làm lại khi cần.

> **Đọc trước khi gộp bất kỳ nhánh nào.** Làm đúng thứ tự A → B → C. Mã app mới **cần** máy chủ mới. Màn đăng ký mới luôn gửi `acceptTerms` và `confirmAdult`. Máy chủ cũ bật `forbidNonWhitelisted`, nên từ chối cả yêu cầu với lỗi 400: người mới không đăng ký được. Máy chủ cũ cũng không có `POST /users/me/ai-consent`, `POST /users/me/accept-terms` và các đường `/moderation/*`, nên Leader không dùng được AI. Vì vậy **không build, không phát OTA từ nhánh `ios` trước khi Bước A xong.**

### Bước A. Máy chủ `ios-backend` (làm trước tiên)

**A1. Kiểm bốn bí mật migration trên GitHub — trước khi gộp.**

Workflow `BE .github/workflows/backend_api-wedo-backend-dai.yml` chạy khi đẩy lên nhánh `backend`. Nó tự chạy `prisma migrate deploy` **trước** khi deploy, nhưng chỉ khi có **đủ cả bốn** bí mật:

```text
PRODUCTION_MIGRATION_URL
PRODUCTION_DATABASE_HOST
PRODUCTION_DATABASE_USER
PRODUCTION_DATABASE_NAME
```

Thiếu dù một cái, workflow chỉ in một cảnh báo ("Chua khai du bon bi mat migration…"), **bỏ qua migration và vẫn deploy**. Mã mới đọc cột `User.suspendedAt` ở mọi lượt kiểm token (`BE src/auth/jwt.strategy.ts`). Cột đó chưa có thì **mọi yêu cầu có đăng nhập trả lỗi 500**, cho cả web và bản Android đang chạy.

Cách kiểm (chỉ cần xem tên, không cần xem giá trị): mở `https://github.com/dailhse184118-commits/FE_WEDO` → **Settings** → **Secrets and variables** → **Actions** → **Repository secrets**.

- Đủ bốn tên: sang A2.
- Thiếu: khai thêm cho đủ, hoặc chạy migration bằng tay **trước khi gộp**. Chạy bằng tay trong PowerShell, ở `D:\WEDO_PC\BE_WEDO-ios`:

  ```powershell
  $env:DIRECT_URL = "<chuỗi kết nối trực tiếp tới cơ sở dữ liệu production>"
  npm run db:migrate:status
  npm run db:migrate:deploy
  ```

  `prisma.config.ts` đọc `DIRECT_URL`. Biến chỉ sống trong cửa sổ PowerShell đó.
- Hai bí mật `STAGING_DATABASE_HOST` và `STAGING_DATABASE_USER` làm "đích cấm" cho bước kiểm đích. Phải có **cả hai** hoặc **không có cái nào**. Có một cái thì bước kiểm đích báo lỗi và dừng lần deploy. Bản cũ vẫn chạy, không hỏng gì, nhưng mã mới không lên.

Migration của đợt này là `BE prisma/migrations/202609260001_moderation_consent`. Nó **chỉ thêm**: bốn enum, năm cột có thể rỗng trên `User` (`suspendedAt`, `suspensionReason`, `aiConsentAt`, `termsAcceptedAt`, `adultConfirmedAt`), hai bảng mới `UserBlock` và `ContentReport`. Bước "chặn thay đổi phá dữ liệu" của workflow cho qua.

**A2. Đặt biến môi trường mới trên Azure — trước hoặc cùng lúc với lần deploy.**

Azure Portal → App Service `api-wedo-backend-dai` → **Settings** → **Environment variables**. Danh sách đúng theo `BE .env.example` trên nhánh `ios-backend`:

| Biến | Giá trị | Để trống thì |
|---|---|---|
| `REPORT_NOTIFY_EMAIL` | Hộp thư nhận thư báo có báo cáo vi phạm mới. Nên là `wedosupport6886@gmail.com`, hộp thư có người đọc mỗi ngày | Không gửi thư. Báo cáo vẫn nằm ở trang quản trị "Báo cáo vi phạm", nhưng dễ trễ quá 24 giờ |
| `MOBILE_IOS_LATEST_VERSION` | Để trống tới khi bản iOS đầu tiên đã lên kệ | iPhone không hiện dải nhắc cập nhật |
| `MOBILE_IOS_MINIMUM_VERSION` | Để trống. Không bao giờ đặt cao hơn bản iOS đang chờ Apple duyệt | iPhone không bị chặn ngoài app |
| `MOBILE_IOS_UPDATE_NOTES` | Một câu ngắn về bản mới, hoặc để trống | Không có ghi chú |
| `MOBILE_IOS_STORE_URL` | `https://apps.apple.com/app/id<APPLE ID SỐ CỦA APP>`, có sau IOS-01 | iPhone không hiện dải nhắc hay màn chặn nào, kể cả khi hai số phiên bản ở trên có giá trị |
| `MOBILE_ANDROID_STORE_URL` | `https://play.google.com/store/apps/details?id=vn.wedo.app` | Máy chủ trả `storeUrl: null`. App Android vẫn mở CH Play như cũ |
| `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` | Bundle ID, Team ID, Key ID `U9G7RAS2LZ`, và nội dung khoá `.p8` (chỉ dán vào Azure, không ghi ở đâu khác). **Đã đặt** ngày 28/09/2026 | Thiếu ba biến sau thì đăng nhập Apple vẫn chạy, nhưng máy chủ không lấy được refresh token nên **không thu hồi được** khi xoá tài khoản |
| `GOOGLE_IOS_CLIENT_ID` | Client ID loại iOS của Google. **Đã đặt** ngày 28/09/2026 | Máy chủ từ chối ID token của nút Google trên iPhone |

App iPhone chỉ nhận `storeUrl` dạng `itms-apps://` hoặc `https://apps.apple.com/…`. Một đường CH Play dán nhầm vào `MOBILE_IOS_STORE_URL` bị bỏ qua. Hai biến Android cũ (`MOBILE_LATEST_VERSION`, `MOBILE_MINIMUM_VERSION`) không còn ảnh hưởng tới iPhone.

**A3. Gộp và đẩy.** Gộp `ios-backend` vào `backend` trong `D:\WEDO_PC\BE_WEDO`, rồi đẩy lên. Workflow chạy lần lượt: chặn thay đổi phá dữ liệu, cài và test, migration (nếu đủ bí mật), deploy lên Azure.

**A4. Kiểm sau khi deploy:**

- Log workflow có bước "Apply pending migrations" đã chạy, và `prisma migrate status` báo không còn migration chờ.
- Đăng nhập web và bản Android 1.0.13 đang chạy: vào được, chat được.
- Mở `https://<địa chỉ máy chủ>/app-version` và `…/app-version?platform=ios`. Bản Android nhận như cũ, thêm `storeUrl`. Bản iOS nhận `latest: null` khi chưa khai biến.
- Gửi thử một báo cáo từ bản build nội bộ, hoặc bằng lệnh gọi API: thư tới hộp thư ở `REPORT_NOTIFY_EMAIL`.

**Tương thích với bản Android 1.0.13 đang chạy** (đã kiểm trong vòng review máy chủ):

- Mọi endpoint mới đều là thêm mới. `POST /auth/register` vẫn nhận thân yêu cầu cũ.
- `/app-version` không tham số trả như cũ, thêm `storeUrl`.
- Bản cũ gửi tin có từ phản cảm thì tin được lưu với từ bị che `***`.
- Chặn chạy trên máy chủ, nên bản cũ vẫn được bảo vệ phần lớn. Bản cũ chưa có nút báo cáo, chặn, và chưa ẩn tin mới tới qua socket của người đã chặn.
- Người bị đình chỉ trên bản cũ bị đăng xuất gọn sau lỗi 403 khi làm mới phiên.
- Tìm bạn trên bản cũ: từ khoá dưới 3 ký tự không ra ai; người chưa là bạn không hiện email.

**Việc còn mở từ vòng review máy chủ (mức thấp, không chặn deploy):**

1. `BE src/chat/chat.service.ts`, `getProjectHistory` và `getDirectHistory`: nếu tin làm mốc `before` là của người vừa bị chặn sau khi đã tải, trang kế tiếp có thể bỏ sót một tin cũ hơn. Hiếm gặp. Sửa phải làm lại cách phân trang.
2. `startDirectConversation` trả 403 `BLOCKED` cả khi cuộc trò chuyện đã có sẵn. Chặt hơn yêu cầu nhưng nhất quán, cố ý giữ.
3. `BE src/moderation/reports.service.ts`, báo cáo loại USER: không kiểm người báo cáo có thấy người kia không. Mã 404 hay 201 cho biết một mã người dùng có tồn tại. Mã là UUID, và mỗi người chỉ được 30 báo cáo mỗi 24 giờ.
4. `BE src/users/users.service.ts`: câu lỗi "User not found" bằng tiếng Anh. Không chạm tới được sau bước kiểm token.
5. Từ vòng review web, về máy chủ: danh sách báo cáo chờ xử lý xếp mới nhất trước, nên báo cáo quá hạn trôi xuống trang sau; `PATCH /admin/moderation/reports/:id` không kiểm báo cáo còn mở, nên hai người xử lý cùng lúc có thể ghi đè quyết định của nhau; khoá một tài khoản đang bị khoá thì mốc khoá và lý do bị ghi lại.
6. Từ vòng kiểm hợp đồng: `npx tsc --noEmit` trên cả máy chủ báo lỗi kiểu ở `BE src/friends/friends.service.spec.ts` dòng 178–179 (chỉ trong tệp test, không ảnh hưởng `npm run build` hay jest).

**Đã sửa thêm sau vòng review trang web:** `startDirectConversation` chỉ còn khớp trọn vẹn mã người dùng, email hoặc số điện thoại (commit `ade94d8` trên `ios-backend`). Bản cũ khớp một phần email và tên, nên 404 hay 403 đủ để dò một mẩu email có thuộc tài khoản nào không. Web và app chỉ gửi `targetUserId`, nên không ai mất đường. Mục 5 và 6 ở trên đang được sửa tiếp.

### Bước B. Web `ios-web` (sau Bước A)

Gộp `ios-web` vào `main` trong `D:\WEDO_PC\FE_WEDO`, rồi đẩy lên. Vercel tự deploy. Nhánh này có:

- Trang quản trị **"Báo cáo vi phạm"** (`#/admin/moderation`): lọc Chờ xử lý / Đã xử lý / Đã bỏ qua; nút Bỏ qua, Gỡ nội dung, Khoá tài khoản, Gỡ nội dung và khoá, Mở khoá; ô "Ghi chú xử lý"; nhãn "Quá hạn" cho báo cáo chờ quá 24 giờ.
- `public/privacy.html` viết lại, tên mới **"Chính sách quyền riêng tư"**.
- `public/dieu-khoan.html`, `public/ho-tro.html` (mới) và `public/xoa-tai-khoan.html` (sửa).

Vì sao sau Bước A: trang quản trị gọi `/admin/moderation/*` của máy chủ mới. Các trang pháp lý mô tả báo cáo, chặn, bộ lọc `***`, AI không nhận email, xoá tệp khi xoá tài khoản. Những điều đó chỉ đúng khi máy chủ mới đã chạy.

Các trang web dùng câu trung tính ở những chỗ chưa biết giá trị thật (vùng kho tệp Azure, số ngày sao lưu, số ngày nhật ký, thời hạn PostHog, thời hạn giữ báo cáo). Điền giá trị thật sau, theo `05-chinh-sach-bao-mat.md` mục 2.1.

Kiểm sau khi deploy: bốn địa chỉ dưới đây trả 200. Đăng nhập trang quản trị bằng tài khoản quản trị, mở "Báo cáo vi phạm".

```text
https://wedofpt.com.vn/privacy.html
https://wedofpt.com.vn/dieu-khoan.html
https://wedofpt.com.vn/ho-tro.html
https://wedofpt.com.vn/xoa-tai-khoan.html
```

### Bước C. Build iOS từ `D:\WeDo_ChPlay-ios` (chỉ sau Bước A và B)

1. Làm các việc ở mục [Đợt còn lại và build](#đợt-còn-lại-và-build): `eas.json` (IOS-16), `fingerprint.config.js`, và tăng `versionCode` nếu build Play cùng lúc.
2. Kiểm biến EAS môi trường `production` (IOS-15).
3. Build, đẩy lên TestFlight, thử hết bảng [Chưa kiểm chứng](#chưa-kiểm-chứng--kiểm-trên-testflight).

### Bước D. Gộp `ios` vào `main` (về sau)

- `app.json` trên nhánh `ios` khác `main`, nên vân tay Android đã khác bản Play 17. Gộp xong thì mọi OTA phát từ `main` **không tới** bản Play 17 nữa. Phải build Play mới (versionCode 18) từ commit đã gộp. Máy còn ở bản 17 chỉ nhận OTA phát từ một nhánh tách ra trước lúc gộp.
- Mã app mới cần máy chủ mới (xem hộp cảnh báo đầu mục). Không gộp, không build Play 18 trước khi Bước A xong.
- Người dùng Android chỉ có nút báo cáo, chặn và màn đồng ý điều khoản khi đã cài bản Play mới. Họ sẽ thấy màn "Điều khoản sử dụng" một lần sau khi cập nhật.

---

## Bảng trạng thái

Nhánh: `ios` là mobile, `ios-backend` là máy chủ, `ios-web` là web. "Chủ dự án" là việc của chủ tài khoản.

### Bắt buộc trước khi nộp (blocker, high)

| ID | Việc | Mức | Trạng thái | Commit | Còn lại |
|---|---|---|---|---|---|
| — | Cấu hình iOS trong `app.json` (8 việc) | blocker | **Đã làm** | `dbbd5f0` (`ios`) | Tuỳ chọn: xoá thư mục `M assets/expo.icon`. Kiểm trên TestFlight |
| IOS-01 | Tài khoản Apple Developer, App ID, bản ghi App Store Connect | blocker | **Đã xong** (chủ dự án, 28/09/2026) | — | — |
| IOS-02 | Ẩn nút Google trên iPhone | blocker | **Đã thay bằng SAU-03**: Google bật lại trên iPhone | `c013903`, `682916e`, `899c8eb`; rồi `2d1606f`, `df0c255` (`ios`) | — |
| SAU-01 … SAU-03 | Sign in with Apple, Google trên iPhone, thu hồi token Apple khi xoá tài khoản (Guideline 4.8, 5.1.1(v)) | blocker | **Đã làm**, đã thử trên iPhone thật | Máy chủ `64a0a5a` … `3d24e39`; app `a5cfb2e`, `5db415d`, `b016c3f`, `2d1606f`, `336cebb`, `df0c255` | Kiểm lại trên build nộp |
| — | Xoá tài khoản xong về màn Đăng nhập, báo "Đã xoá tài khoản" | high | **Đã làm** | `2b94b17` (`ios`) | Thấy câu này trên iPhone thật |
| IOS-03 | Máy chủ: chặn, báo cáo, lọc từ ngữ, đình chỉ | blocker | **Đã làm** (phần chính) | `f508184`, `6384ab9`, `f76f0ec`, `db0322e`, `497740d` (`ios-backend`) | Còn lại: chặn gửi lại lời mời trong 30 ngày, chặn thêm vào dự án, phần B. Chủ dự án: Bước A |
| IOS-04 | Mobile: Báo cáo, Chặn, Người đã chặn | blocker | **Đã làm** | `32c1101`, `7a9ed8b`, `05a0f15`, `ee2254e`, `e2e07fb`, `41dcd8c`, `be3c023`, `226fc9b` (`ios`) | Chưa có "Huỷ kết bạn". Kiểm trên TestFlight |
| IOS-05 | Web quản trị: trang "Báo cáo vi phạm" | high | **Đã làm** | `f65b1dd`, `f39efcd`, `a284326`, `a8e9b71`, `f40c351`, `92dd7c8` (`ios-web`) | Chủ dự án: phân công người trực |
| IOS-06 | Điều khoản sử dụng, ô 18+, màn đồng ý một lần | high | **Đã làm** | App `899c8eb`, `dff8821` (`ios`); máy chủ `3386c52` (`ios-backend`); trang `f6052b3` (`ios-web`) | Còn lại: web đăng ký chưa có ô đồng ý; máy chủ không lưu phiên bản điều khoản. Chủ dự án: quyết địa chỉ, điện thoại trong điều khoản |
| IOS-07 | Trang Hỗ trợ và dòng liên hệ trong app | high | **Đã làm** | App `43ad40d`, `dd1fa4e` (`ios`); trang `1f6e813`, chân trang trang chủ `85cf0b5` (`ios-web`) | Chủ dự án: người đọc hộp thư mỗi ngày |
| IOS-08 | Mobile: hộp thoại đồng ý trước lần dùng AI đầu tiên | high | **Đã làm** | `0585335`, `43ad40d` (`ios`) | Sửa tên nhà cung cấp trong câu hộp thoại khi biết cấu hình thật |
| IOS-09 | Máy chủ: lưu đồng ý AI, bớt dữ liệu gửi AI | high | **Đã làm** (một phần) | `3386c52` (`ios-backend`) | Còn lại: máy chủ chưa bắt buộc dấu đồng ý; web vẫn tự gửi tin của Leader cho AI. Chủ dự án: kiểm gói Gemini |
| IOS-10 | Chính sách quyền riêng tư và trang xoá tài khoản | high | **Đã làm** | `c4b98c2`, `2d02fa7`, sửa chữ `1342927`, `3e81a48`, `c025008`, `8bab15c` (`ios-web`); đã đăng 28/09/2026 | Đẩy lại web khi bốn trang có đoạn về Apple và Google (đã sửa trong `FE_WEDO-ios`, chưa đăng). Điền giá trị chưa biết |
| IOS-11 | Ẩn "Xem đầy đủ trên web" trên iPhone | high | **Đã làm** | `1adf6b5` (`ios`) | — |
| IOS-12 | Kiểm tra phiên bản theo nền tảng, App Store trên iPhone | high | **Đã làm** | App `1894bd0` (`ios`); máy chủ `4cfe5e1`, `9314d45` (`ios-backend`) | Chủ dự án: biến `MOBILE_IOS_*` trên Azure (Bước A2) |
| IOS-13 | Ảnh HEIC từ thư viện iPhone | high | **Đã làm**, chưa thử trên máy thật | `0cc5b3b` (`ios`) | Kiểm trên TestFlight |
| IOS-14 | Tài khoản demo cho App Review | blocker | **Chủ dự án làm** | — | Toàn bộ (máy chủ mới đã chạy). Dùng tài khoản email và mật khẩu, không dùng Apple hay Google |

### Nên làm trước khi nộp (medium)

| ID | Việc | Trạng thái | Commit | Còn lại |
|---|---|---|---|---|
| IOS-15 | Biến EAS production, đường dẫn chính sách không biến mất | Mã: **Đã làm** | `899c8eb`, `dd1fa4e` (`ios`) | Chủ dự án: xem `eas env:list`, chọn giá trị `EXPO_PUBLIC_PRIVACY_URL` |
| IOS-16 | `eas.json` cho submit iOS | **Đã làm** | `962517f` (`ios`) | — |
| IOS-17 | Push trên iOS: khoá APNs, biên nhận Expo | Khoá: **Chủ dự án làm**. Biên nhận: **Còn lại** | — | Toàn bộ |
| IOS-18 | Bàn phím iOS che ô nhập | **Đã làm một phần** | `84f7544` (`ios`) | Còn năm chỗ: tạo cuộc họp, góp ý, thông tin cá nhân, tạo không gian làm việc, bảng từ chối việc |
| IOS-19 | Tìm bạn làm lộ email, số điện thoại | **Đã làm** (phần chính) | `6384ab9`, `f76f0ec`, `db0322e` (`ios-backend`); `ee2254e` (`ios`) | Còn lại: giới hạn tần suất cho hai đường tìm |
| IOS-20 | Xoá tài khoản xoá luôn tệp trên Azure Blob | **Đã làm** | `3386c52` (`ios-backend`); `dd1fa4e` (`ios`) | Không xoá bản chép lời ở Daily.co |
| IOS-21 | Thông báo sắp hết gói: bỏ câu mời gia hạn | **Đã làm** | `55a69f1` (`ios-backend`); `c9ff08c` (`ios`) | — |
| IOS-22 | Giữ vị thế app miễn phí đi kèm web (3.1.3(f)) | Mã: **Đã làm** | qua IOS-11, IOS-21, `c9ff08c` | Tuỳ chọn: ẩn dải "Còn N lượt AI" trên iPhone. Chạy lệnh kiểm chữ trước mỗi build |
| IOS-23 | Tạo dự án trong app | **Không làm ở bản đầu** | — | Chỉ làm nếu Apple nhắc tới 4.2 |

### Làm sau (low)

| ID | Việc | Trạng thái | Commit | Còn lại |
|---|---|---|---|---|
| IOS-24 | Sentry cho iOS | **Đã làm một phần** | `394da33` (`ios`) | Plugin dSYM, tắt lưu IP trên Sentry, cắt `?query=` khỏi breadcrumb |
| IOS-25 | Gỡ module native không dùng | **Còn lại** | — | Nên gộp vào Đợt 2 |
| IOS-26 | Privacy manifest dự phòng | Chỉ làm khi Apple gửi thư ITMS-91053 | — | — |
| IOS-27 | Quy trình OTA hai nền tảng | Quy trình, xem [Thứ tự đưa lên](#thứ-tự-đưa-lên-deploy) | — | — |
| IOS-28 | Keychain còn token sau khi gỡ app | **Còn lại** | — | Quyết định có giữ hành vi này không |
| IOS-29 | Xin quyền thông báo đúng lúc | **Đã làm** | `14c557c` (`ios`) | — |
| IOS-30 | Bỏ nút "Đề xuất này không đúng" giả | **Đã làm** | `f254141` (`ios`) | — |
| IOS-31 | Câu gợi ý cũ về cuộc họp | **Đã làm** | `f254141` (`ios`) | — |
| IOS-32 | Push iOS: `badge`, `threadId` | **Còn lại** | — | — |
| IOS-33 | Phòng họp Daily đang để công khai | **Còn lại** | — | — |
| IOS-34 | Hồ sơ thanh toán bị xoá cứng theo tài khoản | **Còn lại** | — | Cần migration riêng, hỏi người làm kế toán |
| IOS-35 | Câu kiểu Android khi bị từ chối máy ảnh | **Đã làm** | `0cc5b3b` (`ios`) | — |
| IOS-36 | Tự điền mật khẩu trên iOS | **Đã làm** (phần mã) | `c013903`, `899c8eb` (`ios`) | `ios.associatedDomains` để sau |

Ngoài kế hoạch, các nhánh còn làm thêm: app hiện đúng câu của máy chủ khi tài khoản bị khoá (`682916e`); app không gọi SDK Google trên iPhone (`c013903`, nay đã thay bằng SAU-03); iPhone ẩn thông báo gói và thanh toán (`c9ff08c`); các sửa lỗi sau vòng review và vòng kiểm hợp đồng (`68300ff`, `b6a26b8`, `41dcd8c`, `be3c023`, `226fc9b` trên `ios`; `497740d` trên `ios-backend`).

---

## Còn lại trước khi nộp

Các việc dưới đây chưa xong. Phần lớn là việc của chủ dự án.

### IOS-01 · Tài khoản Apple Developer, App ID và bản ghi App Store Connect

- **Trạng thái:** **Đã xong** ngày 28/09/2026. Apple đã duyệt tài khoản cá nhân, Team ID `LR53W8386S`. Bản ghi "WeDo: Làm việc nhóm", Apple ID của app `6816878767`, SKU `wedo-ios`. Bundle `vn.wedo.app` có Push Notifications và Sign In with Apple. Khai DSA: không phải trader. Phần dưới giữ lại để tra.
- **Mức:** blocker (#3, phản biện giữ nguyên). Trong mục này còn: tên app (#68, bị hạ xuống medium), trạng thái trader theo luật DSA của EU (#83, medium, chưa phản biện) và vùng phát hành (#88, low).
- **Phụ trách:** owner-account.
- **Công sức:** M. Thao tác khoảng một ngày, cộng thời gian chờ Apple xác minh danh tính (thường 1–2 ngày, có thể lâu hơn).
- **Phải xong trước:** không có. Mọi build iOS đều cần việc này. IOS-12 và IOS-16 cần Apple ID dạng số của app.
- **Nguồn:** #3, #12, #68, #83, #84, #88.

**Vì sao:** không có tài khoản trả phí thì không ký được bản build, không tải lên được, không nộp được (https://docs.expo.dev/submit/ios/).

**Làm theo thứ tự** (thao tác chi tiết từng màn hình nằm ở `01-tai-khoan-va-build.md`):

1. Đăng ký Apple Developer Program dạng **Individual** bằng một Apple Account đã bật xác thực hai lớp, dùng đúng tên pháp lý. Phí 99 USD/năm. ⚠ Giả định: đăng ký cá nhân, nên App Store sẽ hiện tên thật **Lê Hữu Đại** ở ô người bán.
2. Chấp nhận Program License Agreement. App miễn phí, không có mua hàng trong ứng dụng, nên **không cần** Paid Apps Agreement, thông tin thuế hay tài khoản ngân hàng.
3. Để lần `eas build -p ios` đầu tiên tự đăng ký App ID `vn.wedo.app`. Sau đó vào Certificates, Identifiers & Profiles → Identifiers và kiểm capability **Push Notifications**. Bật thêm capability **Sign In with Apple** (đã làm, xem SAU-02). Khoá APNs thì để EAS tạo ở lần build đầu (xem IOS-17).
4. Vào App Store Connect → Apps → New App và **tự tạo bản ghi bằng tay**. Nếu để `eas submit` tự tạo, nó sẽ lấy tên "WeDo" từ `expo.name` và ngôn ngữ mặc định `en-US` (đã đọc mã eas-cli 24.7.0, `build/submit/ios/AppProduce.js`). Điền:
   - Platform: iOS.
   - Name: `WeDo: Làm việc nhóm` (19/30 ký tự). Không dùng "WeDo" trơn. Tên trơn đã có người dùng, và dễ lẫn với "WeDo: Shared To-Do & Planner" và LEGO Education WeDo (#79).
   - Primary Language: Vietnamese.
   - Bundle ID: `vn.wedo.app`.
   - SKU: `wedo-ios`. Không đổi được về sau. Giống `01-tai-khoan-va-build.md` bước 7.1 và `02-thong-tin-app-store.md` mục 3.
   - Ghi lại **Apple ID dạng số** của app (`ascAppId`).

   Nếu App Store Connect báo tên đã có người dùng, thử lần lượt hai tên dự phòng dưới đây, cùng thứ tự với `02-thong-tin-app-store.md` mục 4. Đổi tên thì sửa từ khoá và phụ đề theo mục đó.

   ```text
   WeDo: Làm việc nhóm
   ```

   ```text
   WeDo Team: Việc nhóm & Chat
   ```

   ```text
   WeDo - Bài tập nhóm sinh viên
   ```

   Ba tên dài lần lượt 19, 27 và 29 trên 30 ký tự.

5. Vào Pricing and Availability: chọn giá Free, chỉ tích Việt Nam. Bỏ chọn "iPhone and iPad Apps on Apple Silicon Mac" và Apple Vision Pro, vì app chưa được thử trên hai loại máy đó.
6. Khai trạng thái trader theo luật DSA của EU: chọn **This is not a trader account**. Lần nộp app mới đầu tiên, App Store Connect bắt khai **kể cả khi không phát hành ở EU**. Trang hướng dẫn DSA của Apple nói: nếu chỉ phát hành trên App Store ở ngoài EU thì bạn không hoạt động như trader trên App Store. Bản này chỉ phát hành ở Việt Nam, nên khớp với `01-tai-khoan-va-build.md` bước 2.3 và `02-thong-tin-app-store.md` mục 17.2. Khi mở sang EU thì khai lại. Lúc đó web đang bán gói trả phí, nên nhiều khả năng phải khai là trader. Tài khoản cá nhân là trader phải công bố địa chỉ, số điện thoại và email trên trang App Store ở các nước EU.
7. Vào Users and Access và mời thành viên nhóm với vai trò riêng. Không dùng chung tài khoản chủ.

**Kiểm:** trang developer.apple.com báo Membership đang hoạt động. App Store Connect có bản ghi với Apple ID dạng số. Mục Identifiers có `vn.wedo.app`.

### IOS-14 · Tài khoản demo cho App Review

- **Trạng thái:** **Chủ dự án làm.** Máy chủ mới đã chạy (28/09/2026), nên làm được ngay. Chỉ dùng tài khoản email và mật khẩu.
- **Mức:** blocker. Phản biện nâng #69 từ high lên blocker.
- **Công sức:** M.
- **Nguồn:** #69, #32, #52, và phần ngắn hạn của #31.
- Các bước chi tiết, dữ liệu mẫu và ghi chú cho reviewer nằm ở `04-thong-tin-cho-reviewer.md` mục 4 và mục 6.

**Vì sao:** Guideline 2.1(a): app có đăng nhập thì phải đưa thông tin tài khoản demo và bật máy chủ. App mobile không tạo được dự án hay mời thành viên (`M src/lib/api/projects.ts` chỉ có `listProjects`). Một tài khoản mới tinh chỉ thấy màn trống ở trò chuyện dự án, AI và cuộc họp.

**Làm gì** (tóm tắt theo `04-thong-tin-cho-reviewer.md` mục 4):

1. Tạo ba tài khoản email/mật khẩu, vai trò USER. Không dùng tài khoản ADMIN, vì app mobile chặn (`BE src/auth/auth.service.ts`, `assertNotPlatformAdmin`). Không dùng tài khoản tạo bằng Apple hay Google: người duyệt không vào được Apple ID hay tài khoản Google của bạn.
   - **A** (reviewer đăng nhập): Leader của dự án mẫu, **không** làm chủ không gian nào.
   - **B** (đồng đội): chủ không gian làm việc, tạo dữ liệu mẫu.
   - **C** (để reviewer thử xoá): thành viên thường.
2. Lý do B làm chủ: máy chủ từ chối xoá tài khoản đang làm chủ không gian còn thành viên khác (#52). A và C không làm chủ gì, nên reviewer xoá được ngay.
3. A và C đăng ký trong app bản mới (có ô 18+), nên không gặp màn "Điều khoản sử dụng". B đăng ký trên web, nên lần đầu mở app sẽ gặp màn đó. Đăng nhập B trên app một lần, đánh dấu ô, bấm "Đồng ý và tiếp tục" trước khi nộp.
4. Chuẩn bị trên web: tin nhắn dự án của nhiều người, một ảnh, một cuộc trò chuyện riêng A–B, công việc ở các trạng thái, một cuộc họp sắp tới và một cuộc họp đã xong có tóm tắt, lượt AI còn dư.
5. Cả ba tài khoản ở gói miễn phí.
6. Giữ backend Azure luôn chạy. Không đặt `MOBILE_IOS_MINIMUM_VERSION` trong lúc duyệt.

**Kiểm:** đăng nhập A trên TestFlight và đi hết mọi màn một lượt. Thử xoá tài khoản bằng một tài khoản tạm khác, không xoá C.

### IOS-15 · Biến môi trường EAS production (phần của chủ dự án)

- **Trạng thái:** mã **Đã làm** (`899c8eb`, `dd1fa4e` trên `ios`). Việc xem biến: **Chủ dự án làm.**
- **Mức:** medium (#61, #30).

Dòng "Chính sách quyền riêng tư" nay luôn hiện. `M src/lib/legal-links.ts` đọc `EXPO_PUBLIC_PRIVACY_URL` trước, thiếu thì dùng `https://wedofpt.com.vn/privacy.html`. Điều khoản và trang hỗ trợ dùng đường dẫn cố định trong mã.

**Làm gì:**

1. Trong `D:\WeDo_ChPlay-ios`, chạy `npx eas-cli env:list --environment production`, chỉ xem tên biến. Cần có `EXPO_PUBLIC_API_BASE_URL` và `EXPO_PUBLIC_SENTRY_DSN`. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` có giá trị dự phòng trong mã. Client iOS của Google nằm cứng trong mã (`GOOGLE_IOS_CLIENT_ID`), không cần biến EAS. Bản này không cần biến mới.
2. Nếu `EXPO_PUBLIC_PRIVACY_URL` có trên EAS, nó thắng giá trị dự phòng. Nên đặt `https://wedofpt.com.vn/privacy.html`, cùng địa chỉ với ô Privacy Policy URL. Tệp `.env` ở máy đang để `https://fe-wedo.vercel.app/privacy.html`.

**Kiểm:** trên TestFlight, tab Tài khoản có đủ bốn dòng: Điều khoản sử dụng, Chính sách quyền riêng tư, Hỗ trợ, Liên hệ: wedosupport6886@gmail.com.

### IOS-16 · `eas.json` cho iOS: hồ sơ submit

- **Trạng thái:** **Đã làm** (`962517f` trên `ios`). `M eas.json` có `"ascAppId": "6816878767"` và `"appleTeamId": "LR53W8386S"`. Phần dưới giữ lại để tra.
- **Mức:** medium (#9).
- **Phải xong trước:** IOS-01 (có Apple ID dạng số của app và Team ID). **Việc này đổi vân tay** (`eas.json` cũng được băm), nên làm cùng Đợt 2.

**Làm gì:**

- `M eas.json`: đổi `"submit": { "production": {} }` thành `"submit": { "production": { "ios": { "ascAppId": "<APPLE_ID_SỐ>", "appleTeamId": "<TEAM_ID>" } } }`.
- Sửa trên nhánh `ios` trong `D:\WeDo_ChPlay-ios`, không sửa trên `main`. Chạy mọi lệnh `eas build -p ios` và `eas submit -p ios` trong thư mục đó.
- Không dùng hồ sơ `development` hay `preview` cho iOS (ad-hoc, phải đăng ký UDID từng máy).

**Kiểm:** `eas submit` không hỏi tạo app mới, và đẩy đúng vào bản ghi đã tạo ở IOS-01.

### IOS-17 · Push trên iOS: khoá APNs và biên nhận Expo

- **Trạng thái:** khoá APNs: **Chủ dự án làm.** Đọc biên nhận: **Còn lại.**
- **Mức:** medium (#10, #47).

1. Chủ dự án: ở lần `eas build -p ios` đầu tiên, trả lời **Yes** khi được hỏi có cài push không. Hoặc chạy `eas credentials -p ios` → Push Notifications. Không có khoá thì thông báo trên iPhone mất lặng lẽ.
2. Máy chủ (còn lại): giữ `id` của vé cùng token, khoảng 15 phút sau gọi `https://exp.host/--/api/v2/push/getReceipts`. Gặp `DeviceNotRegistered` thì xoá token, gặp `InvalidCredentials` thì báo lên Sentry. Giữ vé trong bộ nhớ thì không cần migration.

**Kiểm:** trên TestFlight nhận được thông báo nhắc hạn và thông báo tin riêng.

### IOS-18 · Bàn phím iOS: năm màn còn lại

- **Trạng thái:** **Đã làm một phần** (`84f7544` trên `ios`). Phần còn lại: **Còn lại.**
- **Mức:** medium (#11, chưa thử trên máy).

Đã làm: `M src/components/ui/KhungCuonBieuMau.tsx` dùng `KeyboardAwareScrollView` trên iPhone và `ScrollView` thường trên Android. Đã dùng ở màn tạo việc, đăng ký, quên mật khẩu. Phiếu báo cáo có sẵn `KeyboardAvoidingView` trên iOS.

Còn lại, dùng cùng `KhungCuonBieuMau`:

- `M src/app/(tabs)/meetings/new.tsx`
- `M src/app/account/feedback.tsx`
- `M src/app/account/profile.tsx`
- `M src/components/workspace/CreateWorkspaceForm.tsx`
- `M src/components/tasks/RejectTaskSheet.tsx` (Modal có `TextInput` nhiều dòng; bọc thân bảng bằng `KeyboardAvoidingView`)

**Không** đụng màn trò chuyện dự án và tin nhắn riêng. Thử lại cả trên Android.

### Phần còn lại của các việc đã làm

| Việc | Phần còn lại | Mức |
|---|---|---|
| SAU-04 | Email chuyển tiếp của Apple (`…@privaterelay.appleid.com`): thư WeDo gửi (mã đặt lại mật khẩu, thư trả lời từ hộp thư hỗ trợ) có thể không tới, vì nơi gửi thư của WeDo chưa đăng ký ở "Sign in with Apple for Email Communication". Web chưa có nút Apple. Chi tiết ở [SAU-04](#sau-04--tài-khoản-apple-dùng-trên-web-thư-tới-email-chuyển-tiếp--còn-lại) | medium |
| IOS-03 | Chặn gửi lại lời mời kết bạn trong 30 ngày sau khi bị từ chối. Hôm nay `BE src/friends/friends.service.ts` (`sendRequest`) vẫn đưa lời mời REJECTED về PENDING | medium |
| IOS-03 | Người mình đã chặn không được thêm mình vào dự án (`BE src/projects/projects.service.ts`, `addMember` chưa kiểm chặn) | medium |
| IOS-03 | Phần B: lời mời vào dự án chờ đồng ý; `POST /projects/:id/leave`, `POST /workspaces/:id/leave`; `removeMember` xoá luôn `workspaceMember` khi không còn dự án | medium |
| IOS-03 | Các mục thấp của vòng review máy chủ (xem Bước A) | low |
| IOS-04 | Chưa có "Huỷ kết bạn" (máy chủ chưa có `DELETE /friends/:id`). Chặn thì tình bạn bị xoá | low |
| IOS-06 | Web: màn đăng ký chưa có ô 18+ và đồng ý điều khoản. Người đăng ký trên web gặp màn "Điều khoản sử dụng" khi mở app lần đầu. Trên web họ chưa bao giờ phải đồng ý | medium |
| IOS-06 | Máy chủ chỉ lưu thời điểm đồng ý (`termsAcceptedAt`, `adultConfirmedAt`), không lưu phiên bản điều khoản. Muốn hỏi lại khi điều khoản đổi lớn thì phải thêm trường | low |
| IOS-06 | Nút Google (Android, iPhone) và nút Apple (iPhone) ở màn đăng ký không đòi đánh dấu ô. Tài khoản mới tạo bằng hai nút này gặp màn đồng ý ngay sau khi vào, nên không ai lọt qua mà chưa đồng ý. Cố ý giữ | low |
| IOS-08 | Đã sửa ở `608d06c` (nhánh `ios`): hộp thoại nêu đủ "Google Gemini, Azure OpenAI hoặc OpenAI" và "khoảng 12 tin nhắn gần nhất", khớp máy chủ và chính sách. | đã xong |
| IOS-09 | Máy chủ **không** bắt buộc dấu đồng ý AI ở các endpoint AI. App mobile tự chặn | medium |
| IOS-09 | Web vẫn **tự gửi** tin của Leader cho AI mỗi khi Leader gửi tin trong trò chuyện dự án, không hỏi (`FE src/views/ChatView.tsx:920-923`), và có nút phân tích từng tin (dòng 1452). Chính sách và điều khoản đã nói thật điều này. Nên thêm bước hỏi trên web | medium |
| IOS-09 | Vẫn gửi tối đa 12 tin gần nhất (`BE src/chat/chat.service.ts:186`, `take: 12`). Chính sách ghi đúng con số này | — |
| IOS-19 | Giới hạn tần suất cho `GET /friends/search` và `GET /chat/direct/users` (`BE src/common/request-rate-limit.guard.ts`) | low |
| IOS-19 | Người nhắn tin riêng với nhau vẫn thấy email và số điện thoại của nhau. Web hiện số điện thoại người kia (`FE src/views/ChatView.tsx:1605`). Chính sách đã nói thật điều này | low |
| IOS-20 | Không xoá bản chép lời cuộc họp ở Daily.co. Xoá tệp chạy ngầm sau khi xoá tài khoản; lỗi chỉ ghi log để dọn tay | low |
| IOS-22 | Tuỳ chọn: ẩn dải "Còn N lượt AI trong tháng này" trên iPhone (`M src/lib/ai/han-muc.ts:65`) | low |

Lệnh kiểm chữ mời mua, chạy trong `D:\WeDo_ChPlay-ios` trước mỗi build (IOS-22). Kết quả chỉ được là chú thích, chuỗi lỗi nội bộ, hoặc chữ chỉ chạy trên Android:

```bash
grep -rniE "nâng cấp|thanh toán|gói |premium|upgrade|pricing|VND|CH Play" src --include=*.tsx --include=*.ts | grep -v __tests__
```

---

## Đã làm

Mọi việc dưới đây đã có mã trên nhánh iOS và đã qua vòng review. Phần máy chủ và web đã lên production ngày 28/09/2026. Mỗi mục ghi: đã làm gì, chỗ khác với kế hoạch ban đầu, và cách kiểm trên TestFlight.

### Cấu hình iOS trong `app.json` · Đã làm · `dbbd5f0` (`ios`)

Tám việc của mục "Đang làm" cũ đều đã có trong commit `dbbd5f0`:

| Việc | Phát hiện | Giá trị |
|---|---|---|
| `ios.bundleIdentifier` | #1 | `vn.wedo.app` |
| `ios.icon` | #2, #66 | `./assets/images/icon.png` (logo WeDo) |
| `ios.buildNumber` | #7 | `"1"`. Vì `M eas.json` là `appVersionSource: "local"`, mỗi build iOS mới phải **tự tăng** số này |
| `ios.config.usesNonExemptEncryption` | #8, #78 | `false` |
| `locales` + `CFBundleDevelopmentRegion` + `CFBundleLocalizations` + `CFBundleAllowMixedLocalizations` | #81 | tiếng Việt (`M locales/vi.json`) |
| `ios.supportsTablet` | #82 | `false` |
| Chuỗi Face ID | #14 | `["expo-secure-store", { "faceIDPermission": false }]` |
| Chuỗi quyền thư viện ảnh | #14 | "WeDo cần thư viện ảnh để bạn gửi ảnh có sẵn trong khung chat và chọn ảnh đại diện." (cả `app.json` và `M locales/vi.json`) |

Thêm: `NSAppTransportSecurity` chặn tải trang `http`. Thư mục `M assets/expo.icon/` vẫn còn nhưng không được dùng. Xoá nó là tuỳ chọn.

**Kiểm (TestFlight):** biểu tượng là logo WeDo; build không kẹt ở "Missing Compliance"; Info.plist trong log EAS không có `NSFaceIDUsageDescription`; hộp thoại hệ thống hiện tiếng Việt.

### IOS-02 · Ẩn Google trên iPhone · Đã thay bằng SAU-03 · `c013903`, `682916e`, `899c8eb`; rồi `2d1606f`, `df0c255` (`ios`)

- Build iOS 1 ẩn nút Google trên iPhone. Ngày 28/09/2026 quyết định này đã bỏ: từ build 3, iPhone có lại "Tiếp tục với Google", cùng "Tiếp tục với Apple" (xem [SAU-01 … SAU-04](#đăng-nhập-apple-và-google-trên-iphone-sau-01--sau-04)).
- Giữ lại từ việc này: `coDangNhapGoogle()` vẫn là chỗ quyết định có vẽ nút Google hay không. Nay nó trả đúng trên iPhone khi đã khai client iOS. Không còn nút nào thì màn hình không vẽ dòng "hoặc".
- Đường "Quên mật khẩu?" cho tài khoản Google vẫn chạy (`BE src/auth/password-reset.service.ts`), nhưng trên iPhone không còn cần.

### IOS-03 · Máy chủ: chặn, báo cáo, lọc từ ngữ, đình chỉ · Đã làm · `f508184`, `6384ab9`, `f76f0ec`, `db0322e`, `497740d` (`ios-backend`)

Đã làm:

- **Migration** `202609260001_moderation_consent`: bảng `UserBlock`, `ContentReport`; enum `ReportTargetType` (USER, PROJECT_MESSAGE, DIRECT_MESSAGE), `ReportReason` (SPAM, HARASSMENT, HATE, SEXUAL, VIOLENCE, OTHER), `ReportStatus` (OPEN, RESOLVED, DISMISSED), `ReportAction`; cột `User.suspendedAt`, `suspensionReason` (và ba cột đồng ý của IOS-06, IOS-09).
- **Endpoint cho người dùng:** `POST /moderation/reports`, `GET /moderation/blocks`, `POST /moderation/blocks`, `DELETE /moderation/blocks/:userId`.
- **Chặn có hiệu lực hai chiều:** trả 403 mã `BLOCKED` ("Bạn không thể nhắn tin cho người này." / "Bạn không thể kết bạn với người này.") khi gửi tin riêng, gửi tệp, thả cảm xúc, chuyển tiếp, mở cuộc trò chuyện riêng (kể cả khi đã có sẵn), gửi hay chấp nhận lời mời kết bạn. Chặn xoá luôn tình bạn. Hai người có quan hệ chặn không tìm thấy nhau.
- **Ẩn tin của người đã chặn** ở mọi đường đọc qua HTTP: lịch sử trò chuyện dự án, tin nhắn riêng, tìm tin, tin cuối trong danh sách hội thoại, số tin chưa đọc. Tin mới qua socket thì app tự lọc. Không đẩy thông báo tin dự án của người mình đã chặn.
- **Báo cáo:** máy chủ tự xác định người bị báo cáo, kiểm người báo cáo được xem thứ họ báo, và lưu **bản chụp nội dung** (tối đa 2.000 ký tự, kèm tên tệp đính kèm) để còn bằng chứng khi tin bị thu hồi. Báo cáo lại cùng thứ đang mở thì không tạo dòng mới. Mỗi người tối đa 30 báo cáo mỗi 24 giờ (429 mã `REPORT_LIMIT`). Không tự báo cáo mình. Mỗi báo cáo gửi một thư văn bản thuần tới `REPORT_NOTIFY_EMAIL`. Báo cáo còn lại khi tài khoản liên quan bị xoá (liên kết thành rỗng).
- **Quản trị:** `GET /admin/moderation/reports`, `PATCH /admin/moderation/reports/:id` với hành động `DISMISS`, `REMOVE_CONTENT`, `SUSPEND_USER`, `REMOVE_CONTENT_AND_SUSPEND` và ghi chú tuỳ chọn; `POST /admin/moderation/users/:id/unsuspend`. Gỡ nội dung dùng đúng cơ chế thu hồi tin, nên mọi máy đang mở tự ẩn tin. Không đình chỉ được tài khoản quản trị nền tảng.
- **Đình chỉ:** chặn đăng nhập email, Google, làm mới phiên (403 mã `ACCOUNT_SUSPENDED`), chặn mọi lượt gọi API còn token (401), từ chối và ngắt socket, thu hồi mọi refresh token, xoá mọi push token. Câu báo: "Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng. Liên hệ wedosupport6886@gmail.com nếu bạn cho rằng đây là nhầm lẫn."
- **Bộ lọc từ ngữ** (`BE src/moderation/word-filter.ts`): **che** từ phản cảm bằng `***`, không từ chối cả tin. Áp cho tin dự án, tin riêng, chú thích tệp, tin chuyển tiếp, và họ tên khi đăng ký (email, Google) và khi sửa hồ sơ. So nguyên từ. Hai danh sách: từ tiếng Việt so đúng dấu (để "lồn" khác "lớn"), từ viết tắt và tiếng Anh so sau khi bỏ dấu.

Khác với kế hoạch ban đầu: đường dẫn là `/moderation/*` thay cho `/users/:id/block` và `/reports`; bộ lọc che `***` thay cho trả lỗi 400; địa chỉ nhận thư là biến `REPORT_NOTIFY_EMAIL` thay cho địa chỉ viết cứng; chưa có `DELETE /friends/:id`; chưa chặn gửi lại lời mời 30 ngày; chưa kiểm chặn ở `addMember`.

**Kiểm:** 55 bộ test máy chủ chạy qua, gồm tệp kiểm hợp đồng HTTP `BE src/hop-dong-api-ios.spec.ts`. Chưa chạy với cơ sở dữ liệu thật và Azure Blob thật. Sau Bước A: A chặn B, rồi B không tìm thấy A, không gửi được lời mời, không nhắn riêng được; gửi một báo cáo và nhận thư.

### IOS-04 · Mobile: Báo cáo, Chặn, Người đã chặn · Đã làm · `32c1101`, `7a9ed8b`, `05a0f15`, `ee2254e`, `e2e07fb`, `41dcd8c`, `be3c023`, `226fc9b` (`ios`)

Chữ trên giao diện, đúng như mã:

```text
Nhấn giữ tin của người khác trong trò chuyện dự án:
Tạo công việc bằng AI   (chỉ Leader dự án và chủ không gian làm việc)
Báo cáo tin nhắn
Chặn người này
Huỷ

Nhấn giữ tin của người kia trong tin nhắn riêng:
Báo cáo tin nhắn
Chặn người này
Huỷ

Nút ba chấm ở đầu cuộc trò chuyện riêng, và nút ba chấm cuối mỗi dòng người trong màn Bạn bè
(bạn bè, lời mời đến, lời mời đã gửi, kết quả tìm kiếm):
Báo cáo người này
Chặn người này
Huỷ

Phiếu báo cáo — tiêu đề: Báo cáo tin nhắn  (hoặc: Báo cáo [Tên])
Câu hỏi: Vì sao bạn báo cáo tin nhắn này?  (hoặc: Vì sao bạn báo cáo người này?)
Lý do:
Spam, quảng cáo
Quấy rối, bắt nạt
Thù ghét, phân biệt đối xử
Nội dung tình dục
Bạo lực, đe doạ
Lý do khác
Ô: Ghi chú thêm (không bắt buộc), tối đa 500 ký tự
Nút: Gửi báo cáo | Huỷ
Sau khi gửi: Đã gửi báo cáo. WeDo sẽ xem xét trong vòng 24 giờ.
Quá hạn mức: Bạn đã gửi nhiều báo cáo trong 24 giờ qua. Vui lòng thử lại sau.

Xác nhận chặn — tiêu đề: Chặn [Tên]?
Xác nhận chặn — nội dung: Bạn sẽ không thấy tin nhắn của người này nữa, và hai người không thể nhắn tin riêng hay kết bạn với nhau. Bạn có thể bỏ chặn trong Tài khoản → Người đã chặn.
Nút: Huỷ | Chặn

Tài khoản → Người đã chặn (gợi ý dưới dòng: Xem và bỏ chặn)
Màn danh sách — tiêu đề: Người đã chặn
Khi trống: Bạn chưa chặn ai.
Nút trên mỗi hàng: Bỏ chặn
```

- Trên iPhone, bảng thao tác là `ActionSheetIOS` của hệ thống. Android dùng bảng trượt riêng.
- Tin của chính mình: nhấn giữ không có Báo cáo và Chặn. Tin đang gửi dở: không có thao tác nào.
- Chặn xong, app ghi người đó vào bộ nhớ đệm ngay: tin của họ biến mất ở trò chuyện dự án và tin nhắn riêng (kể cả tin mới qua socket), khỏi danh sách Tin nhắn, danh sách Bạn bè, kết quả tìm kiếm và dòng "đang gõ". Chặn từ trong tin nhắn riêng thì app rời cuộc trò chuyện.
- Máy chủ từ chối với mã `BLOCKED` thì app hiện nguyên câu của máy chủ.
- Tìm bạn: từ khoá tối thiểu 3 ký tự. Dòng người không có email thì không hiện dòng email.

**Kiểm (TestFlight):** hai tài khoản demo, thử trọn luồng báo cáo, chặn, bỏ chặn, ở trò chuyện dự án, tin nhắn riêng và màn Bạn bè.

### IOS-05 · Web quản trị "Báo cáo vi phạm" · Đã làm · `f65b1dd`, `f39efcd`, `a284326`, `a8e9b71`, `f40c351`, `92dd7c8` (`ios-web`)

- Mục **"Báo cáo vi phạm"** trong trang quản trị, địa chỉ `#/admin/moderation`. Chỉ tài khoản quản trị nền tảng vào được.
- Lọc **Chờ xử lý / Đã xử lý / Đã bỏ qua**, 20 báo cáo mỗi trang.
- Mỗi báo cáo hiện lý do (cùng nhãn với app), loại (tài khoản, tin dự án, tin riêng), bản chụp nội dung, ghi chú của người báo cáo, thời điểm, người báo cáo và người bị báo cáo (hoặc "Tài khoản đã bị xoá"). Báo cáo chờ quá 24 giờ có nhãn **"Quá hạn"**.
- Nút: **Bỏ qua**, **Gỡ nội dung**, **Khoá tài khoản**, **Gỡ nội dung và khoá**, **Mở khoá**. Mỗi nút có bước xác nhận và ô **"Ghi chú xử lý"** (tối đa 500 ký tự).
- Máy chủ cũ (chưa có kiểm duyệt) thì trang báo rõ, không hiện lỗi 404 trần.

**Kiểm:** sau Bước B, gửi một báo cáo từ app, mở trang, bấm Gỡ nội dung: tin biến mất ở cả hai phía. Khoá tài khoản: người đó bị đẩy ra ở lượt gọi kế tiếp.

### IOS-06 · Điều khoản, ô 18+, màn đồng ý một lần · Đã làm · app `899c8eb`, `dff8821` (`ios`); máy chủ `3386c52` (`ios-backend`); trang `f6052b3` (`ios-web`)

- **Màn Đăng ký:** ô đánh dấu dưới ô Mật khẩu, không đánh dấu sẵn. Chữ: "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư". Hai cụm tên là đường dẫn, mở trong trình duyệt trong app. Nút **Đăng ký** bị tắt tới khi đánh dấu ô. Chốt thêm trong mã: câu "Bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng để tạo tài khoản."
- **Máy chủ:** `RegisterDto` nhận hai trường tuỳ chọn `acceptTerms`, `confirmAdult`. Có đủ cả hai thì ghi `termsAcceptedAt` và `adultConfirmedAt`. Thêm `POST /users/me/accept-terms` với thân `{ confirmAdult: true }` (thiếu hay `false` thì 400). `GET /users/me` trả ba mốc đồng ý.
- **Màn đồng ý một lần** (`M src/components/auth/CongDieuKhoan.tsx`): bọc toàn bộ app. Người đã đăng nhập mà `termsAcceptedAt` là `null` không vào được màn nào, kể cả màn mở từ thông báo. Tiêu đề "Điều khoản sử dụng". Nội dung: "Trước khi tiếp tục dùng WeDo, bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng." và "WeDo không chấp nhận nội dung phản cảm, quấy rối hay lạm dụng. Bạn có thể báo cáo tin nhắn hoặc chặn người vi phạm ngay trong app, và WeDo xem xét mọi báo cáo trong vòng 24 giờ." Cùng ô đánh dấu như màn đăng ký. Nút **"Đồng ý và tiếp tục"** và **"Đăng xuất"**.
- Máy chủ cũ không trả trường `termsAcceptedAt`, nên màn này không hiện (tránh nhốt người dùng).
- **Trang web** `public/dieu-khoan.html`.

**Kiểm (TestFlight):** đăng ký khi chưa đánh dấu ô: nút Đăng ký tắt. Tài khoản tạo trên web đăng nhập app: thấy màn đồng ý một lần; đồng ý xong vào thẳng Trò chuyện.

### IOS-07 · Hỗ trợ · Đã làm · app `43ad40d`, `dd1fa4e` (`ios`); trang `1f6e813`, `85cf0b5` (`ios-web`)

- Tab Tài khoản có bốn dòng: **"Điều khoản sử dụng"**, **"Chính sách quyền riêng tư"**, **"Hỗ trợ"** (mở `https://wedofpt.com.vn/ho-tro.html`), **"Liên hệ: wedosupport6886@gmail.com"** (mở ứng dụng thư; không có ứng dụng thư thì mở trang hỗ trợ). Các trang mở trong trình duyệt trong app.
- Trang web `public/ho-tro.html`. Support URL: `https://wedofpt.com.vn/ho-tro.html`. Chân trang trang chủ web có liên kết tới bốn trang pháp lý (`85cf0b5`).

### IOS-08 · Hộp thoại đồng ý AI · Đã làm · `0585335`, `43ad40d` (`ios`)

- Leader chọn "Tạo công việc bằng AI" lần đầu thì app hiện hộp thoại **trước** khi gửi gì. Đây là đường duy nhất vào AI trên mobile.

  ```text
  Tiêu đề: Dùng AI để gợi ý công việc?
  Nội dung: Để gợi ý công việc, WeDo sẽ gửi tin nhắn bạn chọn cùng khoảng 12 tin nhắn gần nhất và tên các thành viên trong dự án cho một nhà cung cấp AI bên thứ ba (Google Gemini, Azure OpenAI hoặc OpenAI). WeDo không gửi email hay số điện thoại của ai. Bạn có thể tắt tính năng này bất cứ lúc nào trong Tài khoản.
  Nút: Không, cảm ơn | Đồng ý

  Khi đang chờ: AI đang đọc tin nhắn…

  Tài khoản → công tắc "Cho phép dùng AI"
  Gợi ý dưới dòng: Gợi ý công việc từ tin nhắn. Tắt thì WeDo không gửi tin nhắn cho AI nữa.
  ```

- "Đồng ý": lưu lên máy chủ (`POST /users/me/ai-consent`) rồi mới gọi AI. "Không, cảm ơn" hoặc lưu hỏng: không gửi gì.
- Bật công tắc đi qua đúng hộp thoại trên. Tắt công tắc thì rút lại ngay (`DELETE /users/me/ai-consent`), không hỏi.
- Đồng ý lưu trên máy chủ, nên máy khác không hỏi lại.
- Khác kế hoạch: nút phụ là "Không, cảm ơn"; từ chối thì không mở bảng tạo việc trống; hộp thoại không có đường dẫn tới chính sách; tên dòng là "Cho phép dùng AI".

**Kiểm (TestFlight):** Leader nhấn giữ một tin, chọn "Tạo công việc bằng AI": hộp thoại hiện trước. Tắt công tắc rồi thử lại: hỏi lại.

### IOS-09 · Máy chủ: đồng ý AI, bớt dữ liệu gửi AI · Đã làm (một phần) · `3386c52` (`ios-backend`)

- Cột `User.aiConsentAt`. `POST` và `DELETE /users/me/ai-consent`. Bật lại khi đang bật thì giữ mốc cũ.
- **Không gửi email cho AI nữa.** Thành viên dự án gửi đi chỉ gồm mã, tên, vai trò. Tác giả tin chỉ gồm mã và tên. Câu hướng dẫn cho AI đổi thành "Tên người phụ trách". Máy chủ vẫn dùng email để tự khớp người phụ trách, nhưng không gửi ra ngoài.
- Tóm tắt cuộc họp chỉ gửi tiêu đề và bản chép lời (không đổi).
- Còn lại: xem mục [Phần còn lại](#phần-còn-lại-của-các-việc-đã-làm).

### IOS-10 · Chính sách quyền riêng tư và trang xoá tài khoản · Đã làm · `c4b98c2`, `2d02fa7`, `1342927`, `3e81a48`, `c025008`, `8bab15c` (`ios-web`)

- `public/privacy.html` viết lại theo `05-chinh-sach-bao-mat.md`, tên mới "Chính sách quyền riêng tư". Phạm vi gồm web, Android, iPhone. Nêu đúng dữ liệu gửi AI (không có email), nói thật việc web tự gửi tin của Leader cho AI, bộ lọc `***`, báo cáo, chặn, đình chỉ, xoá tệp khi xoá tài khoản, tìm bạn tối thiểu 3 ký tự.
- `public/xoa-tai-khoan.html` khớp app iPhone và chính sách mới.
- Chỗ chưa biết giá trị thật được viết bằng câu trung tính, không để ngoặc vuông (xem `05` mục 2.1).
- Các commit sửa chữ sau đó: thư báo cáo vi phạm chỉ "có thể" gửi (tuỳ `REPORT_NOTIFY_EMAIL`), thẻ xin quyền thông báo, bỏ liên kết tới trang chủ web khỏi chính sách và trang hỗ trợ, câu về nhật ký máy chủ (dòng log gửi thư đặt lại mật khẩu có ghi email), bản chụp báo cáo và chặn.

### IOS-11 · Ẩn "Xem đầy đủ trên web" · Đã làm · `1adf6b5` (`ios`)

`M src/app/(tabs)/account/contributions.tsx`: nút chỉ hiện khi `coWeb() && Platform.OS !== 'ios'`. Bảng đóng góp vẫn có trên iPhone. `contributions.tsx` là chỗ duy nhất trong app mở web WeDo.

### IOS-12 · Phiên bản theo nền tảng · Đã làm · app `1894bd0` (`ios`); máy chủ `4cfe5e1`, `9314d45` (`ios-backend`)

- App gọi `/app-version?platform=ios` hoặc `android`. Máy chủ trả `storeUrl` kèm phiên bản.
- iPhone: nút ghi "Mở App Store để cập nhật" và mở `storeUrl`. Chỉ nhận `itms-apps://` hay `https://apps.apple.com/…`. Máy chủ không gửi `storeUrl` hợp lệ thì iPhone không hiện màn chặn hay dải nhắc nào.
- Android không đổi: "Mở CH Play để cập nhật".
- Biến Azure: xem Bước A2.

### IOS-13 · Ảnh HEIC · Đã làm, chưa thử trên máy · `0cc5b3b` (`ios`)

- Bộ chọn ảnh iPhone được yêu cầu trả định dạng tương thích.
- Dự phòng: ảnh HEIC, HEIF và mọi ảnh iPhone không phải JPEG hay PNG được nén lại thành JPEG, đuôi `.jpg`, kiểu `image/jpeg`. Nhờ vậy EXIF và vị trí trong ảnh gốc không đi lên máy chủ.
- Không thêm `image/heic` vào danh sách của máy chủ.

**Kiểm (TestFlight):** chụp ảnh ở định dạng Hiệu suất cao, gửi từ thư viện trong trò chuyện dự án và tin nhắn riêng. Web và Android xem được.

### IOS-19 · Tìm bạn · Đã làm (phần chính) · `6384ab9`, `f76f0ec`, `db0322e` (`ios-backend`); `ee2254e` (`ios`)

- Tìm bạn (`GET /friends/search`) và tìm người nhắn riêng (`GET /chat/direct/users`): từ khoá tối thiểu 3 ký tự; tên khớp một phần; email và số điện thoại chỉ khớp khi gõ đủ; người chưa là bạn nhận `email: null`, `phone: null`; hai người có quan hệ chặn không tìm thấy nhau.
- Lời mời mình đã gửi mà người kia chưa nhận: máy chủ giấu email, số điện thoại của người nhận.
- App: tìm từ 3 ký tự. Ô tìm vẫn ghi "Tên, email hoặc số điện thoại".

### IOS-20 · Xoá tài khoản xoá tệp · Đã làm · `3386c52` (`ios-backend`); `dd1fa4e` (`ios`)

- Trước khi xoá, máy chủ gom tên tệp đính kèm trò chuyện và tệp nộp bài do người đó tải lên, cùng mọi tệp trong các không gian làm việc bị xoá theo. Xoá xong trong cơ sở dữ liệu thì xoá các tệp đó trên Azure Blob (tệp nộp bài ở `task-submissions/`). Chỉ xoá tệp không còn dòng nào trỏ tới, nên tệp người khác đã chuyển tiếp vẫn còn.
- Việc xoá tệp chạy ngầm. Lỗi thì ghi log, không báo lỗi cho người dùng.
- Ảnh đại diện là chuỗi `data:` nằm ngay trong dòng `User`, nên mất cùng dòng đó.
- Màn "Xoá tài khoản" thêm dòng "Tin nhắn riêng, danh sách bạn bè, ảnh và tệp bạn đã tải lên", và nút **"Thử lại"** khi không tải được thông tin.

### IOS-21 · Thông báo gói · Đã làm · `55a69f1` (`ios-backend`); `c9ff08c` (`ios`)

- Máy chủ bỏ câu "Gia hạn sớm sẽ được cộng nối tiếp thời gian còn lại." Chữ còn lại: "Gói … sẽ hết hạn sau … ngày (…)."
- Máy chủ không đẩy `SUBSCRIPTION_RENEWAL_DUE` và `PAYMENT_CONFIRMED` tới máy có `platform` là `ios`. Bản ghi vẫn có trên web và vẫn đẩy tới Android.
- App iPhone ẩn các loại thông báo gói, thanh toán (và mọi loại bắt đầu bằng `SUBSCRIPTION_`, `PAYMENT_`, `BILLING_`) khỏi danh sách, khỏi số chưa đọc, không hiện khi app đang mở, chạm vào không mở gì.

### Việc mức thấp đã làm

| ID | Đã làm | Commit |
|---|---|---|
| IOS-24 (một phần) | Sentry trên iPhone lấy `ios.buildNumber` làm mã build | `394da33` |
| IOS-29 | iPhone không hỏi quyền thông báo sau khi đăng nhập. Thẻ "Nhắc bạn trước khi việc đến hạn" ở tab Thông báo, nút "Bật thông báo", mới hỏi, rồi ghi token ngay | `14c557c` |
| IOS-30 | Bỏ nút "Đề xuất này không đúng" giả | `f254141` |
| IOS-31 | Gợi ý ở Cài đặt thông báo: "Khi có cuộc họp mới được lên lịch" | `f254141` |
| IOS-35 | Từ chối quyền máy ảnh: hộp thoại trung tính có nút "Mở Cài đặt" (`Linking.openSettings()`) | `0cc5b3b` |
| IOS-36 | `textContentType` và `autoComplete` ở đăng nhập, đăng ký, quên mật khẩu; ô "Mã 6 số" là `oneTimeCode` | `c013903`, `899c8eb` |
| — | App hiện câu của máy chủ khi tài khoản bị khoá, ở màn đăng nhập | `682916e` |

---

## Làm sau: chi tiết các việc còn lại mức thấp

| ID | Việc | Phụ trách | Công sức | Tệp | Nguồn |
|---|---|---|---|---|---|
| IOS-24 | Sentry cho iOS: plugin dSYM, không lưu IP, bỏ chuỗi truy vấn trong breadcrumb | config, mobile | S–M | Thêm plugin `@sentry/react-native/expo` (đổi app.json); bật "Prevent Storing of IP Addresses" trên Sentry; thêm `beforeBreadcrumb` cắt `?query=` | #13, #63 |
| IOS-25 | Gỡ các module native không dùng | config | S | `M package.json`: `expo-glass-effect`, `expo-symbols`, `@expo/ui`, `expo-device`. Kiểm test và mock trước. **Nên gộp vào Đợt 2.** | #15 |
| IOS-26 | Privacy manifest dự phòng | config | S | Chỉ thêm `ios.privacyManifests` nếu Apple gửi email ITMS-91053 sau lần tải lên đầu | #16 |
| IOS-27 | Quy trình OTA khi có hai nền tảng | config | S | Dùng `eas update --platform android` hoặc `--platform ios`, kèm `--environment production`. Trước mỗi lần phát, kiểm vân tay của cả hai nền tảng | #17 |
| IOS-28 | Keychain còn token sau khi gỡ app; màn ẩn không vuốt để quay lại được | mobile | S / M | Đánh dấu "đã cài" bằng AsyncStorage để xoá SecureStore ở lần mở đầu (`M src/lib/auth/token-storage.ts`) | #18 |
| IOS-32 | Push iOS: `badge` và `threadId` | backend | S | `BE src/notifications/expo-push.service.ts` | #48 |
| IOS-33 | Phòng họp Daily đang để công khai | backend, mobile, web | M | `BE src/meetings/meetings.service.ts` đặt `privacy: 'private'` và cấp meeting token; `M src/app/(tabs)/meetings/[id].tsx` mở kèm token | #50 |
| IOS-34 | Hồ sơ thanh toán bị xoá cứng theo tài khoản | backend | S | `BE prisma/schema.prisma` (model `PaymentOrder`): `onDelete: SetNull`, `userId String?`, ẩn danh người mua. **Cần migration.** Hỏi người làm kế toán trước | #51 |

---

## Đăng nhập Apple và Google trên iPhone (SAU-01 … SAU-04)

Mục này trước tên là "Bản sau (1.1)". Ngày 28/09/2026, chủ dự án chốt: bản iPhone đầu tiên có luôn nút Google. App có đăng nhập bên thứ ba thì phải có thêm một cách đăng nhập giữ kín được email (Guideline 4.8), nên Sign in with Apple cũng vào bản này. SAU-01, SAU-02, SAU-03 đã làm, máy chủ đã lên production, và đã thử trên iPhone thật với build 3. SAU-04 còn một phần.

| ID | Việc | Trạng thái | Commit |
|---|---|---|---|
| SAU-01 | Máy chủ: `POST /auth/apple`, thu hồi token Apple khi xoá tài khoản | **Đã làm**, đang chạy trên production | `64a0a5a`, `654db2a`, `0c5fd88`, `6f48987`, `a50a58e`, `b5ab33b`, `e9b556b`, `f7bf282`, `3d24e39` (`ios-backend`, đã gộp vào `backend`) |
| SAU-02 | Mobile: nút "Tiếp tục với Apple" | **Đã làm**, có trong build iOS 3 | `a5cfb2e`, `5db415d`, `b016c3f` (`ios`) |
| SAU-03 | Google trên iPhone | **Đã làm**, có trong build iOS 3 | App `2d1606f`, `336cebb`, `df0c255` (`ios`); máy chủ `654db2a` |
| SAU-04 | Tài khoản Apple dùng trên web; thư tới email chuyển tiếp | **Còn lại** (một phần) | — |
| — | Xoá tài khoản xong về màn Đăng nhập, báo "Đã xoá tài khoản" | **Đã làm** | `2b94b17` (`ios`) |

Phần việc trên tài khoản, **đã xong** ngày 28/09/2026 (chủ dự án làm):

- App ID `vn.wedo.app` đã bật capability **Sign In with Apple**. `app.json` có `ios.usesAppleSignIn: true` (commit `a5cfb2e`).
- Khoá Sign in with Apple: Key ID **`U9G7RAS2LZ`**. Tệp `.p8` do chủ dự án giữ. Không chép nội dung khoá vào tài liệu, mã hay tin nhắn.
- Biến Azure đã đặt trên App Service `api-wedo-backend-dai`: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`, `GOOGLE_IOS_CLIENT_ID`. Mẫu khai ở `BE .env.example` (commit `b5ab33b`).
- Google Cloud, project `alert-rush-501204-b6`: OAuth client loại iOS cho bundle `vn.wedo.app`. Client ID và `iosUrlScheme` không phải bí mật, nằm trong `M src/lib/auth/google-signin.ts` và `M app.json`.

### SAU-01 · Máy chủ: đăng nhập bằng Apple và thu hồi token khi xoá tài khoản · Đã làm

- **Migration** `202609280001_apple_sign_in`: thêm hai cột có thể rỗng trên `User`: `appleSub` (duy nhất) và `appleRefreshToken`. Chỉ thêm, không đổi cột nào. Đã chạy trên production ngày 28/09/2026.
- **`POST /auth/apple`** nhận `identityToken`, `nonce`, và tuỳ chọn `authorizationCode`, `fullName`. Máy chủ kiểm chữ ký token bằng khoá công khai của Apple (`appleid.apple.com/auth/keys`), kiểm `iss`, `aud` là `vn.wedo.app`, hạn dùng, và SHA-256 của nonce. Sai điều nào cũng trả 401 mã `APPLE_TOKEN_INVALID` (`BE src/auth/apple-auth.service.ts`).
- **Tìm tài khoản** theo thứ tự: đã gắn mã Apple (`appleSub`) → tài khoản có cùng email **đã xác minh** (gắn luôn mã Apple) → tạo mới. Email đó đã gắn một Apple ID khác thì trả 409. Tài khoản mới lấy tên Apple đưa ở lần đầu, không có thì đặt **"Người dùng Apple"**. Apple không đưa email thì dùng địa chỉ giữ chỗ `<sub>@apple.invalid`, không nhận thư (`BE src/auth/auth.service.ts`, `timHoacTaoNguoiDungApple`).
- Tài khoản mới để trống mốc đồng ý điều khoản, nên app hiện màn "Điều khoản sử dụng" (18+) một lần, như tài khoản Google mới.
- **Refresh token:** có `authorizationCode` thì máy chủ đổi lấy refresh token ở `appleid.apple.com/auth/token` và lưu vào `User.appleRefreshToken`, **chỉ để thu hồi** khi xoá tài khoản. Log không ghi token (`3d24e39`).
- **Xoá tài khoản:** xoá xong trong cơ sở dữ liệu thì gọi `appleid.apple.com/auth/revoke`. Apple chậm hay lỗi thì ghi log, việc xoá vẫn xong (`BE src/users/users.service.ts`, `thuHoiAppleSauKhiXoa`).
- **Google:** ID token nhận `aud` là client Web (`GOOGLE_CLIENT_ID`) hoặc client iOS (`GOOGLE_IOS_CLIENT_ID`) (`verifyGoogleIdToken`).
- Sửa sau lần đưa lên đầu: đọc được khoá `.p8` dán vào ô một dòng của Azure Portal (`e9b556b`); `nonce: null` không còn gây lỗi 500 (`f7bf282`).

Khác kế hoạch cũ: không có bảng `AuthIdentity` riêng, chỉ hai cột trên `User`; refresh token lưu thẳng trong cột, không mã hoá thêm lớp riêng; không dùng thư viện `jose`.

**Đã kiểm:** test máy chủ cho token sai chữ ký, sai `aud`, hết hạn, lệch nonce; tìm, gắn, tạo tài khoản; thu hồi khi xoá, và Apple lỗi thì vẫn xoá xong (`0c5fd88`, `6f48987`, `a50a58e`). Trên production: `/auth/apple` với token giả trả 401 `APPLE_TOKEN_INVALID`. Trên iPhone thật ngày 28/09/2026: đăng nhập Apple với "Ẩn địa chỉ email" tạo tài khoản có email `…@privaterelay.appleid.com`; xoá tài khoản xong, WeDo biến khỏi Cài đặt → [tên] → Đăng nhập & Bảo mật → Đăng nhập bằng Apple.

### SAU-02 · Mobile: nút "Tiếp tục với Apple" · Đã làm

- Thêm `expo-apple-authentication`, `ios.usesAppleSignIn: true`, `ios.buildNumber` lên `3` (`a5cfb2e`). Việc này đổi vân tay native, nên cần build mới: build iOS 3.
- `M src/lib/auth/apple-signin.ts`: `useCoDangNhapApple()` chỉ trả đúng trên iPhone khi `isAvailableAsync()` báo có. App sinh nonce gốc từ nguồn ngẫu nhiên an toàn, gửi SHA-256 của nó cho Apple, gửi bản gốc lên máy chủ. Xin `FULL_NAME` và `EMAIL`. Ghép họ tên theo thứ tự tiếng Việt. Người dùng đóng bảng Apple thì im lặng, không báo lỗi (`5db415d`).
- `M src/components/ui/AppleButton.tsx`: nút gốc của Apple, kiểu CONTINUE, nền đen, cùng cao và bo tròn như nút Google. Màn Đăng nhập và Đăng ký đặt nút Apple **trước** nút Google (`b016c3f`).
- Không có màn bắt nhập lại tên hay email sau khi đăng nhập Apple. Tên sửa được ở tab Tài khoản.
- Android không có nút Apple.

**Đã kiểm:** test Jest cho nút (iPhone có, Android không), nonce, ghép tên, huỷ giữa chừng. Trên iPhone thật ngày 28/09/2026: nút hiện đúng mẫu của Apple, đăng nhập tạo được tài khoản mới, qua màn Điều khoản 18+, rồi tới màn "Tạo không gian làm việc". Chủ dự án gõ tên không gian "Tốt Nghiệp Drone 9+" ở màn đó; tên này hiện dưới email ở tab Tài khoản, là tên không gian vừa tạo, không phải dữ liệu lạ.

### SAU-03 · Google trên iPhone · Đã làm

- `M src/lib/auth/google-signin.ts`: `GOOGLE_IOS_CLIENT_ID` là client iOS của Google, nhúng cứng trong mã (không phải bí mật). `coDangNhapGoogle()` trả đúng trên iPhone khi đã khai client này (`2d1606f`, `336cebb`).
- `M app.json`: plugin `@react-native-google-signin/google-signin` có `iosUrlScheme` (client ID viết ngược) (`df0c255`). Thiếu nó thì bấm nút là app văng.
- Máy chủ nhận ID token của client iOS (SAU-01).
- Việc này thay IOS-02 (ẩn Google trên iPhone). Đường "Quên mật khẩu?" cho tài khoản Google vẫn chạy, nhưng không còn cần trên iPhone.

**Đã kiểm:** trên iPhone thật ngày 28/09/2026, "Tiếp tục với Google" vào đúng tài khoản Google cũ, qua màn Điều khoản, thấy đủ dự án cũ.

### SAU-04 · Tài khoản Apple dùng trên web, thư tới email chuyển tiếp · Còn lại

- **Web không có nút Apple.** Người tạo tài khoản bằng Apple muốn vào web phải đặt mật khẩu bằng "Quên mật khẩu?", tức là nhận mã qua email.
- **Giới hạn đã biết:** người chọn "Ẩn địa chỉ email" có email dạng `…@privaterelay.appleid.com`. Thư WeDo gửi tới địa chỉ đó (mã đặt lại mật khẩu, thư trả lời từ hộp thư hỗ trợ) **có thể không tới**, trừ khi nơi gửi thư của WeDo đã được đăng ký với Apple ở Certificates, Identifiers & Profiles → Services → **Sign in with Apple for Email Communication**. **Chưa đăng ký.** Tài khoản Apple không có email (`…@apple.invalid`) thì không nhận được thư nào.
- Trong lúc chờ: người đã ẩn email nên tiếp tục đăng nhập bằng nút Apple trên iPhone. Trang Hỗ trợ và Chính sách quyền riêng tư nói điều này (`05`, `07`).
- **Làm gì:** xem `MAIL_FROM` và `MAIL_HOST` thật trên Azure. Nếu gửi từ địa chỉ `@gmail.com` qua Brevo, Apple khó nhận vì không cấu hình được SPF, DKIM cho gmail.com; nên chuyển sang địa chỉ trên tên miền riêng, ví dụ `@wedofpt.com.vn`. Đăng ký tên miền hoặc địa chỉ đó ở mục Services trên, kiểm SPF, DKIM. Rồi gửi thử mã "Quên mật khẩu?" tới một địa chỉ chuyển tiếp.
- **Làm sau:** thêm Sign in with Apple trên web (Services ID cho `wedofpt.com.vn` và `fe-wedo.vercel.app`, máy chủ nhận thêm `aud` đó).
- **Mức:** medium. Không chặn lần nộp đầu: người duyệt dùng tài khoản demo email.

---

## Đợt còn lại và build

Kế hoạch cũ có bốn đợt. Tới ngày 28/09/2026 cả bốn đã xong. Còn lại là thử trên TestFlight, tài khoản demo, ảnh chụp màn hình và nộp.

```text
Đợt 0 (chủ dự án) ──┐
Bước A (máy chủ) ────┼──> Bước B (web) ──> Đợt 2 (cấu hình) ──> Build iOS 1.0.14 (1, rồi 3) + Android 18, 19 ──> TestFlight ──> Nộp
```

**Vì sao tách nhánh và thư mục.** App dùng `runtimeVersion: { policy: "fingerprint" }`. Vân tay băm cấu hình Expo và mã native. Mọi việc iOS làm trên nhánh `ios` trong `D:\WeDo_ChPlay-ios`, còn `main` trong `D:\WeDo_ChPlay` giữ nguyên cho tới khi chủ dự án gộp.

### Đợt 0 — Chủ dự án · Đã xong

- IOS-01: tài khoản Apple Developer đã duyệt (28/09/2026), Team ID `LR53W8386S`. Bản ghi App Store Connect "WeDo: Làm việc nhóm", Apple ID `6816878767`, SKU `wedo-ios`. Khai DSA: không phải trader. Chỉ ký thoả thuận cho app miễn phí.
- Bước A1, A2: migration đã chạy; biến Azure của bản iOS và năm biến Apple, Google đã đặt.
- Khoá Sign in with Apple `U9G7RAS2LZ`, OAuth client iOS của Google (SAU-01 … SAU-03).
- Còn mở: nhà cung cấp AI thật trên Azure và gói Gemini (IOS-08, IOS-09); tên biến EAS (IOS-15); `MAIL_FROM` cho email chuyển tiếp của Apple (SAU-04).

### Đợt 2 — Mobile: cấu hình (`app.json`, `package.json`, `eas.json`) · Đã xong

- IOS-16: `eas.json` có `ascAppId` và `appleTeamId` (`962517f`).
- `fingerprint.config.js` bỏ các trường số phiên bản khỏi vân tay, và giữ bước bỏ qua mặc định cho script `android`/`ios` trong `package.json` (`962517f`, `801c266`).
- Đồng bộ bộ gói Expo SDK 57 để app không văng khi mở (`e2bf08b`).
- Sign in with Apple và Google trên iPhone (`a5cfb2e`, `df0c255`): đổi vân tay native, nên cần build iOS 3.
- Chưa làm: IOS-25 (gỡ module), IOS-24 (plugin Sentry), xoá thư mục `assets/expo.icon`.

### Build và thử

1. Phiên bản `1.0.14` cho cả hai nền tảng. `app.json` trên nhánh `ios` hiện ghi iOS `buildNumber` `3`, Android `versionCode` `19`. Build trong `D:\WeDo_ChPlay-ios`.
2. Build iOS 1.0.14 (1) đã tải lên TestFlight ngày 28/09/2026. Build 3 có nút Apple và Google; đã cài và thử trên iPhone thật ngày 28/09/2026.
3. Gói Free của EAS chỉ có **15 build iOS mỗi tháng**. Gom mọi thay đổi native trước. Sửa JS thì phát OTA từ `D:\WeDo_ChPlay-ios`, **luôn kèm `--platform ios`**: nhánh `ios` có thêm `expo-apple-authentication`, nên vân tay native khác bản Android đang chạy. Không phát OTA nào trong lúc Apple đang duyệt.
4. Chạy hết bảng Chưa kiểm chứng dưới đây trên build sẽ nộp. Mỗi lần build lại thì tăng `ios.buildNumber` (3 → 4 …).
5. Gộp nhánh `ios` vào `main` (Bước D): chủ dự án tự làm.

---

## Chưa kiểm chứng — kiểm trên TestFlight

Những việc dưới đây chỉ kiểm được trên iPhone thật hoặc trên bản build thật. Mã đã có, nhưng chưa ai chạy trên máy.

Bốn phát hiện critic không kiểm trên TestFlight mà kiểm trong App Store Connect: #83 trạng thái trader và #84 loại tài khoản (IOS-01 bước 1 và 6), #88 vùng phát hành (IOS-01 bước 5), #85 bảng câu hỏi xếp hạng tuổi và mức 18+ (`02-thong-tin-app-store.md` mục 14).

| Việc | Vì sao chưa chắc | Cách kiểm | Kết quả đúng |
|---|---|---|---|
| #80 ảnh HEIC (IOS-13) | Đọc mã thư viện, có test Jest, chưa thử trên máy | Chụp bằng Camera ở định dạng Hiệu suất cao, rồi gửi từ thư viện ảnh trong trò chuyện dự án và tin nhắn riêng | Gửi được; web và Android xem được ảnh |
| #89 từ chối máy ảnh (IOS-35) | Chỉ có test Jest | Từ chối quyền máy ảnh, rồi bấm nút chụp ảnh trong trò chuyện | Hộp thoại "Chưa có quyền dùng máy ảnh", nút "Mở Cài đặt" mở đúng trang Cài đặt của WeDo |
| #11 bàn phím (IOS-18) | Mới sửa ba màn, năm màn chưa sửa | Mở từng màn: tạo việc, đăng ký, quên mật khẩu, phiếu báo cáo (đã sửa); tạo cuộc họp, góp ý, thông tin cá nhân, tạo không gian, bảng từ chối việc (chưa sửa) | Ô đang gõ và nút xác nhận không bị che |
| #81 ngôn ngữ hệ thống | Chưa rõ mẫu iOS của Expo mặc định ngôn ngữ gì | Đặt iPhone sang tiếng Việt; nhấn giữ chữ, mở bộ chọn ảnh, bấm "Xong" của trình duyệt trong app | Chữ hệ thống hiện tiếng Việt |
| #82 iPad chế độ tương thích | Chưa ai thử | Cài bản TestFlight lên iPad; đăng nhập, gõ bàn phím, mở bảng trượt | Không vỡ giao diện |
| SAU-02, SAU-03 nút Apple và Google | **Đã thử** trên iPhone thật với build 3 ngày 28/09/2026 | Mở màn Đăng nhập và Đăng ký | Có "Tiếp tục với Apple" (nút của Apple) rồi "Tiếp tục với Google", cùng cỡ. Còn kiểm màn Đăng ký trên build nộp |
| SAU-03 Google trên iPhone | **Đã thử** 28/09/2026 | Bấm "Tiếp tục với Google" bằng tài khoản Google đã có trên web | Vào đúng tài khoản cũ, thấy dự án cũ |
| SAU-01, SAU-02 Apple, ẩn email | **Đã thử** 28/09/2026 | Bấm "Tiếp tục với Apple", chọn "Ẩn địa chỉ email" | Tài khoản mới có email `…@privaterelay.appleid.com`, gặp màn Điều khoản 18+ rồi màn Tạo không gian làm việc |
| SAU-01 thu hồi khi xoá | **Đã thử** 28/09/2026 | Tài khoản Apple ở dòng trên: Tài khoản → Xoá tài khoản; rồi mở Cài đặt → [tên] → Đăng nhập & Bảo mật → Đăng nhập bằng Apple | WeDo không còn trong danh sách |
| `2b94b17` câu "Đã xoá tài khoản" | Chỉ có test Jest | Xoá một tài khoản tạm trên bản có commit này (OTA iOS hoặc build mới) | App báo "Đã xoá tài khoản" rồi về màn Đăng nhập, không kẹt ở "Không tải được thông tin tài khoản." |
| SAU-04 thư tới email chuyển tiếp | Chưa đăng ký nơi gửi thư với Apple | Tài khoản Apple ẩn email: bấm "Quên mật khẩu?" trên màn Đăng nhập | Hiện có thể không nhận được thư. Sau khi đăng ký nơi gửi: nhận được mã |
| IOS-06 ô 18+ và màn đồng ý | Có test với bộ điều hướng thật của Expo Router, chưa thử trên máy | Đăng ký khi chưa đánh dấu ô; rồi đánh dấu và đăng ký. Đăng nhập một tài khoản tạo trên web | Nút Đăng ký tắt khi chưa đánh dấu. Tài khoản web gặp màn "Điều khoản sử dụng", bấm "Đồng ý và tiếp tục" thì vào app |
| IOS-03, IOS-04 báo cáo, chặn, bộ lọc | Test chạy với cơ sở dữ liệu giả | Hai tài khoản: báo cáo, chặn, bỏ chặn; gửi tin có từ phản cảm có dấu và không dấu; đổi họ tên thành từ phản cảm | Báo cáo tới trang quản trị và hộp thư; chặn có tác dụng ngay; từ phản cảm hiện `***` |
| IOS-08 hộp thoại AI | Chỉ có test Jest | Leader nhấn giữ tin, chọn "Tạo công việc bằng AI"; tắt rồi bật công tắc "Cho phép dùng AI" | Hộp thoại hiện trước khi gửi; tắt xong lần sau hỏi lại |
| IOS-20 xoá tệp khi xoá tài khoản | Chưa chạy với Azure Blob thật | Tài khoản tạm gửi ảnh, nộp tệp, rồi xoá tài khoản | Tệp không còn trong container `wedo-chat`; log máy chủ không báo lỗi xoá tệp |
| #10, #47 APNs (IOS-17) | Chưa kiểm khoá APNs trên build thật | Gán một việc cho tài khoản thử; gửi một tin riêng | Có thông báo |
| IOS-29 hỏi quyền thông báo | Hành vi riêng của iOS | Cài mới, đăng nhập | Đăng nhập không hỏi quyền. Thẻ "Nhắc bạn trước khi việc đến hạn" ở tab Thông báo, nút "Bật thông báo", mới hỏi. Sau đó máy chủ có push token `platform: ios` |
| IOS-12 nhắc cập nhật | Phụ thuộc biến trên Azure | Mở app trên TestFlight khi `MOBILE_IOS_*` còn trống | Không có dải nhắc hay màn chặn nào; không có chữ "CH Play" |
| IOS-21 thông báo gói | Chỉ có test | Tài khoản có gói trả phí (không phải tài khoản demo) đăng nhập iPhone | Không thấy thông báo gói hay thanh toán |
| IOS-24 Sentry | Chỉ có test | Gây một lỗi trên bản TestFlight | Sentry ghi đúng số build iOS |
| #16 privacy manifest (IOS-26) | Apple có thể đọc sai tệp gộp | Xem hộp thư sau lần tải lên đầu | Không có email ITMS-91053 |
| #2 biểu tượng, #8 mã hoá, #14 Face ID | Kiểm sau khi build | Xem màn hình chính, trạng thái build, Info.plist trong log EAS | Logo WeDo; không "Missing Compliance"; không có `NSFaceIDUsageDescription` |
| #18 Keychain (IOS-28) | Hành vi riêng của iOS | Đăng nhập, gỡ app, cài lại | Hiện tại sẽ tự đăng nhập lại. Quyết định có giữ hành vi này không |
| #90 tự điền (IOS-36) | Hành vi riêng của iOS | Đăng ký, rồi đăng nhập lại | iOS đề nghị lưu mật khẩu và tự điền lại |

---

## Ngoài phạm vi tài liệu này

Các phát hiện sau không phải sửa mã hay cấu hình. Chúng thuộc các tài liệu khác trong thư mục này.

| Phát hiện | Nội dung | Thuộc về |
|---|---|---|
| #64 | Bản tiếng Anh của chính sách và trang xoá tài khoản | `05-chinh-sach-bao-mat.md` |
| #65 | Phiếu Data safety trên Google Play khai thiếu | `03-app-privacy.md` mục 8 (đồng bộ lại hai nơi) |
| #74 | Chưa có ảnh chụp màn hình iPhone 6.9 inch | `01-tai-khoan-va-build.md` Bước 9 |
| #75 | Chữ quảng cáo trên web nói tới tính năng mà app mobile không có | `02-thong-tin-app-store.md` mục 7 (mô tả app) |
| #79 | Tên "WeDo" trùng với thương hiệu khác | `02-thong-tin-app-store.md` mục 4 (IOS-01 chỉ lo phần tạo bản ghi) |
| #85 (phần trả lời bảng câu hỏi) | Trả lời bảng xếp hạng tuổi | `02-thong-tin-app-store.md` mục 14 (IOS-06 chỉ lo phần mã) |
| #32, #69 (phần chữ) | Chữ ghi chú cho reviewer | `04-thong-tin-cho-reviewer.md` mục 6 |

---

## Bảng đối chiếu 90 phát hiện

| Vùng | Phát hiện → nằm ở |
|---|---|
| ios-config (1–18) | 1 app.json (đã làm) · 2 app.json (đã làm) · 3 IOS-01 · 4 SAU-03 (đã làm) · 5 SAU-02 (đã làm) · 6 IOS-12 · 7 app.json (đã làm) · 8 app.json (đã làm) · 9 IOS-16 · 10 IOS-17 · 11 IOS-18 · 12 IOS-01 · 13 IOS-24 · 14 app.json (đã làm) · 15 IOS-25 · 16 IOS-26 · 17 IOS-27 · 18 IOS-28 |
| review-guidelines (19–36) | 19 SAU-02 (đã làm) · 20 IOS-04 · 21 IOS-03 · 22 IOS-08 · 23 IOS-10 + IOS-06 · 24 IOS-12 · 25 SAU-03 (đã làm) · 26 IOS-11 · 27 IOS-19 · 28 IOS-21 · 29 IOS-22 · 30 IOS-15 + IOS-07 · 31 IOS-23 · 32 IOS-14 · 33 IOS-29 · 34 IOS-30 · 35 IOS-20 · 36 IOS-31 |
| backend (37–52) | 37 SAU-01 (đã làm) · 38 IOS-03 · 39 SAU-01 (đã làm) · 40 IOS-09 · 41 IOS-12 · 42 IOS-21 · 43 IOS-20 · 44 IOS-22 · 45 IOS-19 · 46 SAU-04 (còn lại) · 47 IOS-17 · 48 IOS-32 · 49 SAU-03 (đã làm) · 50 IOS-33 · 51 IOS-34 · 52 IOS-14 |
| privacy-inventory (53–65) | 53 SAU-02 (đã làm) · 54 IOS-08 + IOS-09 · 55 IOS-19 · 56 IOS-10 · 57 IOS-04 + IOS-03 · 58 IOS-10 · 59 IOS-20 · 60 IOS-07 + IOS-06 · 61 IOS-15 · 62 IOS-10 + IOS-09 · 63 IOS-24 · 64 ngoài phạm vi · 65 ngoài phạm vi |
| listing-facts (66–79) | 66 app.json (đã làm) · 67 SAU-02 + SAU-03 (đã làm) · 68 IOS-01 · 69 IOS-14 · 70 IOS-04 + IOS-03 · 71 IOS-08 + IOS-09 · 72 IOS-12 · 73 IOS-11 · 74 ngoài phạm vi · 75 ngoài phạm vi · 76 IOS-07 · 77 IOS-10 · 78 app.json (đã làm) · 79 ngoài phạm vi |
| critic (80–90) | 80 IOS-13 · 81 app.json (đã làm) · 82 app.json (đã làm) · 83 IOS-01 · 84 IOS-01 · 85 IOS-06 · 86 SAU-02 (đã làm) · 87 SAU-04 (còn lại) · 88 IOS-01 · 89 IOS-10 + IOS-35 · 90 IOS-36 |
