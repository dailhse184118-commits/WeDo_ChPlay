# 07 — Trang Hỗ trợ (Support URL) cho App Store

Tài liệu này có ba phần:

1. Đặt trang Hỗ trợ ở đâu trên web WeDo, file nào, đường dẫn nào.
2. Nội dung trang, chia từng khối để bạn đọc duyệt và sao chép. Tệp HTML thật đã làm xong trên nhánh `ios-web` (Phụ lục A).
3. Phần dành riêng cho chủ dự án: điền gì vào ô Support URL và Marketing URL trong App Store Connect, và những việc phải xong trước khi đăng trang.

Trạng thái: tệp `public/ho-tro.html` **đã làm** trên nhánh `ios-web` (`D:\WEDO_PC\FE_WEDO-ios`, commit `1f6e813` và các commit sửa sau), **chưa đăng**. Kiểm tra ngày 26/09/2026: `https://wedofpt.com.vn/ho-tro.html` còn trả **404**. Trang phải trả **200** trước khi bấm Submit for Review, vì người duyệt của Apple sẽ mở nó, và app mở trang này từ dòng "Hỗ trợ" ở tab Tài khoản. Đăng theo `08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên, Bước B (sau máy chủ).

Quy ước trong tài liệu:

- **⚠ Giả định:** là chỗ dựa trên quyết định chưa chốt hoặc tính năng chưa làm. Bạn đổi được.
- Chữ trong ngoặc vuông như `[LINK APP STORE]` là chỗ trống phải điền thông tin thật. Mục 5.3 liệt kê hết. Email hỗ trợ đã chốt và đã điền sẵn.
- Chữ trong khung ` ```text ` là nội dung sao chép được, không chứa ghi chú nội bộ.

---

## 0. Tóm tắt nhanh

| Việc | Giá trị |
|---|---|
| File | `public/ho-tro.html` trên nhánh `ios-web` (`D:\WEDO_PC\FE_WEDO-ios`), đã làm, chưa đăng |
| Địa chỉ trang | `https://wedofpt.com.vn/ho-tro.html` |
| Ô Support URL (bắt buộc) | `https://wedofpt.com.vn/ho-tro.html` — 34 ký tự |
| Ô Marketing URL (không bắt buộc) | **Để trống** ở bản đầu, như `02-thong-tin-app-store.md` (xem mục 4.2) |
| Email hỗ trợ | `wedosupport6886@gmail.com` (đã chốt; cũng là email đang công bố trên trang chính sách và trang xoá tài khoản, và hiện trong app ở dòng "Liên hệ"). **Hộp thư này phải có người đọc mỗi ngày, kể cả cuối tuần và ngày lễ**, vì trang, điều khoản và App Review Notes hứa xem mọi báo cáo vi phạm trong 24 giờ. |
| Tuổi tối thiểu | 18, ghi ở mục Chính sách và điều khoản của trang (khớp `05`, `06`, và mức 18+ trong App Store Connect) |
| Mạng xã hội | Facebook `https://www.facebook.com/WeDoTeamVietNam/`, TikTok `https://www.tiktok.com/@wedoteamvietnam` (cả hai trả 200 ngày 26/09/2026) |

---

## 1. Các giả định trong tài liệu này

- Đã chốt: ứng dụng trên iPhone **chỉ đăng nhập bằng email và mật khẩu**. Nút Google bị ẩn trên iPhone (đã làm), web và điện thoại khác vẫn có. **Không có Đăng nhập bằng Apple** ở bản này. Trang có mục hướng dẫn người đã đăng ký bằng Google đặt mật khẩu qua "Quên mật khẩu?" (mục 3.5.2). Khối Apple chuyển sang Phụ lục C (Bản sau).
- Đã chốt: **tuổi tối thiểu 18** (mục 3.4 và 3.13).
- Đã chốt: email hỗ trợ `wedosupport6886@gmail.com` (mục 0). Tên trang chính sách là **"Chính sách quyền riêng tư"**.
- Đã làm (`08-sua-code-truoc-khi-nop.md`, IOS-03, IOS-04): **báo cáo**, **chặn**, **bộ lọc từ ngữ** (thay từ bằng `***`) và **khoá tài khoản**. Chữ trên màn hình: nhấn giữ tin nhắn → "Báo cáo tin nhắn", "Chặn người này"; nút ba chấm ở đầu tin nhắn riêng hoặc ở mỗi dòng trong màn Bạn bè → "Báo cáo người này", "Chặn người này"; bỏ chặn ở "Tài khoản → Người đã chặn". Sáu lý do báo cáo.
- Đã làm (IOS-08): **hộp thoại xin đồng ý** trước lần dùng AI đầu tiên trên app, và công tắc **"Cho phép dùng AI"** trong tab Tài khoản để rút lại. Web chưa có bước hỏi.
- Đã làm (IOS-20): máy chủ mới **xoá ảnh và tệp** trên Azure Blob khi xoá tài khoản.
- Đã làm (IOS-13): ảnh HEIC của iPhone được đổi sang JPEG trước khi gửi. Còn phải thử trên máy thật.
- Đã làm (IOS-29): trên iPhone, app chỉ hỏi quyền thông báo khi người dùng bấm "Bật thông báo" ở tab Thông báo.
- ⚠ Giả định: app iOS **không bán gì**, không có lời mời mua ở nơi khác (3.1.3(f)). Vì vậy trang Hỗ trợ cũng không nhắc giá, gói hay "Nâng cấp".
- ⚠ Giả định: chỉ phát hành ở **App Store Việt Nam**, miễn phí, chỉ iPhone.
- ⚠ Giả định: thời gian phản hồi là **2 ngày làm việc** cho câu hỏi thường, **24 giờ** cho báo cáo vi phạm, **20 ngày** cho yêu cầu xoá tài khoản qua email. Yêu cầu dữ liệu khác theo thời hạn ở mục 11 của Chính sách quyền riêng tư mới (`05-chinh-sach-bao-mat.md`). Con số 24 giờ khớp tài liệu Điều khoản.
- ⚠ Chưa biết: nhà cung cấp AI **đang chạy** trên máy chủ. Mã ưu tiên Gemini, rồi Azure OpenAI, rồi OpenAI, nhưng biến môi trường nằm trên Azure nên chưa ai xác nhận được. Trang hiện nêu cả ba, "mỗi lúc chỉ dùng một".
- **Mọi điều trên chỉ đúng khi máy chủ mới đã chạy trên production.** Đăng trang này sau Bước A của `08`, mục Thứ tự đưa lên.

---

## 2. Đặt trang ở đâu trên web

### 2.1. Web WeDo đang điều hướng thế nào

- Web là một SPA. Điều hướng bằng dấu `#` và trạng thái trong `D:\WEDO_PC\FE_WEDO\src\App.tsx`:
  - Kiểu `Screen` ở dòng 64 chỉ có `landing`, `login`, `forgot-password`, `register`, `pricing`, `app`, `admin-login`, `admin`, `checkout`, `payment-result`.
  - `getInitialState()` (dòng 89) chỉ nhận các route trong danh sách ở dòng 100 và trong `APP_VIEWS`. Route lạ rơi về trang chủ. Tức là `https://wedofpt.com.vn/#/ho-tro` hôm nay mở ra trang chủ, không phải trang hỗ trợ.
- Các trang pháp lý công khai **không** đi qua SPA. Chúng là file HTML tĩnh trong `D:\WEDO_PC\FE_WEDO\public\`: `privacy.html` và `xoa-tai-khoan.html`. Vite chép nguyên thư mục `public` vào bản build, Vercel phục vụ thẳng (ghi chú ở `privacy.html:2-4`).
- Không có `vercel.json`, nên không có "đường dẫn gọn". Phải giữ đuôi `.html`: `https://wedofpt.com.vn/privacy` trả 404, còn `/privacy.html` trả 200 (đã thử ngày 26/09/2026).

### 2.2. Đề xuất: trang tĩnh `public/ho-tro.html`

| Cách | Địa chỉ | Được | Mất |
|---|---|---|---|
| **Trang tĩnh `public/ho-tro.html` (chọn cách này)** | `https://wedofpt.com.vn/ho-tro.html` | Cùng kiểu với `privacy.html` và `xoa-tai-khoan.html`. Mở ra là thấy email ngay, không cần JavaScript, không cần đăng nhập. Không tải PostHog. Không có thanh menu trang chủ, nên không có nút "Bảng giá". Không phải sửa mã React. | Liên kết tới trang đã thêm ở chân trang web và trong app (dòng "Hỗ trợ"). |
| Route trong SPA `#/ho-tro` | `https://wedofpt.com.vn/#/ho-tro` | Dùng chung giao diện web. | Phải sửa `App.tsx` ở ba chỗ (dòng 64, 100, 146) và viết view mới. SPA khởi động PostHog ngay khi tải (`src\main.tsx:12`), tức là người xem trang hỗ trợ bị đo và ghi phiên. Thanh menu trang chủ có nút "Bảng giá" (`src\views\LandingView.tsx:254`). |
| Đường dẫn không đuôi `/ho-tro` | — | — | Không chạy được khi chưa cấu hình `cleanUrls` trên Vercel. |

Tên file `ho-tro.html` theo đúng kiểu của `xoa-tai-khoan.html`: tiếng Việt không dấu, nối bằng gạch ngang.

Trang **không có liên kết** tới trang chủ web hay trang đăng nhập web: địa chỉ `wedofpt.com.vn` chỉ ghi bằng chữ thường. Lý do: trang chủ có mục "Bảng giá", trang đăng nhập có nút về trang chủ, mà app mở trang hỗ trợ trong trình duyệt trong app, nên một liên kết là một lần chạm tới trang giá (Guideline 3.1.1, 3.1.3(f)). Bản HTML đã bỏ các liên kết đó (nhánh `ios-web`, commit `3e81a48`).

Trang cũng có ở `https://fe-wedo.vercel.app/ho-tro.html`, vì hai tên miền phục vụ cùng một bản build. Nhưng mọi nơi chỉ dùng **một** địa chỉ: `https://wedofpt.com.vn/ho-tro.html`.

### 2.3. Các mốc neo (anchor) trong trang

File HTML ở Phụ lục A đặt sẵn `id` cho từng mục. Ghi chú cho người duyệt Apple hoặc nút trong app có thể trỏ thẳng tới mục cần xem:

