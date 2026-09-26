# 01 — Tài khoản Apple, build iOS, TestFlight và nộp duyệt

Tài liệu này dẫn từ con số 0 tới lúc bấm **Submit for Review** cho bản iOS đầu tiên của WeDo.

- Viết cho chủ dự án dùng **Windows** và có **iPhone**, **không có Mac**. Mọi build iOS chạy trên máy chủ EAS của Expo, nên không cần Mac.
- Viết ngày 26/09/2026. Giao diện của Apple, Google và Expo có thể đổi chữ theo thời gian. Thứ tự các bước thì giữ nguyên.
- Lệnh đều viết cho **PowerShell**. Không dùng `&&`. Muốn chạy hai lệnh liền nhau thì xuống dòng hoặc dùng `;`.
- Nội dung trang App Store (mô tả, từ khoá, nhãn quyền riêng tư, ghi chú cho người duyệt…) nằm ở các tài liệu khác trong thư mục `docs/app-store-ios/`. Tài liệu này chỉ lo tài khoản, build và quy trình.

Hai vai trong tài liệu:

- **Chủ dự án (CDA)**: anh Lê Hữu Đại. Làm những việc cần giấy tờ, thẻ, mật khẩu và bấm nút.
- **Lập trình viên (LTV)**: người sửa code và cấu hình trong repo.

---

## Các quyết định đã chốt

Chủ dự án chốt ngày 26/09/2026:

- **Đăng nhập trên iPhone: chỉ email và mật khẩu.** Nút Google bị ẩn trên iPhone. Android và web giữ Google. Vì vậy bản này **không cần Đăng nhập bằng Apple** (Guideline 4.8 chỉ áp dụng khi app có đăng nhập bên thứ ba), và cũng không cần OAuth client iOS của Google. Các bước cho hai việc đó dồn về mục [Bản sau (1.1)](#bản-sau-11) ở cuối tài liệu.
- **Tuổi tối thiểu 18.** Ở App Store Connect, bước Age Rating chọn Override to Higher Age Rating → 18+ (cách làm ở `02-thong-tin-app-store.md` mục 14).
- **DSA của EU: This is not a trader account**, vì chỉ phát hành ở **App Store Việt Nam** (Bước 2.3).
- **Email hỗ trợ và liên hệ: `wedosupport6886@gmail.com`.**
- **Tên trên App Store: "WeDo: Làm việc nhóm"**, vì tên "WeDo" đã có người dùng. Tên dự phòng và SKU `wedo-ios` khớp với `02-thong-tin-app-store.md` (xem Bước 7.1).
- **Có báo cáo, chặn và bộ lọc từ ngữ** cho tin nhắn và tên hiển thị (Guideline 1.2).
- **Mọi việc iOS làm trên nhánh riêng, thư mục riêng**, để bản CH Play và OTA Android trên `main` không bị đụng tới:

| Repo | Thư mục chính, không đụng | Thư mục làm iOS |
|---|---|---|
| Mobile | `D:\WeDo_ChPlay`, nhánh `main` | `D:\WeDo_ChPlay-ios`, nhánh `ios` (commit `dbbd5f0` chứa cấu hình iOS) |
| Máy chủ | `D:\WEDO_PC\BE_WEDO`, nhánh `backend` | `D:\WEDO_PC\BE_WEDO-ios`, nhánh `ios-backend` |
| Web | `D:\WEDO_PC\FE_WEDO`, nhánh `main` | `D:\WEDO_PC\FE_WEDO-ios`, nhánh `ios-web` |

Các dòng dưới đây còn là giả định. Đổi dòng nào thì sửa theo ở các bước liên quan.

> ⚠ Giả định: Đăng ký Apple Developer Program dạng **Cá nhân (Individual)**. Người bán trên App Store là tên pháp lý của chủ dự án, **Lê Hữu Đại**. Phí **99 USD/năm**. Không có công ty đăng ký.
>
> ⚠ Giả định: Bundle ID là **`vn.wedo.app`** (trùng tên gói Android). Phiên bản **1.0.13**, build iOS đầu tiên số **1**.
>
> ⚠ Giả định: Giá **miễn phí**. **Chỉ iPhone** (`supportsTablet: false`). Ngôn ngữ chính **tiếng Việt**.
>
> ⚠ Giả định: **Không có mua trong ứng dụng (IAP)**. App iOS là bản đồng hành miễn phí của dịch vụ web. App không có giao diện mua và không kêu gọi mua ở nơi khác (Guideline 3.1.3(f)).

Đã làm trên nhánh `ios` (chi tiết ở `08-sua-code-truoc-khi-nop.md`, mục Đã làm): **hộp thoại xin đồng ý** trước lần đầu dùng AI (Guideline 5.1.2(i)), báo cáo, chặn, bộ lọc từ ngữ, ô 18+ và màn đồng ý điều khoản, trang pháp lý trên web. Tên trang chính sách là **"Chính sách quyền riêng tư"** ở mọi nơi.

---

## Bức tranh chung

| # | Việc | Ai làm | Cần gì trước |
|---|---|---|---|
| 1 | Bật xác thực hai yếu tố, đăng ký Apple Developer Program | CDA | iPhone, giấy tờ, thẻ Visa/Mastercard |
| 2 | Kiểm tra thoả thuận, khai trạng thái DSA | CDA | Bước 1 được duyệt |
| 3 | Đăng ký Bundle ID `vn.wedo.app` | EAS tự làm, hoặc CDA | Bước 1 |
| 4 | Google trên iPhone: bản này ẩn nút, không phải tạo gì | LTV | — |
| 5 | Kiểm tra biến môi trường EAS | CDA hoặc LTV | Bước 1 |
| 6 | Build iOS trên EAS | CDA hoặc LTV | Bước 3, 5 |
| 7 | Tạo app trên App Store Connect, đẩy build lên | CDA | Bước 3, 6 |
| 8 | Thử trên iPhone qua TestFlight | CDA và nhóm | Bước 7 |
| 9 | Chụp ảnh màn hình | CDA | Bước 8 |
| 10 | Nộp duyệt, phát hành, cập nhật OTA | CDA | Mọi bước trên, cộng nội dung ở các tài liệu khác |

Kế hoạch build:

- **Trước mọi build: đưa máy chủ `ios-backend` rồi web `ios-web` lên production** (`08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên). Mã trên nhánh `ios` gửi trường mới khi đăng ký và gọi đường API mới. Máy chủ cũ từ chối cả yêu cầu đăng ký, nên build nối máy chủ cũ không đăng ký được.
- **Build 1 — thử nội bộ.** Phần mã bắt buộc đã xong trên nhánh `ios`, nên build đầu tiên đã có đủ tính năng nộp duyệt. Thử kỹ qua TestFlight theo Bước 8.
- **Build 2 trở đi — sửa lỗi.** Mỗi lỗi iPhone tìm được ở Build 1 cần build mới (tăng `buildNumber`). Bản đã qua TestFlight sạch lỗi mới bấm Submit for Review.

---

## Bảng giá trị cần ghi lại

Ghi mỗi giá trị vào một chỗ an toàn (ví dụ trình quản lý mật khẩu) ngay khi có.

| Giá trị | Ví dụ hình dạng | Lấy ở đâu | Dùng ở đâu |
|---|---|---|---|
| Apple Account (email) | `ten@...` | Tài khoản Apple của CDA | Đăng nhập App Store Connect, EAS CLI |
| Team ID | 10 ký tự, ví dụ `AB12CD34EF` | developer.apple.com/account → Membership details | `eas.json` (`appleTeamId`) |
| Bundle ID | `vn.wedo.app` | `app.json` → `expo.ios.bundleIdentifier` | Apple Developer, App Store Connect, Google Cloud |
| Tài khoản Expo | tên người dùng Expo | `npx eas-cli whoami` | Mọi lệnh EAS |
| EAS project ID | `69dcbb1c-23f5-47ea-9f56-4a555d4f5a23` | `app.json` → `extra.eas.projectId` | Đã gắn sẵn, không cần làm gì |
| Apple ID của app (ascAppId) | dãy khoảng 10 chữ số | App Store Connect → app → App Information → Apple ID | `eas.json` → `submit.production.ios.ascAppId` |
| Chứng chỉ phân phối, hồ sơ cấp phép, khoá APNs | — | EAS tự tạo ở Bước 6 | Lưu trên EAS, xem bằng `npx eas-cli credentials --platform ios` |
| Khoá App Store Connect API | — | EAS tự tạo ở Bước 7 | Lưu trên EAS, dùng cho `eas submit` |

Tài khoản Expo đang sở hữu project **có thể** là `huudai` (đoán từ tên tệp khoá `@huudai__wedo.jks`, chưa kiểm). Chạy `npx eas-cli whoami` để biết chắc.

---

## Tình trạng cấu hình lúc viết (26/09/2026)

Cấu hình iOS **đã commit** (commit `dbbd5f0`) trên **nhánh riêng `ios`**, mở sẵn ở thư mục **`D:\WeDo_ChPlay-ios`** (một git worktree của cùng repo). Nhánh `main` ở `D:\WeDo_ChPlay` **không có** các thay đổi này: `app.json` trên `main` vẫn chỉ có `"ios": { "icon": "./assets/expo.icon" }` (logo mẫu của Expo, không có Bundle ID). Vì vậy mọi lệnh build, submit và OTA cho iOS đều chạy trong `D:\WeDo_ChPlay-ios`. Lý do tách nhánh nằm ở Bước 6.1.

**Đã có** trên nhánh `ios`, trong `app.json`, khối `expo.ios`:

- `bundleIdentifier: "vn.wedo.app"`
- `buildNumber: "1"`
- `supportsTablet: false`
- `icon: "./assets/images/icon.png"` (logo WeDo, không còn logo mẫu của Expo)
- `config.usesNonExemptEncryption: false` (khỏi phải khai mã hoá bằng tay cho từng build)
- `infoPlist`: `CFBundleDevelopmentRegion: "vi"`, `CFBundleLocalizations: ["vi"]`, `CFBundleAllowMixedLocalizations: true` (hộp thoại hệ thống hiện tiếng Việt), và `NSAppTransportSecurity` chặn tải trang `http` (chỉ cho mạng nội bộ lúc phát triển)

Cùng commit đó còn có:

- `locales/vi.json`: tên dưới biểu tượng `WeDo` và hai câu xin quyền máy ảnh, thư viện ảnh bằng tiếng Việt.
- Plugin `expo-secure-store` đặt `faceIDPermission: false`, bỏ câu xin quyền Face ID tiếng Anh mà app không dùng.
- Câu xin quyền thư viện ảnh nói rõ cả việc chọn ảnh đại diện.

**Mã đã làm** trên nhánh `ios` (26 commit, từ `dbbd5f0` tới `226fc9b`), cùng nhánh `ios-backend` và `ios-web`: ẩn nút Google trên iPhone, báo cáo, chặn, bộ lọc từ ngữ, ô 18+, màn đồng ý điều khoản một lần, hộp thoại đồng ý AI, bốn dòng pháp lý và liên hệ ở tab Tài khoản, kiểm tra phiên bản theo nền tảng (iPhone mở App Store), ảnh HEIC đổi sang JPEG, câu từ chối máy ảnh kiểu iPhone, không hỏi quyền thông báo lúc đăng nhập, ẩn thông báo gói và thanh toán trên iPhone, bàn phím ở màn tạo việc, đăng ký, quên mật khẩu. Bảng đầy đủ ở `08-sua-code-truoc-khi-nop.md`, mục Bảng trạng thái.

**Còn lại** — việc của LTV. Cột cuối nói việc đó phải xong trước build nào.

| Việc | Chỗ trong code | Cần trước |
|---|---|---|
| Khối `submit` trong `eas.json` có `ascAppId` và `appleTeamId` (IOS-16) | `eas.json` trên nhánh `ios` | Lần `eas submit` đầu tiên (cần Bước 7.2) |
| `fingerprint.config.js` bỏ trường số phiên bản khỏi vân tay (Bước 6.1) | gốc repo, nhánh `ios` | Build 1, nếu build Play 18 cùng lúc |
| Tăng `android.versionCode` từ 17 lên 18, nếu build Play cùng commit | `app.json` | Build Play 18 |
| Bàn phím che ô nhập ở năm màn còn lại (IOS-18) | `meetings/new.tsx`, `account/feedback.tsx`, `account/profile.tsx`, `CreateWorkspaceForm.tsx`, `RejectTaskSheet.tsx` | Nên có trước build nộp duyệt |
| Tuỳ chọn: xoá thư mục `assets/expo.icon`, gỡ module không dùng (IOS-25) | `assets/`, `package.json` | Cùng lần đổi cấu hình |

---

## Bước 1. Apple Account và Apple Developer Program

### 1.1 Chuẩn bị

- **iPhone** đã cập nhật iOS mới nhất.
- **Apple Account** (trước gọi là Apple ID) mang **tên thật** của anh. Email nào cũng được, miễn là anh giữ được lâu dài. Đừng dùng email trường, vì ra trường sẽ mất. Tài khoản này sẽ là **Account Holder**, người duy nhất ký thoả thuận và giữ app.
- **Đủ 18 tuổi** (Apple đòi đủ tuổi thành niên theo luật nơi ở).
- **Giấy tờ tuỳ thân có ảnh.** Apple viết: hộ chiếu được nhận ở hầu hết khu vực, một số khu vực nhận thêm giấy tờ khác như bằng lái xe. Apple không công bố danh sách riêng cho Việt Nam. Một bài hướng dẫn tiếng Việt của bên thứ ba (hoanghamobile.com) nói có thể dùng CMND/CCCD hoặc hộ chiếu, nhưng Apple chưa xác nhận điều này. Nếu có hộ chiếu thì chuẩn bị sẵn. Ở bước chụp, ứng dụng sẽ cho biết loại giấy tờ nào được nhận.
- **Thẻ quốc tế (Visa hoặc Mastercard) đứng tên anh**, đã bật thanh toán quốc tế trực tuyến. Thẻ ATM nội địa thường không trả được. Số dư Apple Account (từ thẻ quà tặng) cũng không dùng được. Apple viết: đăng ký cá nhân mà trả bằng thẻ không phải của mình thì hồ sơ bị chậm, và Apple sẽ đòi bản chụp giấy tờ tuỳ thân.
- **Số điện thoại và địa chỉ nhà**. Apple không nhận hòm thư P.O. Box.

### 1.2 Bật xác thực hai yếu tố và kiểm tra tên

Trên iPhone:

1. Mở **Cài đặt**, chạm vào tên anh ở trên cùng.
2. Chạm **Đăng nhập & Bảo mật** (Sign-In & Security).
3. Dòng **Xác thực hai yếu tố** (Two-Factor Authentication) phải ghi **Bật**. Nếu chưa bật thì chạm vào và làm theo hướng dẫn. Tài khoản tạo gần đây thường đã bật sẵn.
4. Quay lại, chạm **Thông tin cá nhân** (Personal Information) → **Tên**. Họ và tên phải là tên pháp lý, không biệt danh.

> ⚠ Giả định: cách viết tên. Nên nhập **đúng như trên giấy tờ sẽ chụp** để Apple đối chiếu được. Nếu hộ chiếu của anh in tên không dấu (ví dụ Họ `LE`, Tên `HUU DAI`), thì nhập không dấu. Khi đó tên người bán trên App Store nhiều khả năng cũng không dấu. Nếu dùng CCCD có dấu thì nhập có dấu (Họ `Lê`, Tên `Hữu Đại`). Chữ chính xác Apple ghi làm tên người bán sẽ hiện ở **Membership details** sau khi duyệt. Tên người bán không tự đổi được về sau.

### 1.3 Đăng ký qua ứng dụng Apple Developer trên iPhone

Apple cho đăng ký cả trong ứng dụng Apple Developer lẫn trên web. Trong ứng dụng thì chụp giấy tờ ngay trên máy, nên nhanh hơn. Tên nút dưới đây ghi theo bản tiếng Anh; nếu ứng dụng hiện tiếng Việt thì tìm nút tương ứng.

1. Mở App Store, cài ứng dụng **Apple Developer** (nhà phát triển: Apple).
2. Mở ứng dụng, chọn tab **Account**, bấm **Sign In**. Đăng nhập bằng Apple Account ở 1.2.
3. Nếu hiện **Apple Developer Agreement**, đọc rồi bấm **Agree**.
4. Bấm **Enroll Now**. Đọc phần giới thiệu, bấm **Continue**.
5. Nhập họ, tên pháp lý và số điện thoại. Apple ghi rõ: tên này sẽ là tên người bán trên App Store.
6. Làm theo hướng dẫn để **chụp giấy tờ tuỳ thân**.
7. Xem lại thông tin, bấm **Continue**. Ở loại tư cách (entity type), chọn **Individual**.
8. Đọc **Apple Developer Program License Agreement**, bấm đồng ý.
9. Xem giá gói năm (hiện bằng tiền địa phương), bấm **Subscribe**, xác nhận bằng Face ID hoặc mật khẩu. Tiền trừ vào phương thức thanh toán của Apple Account.

Gói mua qua ứng dụng là **gói đăng ký tự gia hạn hằng năm**. Xem hoặc huỷ ở **Cài đặt → [tên anh] → Đăng ký** (Subscriptions). Phí không được hoàn.

### 1.4 Nếu ứng dụng không cho đăng ký

Ví dụ: không thấy nút **Enroll Now**, hoặc giấy tờ bị từ chối.

1. Trên máy tính, mở `https://developer.apple.com/programs/enroll/`, bấm **Start your enrollment**.
2. Đăng nhập cùng Apple Account. Chọn **Individual**. Điền thông tin như trên.
3. Trả phí bằng thẻ **của chính anh**.
4. Nếu kẹt, liên hệ Apple tại `https://developer.apple.com/contact/`, ghi kèm **Enrollment ID** (mã hồ sơ đăng ký), rồi làm theo hướng dẫn của họ.

### 1.5 Sau khi được duyệt

- Apple gửi email xác nhận sau khi xử lý thanh toán. Apple nói: nếu **sau 24 giờ** kể từ lúc mua mà chưa có email xác nhận thì liên hệ Apple.
- Mở `https://developer.apple.com/account`, vào **Membership details**. Kiểm tra:
  - **Entity Type**: Individual.
  - **Team ID**: 10 ký tự. Ghi lại vào bảng giá trị.
  - Tên hiển thị làm người bán, ngày hết hạn.
- Nếu gói hết hạn mà không gia hạn, app sẽ bị gỡ khỏi App Store. Nên bật nhắc lịch trước ngày gia hạn một tuần để chắc thẻ còn tiền.

### 1.6 Cho thành viên nhóm vào (không chia sẻ mật khẩu)

Không đưa mật khẩu Apple Account cho ai. Mã hai yếu tố chỉ gửi về iPhone của anh, nên người khác đăng nhập lần nào cũng phải chờ anh đọc mã. Tài khoản này còn giữ thẻ thanh toán và mọi thông tin cá nhân của anh.

Thay vào đó, mời từng người làm **user** trên App Store Connect:

1. Mở `https://appstoreconnect.apple.com`, vào **Users and Access** (Người dùng và quyền truy cập).
2. Bấm dấu **+**. Nhập họ tên, email của người đó.
3. Chọn vai trò: **App Manager** cho người lo trang App Store, **Developer** cho LTV, **Marketing** cho người lo nội dung.
4. Bấm **Invite**. Người được mời bấm link trong email để nhận lời mời.

Người đã là user thì mới vào được nhóm thử nội bộ của TestFlight (Bước 8).

Về phía Expo: một khi EAS đã tạo chứng chỉ (Bước 6), thành viên trong tài khoản Expo build iOS được mà không cần đăng nhập Apple.

---

## Bước 2. Thoả thuận, thuế, ngân hàng và DSA

### 2.1 Thoả thuận cho app miễn phí

Apple viết: tham gia Apple Developer Program là được phân phối app miễn phí theo **Apple Developer Program License Agreement**. Thoả thuận cho app miễn phí (Free Apps) nằm sẵn trong thoả thuận này, mà anh đã đồng ý ở Bước 1. Không cần ký thêm gì cho app miễn phí.

Kiểm tra:

1. Mở `https://appstoreconnect.apple.com`, đăng nhập.
2. Bấm **Business** (Kinh doanh) ở thanh trên cùng, chọn tab **Agreements**.
3. Nếu có thông báo yêu cầu xem thoả thuận mới (thường là bản cập nhật của Apple Developer Program License Agreement), Account Holder đọc rồi đồng ý. Chưa đồng ý bản mới thì App Store Connect có thể chặn việc tạo app hoặc nộp duyệt.

### 2.2 Không cần thuế và ngân hàng

- **Không** ký **Paid Apps Agreement**.
- **Không** khai biểu mẫu thuế.
- **Không** khai tài khoản ngân hàng.

Ba thứ này chỉ cần khi bán app hoặc có mua trong ứng dụng.

> ⚠ Giả định: không có IAP. Nếu sau này thêm IAP thì phải làm đủ cả ba thứ trên trước.

### 2.3 Trạng thái thương nhân theo Đạo luật Dịch vụ số của EU (DSA)

**Có phải khai không, khi chỉ phát hành ở Việt Nam?** **Có, vẫn phải khai.** Apple viết rõ: kể cả khi không phân phối app ở EU, anh vẫn phải khai trạng thái thương nhân (trader). Nếu chưa khai, App Store Connect sẽ hỏi ở lần nộp app mới đầu tiên.

**Chọn bên nào.** Cũng trên trang đó, Apple viết: nếu anh chỉ phát hành trên App Store **ở ngoài EU** thì anh **không hoạt động như thương nhân** trên App Store. Bản đầu chỉ phát hành ở Việt Nam, nên chọn **This is not a trader account**. Chọn bên này thì không phải nhập thông tin liên hệ, và không có thông tin cá nhân nào bị công bố.

Đã chốt: khai **This is not a trader account**, vì bản này chỉ phát hành ở Việt Nam. `02-thong-tin-app-store.md` mục 17.2 và `08-sua-code-truoc-khi-nop.md` (IOS-01 bước 6) ghi cùng một lựa chọn. Web có bán gói trả phí, nhưng hướng dẫn DSA của Apple nói rõ: chỉ phát hành ngoài EU thì không phải thương nhân trên App Store. Chọn "trader" lúc này còn kéo theo việc phải khai tài khoản thanh toán (ngân hàng) và nộp giấy tờ chứng minh địa chỉ, dù app miễn phí.

**Khai ở đâu** (cần vai trò Account Holder hoặc Admin):

1. App Store Connect → **Business** → tab **Agreements**.
2. Cuộn xuống phần **Compliance**. Cạnh **Digital Services Act**, bấm **Complete Compliance Requirements**.
3. Chọn **This is not a trader account**, bấm **Done**.

**Nếu sau này mở bán ở EU**, phải xét lại. Apple gợi ý xét các yếu tố: app có đem lại doanh thu không, có quảng cáo hay hoạt động thương mại với người dùng không, có đăng ký thuế VAT không, có làm việc này như một nghề không. WeDo bán gói trả phí trên web (qua PayOS), nên khi đó nhiều khả năng là thương nhân. Với tài khoản cá nhân, khai **This is a trader account** nghĩa là:

- Phải nhập **địa chỉ (hoặc hòm thư P.O. Box), số điện thoại, email**. Ba thứ này **hiện công khai** trên trang App Store ở 27 nước EU.
- Apple bắt xác minh email và số điện thoại bằng mã, rồi tải lên giấy tờ chứng minh tên và địa chỉ. Dùng hòm thư P.O. Box thì cần thêm giấy tờ cho thấy anh gắn với hòm thư đó (ví dụ hoá đơn).
- Phải có thông tin tài khoản thanh toán trong App Store Connect.
- Nên dùng số điện thoại công việc và hòm thư P.O. Box thay vì địa chỉ nhà.

Muốn đổi trạng thái cho riêng một app: **Apps** → chọn app → **App Information** → phần **App Store Regulations and Permits** → **Digital Services Act** → **Edit**.

---

## Bước 3. Đăng ký Bundle ID `vn.wedo.app`

Bundle ID là tên định danh của app trên hệ Apple. Sau khi đã tải build lên App Store Connect thì **không đổi được nữa**.

App cần một năng lực (capability):

- **Push Notifications**: để nhận thông báo đẩy. Plugin `expo-notifications` tự thêm quyền `aps-environment` vào app.

Bản này **không** cần **Sign In with Apple**, vì iPhone chỉ đăng nhập bằng email và mật khẩu. Khi nào làm, xem mục [Bản sau (1.1)](#bản-sau-11).

### Cách A — để EAS tự làm (khuyên dùng)

Không phải làm gì ở bước này. Ở lần build iOS đầu tiên (Bước 6), sau khi anh đăng nhập Apple trong EAS CLI:

- EAS tự đăng ký Bundle ID `vn.wedo.app` lên tài khoản Apple Developer.
- EAS tự bật các năng lực mà app khai trong quyền (entitlements). Tài liệu Expo: EAS Build đồng bộ năng lực trên Apple Developer Console với cấu hình quyền của app mỗi lần chạy `eas build`.

Lưu ý: EAS cũng **tắt** năng lực nào đang bật trên Apple mà app không khai. Nếu tự tay bật thêm gì trên web mà app không dùng, lần build sau sẽ tắt đi.

### Cách B — tự tay trên developer.apple.com

Dùng khi muốn giữ chỗ Bundle ID ngay, trước khi build.

1. Mở `https://developer.apple.com/account`, vào **Certificates, IDs & Profiles**.
2. Chọn **Identifiers** ở cột trái, bấm dấu **+**.
3. Chọn **App IDs**, bấm **Continue**. Chọn **App**, bấm **Continue**.
4. **Description**: `WeDo`. Ô này chỉ nhận chữ, số và khoảng trắng.
5. **Bundle ID**: chọn **Explicit**, nhập `vn.wedo.app`.
6. Trong danh sách **Capabilities**, đánh dấu **Push Notifications**. Không đánh dấu thêm gì: năng lực nào app không khai thì lần build sau EAS cũng tắt đi.
7. Bấm **Continue**, rồi **Register**.

Nếu Apple báo `vn.wedo.app` không dùng được (đã có người đăng ký):

- Chọn tên khác, ví dụ `vn.wedofpt.app`.
- Báo LTV sửa `expo.ios.bundleIdentifier` trong `app.json`.
- Dùng tên mới ở mọi chỗ: bản ghi App Store Connect (Bước 7), và các việc ở mục Bản sau (1.1) nếu làm.
- Tên gói Android vẫn giữ `vn.wedo.app`.

---

## Bước 4. Google trên iPhone: ẩn ở bản này

Đã chốt: bản iPhone đầu tiên **không có** nút **Tiếp tục với Google**. Đã làm trên nhánh `ios` (commit `c013903`, `682916e`, `899c8eb`): nút và dòng "hoặc" ẩn trên iPhone, và app không gọi SDK Google trên iPhone (`08-sua-code-truoc-khi-nop.md`, IOS-02). Android và web vẫn giữ Google.

Vì vậy ở bản này anh **không** phải:

- tạo OAuth client iOS trên Google Cloud;
- khai biến `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`;
- sửa dòng plugin Google Sign-In trong `app.json`.

Lý do chọn cách này:

- Guideline 4.8 chỉ áp dụng khi app có đăng nhập bằng dịch vụ bên thứ ba. App iPhone chỉ còn email và mật khẩu của WeDo, nên không cần Đăng nhập bằng Apple.
- Nếu để nút Google mà chưa có client iOS, nút sẽ **hỏng trên mọi iPhone** (thư viện báo lỗi khi thiếu cả `GoogleService-Info.plist` lẫn `iosClientId`), và người duyệt bấm là thấy lỗi.

**Người đã đăng ký bằng Google trên web hoặc Android** vẫn dùng được iPhone. Trên màn Đăng nhập, họ bấm **Quên mật khẩu?**, nhập đúng địa chỉ Gmail, nhận mã 6 số qua email và đặt mật khẩu mới. Sau đó đăng nhập bằng email và mật khẩu đó. Máy chủ tìm tài khoản theo email, không phân biệt cách đăng ký, nên đường này chạy được mà không phải sửa máy chủ (đã đối chiếu mã, xem IOS-02). Trên web và Android, họ vẫn bấm Google như cũ.

Khi muốn bật lại Google trên iPhone: làm theo mục [Bản sau (1.1)](#bản-sau-11), và phải làm Đăng nhập bằng Apple trong cùng bản.

---

## Bước 5. EAS: kiểm tra biến môi trường

Tệp `.env` nằm trong `.gitignore`, nên EAS **không** nhận được nó. Build trên EAS lấy biến `EXPO_PUBLIC_*` từ môi trường **production** của EAS. Hồ sơ `production` trong `eas.json` đã đặt `"environment": "production"`. Biến EAS dùng chung cho cả Android và iOS.

### 5.1 Xem biến đang có

Mở PowerShell ở thư mục `D:\WeDo_ChPlay-ios`. Biến EAS thuộc project trên EAS, không thuộc nhánh git, nên chạy ở `D:\WeDo_ChPlay` cũng ra cùng kết quả. Dùng thư mục iOS cho quen tay:

```powershell
npx eas-cli whoami
npx eas-cli env:list --environment production
```

Muốn thấy cả giá trị đang ẩn (loại sensitive):

```powershell
npx eas-cli env:list --environment production --include-sensitive
```

Lệnh `env:list` mặc định chỉ liệt kê biến cấp project. Nếu có biến khai ở cấp tài khoản, thêm `--scope account` để xem.

### 5.2 So với bảng này

| Biến | Bắt buộc? | Thiếu thì sao |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | Có | App báo "Thiếu EXPO_PUBLIC_API_BASE_URL", không đăng nhập được (`src/lib/api/client.ts:103`) |
| `EXPO_PUBLIC_PRIVACY_URL` | Không bắt buộc nữa | Trên nhánh `ios`, mã dùng địa chỉ dự phòng `https://wedofpt.com.vn/privacy.html` (`src/lib/legal-links.ts`), nên dòng "Chính sách quyền riêng tư" luôn hiện. Nếu biến có trên EAS thì biến thắng, nên đặt đúng `https://wedofpt.com.vn/privacy.html` |
| `EXPO_PUBLIC_WEB_URL` | Không cần cho iPhone | Chỉ dùng cho nút "Xem đầy đủ trên web" ở Bảng đóng góp, mà nút này đã ẩn trên iPhone. Android vẫn dùng |
| `EXPO_PUBLIC_SENTRY_DSN` | Nên có | App vẫn chạy, nhưng lỗi trên iPhone không gửi về Sentry |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Không | Code dùng giá trị dự phòng có sẵn (`google-signin.ts:29`). Chỉ Android dùng, vì nút Google ẩn trên iPhone |
| `GOOGLE_SERVICES_JSON` | Chỉ Android | iOS không dùng |

Các biến này đã chạy cho các build Android production, nên nhiều khả năng đã có sẵn. Bản iOS này **không cần biến EAS mới**. Điều khoản sử dụng và trang hỗ trợ dùng đường dẫn cố định trong mã. Biến `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` chỉ cần khi bật lại Google trên iPhone (mục Bản sau). Biến mới của máy chủ (`REPORT_NOTIFY_EMAIL`, `MOBILE_IOS_*`) đặt trên Azure, không phải EAS (`08`, Bước A2).

### 5.3 Thêm biến còn thiếu

Nếu thiếu biến nào trong bảng 5.2, thêm bằng `env:set`, ví dụ:

```powershell
npx eas-cli env:set --name EXPO_PUBLIC_PRIVACY_URL --value "https://wedofpt.com.vn/privacy.html" --environment production --visibility plaintext
```

Dùng `plaintext` vì đường dẫn này không phải bí mật, và mọi biến `EXPO_PUBLIC_*` đều bị nhúng thẳng vào app. Lệnh cũ `env:create` vẫn chạy nhưng đã bị đánh dấu lỗi thời; `env:set` vừa tạo mới vừa sửa được.

Tệp `.env` trên máy LTV hiện đặt `EXPO_PUBLIC_PRIVACY_URL` là `https://fe-wedo.vercel.app/privacy.html`. Cả hai địa chỉ đều mở được (kiểm ngày 26/09/2026). Nên dùng tên miền chính thức `wedofpt.com.vn`, và dùng cùng địa chỉ đó ở ô Privacy Policy URL trong App Store Connect.

---

## Bước 6. Build iOS trên EAS

### 6.1 Trước khi build

- [ ] Máy chủ `ios-backend` và web `ios-web` **đã chạy trên production** (`08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên). Chưa thì dừng, không build.
- [ ] `app.json` có đủ khối `expo.ios` như mục "Tình trạng cấu hình" ở trên.
- [ ] Biến môi trường đủ (Bước 5).
- [ ] Các việc ở bảng "Còn lại" cần cho build này đã xong.
- [ ] Nếu là build thứ hai trở đi: **tăng `expo.ios.buildNumber`** trong `app.json` (`"1"` → `"2"` → …). App Store Connect từ chối build trùng cặp phiên bản 1.0.13 + số build.

**⚠ Cảnh báo vân tay OTA — đọc kỹ, ảnh hưởng cả bản Android đang chạy.**

**Vì sao làm iOS ở thư mục riêng.** Bất kỳ thay đổi nào trong `app.json`, kể cả chỉ trong khối `ios`, cũng làm đổi vân tay Android khỏi `82cd990037afe065754c48a9a004f293c0d84be9`, vân tay của bản 17 đang chạy trên CH Play. OTA phát từ code có vân tay khác sẽ không tới được máy Android đang cài bản 17. Vì vậy `main` ở `D:\WeDo_ChPlay` giữ nguyên để phát OTA cho Android, còn mọi việc iOS (build, submit, OTA iOS) làm trên nhánh `ios` ở `D:\WeDo_ChPlay-ios` cho tới khi gộp.

App dùng `runtimeVersion: { policy: "fingerprint" }`. Vân tay của **mỗi** nền tảng băm **toàn bộ** cấu hình Expo, gồm cả khối `ios`, khối `android`, `version`, `versionCode` và `buildNumber` (`node_modules/@expo/fingerprint/build/sourcer/Expo.js:78-84`). Mặc định không bỏ qua trường nào trong số đó.

Hệ quả:

1. Khối `ios` mới thêm vào `app.json` trên nhánh `ios` đã làm **đổi vân tay Android**. Tính tại máy ngày 26/09/2026, trên commit `dbbd5f0` của nhánh này:
   - Android: `8c93369774e4b253eebaecc7d9009897db19b8fa`, **khác** vân tay của bản 17 trên Play (`82cd990037afe065754c48a9a004f293c0d84be9`).
   - iOS: `729d4b64f026c80523dea986eef98bb0592a639c`. Các commit sau `dbbd5f0` trên nhánh `ios` chỉ sửa JS, không sửa cấu hình. Con số này sẽ đổi tiếp khi LTV sửa `eas.json`, thêm `fingerprint.config.js` hay gỡ module native (Đợt 2 của `08-sua-code-truoc-khi-nop.md`). Tính lại trước khi build.

   Nghĩa là: bản OTA đẩy từ nhánh `ios` **sẽ không tới** máy Android đang cài bản 17. Nhánh `main` chưa có khối `ios`, nên OTA đẩy từ `main` vẫn tới bản 17 như cũ. Khi gộp nhánh iOS vào `main`, Android cần **build mới** (versionCode 18) thì mới nhận OTA tiếp. Commit `dbbd5f0` cũng ghi rõ điều này.
2. Về sau, mỗi lần tăng `ios.buildNumber` sẽ làm lệch vân tay Android, và ngược lại mỗi lần tăng `versionCode` sẽ làm lệch vân tay iOS.

Khuyến nghị cho LTV, làm **một lần** trên nhánh `ios`, cùng Đợt 2 của `08-sua-code-truoc-khi-nop.md`: tạo tệp `fingerprint.config.js` ở gốc repo, bỏ các trường phiên bản ra khỏi vân tay:

```js
const { SourceSkips } = require('expo/fingerprint');

/** @type {import('expo/fingerprint').Config} */
module.exports = {
  sourceSkips: SourceSkips.ExpoConfigVersions,
};
```

`ExpoConfigVersions` bỏ `version`, `android.versionCode` và `ios.buildNumber` khỏi vân tay (`Expo.js:99-103`). Đã thử ở máy: `require('expo/fingerprint')` có xuất `SourceSkips`, và `@expo/fingerprint` đọc đúng tên tệp `fingerprint.config.js`. Tệp này cũng đổi vân tay một lần nữa. Nên làm trước khi build Android 18 và build iOS nộp duyệt, rồi build **cả hai từ cùng một commit**.

Lưu ý: tệp này chỉ bỏ các trường **số phiên bản**. Mọi thay đổi khác trong `app.json` (kể cả trong khối `ios`, ví dụ thêm plugin hay quyền) vẫn đổi vân tay của cả hai nền tảng.

Kiểm vân tay trước mỗi build. Chạy trong thư mục của nhánh cần kiểm: `D:\WeDo_ChPlay-ios` cho iOS và cho bản Play mới, `D:\WeDo_ChPlay` cho bản Play đang chạy. Hai lệnh dưới đây in thẳng vân tay:

```powershell
(npx expo-updates fingerprint:generate --platform ios | ConvertFrom-Json).hash
(npx expo-updates fingerprint:generate --platform android | ConvertFrom-Json).hash
```

Lệnh gốc in một dòng JSON rất dài; `ConvertFrom-Json` lấy ra trường `hash`. So giá trị này với runtime version trên trang build của EAS.

### 6.2 Chạy lệnh build

```powershell
cd D:\WeDo_ChPlay-ios
git branch --show-current
npx eas-cli whoami
npx eas-cli build --platform ios --profile production
```

- `git branch --show-current` phải in `ios`. Nếu lỡ chạy trong `D:\WeDo_ChPlay` (nhánh `main`), build sẽ hỏng vì thiếu Bundle ID.
- Thư mục `D:\WeDo_ChPlay-ios` đã có `node_modules`. Nếu sau này xoá hoặc đổi `package.json`, chạy `npm ci` trong thư mục đó trước khi build.
- Nếu `whoami` báo chưa đăng nhập thì chạy `npx eas-cli login` trước.

Hồ sơ `production` không có khối `ios` riêng. Không sao: với iOS, mặc định là bản phân phối qua App Store (store), và build dùng kênh OTA `production`.

### 6.3 Trả lời các câu hỏi của EAS

Lần đầu, EAS CLI hỏi lần lượt. Chữ trên màn hình là tiếng Anh.

| EAS hỏi | Trả lời |
|---|---|
| `Do you want to log in to your Apple account?` | `Y` |
| `Apple ID:` | Email Apple Account của anh |
| `Password (for ...):` | Mật khẩu Apple Account |
| Mã xác minh 6 chữ số | Mã hiện trên iPhone của anh |
| Chọn team (nếu có nhiều team) | Team của anh, loại Individual |
| Tạo chứng chỉ phân phối (Distribution Certificate) | Đồng ý. EAS tự tạo |
| Tạo hồ sơ cấp phép (Provisioning Profile) | Đồng ý. EAS tự tạo |
| `Would you like to set up Push Notifications for your project?` | **Yes**. EAS tạo khoá APNs. Không chọn "No, don't ask again", vì lựa chọn đó ghi `promptToConfigurePushNotifications: false` vào `eas.json` và tắt câu hỏi này cho mọi lần sau |

Trong log sẽ có các dòng báo đã đăng ký Bundle ID và đã đồng bộ năng lực (Bước 3, cách A).

Về an toàn: EAS CLI dùng phiên đăng nhập Apple trên máy anh để nói chuyện với Apple. Thứ được lưu lên máy chủ EAS là **chứng chỉ, hồ sơ cấp phép và khoá push**. Sau khi đã có ba thứ này, các lần build sau không cần đăng nhập Apple nữa.

Khoá APNs lưu trên EAS. Dịch vụ đẩy của Expo dùng khoá này để gửi thông báo tới iPhone. **Máy chủ WeDo không cần cấu hình APNs gì thêm.** Mã đẩy hiện tại đã gửi `sound: 'default'` (`BE_WEDO/src/notifications/expo-push.service.ts:69`), và máy chủ nhận `platform` là chuỗi tự do nên chấp nhận `ios` (`BE_WEDO/src/notifications/dto/register-push-token.dto.ts:19`).

Xem lại mọi thứ đã tạo:

```powershell
npx eas-cli credentials --platform ios
```

### 6.4 Thời gian và hàng đợi

- Gói Free của Expo có **15 build iOS mỗi tháng**, chạy ở **hàng đợi ưu tiên thấp**. Expo cảnh báo giờ cao điểm có thể phải chờ **90 phút trở lên**.
- Mỗi build trên gói Free bị cắt sau **45 phút** chạy máy.
- Build iOS của một app Expo cỡ WeDo thường chạy **khoảng 20–40 phút** (ước lượng), cộng thời gian chờ hàng.
- Khi lệnh đã tải dự án lên và in ra link trang build trên expo.dev, anh có thể đóng cửa sổ PowerShell. Build vẫn chạy trên EAS. Theo dõi ở link đó.
- Ngân sách gợi ý cho đợt đầu: khoảng 5 build (1 thăm dò, 1 nộp duyệt, 2–3 lần sửa sau khi bị từ chối). Vẫn dư so với 15.

Kết quả là tệp `.ipa`. Tệp này **không cài thẳng lên iPhone được** (bản store). Phải đi qua TestFlight ở Bước 7–8.

### 6.5 Lỗi hay gặp

| Triệu chứng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Báo thiếu `ios.bundleIdentifier` | Đang chạy lệnh trong `D:\WeDo_ChPlay` (nhánh `main`), nơi `app.json` chưa có khoá này. `app.config.js` là cấu hình động nên EAS không tự ghi vào được | Chạy lại trong `D:\WeDo_ChPlay-ios` (nhánh `ios`) |
| Lỗi chứng chỉ hoặc hồ sơ cấp phép sau khi tự bật năng lực trên web | Hồ sơ cũ không khớp năng lực mới | Chạy `npx eas-cli credentials --platform ios`, chọn hồ sơ `production`, xoá Provisioning Profile, build lại |
| Build bị cắt ở phút 45 | Giới hạn thời gian chạy của gói Free (không tính thời gian chờ hàng) | Build lại một lần. Nếu vẫn bị cắt, nâng gói Starter tạm một tháng (giới hạn 2 giờ mỗi build) |
| Runtime version trên trang build EAS khác vân tay tính ở máy | Máy có thư mục native sinh ra (`android` hoặc `ios`, đều nằm trong `.gitignore`), hoặc `node_modules` lệch với `package-lock.json` | So hai vân tay theo 6.1. Nếu có thư mục `android` hoặc `ios` ở máy: `Remove-Item -Recurse -Force android` (hoặc `ios`), rồi `npm ci` |

---

## Bước 7. Tạo app trên App Store Connect và đẩy build lên

### 7.1 Tạo bản ghi app (làm tay, trước khi submit)

Nên tạo bằng tay. Nếu để `eas submit` tự tạo, nó lấy tên `WeDo` từ `app.json` (đã có người dùng) và không chọn tiếng Việt làm ngôn ngữ chính.

Cần Bundle ID đã đăng ký (Bước 3 hoặc sau Build 1). Nếu ô Bundle ID trống, quay lại Bước 3.

1. Mở `https://appstoreconnect.apple.com`, chọn **Apps**.
2. Bấm dấu **+** ở góc trên bên trái, chọn **New App**.
3. Điền:

| Ô | Điền | Ghi chú |
|---|---|---|
| **Platforms** | `iOS` | |
| **Name** | `WeDo: Làm việc nhóm` | 19/30 ký tự. Xem tên dự phòng bên dưới |
| **Primary Language** | `Vietnamese` | Ngôn ngữ dự phòng cho mọi nội dung trang App Store. Chọn đúng từ đầu cho đỡ rắc rối |
| **Bundle ID** | Dòng có `vn.wedo.app` | |
| **SKU** | `wedo-ios` | 8 ký tự. Mã nội bộ, người dùng không thấy, **không đổi được** sau này. Trùng với `02-thong-tin-app-store.md` |
| **User Access** | `Full Access` | |

4. Bấm **Create**. App hiện trong danh sách với trạng thái **Prepare for Submission**.

Tên app phải là duy nhất trên App Store. Tra iTunes Search API ngày 26/09/2026: đã có một app tên đúng là **"WeDo"** (id6757289093, của nhà phát triển khác) và **"WeDo: Shared To-Do & Planner"** (id1460380962), cả hai đều có ở App Store Việt Nam. Dùng tên khuyên dùng trước. Nếu Apple báo tên đã có người dùng, thử lần lượt hai tên dự phòng. Thứ tự giống hệt `02-thong-tin-app-store.md` mục 4:

```text
WeDo: Làm việc nhóm
```
(19/30 ký tự)

```text
WeDo Team: Việc nhóm & Chat
```
(27/30 ký tự)

```text
WeDo - Bài tập nhóm sinh viên
```
(29/30 ký tự)

Đổi sang phương án 2 hoặc 3 thì phải sửa theo từ khoá và phụ đề ở `02-thong-tin-app-store.md`, mục 4.

Tên dưới biểu tượng trên màn hình chính vẫn là **WeDo** (`expo.name` trong `app.json` và `CFBundleDisplayName` trong `locales/vi.json`). Không cần đổi.

Đã chốt: dùng tên "WeDo: Làm việc nhóm". Tên sửa được về sau, nhưng chỉ đổi được khi nộp một phiên bản mới.

### 7.2 Lấy ascAppId và báo LTV sửa `eas.json`

1. Trong app vừa tạo, cột trái chọn **App Information**.
2. Ở phần **General Information**, dòng **Apple ID** là một dãy số. Đó là **ascAppId**. Ghi lại.
3. LTV sửa khối `submit` trong `eas.json` (hiện là `"production": {}`), trên nhánh `ios` trong `D:\WeDo_ChPlay-ios`. Không sửa trên `main`, vì `eas.json` cũng nằm trong vân tay Android:

```json
"submit": {
  "production": {
    "ios": {
      "ascAppId": "<DÃY SỐ APPLE ID CỦA APP>",
      "appleTeamId": "<TEAM ID>"
    }
  }
}
```

Có `ascAppId` thì `eas submit` bỏ qua bước tự tạo app, và chạy được cả ở chế độ `--non-interactive`.

### 7.3 Đẩy build lên App Store Connect

Chạy trong thư mục iOS, nơi `eas.json` có `ascAppId`:

```powershell
cd D:\WeDo_ChPlay-ios
npx eas-cli submit --platform ios --latest
```

`--latest` lấy build iOS mới nhất trên EAS.

EAS cần quyền đẩy lên App Store Connect. Có hai cách.

**Cách 1 — khoá App Store Connect API (khuyên dùng).** Lần đầu, EAS có thể hỏi `Select the App Store Connect Api Key to use for your project:`. Chọn dòng **`[Add a new key]`** (tạo khoá mới). Nếu EAS không hỏi mà đi thẳng vào tạo khoá thì cứ để nó làm. EAS dùng phiên đăng nhập Apple để tạo khoá và lưu lên EAS. Các lần sau dùng lại, không hỏi nữa.

- Nếu EAS báo không tạo được khoá: Account Holder vào App Store Connect → **Users and Access** → tab **Integrations** → **App Store Connect API**. Nếu có nút **Request Access** thì bấm, chờ Apple bật, rồi chạy lại lệnh.
- Muốn tự tạo khoá: ở trang trên, mục **Team Keys**, bấm **+**. Đặt tên `EAS Submit`, quyền **App Manager**. Tải tệp `.p8` (chỉ tải được một lần), ghi **Key ID** và **Issuer ID**. Sau đó chạy `npx eas-cli credentials --platform ios` và chọn mục khoá App Store Connect API để tải lên.

**Cách 2 — mật khẩu dành riêng cho ứng dụng (dự phòng).**

1. Mở `https://account.apple.com`, vào **Đăng nhập và bảo mật** → **Mật khẩu dành riêng cho ứng dụng**. Tạo một mật khẩu tên `EAS`. Mật khẩu có dạng `abcd-efgh-ijkl-mnop` (4 nhóm, mỗi nhóm 4 chữ thường; EAS từ chối dạng khác).
2. Trong PowerShell (EAS sẽ hỏi thêm email Apple Account):

```powershell
$env:EXPO_APPLE_APP_SPECIFIC_PASSWORD = "abcd-efgh-ijkl-mnop"
npx eas-cli submit --platform ios --latest
```

Biến chỉ sống trong cửa sổ PowerShell đó. Đóng cửa sổ là mất, đúng ý muốn.

Tuỳ chọn cho các lần sau: build xong tự đẩy lên luôn.

```powershell
npx eas-cli build --platform ios --profile production --auto-submit
```

### 7.4 Sau khi đẩy lên

- Apple xử lý build, thường **10–15 phút**, có khi tới khoảng một giờ (ước lượng). Apple gửi email khi xong.
- Build hiện ở tab **TestFlight**, nhóm phiên bản **1.0.13**, số build **1**.
- Vì `app.json` đã khai `usesNonExemptEncryption: false`, build sẽ **không** kẹt ở trạng thái **Missing Compliance**. Nếu vẫn kẹt: bấm **Manage** cạnh build, chọn **None of the algorithms mentioned above**, bấm **Save**. App chỉ dùng HTTPS/WSS qua hệ điều hành, nên thuộc diện miễn.
- Mặc định `eas submit` cố tạo sẵn một nhóm thử nội bộ trên TestFlight, kể cả khi đã có `ascAppId` (tắt được bằng `--no-auto-testflight-setup`). Nếu không thấy nhóm nào, tạo tay ở Bước 8.

---

## Bước 8. TestFlight: thử nội bộ trên iPhone của anh

### 8.1 Cài app qua TestFlight

Thử nội bộ **không cần Apple duyệt**. Tối đa 100 người, và ai cũng phải là user của App Store Connect (Bước 1.6).

1. App Store Connect → app → tab **TestFlight**.
2. Nếu chưa có nhóm nội bộ: bấm **+** cạnh **Internal Testing**, đặt tên `Nhóm WeDo`, bấm **Create**. Nên đánh dấu **Enable automatic distribution** để build mới tự đến tay người thử.
3. Chọn nhóm, bấm **Invite Testers**, đánh dấu tên mình và các thành viên, bấm **Add**.
4. Nếu không bật phân phối tự động: chọn nhóm, bấm **Add Builds**, chọn build 1, bấm **Next**, điền **What to Test** (tuỳ chọn), bấm **Add**.
5. Trên iPhone: cài ứng dụng **TestFlight** từ App Store. Mở email mời, bấm **View in TestFlight**. Hoặc mở TestFlight bằng cùng Apple Account là thấy app. Bấm **Install**.

Mỗi build thử được **90 ngày**. iPhone cần iOS 16.4 trở lên (mức tối thiểu của Expo SDK 57).

Tuỳ chọn: ô **What to Test** của build (giới hạn 4000 ký tự) hiện trên TestFlight cho người thử. Có thể dán:

```text
Bản iOS đầu tiên của WeDo. Nhờ thử kỹ: đăng nhập bằng email (tài khoản tạo bằng Google thì đặt mật khẩu qua Quên mật khẩu), gửi ảnh từ thư viện, các ô nhập khi bàn phím bật lên, thông báo đẩy và chạm vào thông báo, báo cáo và chặn, xoá tài khoản bằng tài khoản phụ. Gặp lỗi thì chụp màn hình rồi gửi phản hồi cho bản thử qua TestFlight.
```
(336/4000 ký tự)

### 8.2 Danh sách thử trên iPhone thật

Dùng **tài khoản demo** có dữ liệu mẫu, không dùng tài khoản thật của người khác. Đánh dấu từng ô khi xong. Các dòng dưới đây đã có mã trên nhánh `ios` nhưng chưa ai thử trên iPhone thật. Dòng có ghi "đã biết" là chỗ mã chưa sửa; thử để xác nhận, rồi báo LTV. Danh sách đầy đủ hơn ở `08-sua-code-truoc-khi-nop.md`, mục Chưa kiểm chứng.

**Cài đặt và mở app**

- [ ] Biểu tượng là logo WeDo (không phải logo Expo). Tên dưới biểu tượng là "WeDo".
- [ ] Hộp thoại hệ thống (xin quyền, nút Xong, menu chọn chữ) hiện tiếng Việt khi iPhone đặt tiếng Việt.
- [ ] Bật **Chế độ máy bay** rồi mở app: app không sập, vẫn thấy dữ liệu đã lưu.
- [ ] Bật **chế độ tối** của iPhone: app vẫn giữ giao diện sáng và không vỡ. Không cần làm giao diện tối (`userInterfaceStyle: "light"`).

**Đăng nhập**

- [ ] Màn Đăng nhập và Đăng ký **không có** nút **Tiếp tục với Google** và dòng "hoặc" (Bước 4).
- [ ] Đăng ký bằng email + mật khẩu. Chưa đánh dấu ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư" thì nút **Đăng ký** tắt. Đánh dấu rồi thì đăng ký được. Hai cụm tên văn bản mở đúng trang trong trình duyệt trong app.
- [ ] Đăng nhập bằng email + mật khẩu.
- [ ] Đăng nhập bằng một tài khoản tạo trên web: gặp màn **Điều khoản sử dụng** một lần. Đánh dấu ô, bấm **Đồng ý và tiếp tục**, vào thẳng Trò chuyện. Bấm **Đăng xuất** ở màn đó cũng thoát được.
- [ ] Quên mật khẩu: nhận mã 6 số qua email, đặt lại được.
- [ ] Tài khoản đã tạo bằng Google trên web: bấm **Quên mật khẩu?**, nhập đúng Gmail, đặt mật khẩu mới, rồi đăng nhập được trên iPhone. Sau đó trên web vẫn đăng nhập Google được.
- [ ] Đăng xuất rồi đăng nhập lại.
- [ ] Gỡ app, cài lại từ TestFlight. Xem app có **tự đăng nhập lại** không. Keychain của iPhone giữ token qua lần gỡ app; đây là hành vi đã biết. Ghi lại để quyết định có xử lý không.

**Ảnh và tệp**

- [ ] Chụp ảnh bằng máy ảnh trong khung chat rồi gửi. Nên chạy được (ảnh chụp được lưu dạng JPEG).
- [ ] **Chọn ảnh từ thư viện** rồi gửi, với ảnh chụp bằng iPhone ở chế độ **Hiệu suất cao** (Cài đặt → Camera → Định dạng → Hiệu suất cao). Mã đã đổi ảnh HEIC sang JPEG trước khi gửi; phải gửi được, và web, Android xem được.
- [ ] Đổi ảnh đại diện từ thư viện. Nên chạy được (ảnh được chuyển sang JPEG trước khi gửi).
- [ ] Từ chối quyền máy ảnh, rồi bấm chụp lại. Phải hiện hộp thoại "Chưa có quyền dùng máy ảnh" với nút **Mở Cài đặt**, và nút đó mở đúng trang Cài đặt của WeDo.
- [ ] Ở chi tiết công việc, bấm **Nộp tài liệu** và chọn một tệp PDF từ ứng dụng Tệp.

**Bàn phím**

- [ ] Ở từng màn sau, chạm vào ô nhập cuối cùng. Ô đó và nút xác nhận không được bị bàn phím che:
  - Công việc mới (nút **Tạo công việc**), Đăng ký, Quên mật khẩu, phiếu báo cáo: đã sửa, cần xác nhận.
  - Tạo cuộc họp, Góp ý cho WeDo, Thông tin cá nhân, Tạo không gian làm việc, Hộp từ chối công việc (nhập lý do): **đã biết** chưa sửa.

  Màn chat thì nên ổn.
- [ ] Không có nút Quay lại cứng như Android. Mọi màn chi tiết phải có mũi tên quay lại trên màn hình, và không bị kẹt ở màn nào. **Đã biết**: vuốt từ mép trái để quay lại không chạy ở các màn chi tiết (chi tiết công việc, cuộc họp, chat), vì các màn này nằm trong thanh tab chứ không trong ngăn xếp màn hình. Chỉ có mũi tên trên màn hình.

**Thông báo và đường dẫn sâu**

- [ ] Sau khi đăng nhập, iPhone **không** hỏi quyền thông báo. Vào tab **Thông báo**, thẻ "Nhắc bạn trước khi việc đến hạn", bấm **Bật thông báo**: iPhone mới hỏi. Chọn **Cho phép**.
- [ ] Nhờ tài khoản thứ hai nhắn tin riêng khi app đang chạy nền: thông báo tới, có âm thanh.
- [ ] Lặp lại khi app **đã tắt hẳn** (vuốt lên đóng app).
- [ ] Chạm vào thông báo: mở đúng màn. Thử lần lượt tin nhắn riêng, tin nhắn dự án, lời mời kết bạn, cuộc họp, công việc được giao.
- [ ] Nhắc hạn chót (thông báo cục bộ) hiện đúng giờ.
- [ ] Gõ `wedo://` vào thanh địa chỉ Safari: iPhone hỏi mở WeDo, rồi mở app.

**Dải cập nhật**

- [ ] Không thấy dải "Có bản cập nhật mới" hay màn chặn "Cần cập nhật WeDo". Trên nhánh `ios`, iPhone đọc bộ biến riêng `MOBILE_IOS_*` của máy chủ mới, nút ghi "Mở App Store để cập nhật", và khi `MOBILE_IOS_STORE_URL` còn trống thì iPhone không hiện dải hay màn chặn nào. Trong suốt thời gian Apple duyệt, **không** đặt `MOBILE_IOS_MINIMUM_VERSION` cao hơn phiên bản đang duyệt. Hai biến Android không ảnh hưởng iPhone.

**Tính năng chính**

- [ ] Chat dự án thời gian thực giữa hai máy.
- [ ] Nhấn giữ một tin nhắn trong chat dự án → **Tạo công việc bằng AI** → hộp thoại "Dùng AI để gợi ý công việc?" → **Đồng ý** → AI đề xuất → tạo công việc. Mục AI chỉ hiện với **Leader** dự án và chủ không gian làm việc, nên thử bằng tài khoản là Leader. Chọn "Không, cảm ơn" thì không gửi gì. Tắt công tắc **Cho phép dùng AI** ở tab Tài khoản thì lần sau hỏi lại.
- [ ] Công việc: nhận việc, từ chối có lý do, nộp tài liệu, gửi duyệt, duyệt bài, trả lại.
- [ ] Cuộc họp: tạo cuộc họp, xem chi tiết (tóm tắt, quyết định, hạng mục hành động). **Vào phòng họp** mở Safari.
- [ ] Lịch (mở từ nút **Lịch** ở đầu màn Cuộc họp), Bạn bè (tìm, gửi, nhận lời mời), Bảng đóng góp (tab Tài khoản).
- [ ] Tab Tài khoản có bốn dòng **Điều khoản sử dụng**, **Chính sách quyền riêng tư**, **Hỗ trợ**, **Liên hệ: wedosupport6886@gmail.com**. Ba dòng đầu mở đúng trang (trang phải trả 200, tức web mới đã đăng). Dòng Liên hệ mở ứng dụng Mail.
- [ ] Bấm **Bảng đóng góp**: không có nút "Xem đầy đủ trên web", không có đường nào tới trang giá, nâng cấp hay thanh toán (Guideline 3.1.3(f)).
- [ ] Nhấn giữ tin của người khác → **Báo cáo tin nhắn** → chọn lý do → **Gửi báo cáo**. Thư tới hộp thư `REPORT_NOTIFY_EMAIL`, báo cáo hiện ở trang quản trị "Báo cáo vi phạm".
- [ ] Nhấn giữ tin của người khác → **Chặn người này** → **Chặn**: tin của người đó biến mất ngay. **Tài khoản → Người đã chặn → Bỏ chặn**: tin hiện lại. Thử cả nút ⋯ ở đầu tin nhắn riêng và nút ⋮ ở màn Bạn bè.
- [ ] Gửi một tin có từ ngữ phản cảm, có dấu và không dấu: từ đó hiện thành `***` ở cả hai phía.

**Xoá tài khoản**

- [ ] Dùng **tài khoản phụ** (không dùng tài khoản demo cho người duyệt), có gửi ảnh và nộp tệp trước: Tài khoản → Xoá tài khoản → gõ `XOA` → **Xoá tài khoản vĩnh viễn** → xác nhận. Sau đó không đăng nhập lại được bằng tài khoản đó. Nhờ LTV xem log máy chủ: không có lỗi xoá tệp trên Azure Blob.

**iPad (không bắt buộc)**

- [ ] Nếu có iPad: cài qua TestFlight, chạy nhanh đăng nhập và chat. App chỉ dành cho iPhone, nhưng người duyệt đôi khi mở trên iPad ở chế độ tương thích.

Thử bên ngoài nhóm (bạn bè không phải user App Store Connect) là tuỳ chọn. Muốn làm thì cần một lần Apple duyệt bản thử (Beta App Review) cho build đầu.

---

## Bước 9. Ảnh chụp màn hình

### 9.1 Kích thước Apple đòi

Theo trang Screenshot specifications của Apple (kiểm ngày 26/09/2026):

| Bộ | Kích thước dọc (px) | Máy tương ứng | Bắt buộc? |
|---|---|---|---|
| **iPhone 6,9 inch** | **1320 × 2868**, 1290 × 2796, hoặc 1260 × 2736 | iPhone Air, 18/17/16 Pro Max, 16 Plus, 15 Pro Max, 15 Plus, 14 Pro Max | Nên nộp bộ này |
| iPhone 6,5 inch | 1284 × 2778 hoặc 1242 × 2688 | 14 Plus, 13/12/11 Pro Max, 11, XS Max, XR | Bắt buộc **nếu không** nộp bộ 6,9 inch |
| Các cỡ nhỏ hơn (6,3; 6,1; 5,5 inch…) | — | — | Không bắt buộc. Thiếu thì Apple dùng ảnh bộ lớn hơn, thu nhỏ lại |

Trang của Apple còn có một dòng cho "iPhone Duo" (màn gập), ghi là **chưa** nhận tải ảnh lên. Bỏ qua dòng này.

- Mỗi bộ **1 đến 10 ảnh**. Nên nộp **5–8 ảnh**.
- Định dạng `.png`, `.jpg` hoặc `.jpeg`. **Không có kênh alpha, không trong suốt.**
- Chỉ ảnh dọc (app khoá hướng dọc).
- Không cần ảnh iPad, vì `supportsTablet: false`.
- Video xem trước (App Preview) là tuỳ chọn. Các video WeDo hiện có không hợp chuẩn (Apple đòi 15–30 giây, 886 × 1920, quay từ chính app), nên bỏ qua ở bản đầu.

### 9.2 Chụp trên iPhone thật

Không có Mac thì không có trình giả lập. Chụp trên iPhone với bản TestFlight là cách đơn giản nhất.

1. Đăng nhập **tài khoản demo** có dữ liệu mẫu đẹp. **Không** chụp dữ liệu của người thật. Máy chủ mới giấu email và số điện thoại của người chưa là bạn, nhưng danh sách bạn bè vẫn hiện email, nên cẩn thận.
2. Sạc pin đầy. Bật **Không làm phiền** để không có thông báo lạ trên ảnh.
3. Chụp: bấm cùng lúc **nút sườn + nút tăng âm lượng** (iPhone có Face ID), hoặc **nút Home + nút sườn** (iPhone có nút Home).
4. Chuyển ảnh sang máy tính **nguyên gốc**:
   - Cắm cáp, trên iPhone chọn **Tin cậy**. Trên Windows mở **Apple iPhone → Internal Storage → DCIM**, hoặc dùng ứng dụng **Ảnh** của Windows để nhập.
   - Hoặc tải lên Google Drive từ iPhone.
   - **Không** gửi qua Zalo hay Messenger, vì hai ứng dụng này nén ảnh.

Gợi ý nội dung, chỉ lấy tính năng app đang có:

1. Danh sách trò chuyện dự án
2. Chat dự án, nhấn giữ tin nhắn để AI đề xuất công việc
3. Việc của tôi (Đang mở / Chờ nhận / Quá hạn)
4. Chi tiết công việc: nhận việc, nộp tài liệu
5. Cuộc họp với tóm tắt, quyết định, hạng mục hành động
6. Lịch: cuộc họp, sự kiện và hạn chót theo ngày
7. Tin nhắn riêng và Bạn bè
8. Bảng đóng góp

Ảnh số 2 cần tài khoản là **Leader** của dự án, vì chỉ Leader dùng được AI đề xuất công việc. Ở màn Bạn bè, đừng để lộ email hay số điện thoại của người thật.

Apple không nhận ảnh chỉ có màn đăng nhập, màn chờ hay ảnh bìa; ảnh phải cho thấy app đang được dùng. Ảnh không được có chữ "CH Play", hình Android, giá tiền hay lời mời mua.

### 9.3 Máy của anh đã đúng cỡ chưa

| iPhone của anh | Ảnh gốc | Dùng thẳng được? |
|---|---|---|
| 16 Pro Max, 17 Pro Max | 1320 × 2868 | Được (bộ 6,9 inch) |
| iPhone Air | 1260 × 2736 | Được (bộ 6,9 inch) |
| 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus | 1290 × 2796 | Được (bộ 6,9 inch) |
| 11 Pro Max, XS Max | 1242 × 2688 | Được (bộ 6,5 inch) |
| 12/13 Pro Max, 14 Plus | 1284 × 2778 | Được (bộ 6,5 inch) |
| 14 Pro, 15, 15 Pro, 16 | 1179 × 2556 | Cần phóng lên 1290 × 2796 |
| 16 Pro, 17, 17 Pro | 1206 × 2622 | Cần phóng lên 1290 × 2796 |
| 12, 13, 14, 16e | 1170 × 2532 | Cần phóng lên 1290 × 2796 |
| 11, XR | 828 × 1792 | Cần phóng lên 1290 × 2796 (ảnh sẽ kém nét hơn) |
| SE, 8 (có nút Home) | 750 × 1334 | Tỉ lệ khác hẳn, phải đặt vào khung |

Nếu máy không đúng cỡ, **cứ gửi ảnh gốc PNG** (chưa sửa, chưa nén) cho người lo trang App Store, hoặc gửi thẳng vào phiên làm việc với trợ lý. Ảnh sẽ được đặt vào khung 1290 × 2796, kèm một dòng chữ ngắn phía trên, và nội dung app giữ nguyên. Cách đặt vào khung cũng tránh được chuyện méo hình do tỉ lệ lệch vài điểm ảnh. Ảnh chụp màn hình của iPhone vốn lưu dạng PNG, nên chỉ cần chuyển sang máy tính đúng cách ở 9.2.

---

## Bước 10. Nộp duyệt, phát hành và cập nhật OTA

### 10.1 Trước khi bấm Submit for Review

Mọi thứ dưới đây nằm trong App Store Connect. Nội dung chữ để điền nằm ở các tài liệu khác trong thư mục này:

- `02-thong-tin-app-store.md`: tên, phụ đề, mô tả, từ khoá, danh mục, độ tuổi, bản quyền.
- `03-app-privacy.md`: nhãn quyền riêng tư (App Privacy).
- `04-thong-tin-cho-reviewer.md`: tài khoản demo, thông tin liên hệ, ghi chú cho người duyệt.
- `05-chinh-sach-bao-mat.md`, `06-dieu-khoan-su-dung.md`, `07-trang-ho-tro.md`: ba trang web cần có trước khi nộp.

**Trang phiên bản** (cột trái, mục **iOS App**, phiên bản ở trạng thái **Prepare for Submission**):

- [ ] Số phiên bản phải là **`1.0.13`**, khớp với build. App mới tạo thường mang sẵn số `1.0`; nếu vậy thì sửa thành `1.0.13` rồi bấm **Save**. Hai số lệch nhau thì không gắn được build.
- [ ] Ảnh chụp màn hình bộ 6,9 inch (Bước 9).
- [ ] Promotional Text, Description, Keywords, Support URL, Marketing URL (tuỳ chọn), Copyright.
  - **Support URL** là bắt buộc: `https://wedofpt.com.vn/ho-tro.html`. Trang đã có trên nhánh `ios-web` (commit `1f6e813`), nhưng kiểm ngày 26/09/2026 địa chỉ này **còn trả lỗi 404** vì chưa đăng. Phải đăng (`08-sua-code-truoc-khi-nop.md`, Bước B) trước khi nộp.
  - ⚠ Giả định: Copyright ghi `2026 Lê Hữu Đại`, cho khớp tên người bán.
- [ ] Mục **Build**: bấm **Add Build**, chọn **1.0.13 (số build nộp duyệt)**, bấm **Done**.
- [ ] Mục **App Review Information** (chi tiết ở `04-thong-tin-cho-reviewer.md`):
  - Đánh dấu **Sign-in required**. Điền tài khoản demo: [EMAIL TÀI KHOẢN DEMO] / [MẬT KHẨU TÀI KHOẢN DEMO].
  - Contact: tên `Lê Hữu Đại`, email `wedosupport6886@gmail.com` (email hỗ trợ đã chốt, cũng là địa chỉ trên trang Chính sách quyền riêng tư), số điện thoại [SỐ ĐIỆN THOẠI DẠNG +84…, CDA tự điền].
  - Notes: bản tiếng Anh ở `04-thong-tin-cho-reviewer.md`.
- [ ] Mục **Version Release**: chọn **Manually release this version** cho bản đầu, để tự chọn lúc lên kệ.

**App Information** (cột trái):

- [ ] Subtitle, Category (Productivity; phụ: Education), Content Rights.
- [ ] Age Rating: trả lời bộ câu hỏi mới, gồm Messaging and Chat, User-Generated Content… cho đúng sự thật. Apple sẽ tính ra 4+. Ở bước cuối, chọn **Override to Higher Age Rating → 18+**, vì điều khoản và chính sách đặt tuổi tối thiểu 18 (cách làm ở `02-thong-tin-app-store.md`, mục 14).
- [ ] License Agreement: giữ **EULA chuẩn của Apple**, theo khuyến nghị của `06-dieu-khoan-su-dung.md`.
- [ ] Digital Services Act: đã khai ở Bước 2.3.

**App Privacy** (cột trái):

- [ ] Privacy Policy URL: `https://wedofpt.com.vn/privacy.html`. Trang đang sống còn ghi "Áp dụng cho cả web WeDo và ứng dụng Android WeDo". Bản mới "Chính sách quyền riêng tư" (phủ cả iPhone) đã có trên nhánh `ios-web` (commit `c4b98c2`). Phải đăng trước khi nộp.
- [ ] Khai nhãn dữ liệu theo `03-app-privacy.md`, rồi bấm **Publish**.

**Pricing and Availability** (cột trái):

- [ ] **Price Schedule**: bấm **Add Pricing**, quốc gia gốc **Vietnam**, giá **Free**, bấm **Confirm**.
- [ ] **App Availability**: chỉ chọn **Vietnam**. Bỏ mọi nước khác, trong đó có EU và Trung Quốc đại lục (nước này đòi số giấy phép ICP).
- [ ] **iPhone and iPad Apps on Apple Silicon Mac**: bỏ chọn cho app có mặt trên Mac.
- [ ] **Apple Vision Pro**: bỏ chọn cho app có mặt trên Vision Pro.

  Hai máy này chưa từng được thử. Mở lại sau khi đã thử.

**Tài khoản demo sống được suốt thời gian duyệt** (cách dựng ba tài khoản demo ở `04-thong-tin-cho-reviewer.md`):

- [ ] Không phải tài khoản quản trị nền tảng. Máy chủ từ chối tài khoản ADMIN đăng nhập trên app (`BE_WEDO/src/auth/auth.service.ts:307-311`).
- [ ] Là **Leader** của ít nhất một dự án, để người duyệt thử được AI đề xuất công việc.
- [ ] Dữ liệu mẫu đủ: dự án, tin nhắn, công việc, cuộc họp. Lượt AI trong tháng còn dư.
- [ ] Không ai đổi mật khẩu hay xoá tài khoản đó trong lúc chờ duyệt.

### 10.2 Bấm nộp

1. Ở trang phiên bản 1.0.13, bấm **Add for Review** ở góc trên bên phải.
2. Nếu App Store Connect báo còn thiếu mục nào, sửa rồi bấm lại.
3. Trong bảng nháp hiện ra, bấm **Submit to App Review**.
4. Trạng thái chuyển sang **Waiting for Review**, rồi **In Review**.

Apple công bố: trung bình **90% bài nộp được duyệt trong vòng 24 giờ**. Theo dõi bằng email, hoặc cài ứng dụng **App Store Connect** trên iPhone.

Nếu bị từ chối: đọc lý do ở **App Review** trong App Store Connect. Trả lời ngay trong đó nếu người duyệt hiểu sai. Nếu phải sửa code thì build mới (tăng `buildNumber`) rồi nộp lại. Kể cả khi chỉ sửa JavaScript, cũng nên build mới thay vì đẩy OTA vào bản đang bị duyệt. Nếu chỉ sửa trang App Store thì sửa rồi nộp lại, không cần build.

### 10.3 Phát hành sau khi được duyệt

- Trạng thái sẽ là **Pending Developer Release** (vì chọn phát hành tay).
- Bấm **Release This Version** khi sẵn sàng. App có thể mất tới 24 giờ mới tìm thấy được trên App Store Việt Nam.
- Kiểm tra lại trên iPhone: tìm tên app trên App Store, cài bản chính thức (không qua TestFlight), đăng nhập, gửi một tin nhắn.
- **Phát hành theo giai đoạn** (Phased Release, 7 ngày) chỉ áp cho các bản cập nhật sau, không áp cho bản đầu.
- Phiên bản iOS sau phải có số lớn hơn `1.0.13`, ví dụ `1.0.14`.

### 10.4 Cập nhật OTA (EAS Update) trên iOS

Cách hoạt động:

- Mỗi build iOS nhúng sẵn JavaScript lúc build, và mang một **vân tay** (runtime version) riêng cho iOS.
- iPhone chỉ nhận bản OTA có vân tay iOS **khớp** build đang cài. Android cũng vậy, với vân tay Android.
- Lệnh tính vân tay từ code trong thư mục đang mở. Vì vậy phải chạy lệnh từ **cùng nhánh, cùng cấu hình** với build đang cài.

**Chạy ở đâu, cho tới khi nhánh `ios` được gộp vào `main`:**

| Phát OTA cho | Thư mục | Nhánh | Lệnh |
|---|---|---|---|
| Android (bản 17 đang chạy trên CH Play) | `D:\WeDo_ChPlay` | `main` | `npx eas-cli update --platform android --channel production --environment production --message "mo ta ngan"` |
| iOS (bản từ TestFlight và App Store) | `D:\WeDo_ChPlay-ios` | `ios` | `npx eas-cli update --platform ios --channel production --environment production --message "mo ta ngan"` |

- **Luôn** kèm `--platform`. Lệnh không có `--platform` gửi cho cả hai nền tảng từ cùng một thư mục, mà mỗi thư mục chỉ khớp vân tay của một bản.
- Phát từ `main` thì iPhone không nhận gì, vì `main` không có khối `ios`. Phát từ `ios` thì Android bản 17 không nhận gì (xem 6.1).
- Sửa lỗi JS dùng cho cả hai nền tảng: sửa trên `main`, phát cho Android, rồi chạy `git merge main` trong `D:\WeDo_ChPlay-ios` và phát cho iOS.
- Sau khi gộp `ios` vào `main` (lúc build Play versionCode 18, xem `08-sua-code-truoc-khi-nop.md` mục Build và thử), OTA cho cả hai nền tảng phát từ `main`, vẫn kèm `--platform`.
- Luôn chọn môi trường **production**. Chọn `development` là đóng gói địa chỉ máy chủ dev, và mọi người mất đăng nhập.
- Sau khi đẩy, thử trên iPhone: mở app, chờ khoảng 10 giây, **thoát hẳn**, mở lại. Bản mới chạy từ lần mở kế tiếp.
- Đổi thứ gì native (thêm gói native, sửa plugin, sửa `app.json`, đổi biểu tượng) thì vân tay đổi. Khi đó phải **build mới và nộp duyệt lại**. OTA không tới được build cũ.
- Gói Free của EAS Update phục vụ tối đa **1.000 người dùng hoạt động mỗi tháng** (MAU).
- Máy chủ mới (nhánh `ios-backend`) trả bộ số riêng cho iPhone khi app gọi `/app-version?platform=ios`: `MOBILE_IOS_LATEST_VERSION`, `MOBILE_IOS_MINIMUM_VERSION`, `MOBILE_IOS_UPDATE_NOTES`, `MOBILE_IOS_STORE_URL`. Nâng số cho Android không còn ảnh hưởng iPhone. Chỉ nâng các biến `_IOS` sau khi bản iOS tương ứng đã lên App Store. Máy chủ cũ đang chạy vẫn trả một cặp chung, nên phải đưa máy chủ mới lên trước khi phát hành iOS.
- **Không phát OTA từ nhánh `ios` trước khi máy chủ mới chạy trên production.** Mã trên nhánh này cần máy chủ mới (`08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên).

### 10.5 Giới hạn của Apple với OTA (Guideline 2.5.2)

Guideline 2.5.2 cấm app tải về và chạy mã làm **thêm hoặc đổi tính năng**. Thoả thuận giấy phép Apple Developer Program cho phép tải mã thông dịch (JavaScript là loại này) với ba điều kiện: không đổi mục đích chính của app so với bản đã duyệt, không dựng một cửa hàng bán mã hay app khác, không vượt qua cơ chế ký, sandbox và bảo mật của hệ điều hành.

Áp vào WeDo:

- **Được** đẩy qua OTA: sửa lỗi, chỉnh giao diện, sửa chữ, cải tiến nhỏ trong tính năng đã có.
- **Không** đẩy qua OTA, phải build và nộp duyệt:
  - Tính năng lớn mới mà người duyệt chưa thấy.
  - Bất kỳ giao diện mua, bảng giá, nút nâng cấp hay liên kết tới trang thanh toán. Làm vậy vi phạm cả 3.1.3(f) lẫn 2.5.2.
  - Gỡ bỏ những thứ Apple bắt phải có: báo cáo, chặn, bộ lọc từ ngữ, ô đồng ý điều khoản, hộp thoại đồng ý AI, xoá tài khoản, liên kết Chính sách quyền riêng tư và liên hệ hỗ trợ.
  - Hiện lại nút Google trên iPhone. Việc đó kéo theo Guideline 4.8 và cần Đăng nhập bằng Apple (mục Bản sau), nên phải đi bằng build mới.
- Mỗi bản OTA phải hợp lệ như thể nó được nộp duyệt. Apple có thể gỡ app nếu phát hiện OTA lách quy định.

---

## Chi phí

| Khoản | Số tiền | Ghi chú |
|---|---|---|
| Apple Developer Program | **99 USD/năm** | Giá hiện bằng tiền địa phương lúc thanh toán. Tự gia hạn. Không hoàn tiền. Nếu thẻ bị tính bằng USD, ngân hàng có thể thu thêm phí chuyển đổi ngoại tệ |
| EAS Build, gói Free | 0 đ | 15 build Android và 15 build iOS mỗi tháng, hàng đợi ưu tiên thấp, mỗi build tối đa 45 phút. Gói Starter 19 USD/tháng (cộng phí dùng thêm) nếu cần nhanh hơn |
| EAS Update, gói Free | 0 đ | Tới 1.000 người dùng hoạt động mỗi tháng |
| TestFlight, App Store Connect | 0 đ | |
| Mac | 0 đ | Không cần |
| Thuế, ngân hàng, Paid Apps Agreement | 0 đ | Không cần vì app miễn phí, không IAP |
| **Tổng tối thiểu** | **99 USD/năm** | |

---

## Thời gian dự kiến

Các con số là ước lượng. Phần mã bắt buộc đã làm xong trên các nhánh iOS. Chưa tính thời gian đưa máy chủ, web lên production và sửa lỗi tìm được trên TestFlight (xem `08-sua-code-truoc-khi-nop.md`).

| Việc | Thời gian làm | Thời gian chờ |
|---|---|---|
| Bật 2FA, kiểm tên Apple Account | 15 phút | — |
| Đăng ký Apple Developer Program | 30 phút | Apple không công bố thời hạn, chỉ dặn: quá 24 giờ sau khi trả tiền mà chưa có email xác nhận thì liên hệ. Thường 1–2 ngày; lâu hơn nếu giấy tờ có vấn đề |
| Kiểm tra thoả thuận, khai DSA "không phải thương nhân" | 10 phút | — |
| Bundle ID, biến EAS | 30 phút | — |
| Một lần build iOS trên EAS | 5 phút gõ lệnh | 20–40 phút chạy, cộng 0–90+ phút chờ hàng |
| Tạo app, đẩy build lên | 30 phút | 10–60 phút Apple xử lý build |
| Thử trên TestFlight | 1–3 ngày | — |
| Ảnh chụp màn hình, điền trang App Store | 1 ngày | — |
| Apple duyệt | — | 90% xong trong 24 giờ; bản đầu hay bị trả về ít nhất một lần |

Tổng: khoảng **1–2 tuần** từ lúc đăng ký tới lúc lên kệ, nếu code đã sẵn và không bị từ chối nhiều lần. Nên chừa thêm một tuần cho một lần bị trả về.

---

## Nguồn đã kiểm (26/09/2026)

- Apple — Become a member: https://developer.apple.com/programs/enroll/
- Apple — Enrolling with the Apple Developer app: https://developer.apple.com/help/account/membership/enrolling-in-the-app/
- Apple — Enrollment support: https://developer.apple.com/support/enrollment/
- Apple — Sign and update agreements: https://developer.apple.com/help/app-store-connect/manage-agreements/sign-and-update-agreements/
- Apple — DSA trader requirements: https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/
- Apple — Add a new app: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- Apple — Add internal testers: https://developer.apple.com/help/app-store-connect/test-a-beta-version/add-internal-testers/
- Apple — Screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/
- Apple — App preview specifications: https://developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications/
- iTunes Search API (tra tên "WeDo" đã có người dùng): https://itunes.apple.com/lookup?id=6757289093
- Bài hướng dẫn bên thứ ba về giấy tờ khi đăng ký ở Việt Nam (chưa được Apple xác nhận): https://hoanghamobile.com/tin-tuc/apple-developer/
- Apple — App Review: https://developer.apple.com/distribute/app-review/
- Apple — App Review Guidelines (2.5.2, 3.1.3(f), 4.8): https://developer.apple.com/app-store/review/guidelines/
- Expo — Submit to the Apple App Store: https://docs.expo.dev/submit/ios/
- Expo — iOS capabilities: https://docs.expo.dev/build-reference/ios-capabilities/
- Expo — Managed credentials: https://docs.expo.dev/app-signing/managed-credentials/
- Expo — Pricing: https://expo.dev/pricing
- Mã nguồn `eas-cli` 24.7.0 (bản lưu tạm trong npm cache của máy): câu hỏi lúc build, cách `eas submit` tự tạo app khi thiếu `ascAppId`, cách tạo khoá App Store Connect API, nhóm TestFlight tự tạo, các lệnh `env:set` / `env:list`.
- Mã nguồn `@expo/fingerprint` 0.20.6 trong `node_modules`: cách vân tay băm cấu hình Expo. Vân tay ở Bước 6.1 được tính lại bằng `npx expo-updates fingerprint:generate` ngày 26/09/2026 trên commit `dbbd5f0` (nay là nhánh `ios`).
- Plugin `@react-native-google-signin/google-signin` 16.1.4 (`plugin/build/withGoogleSignIn.js`): để dòng plugin dạng chuỗi trần thì phần iOS chỉ đọc `ios.googleServicesFile`, mà app không khai, nên build iOS không lỗi dù nút Google bị ẩn. `@expo/prebuild-config` (`withDefaultPlugins.js:150-161`): thêm `iosUrlScheme` sau này không làm mất cấu hình `google-services` của Android.
- Mã máy chủ `BE_WEDO/src/auth/password-reset.service.ts` và `auth.service.ts`: "Quên mật khẩu" tìm tài khoản theo email, không phân biệt cách đăng ký, nên tài khoản tạo bằng Google đặt được mật khẩu.
- Apple — Updated age ratings in App Store Connect (24/07/2025, thêm 13+, 16+, 18+ và cho đặt mức cao hơn theo tuổi tối thiểu của app): https://developer.apple.com/news/?id=ks775ehf

---

## Bản sau (1.1)

Mục này gom các việc **không làm cho bản đầu**, vì iPhone chỉ đăng nhập bằng email và mật khẩu. Làm khi muốn có Google trên iPhone. Luật đi kèm: hiện lại nút Google trên iPhone thì phải có **Đăng nhập bằng Apple trong cùng bản** (Guideline 4.8). Việc mã tương ứng nằm ở `08-sua-code-truoc-khi-nop.md`, SAU-01 … SAU-04. Mọi thay đổi `app.json` ở đây đổi vân tay của cả hai nền tảng, nên cần build mới.

### B.1 Bật năng lực Sign In with Apple

- Cách A (khuyên dùng): khi LTV đặt `"usesAppleSignIn": true` trong `expo.ios` của `app.json`, lần `eas build` kế tiếp tự bật **Sign In with Apple** cho App ID `vn.wedo.app` và tự làm lại hồ sơ cấp phép.
- Cách B: vào **Certificates, IDs & Profiles** → **Identifiers** → `vn.wedo.app`. Đánh dấu **Sign In with Apple**, bấm **Edit** cạnh nó, chọn **Enable as a primary App ID**, bấm **Save**. Nếu build kế tiếp chưa có tính năng này, EAS sẽ tắt ô vừa bật (xem Bước 3, Cách A).

### B.2 Khoá Đăng nhập bằng Apple và email chuyển tiếp (cho máy chủ)

**Khoá `.p8` cho máy chủ.** Máy chủ cần khoá này để thu hồi token Apple khi người dùng xoá tài khoản (Apple bắt buộc). Làm sau khi App ID `vn.wedo.app` đã bật Sign In with Apple (xem B.1), vì bước 3 dưới đây cần chọn App ID đó.

1. **Certificates, IDs & Profiles** → **Keys** → dấu **+**.
2. **Key Name**: `WeDo Sign in with Apple`.
3. Đánh dấu **Sign in with Apple**, bấm **Configure**. **Primary App ID**: chọn `vn.wedo.app`. Bấm **Save**.
4. Bấm **Continue**, rồi **Register**.
5. Bấm **Download**. Tệp `.p8` chỉ **tải được một lần**. Ghi lại **Key ID** hiện trên trang.
6. Gửi tệp `.p8`, Key ID và Team ID cho người làm máy chủ qua kênh riêng tư. Đặt vào biến môi trường trên Azure theo tên mà tài liệu máy chủ quy định.
7. Không commit tệp vào git. `.gitignore` của repo mobile đã chặn `*.p8`.

**Email chuyển tiếp.** Người dùng chọn **Ẩn địa chỉ email** sẽ có email dạng `...@privaterelay.appleid.com`. Thư đặt lại mật khẩu gửi tới địa chỉ đó sẽ bị trả về, trừ khi đăng ký nơi gửi với Apple:

1. **Certificates, IDs & Profiles** → **Services** → **Sign in with Apple for Email Communication** → **Configure**.
2. Bấm **+**, thêm tên miền và địa chỉ gửi thư của máy chủ: [ĐỊA CHỈ GỬI THƯ CỦA MÁY CHỦ — lấy từ biến `MAIL_FROM` trên Azure; nếu biến này trống thì máy chủ dùng `MAIL_USER` (`BE_WEDO/src/mail/mail.service.ts:57-58`)].
3. Bấm **Register**. Tên miền gửi thư cần có bản ghi SPF hợp lệ thì Apple mới chấp nhận.

Máy chủ gửi thư qua SMTP của Brevo (theo `BE_WEDO/.env.example`). Nếu địa chỉ gửi là một hộp thư `@gmail.com`, anh không đăng ký được tên miền `gmail.com`, và bản ghi SPF của Gmail không cho Brevo gửi thay. Khi đó nên đổi `MAIL_FROM` sang một địa chỉ trên tên miền riêng (ví dụ trên `wedofpt.com.vn`) có SPF cho Brevo.

### B.3 Google Cloud: tạo OAuth client cho iOS

Chỉ làm khi bật lại nút **Tiếp tục với Google** trên iPhone. Không có client iOS thì nút **hỏng trên mọi iPhone**: thư viện báo lỗi ngay khi thiếu cả `GoogleService-Info.plist` lẫn `iosClientId`.

#### Tạo client (CDA)

1. Mở `https://console.cloud.google.com`. Đăng nhập bằng tài khoản Google đang quản lý project **`alert-rush-501204-b6`** (tài khoản đã tạo client Web và hai client Android).
2. Chọn project `alert-rush-501204-b6` ở ô chọn project trên cùng.
3. Vào **APIs & Services → Credentials**, bấm **+ Create credentials → OAuth client ID**. (Giao diện mới có thể đưa anh sang **Google Auth Platform → Clients → + Create client**. Hai đường dẫn tới cùng một biểu mẫu.)
4. **Application type**: `iOS`.
5. **Name**: `WeDo iOS`.
6. **Bundle ID**: `vn.wedo.app`.
7. **App Store ID**: để trống. Điền sau khi có ascAppId ở Bước 7, nếu muốn.
8. **Team ID**: dán Team ID từ Bước 1.5. Ô này không bắt buộc.
9. Bấm **Create**.
10. Mở client vừa tạo. Ghi lại hai giá trị:
    - **Client ID**: dạng `108450458549-xxxx.apps.googleusercontent.com`. Nhiều khả năng bắt đầu bằng cùng số `108450458549` như client Web, vì cùng project.
    - **iOS URL scheme**: dạng `com.googleusercontent.apps.108450458549-xxxx`. Đây là Client ID viết ngược.

Hai giá trị này **không phải bí mật**. Chúng nằm sẵn trong mọi bản app phát hành.

Màn đồng ý OAuth của project đã ở trạng thái **In production** (theo ghi chú bàn giao ngày 11/08/2026), nên người duyệt của Apple đăng nhập Google được mà không cần nằm trong danh sách người thử.

#### Giá trị nào đi đâu (LTV)

| Giá trị | Đặt vào | Ghi chú |
|---|---|---|
| Client ID | Biến EAS `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, môi trường `production` (lệnh `env:set` như Bước 5.3, `--visibility plaintext`) | LTV thêm dòng đọc `process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (code **chưa đọc** biến này). Phải viết nguyên biểu thức, vì biến `EXPO_PUBLIC_*` được thay thẳng lúc build |
| Client ID | Tệp `.env` trên máy LTV, thêm một dòng cùng tên | Để chạy thử ở máy |
| Client ID | `src/lib/auth/google-signin.ts:80`: `GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: ... })` | **Hiện chưa có** `iosClientId`. Có thể nhúng giá trị dự phòng giống cách đang làm với client Web |
| iOS URL scheme | `app.json`, đổi dòng plugin thành `["@react-native-google-signin/google-signin", { "iosUrlScheme": "com.googleusercontent.apps.108450458549-xxxx" }]` | Phải nằm trong `app.json` (JSON tĩnh, không đọc được biến môi trường) |
| Client Web (không đổi) | Máy chủ, biến `GOOGLE_CLIENT_ID` | Giữ nguyên |

Thêm tuỳ chọn `iosUrlScheme` không ảnh hưởng Android: Expo vẫn áp `android.googleServicesFile` như cũ. Nhưng nó **đổi vân tay native** (xem Bước 6.1).

#### Một chỗ cần thử trên máy thật

Máy chủ so trường `aud` của ID token với **đúng một** giá trị `GOOGLE_CLIENT_ID` (client Web) ở `BE_WEDO/src/auth/auth.service.ts:243`. Vì app truyền `webClientId`, token trên iOS nhiều khả năng mang `aud` là client Web và qua được. Điều này **chưa được kiểm** trên iPhone thật.

Nếu đăng nhập Google trên iPhone báo **"Google token không thuộc ứng dụng WEDO"**, máy chủ phải chấp nhận thêm iOS client ID. Đó là việc của người làm máy chủ.