| Mục | Địa chỉ |
|---|---|
| Liên hệ | `https://wedofpt.com.vn/ho-tro.html#lien-he` |
| Đăng nhập | `https://wedofpt.com.vn/ho-tro.html#dang-nhap` |
| Đã đăng ký bằng Google, đăng nhập trên iPhone | `https://wedofpt.com.vn/ho-tro.html#google-iphone` |
| Thông báo | `https://wedofpt.com.vn/ho-tro.html#thong-bao` |
| Gửi ảnh | `https://wedofpt.com.vn/ho-tro.html#gui-anh` |
| Tạo dự án | `https://wedofpt.com.vn/ho-tro.html#tao-du-an` |
| Báo cáo và chặn | `https://wedofpt.com.vn/ho-tro.html#bao-cao` |
| Xoá tài khoản | `https://wedofpt.com.vn/ho-tro.html#xoa-tai-khoan` |
| Dữ liệu bị xoá | `https://wedofpt.com.vn/ho-tro.html#du-lieu-bi-xoa` |
| AI và quyền riêng tư | `https://wedofpt.com.vn/ho-tro.html#ai` |

### 2.4. Những thứ KHÔNG đưa lên trang này

Trang được mở từ App Store. Để không vướng quy định của Apple:

- Không nhắc giá, gói trả phí, "Nâng cấp". Không liên kết tới `#/pricing`, `#/upgrade` hay `#/checkout` (Guideline 3.1.1(a) và 3.1.3(f)).
- Không nhắc tên nền tảng di động khác hay chợ ứng dụng khác (Guideline 2.3.10). Trang viết "ứng dụng WeDo trên điện thoại" thay cho tên nền tảng.
- Không hứa tính năng app chưa có. Mọi tính năng trang nhắc tới đã có trong mã trên các nhánh iOS; mục 5.1 ghi điều kiện để từng khối đúng (chủ yếu là máy chủ mới đã chạy).

---

## 3. Nội dung trang, từng khối

Thứ tự trên trang: Đầu trang → Liên hệ → Thời gian phản hồi → Câu hỏi thường gặp → Chính sách và điều khoản → Chân trang. Mục Liên hệ đặt trên cùng vì Apple đòi Support URL dẫn tới thông tin liên hệ thật (trợ giúp App Store Connect, mục Support URL), và đòi app lẫn Support URL có cách liên hệ dễ tìm (Guideline 1.5).

### 3.1. Đầu trang

```text
Hỗ trợ WeDo

Áp dụng cho web WeDo và ứng dụng WeDo trên điện thoại.

Gặp khó khi dùng WeDo? Xem các câu hỏi thường gặp bên dưới. Chưa thấy câu trả lời, hãy liên hệ với chúng tôi.
```

### 3.2. Liên hệ

Nguồn (nhánh `ios`): các dòng "Hỗ trợ", "Liên hệ: wedosupport6886@gmail.com" và "Góp ý cho WeDo" ở `src\app\(tabs)\account\index.tsx`; dòng "Hỗ trợ" mở trang này, dòng "Liên hệ" mở thư (không có ứng dụng thư thì mở trang này); giới hạn góp ý một lần ở `src\app\account\feedback.tsx`; số phiên bản hiện ở cuối tab Tài khoản.

```text
Liên hệ

Email: wedosupport6886@gmail.com
Kênh chính. Dùng cho mọi vấn đề về tài khoản, dữ liệu cá nhân và báo cáo vi phạm.

Facebook: https://www.facebook.com/WeDoTeamVietNam/
Trang Facebook chính thức của WeDo.

TikTok: https://www.tiktok.com/@wedoteamvietnam
Kênh TikTok chính thức của WeDo.

Trong ứng dụng: tab Tài khoản
Dòng "Hỗ trợ" mở trang này. Dòng "Liên hệ" mở thư gửi cho chúng tôi. Dòng "Góp ý cho WeDo" để chấm sao và góp ý; mỗi người gửi được một lần, và kênh này không có trả lời, nên cần phản hồi thì hãy gửi email.

Khi gửi email, bạn ghi giúp:
1. Email tài khoản WeDo của bạn.
2. Bạn dùng web hay ứng dụng. Nếu là ứng dụng, ghi đời iPhone và phiên bản iOS.
3. Phiên bản WeDo. Xem ở cuối tab Tài khoản, ví dụ "WeDo 1.0.13".
4. Bạn đã làm gì và thấy gì. Kèm ảnh chụp màn hình nếu có.

Đừng gửi mật khẩu cho ai, kể cả đội WeDo. Chúng tôi không cần mật khẩu của bạn để hỗ trợ.
```

### 3.3. Thời gian phản hồi

> ⚠ Giả định: 2 ngày làm việc là con số đề xuất. Con số 24 giờ cho báo cáo vi phạm đã nằm trong điều khoản, nên giữ; điều kiện là hộp thư ở mục 0 và trang quản trị "Báo cáo vi phạm" có người xem mỗi ngày. Con số 20 ngày và "mục 11" lấy theo Chính sách quyền riêng tư mới (`05-chinh-sach-bao-mat.md`). Nếu `05` đổi thời hạn, sửa ở đây theo.

```text
Thời gian phản hồi

- Câu hỏi và lỗi khi dùng: trả lời trong vòng 2 ngày làm việc.
- Báo cáo nội dung vi phạm hoặc người dùng quấy rối: xem xét trong vòng 24 giờ. Nếu đúng là vi phạm, chúng tôi gỡ nội dung và khoá tài khoản vi phạm.
- Yêu cầu xoá tài khoản qua email: xử lý trong vòng 20 ngày.
- Yêu cầu khác về dữ liệu cá nhân: xác nhận đã nhận trong vòng 2 ngày làm việc, xử lý trong thời hạn ghi ở mục 11 của Chính sách quyền riêng tư.
```

### 3.4. Không tìm thấy WeDo trên App Store

Nguồn: iOS tối thiểu 16.4 lấy từ `node_modules\expo-modules-core\ExpoModulesCore.podspec:54`.

> ⚠ Giả định: chỉ phát hành ở Việt Nam. `[LINK APP STORE]` chỉ có sau khi Apple duyệt. Bản HTML trên nhánh `ios-web` chưa có dòng cuối; thêm sau khi có link.

```text
Không tìm thấy WeDo trên App Store?

- Bản đầu tiên chỉ phát hành tại Việt Nam. Tài khoản Apple của bạn cần đặt quốc gia hoặc vùng là Việt Nam.
- WeDo cần iPhone chạy iOS 16.4 trở lên.
- WeDo dành cho người từ đủ 18 tuổi, và được xếp hạng 18+ trên App Store. Nếu iPhone đang bật giới hạn nội dung theo độ tuổi (Thời gian sử dụng), App Store có thể ẩn WeDo.
- Mở thẳng trang tải: [LINK APP STORE]
```

### 3.5. Đăng nhập

#### 3.5.1. Không đăng nhập được bằng email và mật khẩu

Nguồn: câu báo lỗi ở `BE_WEDO\src\auth\auth.service.ts:131,137`. Máy chủ so email **đúng từng chữ**, không đổi chữ hoa về chữ thường (`auth.service.ts:125-128`), và app chỉ cắt khoảng trắng (`src\app\(auth)\login.tsx`). Tài khoản tạo bằng Google nhận một mật khẩu ngẫu nhiên người dùng không biết (`auth.service.ts:81`). Câu báo tài khoản bị khoá ở `BE src\auth\tai-khoan-bi-khoa.ts` (nhánh `ios-backend`).

```text
Không đăng nhập được bằng email và mật khẩu

- Báo "Email hoặc mật khẩu không đúng": gõ lại email đúng như lúc đăng ký, kể cả chữ hoa và chữ thường. Mật khẩu có ít nhất 6 ký tự.
- Nếu lúc đầu bạn tạo tài khoản bằng nút "Tiếp tục với Google", bạn chưa từng đặt mật khẩu cho tài khoản đó. Hãy dùng "Quên mật khẩu?" để đặt mật khẩu (xem mục ngay dưới). Trên web, bạn cũng có thể bấm lại "Tiếp tục với Google".
- Báo "Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng": tài khoản bị khoá không đăng nhập được. Nếu bạn cho rằng chúng tôi xử lý nhầm, hãy gửi email cho chúng tôi trong vòng 30 ngày (Điều 11.4 của Điều khoản sử dụng).
- Kiểm tra Wi-Fi hoặc dữ liệu di động rồi thử lại.
- Vẫn không được: gửi email cho chúng tôi, ghi rõ câu báo lỗi bạn thấy.
```

#### 3.5.2. Đăng ký bằng Google, đăng nhập trên iPhone

Nguồn: ứng dụng iPhone ẩn nút Google (`08-sua-code-truoc-khi-nop.md`, IOS-02). Tài khoản tạo bằng Google có mật khẩu ngẫu nhiên (`BE_WEDO\src\auth\auth.service.ts:81`). "Quên mật khẩu" tìm tài khoản theo email, không phân biệt cách đăng ký (`BE_WEDO\src\auth\password-reset.service.ts:43`), rồi ghi mật khẩu mới (`:123-128`). Đăng nhập bằng email so mật khẩu mới đó (`auth.service.ts:125-140`). Đăng nhập Google trên web vẫn tìm theo email và không đụng mật khẩu (`auth.service.ts:73-101`). Máy chủ so email đúng từng chữ, nên phải gõ đúng Gmail bằng chữ thường. Đã đối chiếu mã ngày 26/09/2026: đường này chạy được, không cần sửa máy chủ.

```text
Tôi đăng ký bằng Google. Đăng nhập trên iPhone thế nào?

Ứng dụng WeDo trên iPhone chỉ đăng nhập bằng email và mật khẩu. Nếu bạn tạo tài khoản bằng nút "Tiếp tục với Google" trên web WeDo hoặc trên điện thoại khác, tài khoản đó chưa có mật khẩu mà bạn biết. Đặt mật khẩu một lần như sau:
1. Ở màn Đăng nhập trên iPhone, bấm "Quên mật khẩu?".
2. Nhập đúng địa chỉ Gmail bạn dùng với Google, viết chữ thường, rồi bấm "Gửi mã".
3. Mở hộp thư, tìm thư "Mã đặt lại mật khẩu WeDo". Nhớ xem cả thư mục thư rác.
4. Nhập "Mã 6 số" và "Mật khẩu mới" (ít nhất 6 ký tự), rồi bấm "Đặt lại mật khẩu".
5. Đăng nhập trên iPhone bằng địa chỉ Gmail đó và mật khẩu mới.

Đây vẫn là tài khoản cũ của bạn, với đủ dự án và tin nhắn. Trên web WeDo và trên điện thoại khác, bạn vẫn bấm "Tiếp tục với Google" như trước.
```

#### 3.5.3. Đăng nhập bằng Google (trên web)

Nguồn: nhãn nút ở `src\components\ui\GoogleButton.tsx:47`; nối tài khoản theo email ở `BE_WEDO\src\auth\auth.service.ts:73-96`; đăng xuất khỏi WeDo cũng đăng xuất Google để hộp chọn tài khoản hiện lại (`src\lib\auth\google-signin.ts`, hàm `signOutFromGoogle`); câu lỗi email chưa xác minh ở `auth.service.ts:253`.

Trang không nhắc tên nền tảng di động khác (xem 2.4), nên viết "trên điện thoại khác".

```text
Đăng nhập bằng Google (trên web)

- Nút "Tiếp tục với Google" có trên web WeDo và trên ứng dụng WeDo ở điện thoại khác. Ứng dụng trên iPhone chưa có nút này: xem mục ngay trên.
- Bấm "Tiếp tục với Google" rồi chọn tài khoản Google.
- Email Google trùng với email bạn đã đăng ký WeDo: bạn vào đúng tài khoản cũ.
- Chưa có tài khoản WeDo: WeDo tạo tài khoản mới, lấy họ tên và ảnh đại diện từ Google.
- Muốn đổi sang tài khoản Google khác: đăng xuất, rồi bấm lại "Tiếp tục với Google". Hộp chọn tài khoản sẽ hiện ra.
- Lỡ đóng hộp chọn tài khoản: không sao, bấm lại nút.
- Báo "Email Google chưa được xác minh": xác minh email trong tài khoản Google trước, rồi thử lại.
```

#### 3.5.4. Quên mật khẩu

Nguồn: màn `src\app\(auth)\forgot-password.tsx:124-185`; mã sống 10 phút và tối đa 5 lần sai ở `BE_WEDO\src\auth\password-reset.service.ts:8,11`; mã cũ bị huỷ khi xin mã mới ở dòng 56-60; tiêu đề thư ở `BE_WEDO\src\mail\mail.service.ts:99`; không tiết lộ email có tài khoản hay không ở `password-reset.service.ts:13-18,43-54`.

```text
Quên mật khẩu

1. Ở màn Đăng nhập, bấm "Quên mật khẩu?".
2. Nhập email đã đăng ký, bấm "Gửi mã".
3. Mở hộp thư, tìm thư "Mã đặt lại mật khẩu WeDo". Nhớ xem cả thư mục thư rác.
4. Nhập "Mã 6 số" và "Mật khẩu mới" (ít nhất 6 ký tự), rồi bấm "Đặt lại mật khẩu".
5. Đăng nhập lại bằng mật khẩu mới.

Lưu ý:
- Mã dùng được trong 10 phút và chỉ một lần.
- Nhập sai 5 lần thì phải xin mã mới. Khi bạn xin mã mới, mã cũ hết tác dụng.
- Gõ nhầm email: bấm "Gõ nhầm email? Nhập lại".
- Để bảo vệ bạn, WeDo không cho biết một email có tài khoản hay không. Nếu sau vài phút vẫn không có thư, kiểm tra lại email đã gõ và thư mục thư rác.
```

### 3.6. Thông báo không tới trên iPhone

Nguồn (nhánh `ios` trừ khi ghi khác):

- Trên iPhone, app **không** xin quyền khi đăng nhập; chỉ ghi mã thiết bị nếu đã có quyền (`src\lib\notifications\push-token.ts`, `coQuyenThongBao`). Thẻ "Nhắc bạn trước khi việc đến hạn" ở đầu tab Thông báo có nút "Bật thông báo" và "Để sau"; bấm "Bật thông báo" mới hiện hộp xin quyền, rồi ghi mã thiết bị ngay (`src\app\(tabs)\notifications\index.tsx`). iOS chỉ hiện hộp xin quyền một lần.
- Bốn công tắc trong app: `src\app\account\notification-settings.tsx`.
- Đăng xuất thì xoá mã thiết bị (`src\lib\notifications\push-token.ts`, `huyDangKyPushToken`).
- Mỗi dự án đẩy tối đa 1 thông báo cho mỗi người trong 10 phút: `BE_WEDO\src\chat\chat-push.service.ts`. Không gửi cho chính người gửi. Máy chủ mới không đẩy tin dự án của người mình đã chặn.
- Tin nhắn và kết bạn không tạo mục trong tab Thông báo, và không đi qua bốn công tắc trong app (`ChatPushService` gọi thẳng `sendToUser`).
- Lời mời kết bạn xem ở màn Bạn bè, mở bằng nút biểu tượng hai người ở góc trên tab Trò chuyện.
- Máy chủ gửi tới mọi thiết bị của một người (`BE_WEDO\src\notifications\expo-push.service.ts`, `sendToUser`).

> ⚠ Giả định: đã cài khoá APNs qua EAS (`08`, IOS-17). Chưa cài thì mọi thông báo trên iPhone mất lặng lẽ, và không bước nào trong khối này giúp được.

```text
Thông báo không tới trên iPhone

Kiểm tra lần lượt:
1. Trên iPhone, WeDo chỉ xin quyền gửi thông báo khi bạn bấm "Bật thông báo" ở thẻ đầu tab Thông báo. Nếu chưa bấm, hãy mở tab đó và bấm. Nếu bạn đã bấm "Để sau", tắt hẳn rồi mở lại ứng dụng để thẻ hiện lại.
2. Nếu lúc được hỏi bạn chọn "Không cho phép", iPhone sẽ không hỏi lại. Khi đó, mở Cài đặt của iPhone → Thông báo → WeDo, bật "Cho phép thông báo".
3. Vuốt tắt hẳn WeDo rồi mở lại. Khi mở, ứng dụng ghi nhận lại iPhone của bạn để nhận thông báo.
4. Trong WeDo, vào Tài khoản → Cài đặt thông báo. Xem bốn loại đã bật chưa: Giao việc, Duyệt việc, Nhắc hạn chót, Cuộc họp.
5. Nếu iPhone đang bật chế độ Tập trung (Focus), thêm WeDo vào danh sách ứng dụng được phép, hoặc tắt chế độ đó.
6. Bạn phải đang đăng nhập. Đăng xuất thì iPhone đó ngừng nhận thông báo.
7. Kiểm tra kết nối mạng.

Nên biết:
- Chat dự án: mỗi dự án gửi bạn tối đa 1 thông báo trong 10 phút, để máy không rung liên tục khi nhóm nhắn nhiều. Mở khung chat để đọc hết tin mới.
- Tin nhắn và lời mời kết bạn chỉ đến dưới dạng thông báo đẩy, không nằm trong tab Thông báo. Tin nhắn đọc ở tab Trò chuyện. Lời mời xem ở màn Bạn bè: chạm biểu tượng hai người ở góc trên tab Trò chuyện.
- Bốn công tắc ở Cài đặt thông báo không áp dụng cho tin nhắn và lời mời kết bạn. Muốn tắt cả những thông báo này, tắt thông báo của WeDo trong Cài đặt của iPhone.
- Bạn không nhận thông báo cho tin nhắn do chính mình gửi.
- Bạn không nhận thông báo về tin nhắn của người bạn đã chặn.
- Đăng nhập trên nhiều máy thì máy nào cũng nhận.
```

### 3.7. Gửi ảnh

Nguồn: nút "Chụp ảnh" và "Chọn ảnh từ máy" ở `src\components\chat\MessageComposer.tsx:107,121`; ảnh vừa chọn **không gửi ngay** mà vào dải xem trước có nút bỏ ảnh, người dùng bấm Gửi mới gửi, kèm chữ nếu có; tối đa 5 ảnh, 10 MB mỗi ảnh, nén 70% ở `src\lib\images\pick-images.ts`; máy chủ nhận tối đa 5 tệp mỗi lượt; không xin quyền thư viện, dùng bộ chọn ảnh của hệ thống; ảnh HEIC đổi sang JPEG trước khi gửi, và từ chối quyền máy ảnh thì hiện hộp thoại có nút "Mở Cài đặt" (nhánh `ios`, commit `0cc5b3b`); chat trong app chỉ gửi ảnh, còn tài liệu nộp qua nút "Nộp tài liệu", tối đa 10 tệp, 20 MB mỗi tệp (`src\lib\files\pick-documents.ts`).

> Ảnh HEIC đã được xử lý trong mã (mục 1). Còn phải thử trên iPhone thật.

```text
Gửi ảnh trong chat

Trong khung chat dự án hoặc tin nhắn riêng:
- Chạm biểu tượng máy ảnh để chụp ảnh mới.
- Chạm biểu tượng ảnh để chọn ảnh có sẵn.
- Ảnh hiện thành một hàng xem trước phía trên ô nhập. Chạm dấu × trên ảnh để bỏ ảnh đó. Gõ thêm chữ nếu muốn, rồi bấm Gửi.
- Mỗi tin gửi tối đa 5 ảnh, mỗi ảnh tối đa 10 MB. WeDo tự nén ảnh trước khi gửi.
- Chạm vào ảnh trong khung chat để xem toàn màn hình.

Máy ảnh không mở: lần đầu, iPhone hỏi quyền dùng Camera. Nếu bạn đã từ chối, WeDo hiện nút "Mở Cài đặt" để bạn bật lại Camera cho WeDo. Bạn cũng có thể vào Cài đặt của iPhone → Ứng dụng → WeDo. Trên iOS 17 trở về trước: Cài đặt → WeDo.

Chọn ảnh có sẵn: WeDo dùng bộ chọn ảnh của iPhone. WeDo chỉ nhận đúng những ảnh bạn chọn, không đọc cả thư viện ảnh.

Ảnh không gửi được:
- Kiểm tra kết nối mạng rồi gửi lại.
- Ảnh nặng quá 10 MB: chụp màn hình ảnh đó rồi gửi bản chụp.

Gửi tệp PDF, Word, Excel: chat trong ứng dụng hiện chỉ gửi ảnh. Muốn nộp tài liệu cho công việc bạn được giao, mở công việc đó và bấm "Nộp tài liệu". Mỗi lần nộp tối đa 10 tệp, mỗi tệp tối đa 20 MB.
```

### 3.8. Tạo dự án (làm trên web)

Nguồn:

- App không có chức năng tạo dự án: `src\lib\api\projects.ts` chỉ có `listProjects`. Màn trống nói rõ phải tạo trên web: `src\app\(tabs)\chat\index.tsx:365`.
- Nút "Tạo dự án" trên web: cột trái `FE_WEDO\src\components\layout\Sidebar.tsx:171-183`; trên điện thoại là nút giữa thanh dưới `FE_WEDO\src\components\layout\BottomNav.tsx:39-47`.
- Hộp tạo dự án: `FE_WEDO\src\views\WorkspaceView.tsx:736-846` (Tên dự án bắt buộc, Mô tả dự án, Thêm thành viên, vai trò Member/Leader, nút "Tạo dự án").
- Ô "Workspace đang xem" khi có nhiều không gian: `WorkspaceView.tsx:464-479`.
- Người được thêm phải có tài khoản sẵn: `BE_WEDO\src\projects\projects.service.ts:89-102`. Người tạo là Leader: dòng 37.
- Danh sách dự án có kéo xuống để làm mới (`src\app\(tabs)\chat\index.tsx:339-347`), và tự tải lại mỗi khi quay về màn này (dòng 128). Dòng 299-301 là danh sách Tin nhắn, không phải Dự án.
- Tên không gian làm việc là dòng phụ dưới tiêu đề, chạm vào để đổi (`chat\index.tsx:178-179`).

```text
Tạo dự án (làm trên web)

Ứng dụng dùng để trò chuyện, nhận việc, nộp bài và theo dõi hạn chót. Tạo dự án và thêm thành viên thì làm trên web WeDo.

1. Mở wedofpt.com.vn trên máy tính hoặc trình duyệt điện thoại. Đăng nhập bằng đúng tài khoản bạn dùng trong ứng dụng.
2. Vào mục Dự án. Nếu bạn có nhiều không gian làm việc, chọn đúng ở ô "Workspace đang xem".
3. Bấm "Tạo dự án". Trên máy tính, nút này ở cột bên trái. Trên điện thoại, đó là nút dấu cộng ở giữa thanh dưới.
4. Nhập "Tên dự án" (bắt buộc) và "Mô tả dự án" (không bắt buộc).
5. Ở phần "Thêm thành viên", nhập email, số điện thoại hoặc ID tài khoản WeDo của từng người, mỗi dòng một người. Chọn vai trò Member hoặc Leader. Có thể bỏ qua bước này và thêm sau.
6. Bấm "Tạo dự án". Người tạo là Leader của dự án.
7. Mở ứng dụng, vào tab Trò chuyện, kéo danh sách xuống để làm mới. Dự án mới hiện ra cùng kênh chat riêng.

Lưu ý:
- Người được thêm phải có tài khoản WeDo trước.
- Không thấy dự án trong ứng dụng: kiểm tra bạn đang ở đúng không gian làm việc. Chạm vào tên không gian làm việc ngay dưới tiêu đề màn hình để đổi.
```

### 3.9. Báo cáo và chặn người dùng

Nguồn: đã làm trên nhánh `ios` và `ios-backend` (`08-sua-code-truoc-khi-nop.md`, IOS-03, IOS-04). Bảng thao tác và phiếu báo cáo ở `src\components\moderation\BangThaoTac.tsx`, `PhieuBaoCao.tsx`; sáu lý do và câu xác nhận ở `src\lib\moderation\noi-dung.ts`; màn Người đã chặn ở `src\app\account\blocked.tsx`; bộ lọc ở `BE src\moderation\word-filter.ts`; khoá tài khoản ở `BE src\moderation\moderation-admin.service.ts`. Nút "Xóa khỏi dự án" cho người quản lý dự án trên web có thật: `FE_WEDO\src\views\WorkspaceView.tsx:1228`. Phần "Báo cáo qua email" luôn đúng và nên giữ.

```text
Báo cáo và chặn người dùng

WeDo không chấp nhận nội dung xúc phạm, quấy rối, đe doạ, khiêu dâm, bạo lực hay lừa đảo. Từ ngữ thô tục trong tin nhắn và tên hiển thị được tự động thay bằng dấu ***.

Báo cáo một tin nhắn:
1. Nhấn giữ tin nhắn cần báo cáo, trong chat dự án hoặc tin nhắn riêng.
2. Chọn "Báo cáo tin nhắn".
3. Chọn lý do, thêm mô tả nếu muốn, rồi gửi.

Báo cáo một người:
1. Trong tin nhắn riêng với người đó, bấm nút ba chấm ở đầu cuộc trò chuyện. Hoặc mở màn Bạn bè (biểu tượng hai người ở góc trên tab Trò chuyện) và bấm nút ba chấm cạnh tên họ. Cách này dùng được cho cả lời mời kết bạn.
2. Chọn "Báo cáo người này", chọn lý do rồi gửi.

Có sáu lý do để chọn: Spam, quảng cáo; Quấy rối, bắt nạt; Thù ghét, phân biệt đối xử; Nội dung tình dục; Bạo lực, đe doạ; Lý do khác.

Chặn một người:
1. Nhấn giữ một tin nhắn của người đó, hoặc bấm một trong hai nút ba chấm nói trên.
2. Chọn "Chặn người này", rồi xác nhận.
Việc chặn có tác dụng ngay. Hai người không nhắn tin riêng, không kết bạn và không tìm thấy nhau được nữa. Quan hệ bạn bè và lời mời kết bạn giữa hai người bị xoá. Trong ứng dụng, tin nhắn của người bị chặn bị ẩn với bạn, kể cả trong chat dự án chung. Họ không nhận được thông báo nào về việc bị chặn. Bỏ chặn ở Tài khoản → Người đã chặn.

Chặn không đưa người đó ra khỏi dự án chung. Hãy báo cáo để chúng tôi xử lý, hoặc nhờ Leader dự án xoá người đó khỏi dự án trên web.

Báo cáo qua email: gửi tới wedosupport6886@gmail.com với tiêu đề "Báo cáo vi phạm". Ghi tên người vi phạm, tên dự án hoặc cuộc trò chuyện, thời điểm, và kèm ảnh chụp màn hình.

Chúng tôi xem xét mọi báo cáo trong vòng 24 giờ. Nếu đúng là vi phạm, chúng tôi gỡ nội dung và khoá tài khoản vi phạm. Tài khoản bị khoá không đăng nhập được nữa.

Nếu bạn hoặc người khác đang gặp nguy hiểm, hãy gọi ngay 113 (công an) hoặc 115 (cấp cứu).
```

### 3.10. Xoá tài khoản

Nguồn:

- Dòng "Xoá tài khoản" gần cuối tab Tài khoản, ngay trên "Đăng xuất": `src\app\(tabs)\account\index.tsx` (nhánh `ios`).
- Màn xoá: `src\app\account\delete-account.tsx`. Danh sách dữ liệu (có dòng "Tin nhắn riêng, danh sách bạn bè, ảnh và tệp bạn đã tải lên"), thẻ chuyển quyền sở hữu và hộp xác nhận "Chuyển", từ `XOA`, nút "Xoá tài khoản vĩnh viễn" và hộp xác nhận "Xoá tài khoản". Xoá xong tự đăng xuất. Tải thông tin lỗi thì hiện "Không tải được thông tin tài khoản." cùng nút "Thử lại".
- Máy chủ xoá hẳn, không có thời gian chờ, rồi xoá tệp trên Azure Blob (`BE src\users\users.service.ts`, nhánh `ios-backend`).
- Web **chưa có** nút xoá tài khoản: thẻ "Bảo mật" trong Cài đặt web chỉ ghi "Chưa khả dụng" (`FE_WEDO\src\views\SettingsView.tsx:317-324`). Hạn xử lý qua email là 20 ngày theo mục 10 của `05-chinh-sach-bao-mat.md`.

> Bản này không có Đăng nhập bằng Apple, nên trang không có khối về thu hồi quyền Apple (khối đó để ở Phụ lục C). Apple không cho bắt người dùng gửi email để xoá tài khoản. Ở đây email chỉ là đường phụ cho người chỉ dùng web, còn app có nút xoá riêng, nên không vướng.

```text
Xoá tài khoản

Trong ứng dụng WeDo trên iPhone:
1. Mở WeDo và đăng nhập.
2. Vào tab Tài khoản.
3. Chọn "Xoá tài khoản".
4. Đọc danh sách dữ liệu sẽ bị xoá.
5. Nếu bạn là chủ một không gian làm việc còn thành viên khác, ứng dụng hiện thẻ của không gian đó. Chạm vào người sẽ nhận quyền sở hữu, rồi bấm "Chuyển". Làm như vậy với từng không gian.
6. Gõ XOA vào ô xác nhận.
7. Bấm "Xoá tài khoản vĩnh viễn", rồi bấm "Xoá tài khoản" để xác nhận.
Tài khoản bị xoá ngay và ứng dụng tự đăng xuất. Không có thời gian chờ và không khôi phục được.

Ứng dụng WeDo trên các điện thoại khác cũng có các bước giống hệt.

Trên web:
Web WeDo chưa có nút xoá tài khoản. Bạn xoá trong ứng dụng như trên, hoặc gửi email:
1. Gửi từ chính email của tài khoản tới wedosupport6886@gmail.com.
2. Tiêu đề: "Yêu cầu xoá tài khoản WeDo".
3. Chúng tôi xác minh, xoá trong vòng 20 ngày và báo lại cho bạn.

Không thấy nút xoá: màn Xoá tài khoản cần tải thông tin trước. Nếu thấy "Không tải được thông tin tài khoản", kiểm tra mạng rồi bấm "Thử lại". Vẫn không được thì gửi email cho chúng tôi.

Chỉ muốn ngừng nhận thông báo? Không cần xoá tài khoản. Vào Tài khoản → Cài đặt thông báo để tắt từng loại. Muốn tắt hết, kể cả tin nhắn và lời mời kết bạn, vào Cài đặt của iPhone → Thông báo → WeDo.
```

### 3.11. Dữ liệu nào bị xoá

Nguồn: mọi quan hệ trỏ tới `User` trong `BE_WEDO\prisma\schema.prisma` (đã rà từng dòng `onDelete`), cộng phần dọn tệp của máy chủ mới:

- Xoá theo (`Cascade`): `RefreshToken`, `PasswordResetCode`, `UserFeedback`, `Workspace` do mình làm chủ, `WorkspaceMember`, `ProjectMember`, `TaskSubmission`, `Notification`, `PushToken`, `ChatMessage`, `DirectConversationParticipant`, `DirectMessage`, `ChatReaction`, `ProjectChatRead`, `Friendship` (cả hai chiều), `ChatAttachment`, `Event`, `Meeting` do mình tạo, `MeetingActionItem` do mình tạo, `MeetingParticipant`, `EntitlementUsage`, `AiUsageEvent`, và `UserBlock` (cả hai chiều, nhánh `ios-backend`).
- Giữ lại, bỏ liên kết (`SetNull`): `Task.assignee` (việc thành chưa giao), `Notification.actor`, `ChatMessage.pinnedBy`, `MeetingActionItem.assignee`, và `ContentReport` (người báo cáo, người bị báo cáo, người xử lý; nhánh `ios-backend`).
- Tệp trên Azure Blob: máy chủ mới xoá tệp đính kèm và bài nộp người đó tải lên, cùng tệp trong không gian bị xoá theo, ngay sau khi xoá tài khoản. Chỉ xoá tệp không còn dòng nào trỏ tới, nên tệp trong tin chuyển tiếp của người khác vẫn còn. Ảnh đại diện nằm trong dòng `User`.
- Cũng xoá theo nhưng **cố ý không nhắc trên trang** (Guideline 3.1.3(f), trang không nói chuyện mua bán): `Subscription`, `PaymentOrder`. Mục 10 của `05-chinh-sach-bao-mat.md` đã nói phần đơn thanh toán.
- `Task` không có cột người tạo, nên việc trong dự án chung vẫn còn.
- `Meeting.transcript` của cuộc họp **do người khác tạo** vẫn giữ nguyên lời nói của người đã xoá.
- Bản sao ở bên thứ ba (bản sao lưu cơ sở dữ liệu, bản chép lời ở Daily.co, sự kiện PostHog trên web) chưa tự xoá: mục 10 của `05`.

```text
Dữ liệu nào bị xoá khi xoá tài khoản

Bị xoá vĩnh viễn:
- Hồ sơ: họ tên, email, mật khẩu, số điện thoại, ngày sinh, ảnh đại diện.
- Tin nhắn bạn đã gửi trong chat dự án và tin nhắn riêng, cùng ảnh đính kèm và biểu tượng cảm xúc bạn đã thả. Các tin này biến mất khỏi khung chat của mọi người.
- Danh sách bạn bè, lời mời kết bạn và danh sách người bạn đã chặn.
- Thông báo của bạn, thông tin thiết bị dùng để gửi thông báo, và phiên đăng nhập.
- Tài liệu bạn đã nộp cho công việc.
- Cuộc họp và sự kiện lịch do bạn tạo. Chúng cũng biến mất với các thành viên khác.
- Góp ý bạn đã gửi và lịch sử dùng AI của bạn.
- Không gian làm việc chỉ có mình bạn, cùng mọi dự án, công việc, tin nhắn và tệp bên trong.
- Ảnh và tài liệu bạn đã tải lên được xoá khỏi kho lưu trữ ngay sau khi tài khoản bị xoá.

Được giữ lại:
- Công việc trong dự án chung vẫn còn cho nhóm. Việc bạn đang phụ trách chuyển thành chưa giao cho ai.
- Không gian làm việc có thành viên khác vẫn còn. Nếu bạn là chủ, quyền sở hữu đã chuyển cho người bạn chọn.
- Tin nhắn người khác chuyển tiếp từ tin của bạn là bản sao do họ gửi. Bản sao đó vẫn còn và có thể ghi tên bạn là người viết gốc.
- Biên bản của cuộc họp do người khác tạo có thể vẫn nhắc tên hoặc lời nói của bạn. Muốn xoá phần đó, hãy gửi email cho chúng tôi.
- Báo cáo vi phạm do bạn gửi hoặc về bạn được giữ làm hồ sơ xử lý, nhưng không còn gắn với tài khoản của bạn.
- Một số bản sao ở nơi khác chưa tự xoá ngay, như bản chép lời cuộc họp ở Daily.co. Xem mục 10 của Chính sách quyền riêng tư.
```

### 3.12. AI và quyền riêng tư

Nguồn:

- Nhấn giữ tin nhắn → "Tạo công việc bằng AI" (chỉ hiện với Leader dự án và chủ không gian làm việc) → hộp thoại xin đồng ý lần đầu: `src\app\(tabs)\chat\[projectId].tsx`, `src\lib\ai\dong-y-ai.ts` (nhánh `ios`); nút "Tạo công việc" ở `src\components\chat\TaskSuggestionSheet.tsx`.
- Máy chủ chỉ cho Leader dự án hoặc chủ không gian làm việc dùng AI.
- **Trên web, mỗi tin Leader gửi trong chat dự án đều tự được đưa cho AI** (`FE_WEDO\src\views\ChatView.tsx:920-923`), ngoài nút phân tích từng tin (dòng 1452). Vì 12 tin gần nhất đi kèm, tin của người dùng iPhone cũng có thể bị gửi đi dù không ai nhấn giữ.
- Dữ liệu gửi đi (máy chủ mới, nhánh `ios-backend`): tên dự án, tin được chọn, tối đa 12 tin gần nhất kèm tên tác giả và thời điểm gửi, danh sách thành viên (tên, vai trò). **Không có email hay số điện thoại.** Chỉ gửi phần chữ, không gửi ảnh hay tệp.
- Nhà cung cấp: Gemini, rồi Azure OpenAI, rồi OpenAI; mỗi lúc một nhà cung cấp.
- Tin nhắn riêng không có AI.
- Tóm tắt họp làm trên web: nút "Bắt đầu ghi biên bản AI" ở `FE_WEDO\src\views\MeetingView.tsx:1444`.
- Góp ý ẩn danh được AI tổng hợp cho trang quản trị: `BE_WEDO\src\feedback\feedback.service.ts:477-493`.
- Hạn mức: nhắc khi còn 3 lượt, báo ngày nạp lại khi hết, vẫn tạo tay được (`src\lib\ai\han-muc.ts`).

> Trang không nói "dữ liệu không dùng để huấn luyện". Chỉ thêm câu đó khi đã xác nhận khoá Gemini thuộc gói trả phí (xem mục 5.2). Khi web thêm bước hỏi trước khi gửi cho AI, bỏ câu "Trên web, việc tự đưa tin…" và sửa mục 8.3 của `05` cùng lúc.

```text
AI và quyền riêng tư

WeDo dùng AI ở hai tính năng cho người dùng, và ở một công cụ nội bộ để đội WeDo đọc tổng hợp góp ý. Chỉ phần chữ được gửi cho AI. Ảnh và tệp không được gửi.

1. Tạo công việc từ tin nhắn
- Trong ứng dụng: trong chat dự án, nhấn giữ một tin nhắn rồi chọn "Tạo công việc bằng AI".
- Trên web: Leader bấm phân tích một tin nhắn. Ngoài ra, khi Leader gửi một tin trong chat dự án trên web, web tự đưa tin đó cho AI để gợi ý công việc.
Chỉ Leader dự án hoặc chủ không gian làm việc dùng được tính năng này. AI đề xuất tên việc, mô tả, người phụ trách và hạn chót. Leader xem lại, sửa nếu cần, rồi bấm "Tạo công việc". Chưa bấm thì chưa có công việc nào được tạo.

2. Tóm tắt cuộc họp (làm trên web)
Khi một thành viên bấm "Bắt đầu ghi biên bản AI" trong phòng họp trên web, dịch vụ phòng họp Daily.co chuyển lời nói của mọi người trong phòng thành chữ. WeDo gửi tiêu đề cuộc họp và bản chữ đó cho AI để viết tóm tắt, các quyết định và việc cần làm. Hãy báo cho mọi người trong phòng trước khi bật ghi biên bản. Trong ứng dụng, bạn xem kết quả ở màn chi tiết cuộc họp.

Dữ liệu được gửi cho AI:
- Khi tạo công việc từ tin nhắn: tên dự án; tin nhắn được chọn; tối đa 12 tin gần nhất trong chat dự án đó, kèm họ tên người viết và thời điểm gửi; danh sách thành viên dự án (họ tên, vai trò) để AI gợi ý người phụ trách. WeDo không gửi email hay số điện thoại của ai.
- Khi tóm tắt cuộc họp: tiêu đề và bản chép lời của cuộc họp.
- Góp ý bạn gửi trong ứng dụng (số sao và lời nhận xét, không kèm tên) có thể được gửi cho AI để đội WeDo đọc tổng hợp. Đừng ghi thông tin cá nhân vào góp ý.

Ai xử lý: máy chủ WeDo dùng một trong ba nhà cung cấp: Google Gemini của Google, Azure OpenAI của Microsoft, hoặc OpenAI. Mỗi lúc chỉ dùng một nhà cung cấp.

Nên biết:
- AI không đọc tin nhắn riêng giữa hai người.
- 12 tin gần nhất có thể do thành viên khác viết. Vì vậy tin bạn viết trong chat dự án có thể được gửi cho AI mỗi khi Leader dùng tính năng này, trên ứng dụng hoặc trên web. Đừng viết thông tin nhạy cảm trong chat dự án. Nếu không muốn tin của mình được gửi cho AI, hãy báo Leader.
- WeDo không bán dữ liệu và không dùng dữ liệu của bạn cho quảng cáo.

Bạn kiểm soát:
- Lần đầu dùng "Tạo công việc bằng AI", ứng dụng hỏi bạn có đồng ý gửi dữ liệu cho nhà cung cấp AI không. Không đồng ý thì không có gì được gửi, và bạn vẫn tạo công việc bằng tay với nút dấu cộng ở tab Công việc.
- Muốn rút lại sự đồng ý: tắt công tắc "Cho phép dùng AI" trong tab Tài khoản, hoặc gửi email cho chúng tôi. Việc rút lại không thu hồi được dữ liệu đã gửi trước đó.
- Công tắc này chỉ áp dụng trong ứng dụng. Trên web, việc tự đưa tin của Leader cho AI hiện chạy mà không hỏi trước.
- Mỗi tháng có giới hạn số lượt AI. Khi còn 3 lượt, ứng dụng báo trước. Hết lượt, ứng dụng cho biết ngày lượt được nạp lại. Trong lúc chờ, bạn vẫn tạo công việc bằng tay.

Chi tiết hơn: xem mục 8 của Chính sách quyền riêng tư.
```

### 3.13. Chính sách, điều khoản và chân trang

```text
Chính sách và điều khoản

- Chính sách quyền riêng tư: https://wedofpt.com.vn/privacy.html
- Điều khoản sử dụng: https://wedofpt.com.vn/dieu-khoan.html
- Hướng dẫn xoá tài khoản: https://wedofpt.com.vn/xoa-tai-khoan.html

WeDo dành cho người từ đủ 18 tuổi trở lên (Điều 2 của Điều khoản sử dụng).

© 2026 WeDo Team
```

Bốn trang pháp lý trên nhánh `ios-web` dùng chung một chân trang có liên kết tới nhau, và dòng `© 2026 WeDo Team`.

---

## 4. Dành cho chủ dự án: điền App Store Connect

### 4.1. Support URL (bắt buộc)

Chỗ điền: App Store Connect → Apps → chọn app (tên đã chốt `WeDo: Làm việc nhóm`, theo `02-thong-tin-app-store.md`) → mục iOS App, phiên bản **1.0.13** (trạng thái Prepare for Submission) → cùng khung với Promotional Text, Description, Keywords → ô **Support URL**.

Apple không ghi giới hạn ký tự cho ô này. Apple chỉ đòi ghi đủ cả giao thức (`https://`), và trang phải dẫn tới thông tin liên hệ thật (trợ giúp App Store Connect, mục "Platform version information", đọc ngày 26/09/2026).

Số ký tự: **34**.

```text
https://wedofpt.com.vn/ho-tro.html
```

- Trang phải sống (HTTP 200) **trước** khi bấm Submit for Review. Người duyệt mở trang này, và Apple đòi nó dẫn tới thông tin liên hệ thật (Guideline 1.5).
- Dùng tên miền `wedofpt.com.vn`, không dùng `fe-wedo.vercel.app`. Cùng tên miền với Chính sách quyền riêng tư, và không lộ tên dịch vụ lưu trữ.
- Trang đã làm xong trên nhánh `ios-web`, nên không cần đường lui. Chỉ cần đăng theo Bước B của `08`. App cũng trỏ tới đúng địa chỉ này, nên trang chưa đăng thì dòng "Hỗ trợ" trong app mở ra trang 404.

### 4.2. Marketing URL (không bắt buộc)

**Khuyên dùng: để trống ở bản 1.0.13**, giống `02-thong-tin-app-store.md`.

Lý do: ứng viên tự nhiên là trang chủ `https://wedofpt.com.vn/` (23 ký tự, đang trả 200). Nhưng trang chủ có nút "Bảng giá" trên thanh menu (`FE_WEDO\src\views\LandingView.tsx:254`) và nhúng nguyên bảng giá có nút đăng ký (dòng 633-639, component `PricingView`). Marketing URL là metadata. Guideline 3.1.1(a) cấm metadata có đường dẫn đưa khách tới cách mua ngoài in-app purchase, ở mọi storefront trừ Mỹ. Guideline 3.1.3(f) chỉ miễn in-app purchase khi không có lời mời mua ở ngoài. Ô này không bắt buộc, nên để trống là an toàn nhất.

Điền ở phiên bản sau, khi đã có một trang giới thiệu **không** có giá, gói hay nút mua.

- Không bao giờ dán `#/pricing`, `#/upgrade` hay `#/checkout` vào ô này hay bất kỳ ô nào khác.

### 4.3. Các ô URL liên quan (thuộc tài liệu khác)

- Privacy Policy URL, ở mục App Privacy: `https://wedofpt.com.vn/privacy.html` (trang "Chính sách quyền riêng tư"). Chi tiết trong `03-app-privacy.md`.
- Trong App Review Notes, có thể trỏ người duyệt tới `https://wedofpt.com.vn/ho-tro.html#bao-cao` (báo cáo và chặn) và `https://wedofpt.com.vn/ho-tro.html#xoa-tai-khoan` (xoá tài khoản).

### 4.4. Tên thật của bạn trên trang

Bạn đăng ký Apple Developer Program dưới dạng cá nhân, nên App Store tự hiện tên người bán là tên pháp lý của bạn (⚠ Giả định: Lê Hữu Đại).

Trợ giúp App Store Connect ghi: Support URL phải dẫn tới thông tin liên hệ thật (địa chỉ pháp lý, email, số điện thoại) **khi luật địa phương đòi hỏi**. Trang này hiện chỉ có email và hai kênh mạng xã hội. Email là mức tối thiểu, và phải có người đọc.

⚠ Giả định: luật Việt Nam không bắt một cá nhân phát hành app miễn phí ghi địa chỉ hay số điện thoại trên trang hỗ trợ. Tài liệu này không kiểm được điều đó. Nếu hỏi người có chuyên môn mà phải ghi thêm, dùng đúng thông tin thật của bạn, đặt ngay dưới dòng Email ở mục Liên hệ, và ghi giống chỗ ghi tên, địa chỉ nhà phát triển trong `06-dieu-khoan-su-dung.md`. Không bịa số điện thoại hay địa chỉ.

---

## 5. Việc phải xong trước khi đăng trang

### 5.1. Điều kiện để từng khối đúng

Mọi tính năng trang nhắc tới đã có trong mã trên các nhánh iOS. Nhưng trang chỉ đúng khi máy chủ mới đã chạy, và khi bản iOS nộp duyệt có đủ các tính năng đó.

| Khối trên trang | Đúng khi | Trạng thái |
|---|---|---|
| Các bước báo cáo, chặn và câu về bộ lọc `***` (mục 3.9) | Máy chủ mới chạy; bản iOS có bảng thao tác và phiếu báo cáo | Mã đã làm. Chờ Bước A của `08` |
| Mục "Tôi đăng ký bằng Google…" (mục 3.5.2) | Bản iOS đã ẩn nút Google | Đã làm (`08`, IOS-02) |
| "chọn Tạo công việc bằng AI" và phần "Bạn kiểm soát" (mục 3.12) | Bản iOS có bảng thao tác, hộp thoại đồng ý và công tắc "Cho phép dùng AI" | Đã làm (`08`, IOS-04, IOS-08) |
| "Dữ liệu được gửi cho AI … không gửi email" (mục 3.12) | Máy chủ mới chạy | Mã đã làm. Chờ Bước A |
| "Ảnh và tài liệu bạn đã tải lên được xoá khỏi kho lưu trữ" (mục 3.11) | Máy chủ mới chạy | Mã đã làm. Chờ Bước A |
| Thẻ "Bật thông báo" (mục 3.6) | Bản iOS mới | Đã làm (`08`, IOS-29) |
| Nút "Mở Cài đặt" khi từ chối máy ảnh (mục 3.7) | Bản iOS mới | Đã làm (`08`, IOS-35) |
| Nút "Thử lại" ở màn xoá tài khoản (mục 3.10) | Bản iOS mới | Đã làm (`08`, IOS-20) |
| Dòng Điều khoản sử dụng (mục 3.13) | `dieu-khoan.html` trả 200 | Đăng cùng lúc (`08`, Bước B) |
| Dòng `[LINK APP STORE]` (mục 3.4) | Apple đã duyệt | Bản HTML chưa có dòng này; thêm sau khi có link |

### 5.2. Việc chỉ bạn làm được

1. **Email hỗ trợ đã chốt** là `wedosupport6886@gmail.com` và đã điền vào trang. Việc còn lại: phân công người đọc hộp thư mỗi ngày (mục 0), và đặt `REPORT_NOTIFY_EMAIL` trên Azure (`08`, Bước A2).
2. **Chốt thời gian phản hồi** ở mục 3.3.
3. **Xác nhận nhà cung cấp AI đang chạy.** Vào Azure Portal → App Service `api-wedo-backend-dai` → Settings → Environment variables. Có `GEMINI_API_KEY` thì là Gemini. Không có mà có `AZURE_OPENAI_*` thì là Azure OpenAI. Chỉ có `OPENAI_API_KEY` thì là OpenAI. Khi biết, có thể sửa câu "Ai xử lý" ở mục 3.12 cho cụ thể hơn.
4. **Muốn ghi "không dùng để huấn luyện"**: vào Google AI Studio hoặc Google Cloud Console, mở dự án chứa khoá Gemini, xem đã bật thanh toán (Cloud Billing) chưa. Đã bật thì có thể thêm câu sau vào phần "Nên biết" của mục 3.12, và chọn phương án A ở mục 8.4 của `05`. Chưa bật thì không được thêm.

   ```text
   - Nhà cung cấp AI không dùng dữ liệu WeDo gửi đi để huấn luyện mô hình của họ.
   ```

5. **Sau khi Apple duyệt**: thêm dòng link App Store vào mục "Không tìm thấy WeDo trên App Store?".

### 5.3. Chỗ trống phải điền

| Chỗ trống | Ghi chú |
|---|---|
| `[LINK APP STORE]` | Chỉ có sau khi được duyệt. Bản HTML trên nhánh `ios-web` chưa có dòng này; thêm sau. |

### 5.4. Sửa mã đi kèm: trạng thái

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Tạo `public/ho-tro.html` | **Đã làm** (nhánh `ios-web`, commit `1f6e813` và các commit sửa sau) |
| 2 | Máy chủ xoá tệp khi xoá tài khoản | **Đã làm** (nhánh `ios-backend`, commit `3386c52`) |
| 3 | Sửa ảnh HEIC trên iPhone | **Đã làm** (nhánh `ios`, commit `0cc5b3b`) |
| 4 | Dòng "Hỗ trợ" và "Liên hệ: wedosupport6886@gmail.com" trong tab Tài khoản; dòng "Chính sách quyền riêng tư" luôn hiện | **Đã làm** (nhánh `ios`, commit `43ad40d`, `dd1fa4e`) |
| 5 | Chân trang trang chủ web có liên kết Hỗ trợ, Chính sách quyền riêng tư, Điều khoản | **Đã làm** (nhánh `ios-web`, commit `85cf0b5`) |
| 6 | Chân trang `privacy.html` và `xoa-tai-khoan.html` có liên kết tới `/ho-tro.html` | **Đã làm** (nhánh `ios-web`) |
| 7 | Bỏ chữ chỉ tên một nền tảng ở `xoa-tai-khoan.html` | **Đã làm** (nhánh `ios-web`, commit `2d02fa7`) |
| 8 | Thay `privacy.html` bằng bản mới, sửa hạn xoá qua email từ 30 thành 20 ngày | **Đã làm** (nhánh `ios-web`, commit `c4b98c2`, `2d02fa7`) |
| 9 | Bổ sung danh sách trong màn Xoá tài khoản, thêm nút "Thử lại" | **Đã làm** (nhánh `ios`, commit `dd1fa4e`) |
| 10 | Câu báo khi bị từ chối quyền máy ảnh theo kiểu iPhone | **Đã làm** (nhánh `ios`, commit `0cc5b3b`) |
| 11 | Không bắt buộc: nút xoá tài khoản trên web | Còn lại. Làm xong thì sửa đoạn "Trên web" ở mục 3.10 |

### 5.5. Kiểm tra sau khi web deploy

1. Chạy lệnh sau. Phải ra `200`.

   ```text
   curl -s -o /dev/null -w "%{http_code}\n" https://wedofpt.com.vn/ho-tro.html
   ```

2. Mở trang trên Safari của iPhone. Kiểm tra:
   - Không cuộn ngang. Chữ đọc được mà không phải phóng to.
   - Chạm vào email thì mở ứng dụng Mail, có sẵn tiêu đề.
   - Chạm từng mục trong phần "Trên trang này" thì nhảy đúng chỗ.
   - Liên kết Facebook, TikTok, Chính sách quyền riêng tư, Điều khoản, Xoá tài khoản đều mở được.
3. Mở trang trên trình duyệt máy tính, bấm Ctrl+F để tìm trên trang đang hiện. Không được thấy: `[LINK`, `[`, `Android`, `CH Play`, `Bảng giá`, `Nâng cấp`, `pricing`, `checkout`, `Apple ID`, `Đăng nhập bằng Apple`. (Tìm trên trang đang hiện, không tìm trong mã nguồn: chú thích HTML có nhắc vài chữ này để dặn người sửa.)
4. Mở trang khi **chưa đăng nhập** web. Trang phải hiện đủ, không đòi đăng nhập.
5. Trong app bản TestFlight, bấm dòng "Hỗ trợ" ở tab Tài khoản: trang mở trong trình duyệt trong app.

---

## Phụ lục A. File `ho-tro.html`

Tệp đã làm xong, nằm ở `D:\WEDO_PC\FE_WEDO-ios\public\ho-tro.html` (nhánh `ios-web`, commit `1f6e813` và các commit sửa sau). Bản HTML nháp từng chép ở đây đã bỏ, để không có hai bản lệch nhau. Nội dung chữ của trang trùng với các khung `text` ở mục 3; sửa chữ ở mục 3 thì sửa cả tệp đó.

Xem tệp: mở thư mục `D:\WEDO_PC\FE_WEDO-ios\public`, hoặc chạy `git show ios-web:public/ho-tro.html` trong `D:\WEDO_PC\FE_WEDO-ios`.

Kiểu trình bày giống `xoa-tai-khoan.html`: khung rộng 720px, màu chính `#0055c7`, phông hệ thống, không dùng thư viện ngoài, không có JavaScript. Mỗi mục có `id` như bảng ở mục 2.3.

---

## Phụ lục B. Đã kiểm những gì, ở đâu

Kiểm tra mạng ngày 26/09/2026:

| Địa chỉ | Kết quả |
|---|---|
| `https://wedofpt.com.vn/privacy.html` | 200 |
| `https://wedofpt.com.vn/xoa-tai-khoan.html` | 200 |
| `https://wedofpt.com.vn/` | 200 |
| `https://wedofpt.com.vn/ho-tro.html` | **404** (đã làm trên nhánh `ios-web`, chưa đăng) |
| `https://wedofpt.com.vn/dieu-khoan.html` | **404** (đã làm trên nhánh `ios-web`, chưa đăng) |
| `https://wedofpt.com.vn/privacy` (không đuôi) | 404, nên phải giữ `.html` |
| `https://www.facebook.com/WeDoTeamVietNam/` | 200 |
| `https://www.tiktok.com/@wedoteamvietnam` | 200 |

Những điều trên trang được đối chiếu với mã, không lấy từ trí nhớ:

| Điều trên trang | Nguồn |
|---|---|
| Email đang công bố | `FE_WEDO\public\privacy.html:140`; `xoa-tai-khoan.html:69,106` |
| Web điều hướng bằng `#`, route lạ về trang chủ | `FE_WEDO\src\App.tsx:64,89-114` |
| Trang tĩnh trong `public/` đi thẳng qua Vercel | `FE_WEDO\public\privacy.html:2-4` |
| SPA khởi động PostHog ngay khi tải | `FE_WEDO\src\main.tsx:12` |
| Câu lỗi đăng nhập, email so đúng từng chữ | `BE_WEDO\src\auth\auth.service.ts:125-137` |
| Google nối tài khoản theo email, tạo mật khẩu ngẫu nhiên | `BE_WEDO\src\auth\auth.service.ts:73-96` |
| Tài khoản Google đặt được mật khẩu qua "Quên mật khẩu" rồi đăng nhập bằng email | `BE_WEDO\src\auth\password-reset.service.ts:43,123-128`; `auth.service.ts:125-140` |
| iPhone ẩn nút Google | `08-sua-code-truoc-khi-nop.md`, IOS-02, đã làm (nhánh `ios`, commit `c013903`, `682916e`, `899c8eb`) |
| Nhãn "Tiếp tục với Google" | `src\components\ui\GoogleButton.tsx:47` |
| Quên mật khẩu: 6 số, 10 phút, 5 lần, huỷ mã cũ | `src\app\(auth)\forgot-password.tsx:124-185`; `BE_WEDO\src\auth\password-reset.service.ts:8,11,56-60`; `BE_WEDO\src\mail\mail.service.ts:99` |
| Bốn công tắc thông báo | `src\app\account\notification-settings.tsx:30-58` |
| iPhone chỉ xin quyền thông báo khi bấm "Bật thông báo" | Nhánh `ios`: `src\lib\notifications\push-token.ts` (`coQuyenThongBao`), `src\app\(tabs)\notifications\index.tsx` (commit `14c557c`) |
| Tối đa 1 thông báo mỗi dự án trong 10 phút | `BE_WEDO\src\chat\chat-push.service.ts:14,154-162` |
| Tin nhắn, kết bạn không vào tab Thông báo, không theo bốn công tắc | `BE_WEDO\src\chat\chat-push.service.ts:21-37`; `BE_WEDO\src\notifications\notifications.service.ts:14-28` |
| Nút Bạn bè là biểu tượng hai người ở góc trên tab Trò chuyện | `src\app\(tabs)\chat\index.tsx:182-195`; `src\app\(tabs)\chat\friends.tsx:119` |
| Ảnh: 5 ảnh, 10 MB, nén 70%, bộ chọn hệ thống | `src\lib\images\pick-images.ts:6,9,18,72-84`; máy chủ 5 tệp mỗi lượt ở `BE_WEDO\src\chat\chat.controller.ts:57` |
| Ảnh vào dải xem trước, bấm Gửi mới gửi | `src\components\chat\MessageComposer.tsx:70-99`; `src\app\(tabs)\chat\dm\[conversationId].tsx:171-190` |
| Tài liệu: 10 tệp, 20 MB, nút "Nộp tài liệu" | `src\lib\files\pick-documents.ts:6,9`; `src\components\tasks\TaskSubmissionPanel.tsx:97` |
| App không tạo được dự án | `src\lib\api\projects.ts`; `src\app\(tabs)\chat\index.tsx:365` |
| Tạo dự án trên web | `FE_WEDO\src\components\layout\Sidebar.tsx:171-183`; `BottomNav.tsx:39-47`; `FE_WEDO\src\views\WorkspaceView.tsx:464-479,736-846` |
| Thêm thành viên cần tài khoản sẵn; người tạo là Leader | `BE_WEDO\src\projects\projects.service.ts:37,89-102` |
| Leader xoá thành viên khỏi dự án trên web | `FE_WEDO\src\views\WorkspaceView.tsx:1228` |
| Các bước xoá tài khoản trong app | `src\app\(tabs)\account\index.tsx`; `src\app\account\delete-account.tsx` (nhánh `ios`, có nút "Thử lại") |
| Web chưa có nút xoá tài khoản | `FE_WEDO\src\views\SettingsView.tsx:317-324` |
| Dữ liệu bị xoá, được giữ | `BE_WEDO\prisma\schema.prisma` (mọi quan hệ `onDelete` trỏ tới `User`); `BE src\users\users.service.ts` (nhánh `ios-backend`, xoá tệp trên Azure Blob) |
| AI: ai dùng được, gửi gì, cho ai | `src\app\(tabs)\chat\[projectId].tsx`, `src\lib\ai\dong-y-ai.ts` (nhánh `ios`); `BE src\chat\chat.service.ts` (nhánh `ios-backend`, không gửi email) |
| Báo cáo, chặn, bộ lọc, khoá tài khoản | Nhánh `ios`: `src\components\moderation\*`, `src\lib\moderation\*`, `src\app\account\blocked.tsx`. Nhánh `ios-backend`: `src\moderation\*`, `src\auth\tai-khoan-bi-khoa.ts` |
| Web tự gửi tin của Leader cho AI | `FE_WEDO\src\views\ChatView.tsx:920-922` (nút phân tích ở dòng 1452) |
| Tóm tắt họp gửi tiêu đề và bản chép lời | `BE_WEDO\src\meetings\meetings.service.ts:568` |
| Tạo công việc bằng tay ở nút dấu cộng tab Công việc | `src\app\(tabs)\tasks\index.tsx:109` |
| Không có AI trong tin nhắn riêng | `src\app\(tabs)\chat\dm\[conversationId].tsx:245-247` |
| Nút "Tạo công việc" trong bảng đề xuất | `src\components\chat\TaskSuggestionSheet.tsx:249` |
| Hạn mức AI | `src\lib\ai\han-muc.ts:19,57` |
| Góp ý ẩn danh qua AI | `BE_WEDO\src\feedback\feedback.service.ts:477-493` |
| Ghi biên bản họp bằng AI trên web | `FE_WEDO\src\views\MeetingView.tsx:1444` |
| iOS tối thiểu 16.4 | `node_modules\expo-modules-core\ExpoModulesCore.podspec:54` |
| Trang chủ có "Bảng giá" và nhúng bảng giá gói dịch vụ | `FE_WEDO\src\views\LandingView.tsx:254,633-639`; `FE_WEDO\src\views\PricingView.tsx` |
| Chân trang trang chủ không có liên kết nào | `FE_WEDO\src\views\LandingView.tsx:707-713` |

Quy định của Apple đã đối chiếu (đọc ngày 26/09/2026):

| Điều | Nguồn |
|---|---|
| Support URL phải dẫn tới thông tin liên hệ thật (địa chỉ pháp lý, email, số điện thoại) khi luật địa phương đòi hỏi; ghi đủ giao thức | developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/ |
| App và Support URL phải có cách liên hệ dễ tìm | App Review Guidelines 1.5 |
| App có nội dung do người dùng tạo: lọc, báo cáo, chặn, công bố thông tin liên hệ | App Review Guidelines 1.2 |
| Metadata không được dẫn tới cách mua ngoài in-app purchase (trừ storefront Mỹ) | App Review Guidelines 3.1.1(a) |
| App miễn phí đi kèm dịch vụ web trả phí: không mua trong app, không lời mời mua ở ngoài | App Review Guidelines 3.1.3(f) |
| Không nhắc tên nền tảng di động khác trong app hay metadata | App Review Guidelines 2.3.10 |
| Không bắt người dùng gửi email để xoá tài khoản | developer.apple.com/support/offering-account-deletion-in-your-app/ |
| Mức tuổi 18+ khi app đòi tuổi tối thiểu cao hơn mức Apple tính | developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/ |
| (Bản sau) App có Sign in with Apple phải thu hồi token qua REST API; đường dẫn Cài đặt → [tên] → Đăng nhập bằng Apple; đăng ký nguồn thư cho dịch vụ chuyển tiếp email | developer.apple.com/support/offering-account-deletion-in-your-app/; support.apple.com/102571; developer.apple.com/help/account/capabilities/configure-private-email-relay-service/ |

---

## Phụ lục C. Bản sau (1.1): các khối về Đăng nhập bằng Apple

Bản iOS đầu tiên không có Đăng nhập bằng Apple (quyết định đã chốt), nên các khối dưới đây **không** nằm trên trang. Giữ lại để dán vào khi làm tính năng đó (`08-sua-code-truoc-khi-nop.md`, SAU-01 … SAU-04). Khi dán: thêm lại liên kết `#dang-nhap-apple` vào mục lục, thêm dòng "Tài khoản tạo bằng Apple: xem mục Đăng nhập bằng Apple để đăng nhập được trên web." vào cuối mục Tạo dự án, và làm thêm việc ở cuối phụ lục này.

Khối chữ (đặt sau mục 3.5.3):

#### C.1. Đăng nhập bằng Apple

> ⚠ Giả định: tính năng này chưa có trong mã (không có endpoint Apple ở `BE_WEDO\src\auth\auth.controller.ts`). Khối này viết cho lúc đã làm xong, và dựa trên năm điều kiện:
> 1. Nút trong app có chữ "Đăng nhập bằng Apple".
> 2. Họ tên lấy từ lần đăng nhập Apple đầu tiên, sửa được ở Thông tin cá nhân.
> 3. Web **chưa** có nút Apple (đúng như hiện tại: `FE_WEDO\src\views\LoginView.tsx` chỉ có email và Google).
> 4. Đã đăng ký email gửi thư của WeDo với dịch vụ chuyển tiếp email của Apple. Chưa đăng ký thì thư đặt lại mật khẩu gửi tới địa chỉ `@privaterelay.appleid.com` sẽ không tới, và gạch đầu dòng cuối cùng sai.
> 5. Máy chủ gắn tài khoản Apple theo cách `08-sua-code-truoc-khi-nop.md` đề xuất (SAU-01, bước 3): email thật đã xác minh thì gắn vào tài khoản có cùng email, email ẩn thì không gắn.

```text
Đăng nhập bằng Apple (trên iPhone)

- Bấm "Đăng nhập bằng Apple" rồi xác nhận bằng Face ID, Touch ID hoặc mật khẩu.
- Lần đầu, Apple hỏi bạn muốn chia sẻ email thật hay ẩn email. Nếu ẩn, WeDo chỉ nhận một địa chỉ có đuôi @privaterelay.appleid.com. Apple chuyển thư của WeDo từ địa chỉ này về hộp thư thật của bạn.
- Chia sẻ email thật trùng với email bạn đã đăng ký WeDo: bạn vào đúng tài khoản cũ.
- Tài khoản tạo bằng email ẩn là một tài khoản riêng. Nó không gộp với tài khoản bạn đã tạo bằng email thật hoặc Google. Nếu đã có tài khoản WeDo, hãy đăng nhập đúng cách bạn dùng lần đầu.
- Apple chỉ gửi họ tên cho WeDo ở lần đầu. Bạn sửa họ tên ở Tài khoản → Thông tin cá nhân.
- Web WeDo chưa có nút đăng nhập bằng Apple. Muốn dùng tài khoản này trên web: xem email của tài khoản ở tab Tài khoản trong ứng dụng, rồi trên trang đăng nhập của web bấm "Quên mật khẩu?" và nhập đúng email đó để đặt mật khẩu.
```

Khối chữ cho mục Xoá tài khoản (đặt sau phần "Trên web"):

```text
Tài khoản đăng nhập bằng Apple:
- Nếu bạn dùng email ẩn (đuôi @privaterelay.appleid.com), hãy xoá ngay trong ứng dụng như trên. Qua email, chúng tôi không đối chiếu được bạn là chủ tài khoản.
- Khi tài khoản bị xoá, WeDo cũng thu hồi quyền Đăng nhập bằng Apple đã cấp cho WeDo. Bạn kiểm tra được ở Cài đặt của iPhone → [tên của bạn] → Đăng nhập bằng Apple. Tên mục có thể khác đôi chút tuỳ phiên bản iOS.
```

Khối HTML tương ứng:

```html
      <!--
        ⚠ Giả định: bản iOS có "Đăng nhập bằng Apple"; họ tên sửa được ở Thông tin cá nhân;
        web chưa có nút Apple; email gửi thư của WeDo đã đăng ký với dịch vụ chuyển tiếp email
        của Apple; máy chủ gắn email thật đã xác minh vào tài khoản cùng email, không gắn email
        ẩn. Chưa có tính năng thì XOÁ cả khối này (từ h3 tới hết ul).
      -->
      <h3 id="dang-nhap-apple">Đăng nhập bằng Apple (trên iPhone)</h3>
      <ul>
        <li>
          Bấm <strong>Đăng nhập bằng Apple</strong> rồi xác nhận bằng Face ID, Touch ID hoặc mật
          khẩu.
        </li>
        <li>
          Lần đầu, Apple hỏi bạn muốn chia sẻ email thật hay ẩn email. Nếu ẩn, WeDo chỉ nhận một
          địa chỉ có đuôi <code>@privaterelay.appleid.com</code>. Apple chuyển thư của WeDo từ địa
          chỉ này về hộp thư thật của bạn.
        </li>
        <li>Chia sẻ email thật trùng với email bạn đã đăng ký WeDo: bạn vào đúng tài khoản cũ.</li>
        <li>
          Tài khoản tạo bằng email ẩn là một tài khoản riêng. Nó không gộp với tài khoản bạn đã tạo
          bằng email thật hoặc Google. Nếu đã có tài khoản WeDo, hãy đăng nhập đúng cách bạn dùng
          lần đầu.
        </li>
        <li>
          Apple chỉ gửi họ tên cho WeDo ở lần đầu. Bạn sửa họ tên ở
          <strong>Tài khoản → Thông tin cá nhân</strong>.
        </li>
        <li>
          Web WeDo chưa có nút đăng nhập bằng Apple. Muốn dùng tài khoản này trên web: xem email
          của tài khoản ở tab <strong>Tài khoản</strong> trong ứng dụng, rồi trên trang đăng nhập
          của web bấm <strong>Quên mật khẩu?</strong> và nhập đúng email đó để đặt mật khẩu.
        </li>
      </ul>

      <!--
        ⚠ Giả định: máy chủ thu hồi token Apple khi xoá tài khoản. Chưa có Đăng nhập bằng Apple,
        hoặc chưa thu hồi token, thì XOÁ đoạn này (từ p tới hết ul).
      -->
      <p><strong>Tài khoản đăng nhập bằng Apple:</strong></p>
      <ul>
        <li>
          Nếu bạn dùng email ẩn (đuôi <code>@privaterelay.appleid.com</code>), hãy xoá ngay trong
          ứng dụng như trên. Qua email, chúng tôi không đối chiếu được bạn là chủ tài khoản.
        </li>
        <li>
          Khi tài khoản bị xoá, WeDo cũng thu hồi quyền Đăng nhập bằng Apple đã cấp cho WeDo. Bạn
          kiểm tra được ở <strong>Cài đặt</strong> của iPhone → [tên của bạn] →
          <strong>Đăng nhập bằng Apple</strong>. Tên mục có thể khác đôi chút tuỳ phiên bản iOS.
        </li>
      </ul>
```

Việc phải làm cùng lúc: vào Apple Developer → Certificates, Identifiers & Profiles → Services → "Sign in with Apple for Email Communication" → Configure → Email Sources → nút (+). Thêm địa chỉ gửi thư của WeDo: biến `MAIL_FROM` trên Azure, hoặc `MAIL_USER` nếu không đặt `MAIL_FROM` (`BE_WEDO\src\mail\mail.service.ts:57-58`). Nếu thư gửi từ tên miền riêng, thêm cả tên miền, và tên miền đó phải qua được SPF hoặc DKIM. Sau đó thử đặt lại mật khẩu cho một tài khoản dùng email ẩn.
