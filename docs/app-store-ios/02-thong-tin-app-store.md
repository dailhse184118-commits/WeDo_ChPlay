# 02 — Thông tin App Store cho bản iOS đầu tiên

Tài liệu này gom mọi trường bạn phải điền trong App Store Connect ở hai chỗ:

- **App Information**: thông tin chung của ứng dụng (tên, phụ đề, danh mục, độ tuổi, quyền nội dung, đường dẫn Chính sách quyền riêng tư).
- **Trang phiên bản iOS 1.0.13**: văn bản quảng bá, mô tả, từ khoá, đường dẫn hỗ trợ, bản quyền, giá và phạm vi phát hành, tuân thủ xuất khẩu.

Các phần khác nằm ở tài liệu riêng trong thư mục `docs\app-store-ios`:

- Ảnh chụp màn hình và cỡ ảnh: `01-tai-khoan-va-build.md`.
- Nhãn quyền riêng tư (App Privacy): `03-app-privacy.md`.
- Ghi chú cho người duyệt (App Review Notes) và tài khoản demo: `04-thong-tin-cho-reviewer.md`.
- Điều khoản sử dụng: `06-dieu-khoan-su-dung.md`.
- Trang hỗ trợ: `07-trang-ho-tro.md`.

**Cách đọc:**

- Chữ trong khung `text` là chữ để dán thẳng vào App Store Connect.
- Mỗi khung đều ghi số ký tự. Khung nào Apple tính theo byte thì ghi thêm số byte. Tôi đếm bằng Python (`len()` trên chuỗi đã chuẩn hoá NFC), ngày 26/09/2026. Một chữ tiếng Việt có dấu tính là 1 ký tự.
- Hai trường Apple giới hạn theo **byte**, không theo ký tự: **Keywords (100 byte)** và **App Review Notes (4000 byte)**. Chữ có dấu chiếm 2 hoặc 3 byte (ví dụ "á" 2 byte, "ọ" 3 byte). Các trường còn lại tính theo ký tự.
- Chỗ nào dựa trên quyết định chưa chốt đều ghi **⚠ Giả định:** để bạn sửa.

---

## 1. Tóm tắt: điền gì vào đâu

| Trường trong App Store Connect | Nằm ở | Giá trị khuyên dùng | Giới hạn | Đo được |
|---|---|---|---|---|
| Name | App Information | `WeDo: Làm việc nhóm` | 30 ký tự | 19 |
| Subtitle | App Information | `Bài tập nhóm, deadline, chat` | 30 ký tự | 28 |
| Primary Language | App Information | Vietnamese | — | — |
| Bundle ID | App Information | `vn.wedo.app` | — | — |
| SKU | App Information | `wedo-ios` | — | — |
| Category | App Information | Productivity (chính), Education (phụ) | — | — |
| Content Rights | App Information | Có nội dung bên thứ ba, có đủ quyền | — | — |
| Age Rating | App Information | Apple tính ra 4+, bạn nâng lên 18+ | — | — |
| Privacy Policy URL | App Information | `https://wedofpt.com.vn/privacy.html` | — | — |
| License Agreement | App Information | EULA chuẩn của Apple (để mặc định) | — | — |
| Promotional Text | Trang phiên bản | mục 6 | 170 ký tự | 159 |
| Description | Trang phiên bản | mục 7 | 4000 ký tự | 2780 |
| Keywords | Trang phiên bản | mục 8 | 100 byte | 100 byte |
| Support URL | Trang phiên bản | `https://wedofpt.com.vn/ho-tro.html` (trang đã có trên nhánh `ios-web`, **chưa đăng**) | — | — |
| Marketing URL | Trang phiên bản | để trống ở bản này | — | — |
| Version | Trang phiên bản | `1.0.13` | — | — |
| Copyright | Trang phiên bản | `2026 Lê Hữu Đại` | — | — |
| What's New | Trang phiên bản | không hiện ở bản đầu tiên (mục 9) | 4000 ký tự | 345 |
| Price | Pricing and Availability | Free | — | — |
| Availability | Pricing and Availability | Chỉ Việt Nam | — | — |
| Export compliance | Info.plist | `ITSAppUsesNonExemptEncryption` = NO | — | — |

---

## 2. Các quyết định và giả định dùng trong tài liệu

Đã chốt ngày 26/09/2026:

- **Đăng nhập trên iPhone: chỉ email và mật khẩu.** Nút Google bị ẩn trên iPhone, còn Android và web giữ Google. App iPhone chỉ dùng hệ tài khoản riêng của WeDo, nên Guideline 4.8 không áp dụng, và bản này **không có Đăng nhập bằng Apple**. Mô tả và mục "Có gì mới" chỉ nói đăng nhập bằng email.
- **Báo cáo, chặn và bộ lọc từ ngữ** cho tin nhắn và tên hiển thị có trong bản 1.0.13 (Guideline 1.2). Đã làm trên nhánh iOS (`08-sua-code-truoc-khi-nop.md`, IOS-03, IOS-04). Bộ lọc thay từ phản cảm bằng `***`. Mô tả có nhắc báo cáo và chặn.
- **Tên trang chính sách là "Chính sách quyền riêng tư"** ở mọi nơi.
- **Tuổi tối thiểu 18** (mục 14). Chính sách, điều khoản và trang hỗ trợ ghi cùng số.
- **Email hỗ trợ: `wedosupport6886@gmail.com`.**
- **Tên app: `WeDo: Làm việc nhóm`**, tên dự phòng ở mục 4.
- **DSA: This is not a trader account**, vì chỉ phát hành ở Việt Nam (mục 17.2).

Còn là giả định:

- Đã làm: **hộp thoại xin đồng ý trước lần dùng AI đầu tiên** (Guideline 5.1.2(i), `08`, IOS-08). Mô tả có nhắc tới nó.
- ⚠ Giả định: ứng dụng **không bán gì trong app** và **không có lời mời mua ở nơi khác** (Guideline 3.1.3(f)). Ba chỗ cũ đã sửa trên nhánh `ios`: nút "Xem đầy đủ trên web" ở Bảng đóng góp đã ẩn trên iPhone, thông báo gói và thanh toán đã ẩn trên iPhone (máy chủ mới cũng bỏ câu "Gia hạn sớm…"), và nút cập nhật trên iPhone mở App Store thay cho CH Play.
- ⚠ Giả định: bạn đăng ký Apple Developer Program **dưới dạng cá nhân**. Tên người bán trên App Store sẽ là **Lê Hữu Đại**. Phí 99 USD mỗi năm (Apple có thể thu theo giá tiền địa phương).
- ⚠ Giả định: bản đầu **miễn phí**, **chỉ cho iPhone** (`supportsTablet: false`), **ngôn ngữ chính tiếng Việt**. Việc chỉ phát hành ở Việt Nam thì đã chốt.
- ⚠ Giả định: Bundle ID `vn.wedo.app`, phiên bản `1.0.13`, số build iOS đầu tiên là `1`.
- Trang hỗ trợ nằm ở `https://wedofpt.com.vn/ho-tro.html` và trang điều khoản ở `https://wedofpt.com.vn/dieu-khoan.html`. Cả hai đã có trên nhánh `ios-web` (commit `1f6e813`, `f6052b3`), app đã trỏ tới đúng hai địa chỉ này, nhưng **chưa đăng**: hôm nay hai địa chỉ còn trả 404. Đăng theo `08`, Bước B.

---

## 3. Tạo bản ghi ứng dụng (hộp thoại New App)

Vào App Store Connect → Apps → nút **+** → **New App**, rồi điền:

| Ô | Điền | Ghi chú |
|---|---|---|
| Platforms | iOS | Chỉ chọn iOS. |
| Name | `WeDo: Làm việc nhóm` | Xem mục 4. Tên phải chưa có ai dùng. |
| Primary Language | Vietnamese | Toàn bộ giao diện app là tiếng Việt. |
| Bundle ID | `vn.wedo.app` | Phải đăng ký trước trong Certificates, Identifiers & Profiles (hoặc để EAS tạo khi build). Không đổi được sau khi đã tải build lên. |
| SKU | `wedo-ios` | Mã nội bộ, khách không thấy. Không đổi được sau này. |
| User Access | Full Access | |

**Nên tạo bản ghi bằng tay trước khi chạy `eas submit`.** Tệp `eas.json` hiện có `"submit": { "production": {} }`, chưa có `ascAppId`. Theo tài liệu EAS, khi thiếu `ascAppId` thì EAS tự tạo bản ghi, lấy tên từ `expo.name` ("WeDo") và ngôn ngữ mặc định `en-US`. Tên "WeDo" đã có người dùng (mục 4), nên bước tạo đó gần như chắc sẽ lỗi, còn nếu qua được thì ngôn ngữ chính lại sai. Tạo xong bằng tay thì chép **Apple ID** của ứng dụng (dãy số ở App Information) vào `submit.production.ios.ascAppId`.

---

## 4. Tên ứng dụng (Name, tối đa 30 ký tự)

**Vì sao không dùng đúng chữ "WeDo":** tôi tra App Store bằng iTunes Search API (App Store Việt Nam và Mỹ, ngày 26/09/2026) và thấy:

- Đã có một ứng dụng tên đúng là **"WeDo"** (nhóm Tiện ích, của công ty khác, thấy ở App Store Mỹ). App Store Connect không cho hai app dùng cùng một tên, dù bán ở nước nào.
- **"WeDo: Shared To-Do & Planner"** cùng nhóm Năng suất, có bán ở App Store Việt Nam. Đây là đối thủ gần nhất về tên và chức năng.
- Ở App Store Mỹ còn nhiều tên bắt đầu bằng WeDo ("WEDO", "WeDoTasks", "WEDO Events"...). Ngoài ra "WeDo" còn là tên dòng sản phẩm LEGO® Education WeDo của LEGO (tôi không thấy app này trong kết quả tra hôm nay).

Guideline 2.3.7 yêu cầu chọn tên riêng, không trùng. Thêm phần mô tả sau "WeDo" giúp tên không trùng, giúp người ta tìm thấy, và giảm nhầm lẫn với các tên trên. Tra "WeDo lam viec nhom" ở App Store Việt Nam cho 0 kết quả. Tôi không tìm thấy app nào tên giống ba phương án dưới đây, nhưng chỉ biết chắc khi bấm tạo bản ghi.

**Phương án 1 (khuyên dùng)** — 19 ký tự:

```text
WeDo: Làm việc nhóm
```

**Phương án 2** — 27 ký tự. Khớp tên kênh Facebook và TikTok "WeDo Team":

```text
WeDo Team: Việc nhóm & Chat
```

**Phương án 3** — 29 ký tự. Nói thẳng đối tượng là sinh viên:

```text
WeDo - Bài tập nhóm sinh viên
```

**Vì sao chọn phương án 1:**

- Ngắn, nên hiện đủ trong danh sách kết quả tìm kiếm trên iPhone. Tên dài thường bị cắt.
- "Làm việc nhóm" là cụm quen thuộc với sinh viên, và nói đúng việc app làm. (Tôi không có số liệu lượt tìm của cụm này; xem lại sau ra mắt, mục 8.3.)
- Chừa chỗ cho phụ đề mang thêm các từ "bài tập", "deadline", "chat".

**Nếu phương án 1 đã có người dùng:** thử phương án 2, rồi phương án 3. Đổi tên thì phải đổi thêm:

- Chọn phương án 2: bỏ `team` khỏi từ khoá (mục 8), vì "Team" đã nằm trong tên.
- Chọn phương án 3: bỏ `sinh vien` khỏi từ khoá, và dùng phụ đề B `Giao việc, chat nhóm, họp` thay cho phụ đề A (phụ đề A lặp chữ "bài tập nhóm").

**Tên dưới biểu tượng trên màn hình chính vẫn là "WeDo".** Tên này lấy từ `expo.name` trong `app.json` và `CFBundleDisplayName` trong `locales/vi.json`, không phải từ App Store Connect. Guideline 2.3.8 chỉ yêu cầu tên và biểu tượng ở các nơi đủ giống nhau để không gây nhầm lẫn. "WeDo" và "WeDo: Làm việc nhóm" cùng mở đầu bằng WeDo và dùng chung một biểu tượng, nên không có vấn đề.

---

## 5. Phụ đề (Subtitle, tối đa 30 ký tự)

Phụ đề hiện ngay dưới tên. Tài liệu của Apple chỉ nói rõ tên app và tên nhà phát triển được dùng khi tìm kiếm. Theo kinh nghiệm phổ biến của người làm ASO, chữ trong phụ đề cũng được tính. Vì vậy phụ đề nên chứa từ người dùng hay gõ.

**Phụ đề A (khuyên dùng)** — 28 ký tự:

```text
Bài tập nhóm, deadline, chat
```

**Phụ đề B** — 25 ký tự:

```text
Giao việc, chat nhóm, họp
```

**Phụ đề C** — 26 ký tự. Đây là khẩu hiệu đang hiện ở màn đăng nhập (`src/app/(auth)/login.tsx:95`):

```text
Nghĩ ít hơn, làm nhiều hơn
```

**Vì sao chọn A:** sinh viên tìm app bằng chữ "bài tập nhóm" và "deadline" nhiều hơn là bằng khẩu hiệu. A thêm được bốn từ mà tên chưa có ("bài", "tập", "deadline", "chat"). Chữ "chat" giữ nguyên tiếng Anh vì người dùng hay gõ như vậy; trong phần mô tả vẫn dùng "trò chuyện". Khẩu hiệu C đẹp nhưng gần như không ai gõ để tìm, nên tôi để nó vào dòng thứ hai của phần mô tả.

---

## 6. Văn bản quảng bá (Promotional Text, tối đa 170 ký tự)

Dòng này hiện phía trên phần mô tả. Bạn **sửa được bất cứ lúc nào mà không cần gửi duyệt lại**, nên dùng nó cho thông điệp theo mùa.

**Bản chính** — 159 ký tự:

```text
Chia việc cho cả nhóm, nhắn tin theo dự án, nhận nhắc hạn chót và vào phòng họp ngay trên iPhone. Trưởng nhóm nhấn giữ tin nhắn để AI gợi ý thành việc cần làm.
```

**Bản dự phòng cho mùa bài tập lớn** — 139 ký tự:

```text
Mùa bài tập lớn đã tới. Tạo việc, đặt hạn chót, nộp bài và duyệt bài ngay trên iPhone. WeDo nhắc bạn trước hạn chót 24 giờ và đúng giờ hạn.
```

---

## 7. Mô tả (Description, tối đa 4000 ký tự)

Mô tả trên App Store là chữ thuần, không có in đậm hay HTML. Tôi dùng dòng trống, tiêu đề viết hoa và dấu "•" để chia đoạn.

**Bản khuyên dùng** — 2780 ký tự, 3712 byte, 54 dòng:

```text
WeDo giúp nhóm sinh viên làm bài tập nhóm và dự án gọn gàng hơn. Chia việc rõ ràng, trò chuyện theo từng dự án, theo dõi hạn chót và cuộc họp, tất cả trên iPhone.

Nghĩ ít hơn, làm nhiều hơn.

TRÒ CHUYỆN THEO DỰ ÁN
• Mỗi dự án có một phòng trò chuyện riêng, tin nhắn hiện ra theo thời gian thực.
• Chụp ảnh hoặc chọn ảnh có sẵn để gửi, chạm vào ảnh để xem toàn màn hình.
• Tìm nhanh dự án và thấy ngay số tin chưa đọc.

AI GỢI Ý CÔNG VIỆC TỪ TIN NHẮN
• Trưởng nhóm (Leader) nhấn giữ một tin nhắn và chọn "Tạo công việc bằng AI". AI đề xuất tên việc, mô tả, người phụ trách và hạn chót.
• Bạn xem lại, sửa nếu cần rồi mới tạo việc. Không có việc nào được tạo tự động.
• Trước lần dùng đầu tiên, WeDo nói rõ dữ liệu nào được gửi tới nhà cung cấp AI và chỉ gửi khi bạn đồng ý.

TIN NHẮN RIÊNG VÀ BẠN BÈ
• Nhắn tin 1-1 với thành viên trong nhóm hoặc bạn bè, gửi được cả ảnh.
• Biết ai đang hoạt động.
• Tìm bạn học, gửi và trả lời lời mời kết bạn.
• Báo cáo tin nhắn không phù hợp và chặn người làm phiền bạn.

CÔNG VIỆC RÕ RÀNG
• Xem ngay số việc đang mở, việc chờ bạn nhận và việc quá hạn.
• Tạo việc, đặt hạn chót và chọn người phụ trách. Việc thuộc dự án do trưởng nhóm tạo.
• Nhận việc, hoặc từ chối kèm lý do.
• Nộp bài kèm tệp. Trưởng nhóm duyệt, hoặc trả bài kèm lý do để bạn sửa.

CUỘC HỌP VÀ LỊCH
• Trưởng nhóm lên lịch họp với tiêu đề, nội dung dự kiến, ngày giờ và dự án.
• Vào phòng họp trực tuyến bằng một chạm. Phòng họp mở trong trình duyệt.
• Xem tóm tắt, quyết định và hạng mục hành động của buổi họp. Biên bản được tạo trên bản web.
• Lịch gom hạn chót, cuộc họp và sự kiện theo từng ngày.

THÔNG BÁO ĐÚNG LÚC
• Báo khi bạn được giao việc, khi bài được nộp hoặc được duyệt, khi có cuộc họp mới, tin nhắn mới hoặc lời mời kết bạn.
• Nhắc hạn chót trước 24 giờ và đúng giờ hạn.
• Chạm vào thông báo để mở thẳng việc, cuộc họp hoặc cuộc trò chuyện.
• Tự chọn bật hay tắt thông báo giao việc, duyệt việc, nhắc hạn chót và cuộc họp.

BẢNG ĐÓNG GÓP
• Xem mỗi thành viên đã hoàn thành bao nhiêu việc, còn bao nhiêu việc chưa xong hoặc trễ hạn, đã nộp bao nhiêu bài và tỷ lệ đúng hạn.

KHÔNG GIAN LÀM VIỆC VÀ TÀI KHOẢN
• Tạo không gian làm việc cho nhóm và chuyển qua lại giữa các không gian.
• Đăng nhập bằng email và mật khẩu.
• Đổi ảnh đại diện, cập nhật họ tên, số điện thoại, ngày sinh.
• Gửi góp ý cho WeDo ngay trong ứng dụng.
• Tự xoá tài khoản ngay trong ứng dụng.

DÙNG CÙNG BẢN WEB
WeDo trên iPhone dùng chung tài khoản và dữ liệu với bản web WeDo. Dự án và thành viên dự án được tạo trên bản web, sau đó cả nhóm cùng làm việc trên điện thoại. Nếu bạn đăng ký bằng Google trên bản web, hãy bấm "Quên mật khẩu?" để đặt mật khẩu, rồi đăng nhập trên iPhone bằng email đó.

Ứng dụng có giao diện tiếng Việt.

Cần hỗ trợ? Viết cho chúng tôi: wedosupport6886@gmail.com
```

### 7.1. Dòng nào phụ thuộc vào tính năng mới

Hai tính năng dưới đây đã có trong mã trên nhánh `ios` và `ios-backend` (`08-sua-code-truoc-khi-nop.md`, mục Đã làm). Chúng chỉ chạy khi máy chủ mới đã lên production. Kiểm trên TestFlight trước khi dán. Apple từ chối mô tả nói tới thứ app không có (Guideline 2.3.1).

| Dòng trong mô tả | Phụ thuộc | Trạng thái |
|---|---|---|
| `• Trước lần dùng đầu tiên, WeDo nói rõ dữ liệu nào được gửi tới nhà cung cấp AI và chỉ gửi khi bạn đồng ý.` | Hộp thoại xin đồng ý dùng AI | Đã làm (`0585335`) |
| `• Báo cáo tin nhắn không phù hợp và chặn người làm phiền bạn.` | Báo cáo và chặn | Đã làm (`05a0f15` và các commit liền đó) |

Nếu bỏ cả hai dòng trên, mô tả còn 2611 ký tự, 52 dòng. Vẫn dưới 4000.

Lưu ý: theo Guideline 1.2, bạn **không thể** gửi bản iOS thiếu báo cáo và chặn. Guideline 5.1.2(i) cũng buộc phải xin phép rõ ràng trước khi gửi dữ liệu cá nhân cho AI bên thứ ba. Bảng trên chỉ để mô tả luôn khớp với app, không phải gợi ý bỏ các tính năng đó. Guideline 4.8 thì không áp dụng, vì app iPhone không có nút Google (đã làm, `08` IOS-02).

Câu "Nếu bạn đăng ký bằng Google trên bản web, hãy bấm "Quên mật khẩu?"…" đúng với mã hôm nay: máy chủ tìm tài khoản theo email, không phân biệt cách đăng ký, nên tài khoản tạo bằng Google đặt được mật khẩu (`08-sua-code-truoc-khi-nop.md`, IOS-02). Câu này chỉ nhắc Google như một cách đăng ký trên web, không nhắc nền tảng di động nào khác (Guideline 2.3.10).

### 7.2. Mỗi dòng dựa vào đâu trong mã

Tính năng mới đọc trên nhánh `ios` ở `D:\WeDo_ChPlay-ios`. Số dòng của các dòng cũ đọc trên nhánh chính, có thể lệch vài dòng.

| Nội dung mô tả | Tệp trong app mobile |
|---|---|
| Trò chuyện theo dự án, gửi ảnh (chụp hoặc chọn), xem ảnh toàn màn hình, tìm dự án, số tin chưa đọc | `src/app/(tabs)/chat/index.tsx`, `src/app/(tabs)/chat/[projectId].tsx`, `src/components/chat/MessageComposer.tsx:107,121`, `src/components/chat/ImageViewer.tsx` |
| Nhấn giữ tin nhắn, chọn "Tạo công việc bằng AI", đồng ý lần đầu; người dùng xem lại rồi mới tạo | `src/app/(tabs)/chat/[projectId].tsx` (`moThaoTacTin`, `batDauGoiYAI`), `src/lib/ai/dong-y-ai.ts`, `src/components/chat/TaskSuggestionSheet.tsx` |
| Báo cáo tin nhắn, chặn người dùng, Người đã chặn | `src/components/moderation/BangThaoTac.tsx`, `PhieuBaoCao.tsx`, `src/lib/moderation/use-kiem-duyet.ts`, `src/app/account/blocked.tsx` |
| Chỉ Leader dự án (hoặc chủ không gian làm việc) dùng được AI, tạo việc trong dự án, tạo cuộc họp. Việc không gắn dự án thì ai cũng tạo được. | Máy chủ: `D:\WEDO_PC\BE_WEDO\src\chat\chat.service.ts:752-762`, `src\tasks\tasks.service.ts:55-57`, `src\meetings\meetings.service.ts:103-107`; app: `src/app/(tabs)/meetings/new.tsx:202-204`, `src/lib/tasks/tao-task.ts:88` |
| Nhà cung cấp AI: Gemini, nếu không có thì Azure OpenAI, rồi OpenAI | Máy chủ `src\chat\chat.service.ts` (khoảng dòng 1072–1103 trên nhánh `ios-backend`) |
| Tin nhắn riêng, chấm "Đang hoạt động", bạn bè và lời mời kết bạn | `src/app/(tabs)/chat/dm/[conversationId].tsx`, `src/components/chat/ConversationRow.tsx:45-53`, `src/app/(tabs)/chat/friends.tsx` |
| Ba ô Đang mở / Chờ nhận / Quá hạn; tạo việc; nhận, từ chối, nộp, duyệt, trả bài | `src/app/(tabs)/tasks/index.tsx:118-122`, `src/app/(tabs)/tasks/new.tsx:147-196`, `src/app/(tabs)/tasks/[taskId].tsx:38,166-207,343-370`, `src/components/tasks/TaskSubmissionPanel.tsx` |
| Cuộc họp: tạo, vào phòng họp trong trình duyệt, xem tóm tắt, quyết định, hạng mục hành động (biên bản tạo trên web) | `src/app/(tabs)/meetings/new.tsx:110-190`, `src/app/(tabs)/meetings/[id].tsx:117,188,226-238,252` |
| Lịch gom hạn chót, cuộc họp, sự kiện theo ngày (mở từ màn Cuộc họp) | `src/app/(tabs)/calendar/index.tsx:40-44`, `src/app/(tabs)/meetings/index.tsx:71` |
| Thông báo, nhắc trước 24 giờ và đúng giờ hạn, bốn công tắc thông báo, chạm để mở đúng màn | `src/app/account/notification-settings.tsx:29-58`, `src/lib/notifications/handler.ts:37-42,61-100`, `src/lib/notifications/scheduler.ts:19,44,52` |
| Bảng đóng góp | `src/app/(tabs)/account/contributions.tsx:33-60` |
| Không gian làm việc, hồ sơ, góp ý, xoá tài khoản | `src/components/workspace/*`, `src/app/account/profile.tsx`, `src/app/account/feedback.tsx`, `src/app/account/delete-account.tsx` |
| Đăng nhập bằng email; tài khoản Google đặt mật khẩu qua "Quên mật khẩu?" | `src/app/(auth)/login.tsx`, `src/app/(auth)/forgot-password.tsx`; máy chủ `D:\WEDO_PC\BE_WEDO\src\auth\password-reset.service.ts:43`, `:123-128` |
| Dự án và thành viên chỉ tạo trên web | `src/app/(tabs)/chat/index.tsx:365` |

### 7.3. Những gì cố ý không đưa vào

- **Không** nhắc giá, gói, "Pro", "nâng cấp", "mua", hay "miễn phí". Guideline 3.1.3(f) cấm lời mời mua ở nơi khác. Chữ "miễn phí" cũng dễ gây hiểu lầm vì bản web có gói trả phí.
- **Không** nhắc Android, CH Play hay Google Play (Guideline 2.3.10 cấm tên nền tảng di động khác trong metadata).
- **Không** dùng chữ "cho trẻ em" hay tương tự (Guideline 2.3.8 dành chữ này cho nhóm Kids).
- **Không** nhắc các tính năng chỉ có trên web: trợ lý AI trò chuyện, kho tài liệu, bảng Kanban, bảng điều khiển (dashboard), tạo dự án, mời thành viên, AI tạo biên bản họp. Trang giới thiệu web còn hứa "tóm tắt tài liệu" và "hơn 100 ngôn ngữ" (`D:\WEDO_PC\FE_WEDO\src\views\LandingView.tsx:420,472`), app iPhone không có. Vì vậy **đừng chép chữ từ trang web sang**.
- Biên bản họp do bản web tạo. Mô tả nói rõ điều này, vì app chỉ hiển thị, không tạo (`src/app/(tabs)/meetings/[id].tsx:252`).
- **Không** nêu tên app hay công ty khác (Zalo, Messenger, Trello, Notion...).

---

## 8. Từ khoá (Keywords, tối đa 100 byte)

**Bản khuyên dùng: không dấu** — 100 ký tự, 100 byte, 17 từ khoá:

```text
sinh vien,du an,quan ly,cong,giao,hop,lich,nhac,han,nhan tin,ke hoach,todo,task,team,hoc,nop,tien do
```

**Bản thay thế: có dấu** — 78 ký tự, 99 byte, chỉ chứa được 14 từ khoá:

```text
sinh viên,dự án,quản lý,giao,họp,lịch,nhắc,hạn,nhắn tin,todo,task,team,học,nộp
```

### 8.1. Vì sao chọn bản không dấu

1. **Apple đếm 100 byte, không phải 100 ký tự.** Mỗi chữ có dấu tốn 2 hoặc 3 byte. Cùng 100 byte, bản không dấu chứa được 17 từ khoá, bản có dấu chỉ được 14 và phải bỏ "công", "kế hoạch", "tiến độ".
2. **Tên và phụ đề đã mang dạng có dấu của các từ quan trọng nhất**: "làm việc nhóm", "bài tập", "deadline", "chat". Người gõ có dấu vẫn tìm thấy app qua tên (và theo kinh nghiệm ASO, qua cả phụ đề).
3. **Nhiều người gõ không dấu khi tìm nhanh trên điện thoại** (nhận định theo thói quen chung, không có số liệu). Ô từ khoá không dấu bắt đúng nhóm này.
4. **Apple không công bố việc tìm kiếm có bỏ qua dấu hay không.** Nếu có bỏ qua, từ khoá không dấu vẫn khớp với lượt tìm có dấu, nên không mất gì. Nếu không bỏ qua, hai dạng bù cho nhau. Riêng chữ "đ" là một chữ cái riêng, không phải dấu, nên `tien do` có thể không khớp "tiến độ".

### 8.2. Các quy tắc bản khuyên dùng đã tuân theo

- Phân cách bằng dấu phẩy, **không có dấu cách sau dấu phẩy**.
- **Không lặp từ trong tên và phụ đề**, ở cả dạng có dấu lẫn không dấu: không có `wedo`, `lam`, `viec`, `nhom`, `bai`, `tap`, `deadline`, `chat`. Apple ghi rõ app đã được tìm theo tên app và tên nhà phát triển, nên không cần lặp lại. Với phụ đề, đây là kinh nghiệm ASO. Lặp lại chỉ phí chỗ.
- Không lặp tên nhà phát triển ("Lê Hữu Đại"), vì Apple cũng đã tìm theo tên này.
- Mỗi từ khoá dài hơn 2 ký tự, đúng quy định của Apple. Chữ 2 ký tự như "dự", "án" được ghép thành cụm `du an`.
- **Không có tên app hay công ty khác.** Tôi cố ý bỏ `fpt` (thương hiệu của Tập đoàn FPT), `zalo`, `trello`, `notion`.
- Mỗi từ khoá đều khớp một tính năng có thật: giao việc, họp, lịch, nhắc hạn, dự án, nhắn tin, nộp bài, tiến độ (Bảng đóng góp).
- Theo kinh nghiệm ASO (Apple không công bố), App Store ghép từ giữa tên, phụ đề và từ khoá. Ví dụ `quan ly` + `cong` + "việc" trong tên có thể khớp lượt tìm "quản lý công việc". Vì vậy tôi dùng từ đơn và cụm ngắn, không viết cả câu.

### 8.3. Sau khi ra mắt

- Từ khoá chỉ đổi được khi gửi phiên bản mới.
- Sau 2 đến 4 tuần, xem App Store Connect → App Analytics → nguồn "App Store Search". Nếu lượt tìm thấy thấp, thử thêm dạng không dấu của từ trong tên (`lam viec nhom`) vào bản sau và bỏ bớt từ yếu nhất (`hoc`, `nop`).
- Tuỳ chọn cho sau này: theo trang App Store localizations của Apple, App Store Việt Nam dùng hai ngôn ngữ, English (U.K.) và Vietnamese. Thêm bản địa hoá English (U.K.) sẽ có thêm một ô từ khoá 100 byte, và có thể được tính khi tìm kiếm ở Việt Nam. Đây là kinh nghiệm phổ biến trong giới làm ASO; Apple không công bố cách tính. Muốn làm thì phải viết đủ tên, phụ đề, mô tả tiếng Anh, nên để sau bản đầu.

---

## 9. Có gì mới (What's New in This Version, tối đa 4000 ký tự)

**Quan trọng:** theo trang tham chiếu của Apple, **ô này không có ở phiên bản đầu tiên** của một app. Nó chỉ bắt buộc từ phiên bản thứ hai. Vì vậy khi gửi 1.0.13, bạn sẽ không thấy ô này.

Đoạn dưới đây vẫn dùng được ở hai chỗ:

- Ô **What to Test** của TestFlight, khi mời người thử bản 1.0.13.
- Làm khung cho mục "Có gì mới" của bản sau (Guideline 2.3.12 yêu cầu nêu rõ tính năng mới).

Bản đầu tiên — 345 ký tự, 7 dòng:

```text
Phiên bản đầu tiên của WeDo trên iPhone.
• Trò chuyện theo dự án, nhắn tin riêng và kết bạn.
• AI gợi ý công việc từ tin nhắn, bạn xem lại trước khi tạo.
• Giao việc, nhận việc, nộp bài và duyệt bài.
• Cuộc họp, lịch hạn chót và thông báo nhắc hạn.
• Đăng nhập bằng email, dùng chung tài khoản với bản web.
• Báo cáo tin nhắn và chặn người dùng.
```

Dòng cuối dựa vào Báo cáo và chặn (xem 7.1), đã có trong mã.

---

## 10. Danh mục (Category)

| | Chọn | Lý do |
|---|---|---|
| Danh mục chính | **Productivity** (Năng suất) | Apple định nghĩa nhóm này là app giúp một việc cụ thể gọn gàng, hiệu quả hơn, và nêu ví dụ "quản lý công việc", "quản lý lịch". Lõi của WeDo đúng là giao việc, hạn chót, lịch và nhắc hạn. Danh mục chính quyết định app nằm ở đâu khi người dùng duyệt App Store. |
| Danh mục phụ | **Education** (Giáo dục) | Người dùng là sinh viên, và việc chính là bài tập nhóm, dự án môn học. Apple có nêu "cổng thông tin trường học" (school portals) trong ví dụ của nhóm Giáo dục, nên một công cụ học tập theo nhóm là hợp lý. |

⚠ Giả định: danh mục phụ là Education. Nói thật, định nghĩa của Apple cho Education nghiêng về "trải nghiệm học một kỹ năng hay môn học", còn định nghĩa **Business** (Kinh doanh) lại có chữ "collaboration" (cộng tác). Danh mục phụ ít ảnh hưởng tới vị trí trên App Store. Nếu người duyệt phản hồi về danh mục, đổi phụ thành **Business** là an toàn nhất.

**Không** chọn "Made for Kids" (xem mục 14).

---

## 11. Các đường dẫn (URL)

Tôi kiểm bằng `curl` ngày 26/09/2026.

| Trường | Đường dẫn | Tình trạng | Việc phải làm |
|---|---|---|---|
| **Privacy Policy URL** (bắt buộc) | `https://wedofpt.com.vn/privacy.html` | Trả về 200, nhưng bản đang sống còn ghi "Áp dụng cho cả web WeDo và ứng dụng Android WeDo" | Bản viết lại "Chính sách quyền riêng tư" đã có trên nhánh `ios-web` (commit `c4b98c2`). **Phải đăng trước khi gửi duyệt** (`08`, Bước B). |
| **Support URL** (bắt buộc) | `https://wedofpt.com.vn/ho-tro.html` | **Trả về 404** cho tới khi đăng | Trang đã có trên nhánh `ios-web` (commit `1f6e813`). **Phải đăng trước khi gửi duyệt** (`08`, Bước B). |
| **Marketing URL** (không bắt buộc) | để trống | — | Xem giải thích bên dưới. |
| User Privacy Choices URL (không bắt buộc, trong mục App Privacy) | để trống | — | Không cần cho bản đầu. |

Chép sẵn:

```text
https://wedofpt.com.vn/privacy.html
```

```text
https://wedofpt.com.vn/ho-tro.html
```

**Về Support URL.** Apple yêu cầu đường dẫn này dẫn tới thông tin liên hệ thật: email, và điện thoại, địa chỉ nếu luật địa phương đòi hỏi. Email hỗ trợ đã chốt là `wedosupport6886@gmail.com`, cũng là email đang công bố trên trang chính sách và trang xoá tài khoản, và hiện trong app (dòng "Liên hệ: wedosupport6886@gmail.com" ở tab Tài khoản). Trang hỗ trợ **không được có đường dẫn tới Bảng giá hay trang thanh toán**. Nếu tới lúc gửi duyệt mà trang hỗ trợ chưa lên, dùng tạm `https://wedofpt.com.vn/privacy.html` vì trang này có email liên hệ. Đó chỉ là cách chữa cháy.

**Về Marketing URL.** Ứng viên tự nhiên là `https://wedofpt.com.vn/`. Nhưng trang này có mục **"Bảng giá"** trên thanh điều hướng và một phần bảng giá ngay trên trang (`D:\WEDO_PC\FE_WEDO\src\views\LandingView.tsx:254,633`). WeDo dựa vào Guideline 3.1.3(f): app miễn phí đi kèm dịch vụ web trả phí thì không cần in-app purchase, **với điều kiện** không có chỗ mua trong app và không có lời mời mua ở nơi khác. Guideline 2.3.7 cũng không cho metadata chứa thông tin giá. Không có điều nào cấm hẳn một trang chủ có bảng giá trong ô Marketing URL, nhưng người duyệt có thể coi đó là lời mời mua. Ô này không bắt buộc, nên **để trống ở bản 1.0.13** là cách an toàn nhất (`07-trang-ho-tro.md`, mục 4.2, cũng nêu rủi ro này). Nếu vẫn muốn điền, hãy làm một trang giới thiệu không có bảng giá.

Trang **điều khoản sử dụng** không có ô riêng trong App Store Connect. Nó được mở từ trong app (ô đồng ý khi đăng ký, màn đồng ý một lần, dòng "Điều khoản sử dụng" ở tab Tài khoản) và ghi trong App Review Notes (xem `06-dieu-khoan-su-dung.md`).

---

## 12. Bản quyền (Copyright)

App Store tự thêm ký hiệu ©. Bạn chỉ ghi năm và tên người giữ quyền:

```text
2026 Lê Hữu Đại
```

⚠ Giả định: bạn đăng ký Apple Developer Program dưới dạng cá nhân, nên người giữ quyền là cá nhân bạn và tên người bán trên App Store cũng là "Lê Hữu Đại". Chân trang web và bốn trang pháp lý (cả bản mới trên nhánh `ios-web`) vẫn ghi "© 2026 WeDo Team". Nên sửa cho khớp, ví dụ "© 2026 Lê Hữu Đại (WeDo Team)", để người duyệt không thấy hai chủ sở hữu khác nhau. Nếu sau này lập công ty và chuyển app sang tài khoản tổ chức, đổi dòng này theo tên công ty.

---

## 13. Giá và phạm vi phát hành (Pricing and Availability)

| Mục | Chọn | Ghi chú |
|---|---|---|
| Price | **Free** (0) | Không có in-app purchase. |
| Countries or Regions | **Chỉ Vietnam** | Bấm "Edit", bỏ chọn tất cả, rồi chọn Vietnam. Mặc định Apple chọn mọi nước, kể cả Trung Quốc đại lục (cần số đăng ký ICP) và 27 nước EU (liên quan DSA, xem mục 17.2). |
| Tự động có mặt ở nước mới | Tắt | Để app không tự xuất hiện ở nước bạn chưa kiểm. |
| iPhone and iPad Apps on Apple Silicon Mac | **Bỏ chọn** "Make this app available" | App chưa từng được thử trên máy Mac. |
| Apple Vision Pro | **Bỏ chọn** | Chưa thử. |
| Pre-Order | Không | |
| Distribution Method | Public | |

- App miễn phí và không có in-app purchase, nên **không cần** ký Paid Apps Agreement, khai thuế hay nhập tài khoản ngân hàng. Thoả thuận cho app miễn phí đã nằm trong thoả thuận của Apple Developer Program.
- Apple có ô "Availability in Vietnam" nhưng nó chỉ áp dụng cho **game** (cần giấy phép phát hành game). WeDo không phải game nên bỏ qua.
- ⚠ Giả định: ứng dụng iOS là **bản đi kèm miễn phí** của dịch vụ web (Guideline 3.1.3(f)). Điều kiện là trong app **không có chỗ mua** và **không có lời mời mua ở nơi khác**. Kết quả kiểm tra tìm ra ba chỗ phải xử lý trên iOS. Cả ba đã sửa trên nhánh iOS: nút "Xem đầy đủ trên web" đã ẩn trên iPhone (`1adf6b5`); thông báo gia hạn gói bỏ câu "Gia hạn sớm...", không đẩy xuống iPhone và bị app iPhone ẩn (`55a69f1`, `c9ff08c`); cổng cập nhật trên iPhone mở App Store (`1894bd0`). Chỉ đúng khi máy chủ mới đã lên production.

---

## 14. Phân loại độ tuổi (Age Rating)

Vào App Information → Age Ratings → **Set Up Age Ratings**. Bộ câu hỏi dưới đây là bộ mới của Apple (áp dụng từ 2025), tôi đối chiếu với trang "Age ratings values and definitions" và "Set an app age rating" ngày 26/09/2026. Tên câu hỏi để nguyên tiếng Anh như trên App Store Connect.

Thứ tự trên màn hình:

1. Bước đầu là một danh sách In-App Controls và Capabilities dạng ô đánh dấu. **Chỉ đánh dấu hai ô: User-Generated Content và Messaging and Chat.** Bảng dưới ghi "Yes" cho ô cần đánh dấu, "No" cho ô để trống.
2. Các bước sau hỏi từng loại nội dung, chọn mức None / Infrequent / Frequent (vài câu chỉ có Yes / No).
3. Bước cuối là **Age Categories and Override** (mục 14.2).

### 14.1. Trả lời từng câu

**In-App Controls (công cụ trong app)**

| Câu hỏi | Trả lời | Lý do |
|---|---|---|
| Parental Controls | **No** | App không có công cụ cho phụ huynh theo dõi hay giới hạn. |
| Age Assurance | **No** | App không xác minh tuổi. Ô tự khai "Tôi đủ 18 tuổi và đồng ý với…" ở màn đăng ký và ở màn đồng ý một lần (06, mục 6) không phải là xác minh tuổi. |

**Capabilities (khả năng của app)**

| Câu hỏi | Trả lời | Lý do |
|---|---|---|
| Unrestricted Web Access | **No** | App không có trình duyệt hay ô nhập địa chỉ web. Chỉ mở vài đường dẫn cố định: bốn trang tĩnh Điều khoản sử dụng, Chính sách quyền riêng tư, Hỗ trợ (mở trong trình duyệt trong app, `src/lib/legal-links.ts` trên nhánh `ios`) và phòng họp Daily.co (`src/app/(tabs)/meetings/[id].tsx:117`). Nút "Xem đầy đủ trên web" (mở web WeDo **bên trong** app) đã ẩn trên iPhone (commit `1adf6b5`). Nếu sau này hiện lại, người dùng có thể đi lung tung trên web, và câu trả lời đúng có thể thành Yes (khi đó app bị tính 16+). |
| User-Generated Content | **Yes** | Tin nhắn, ảnh, tệp nộp bài, ảnh đại diện do người dùng tạo và người khác xem được. |
| Social Media | **No** | Không có bảng tin, lượt thích, chia sẻ lan rộng. Tìm bạn và kết bạn không phải bảng tin. |
| Social Media Disabled for Users Under 13 | **No** (không áp dụng) | Chỉ có nghĩa khi Social Media là Yes. |
| Messaging and Chat | **Yes** | Trò chuyện nhóm theo dự án và tin nhắn riêng 1-1. |
| Advertising | **No** | Không có quảng cáo, không có SDK quảng cáo. |

**Mature Themes (chủ đề người lớn)**

| Câu hỏi | Trả lời |
|---|---|
| Profanity or Crude Humor | **None** |
| Horror/Fear Themes | **None** |
| Alcohol, Tobacco, or Drug Use or References | **None** |

**Medical or Wellness (y tế, sức khoẻ)**

| Câu hỏi | Trả lời |
|---|---|
| Medical or Treatment Information | **None** |
| Health or Wellness Topics | **No** |

**Sexuality or Nudity (tình dục, khoả thân)**

| Câu hỏi | Trả lời |
|---|---|
| Mature or Suggestive Themes | **None** |
| Sexual Content or Nudity | **None** |
| Graphic Sexual Content and Nudity | **None** |

**Violence (bạo lực)**

| Câu hỏi | Trả lời |
|---|---|
| Cartoon or Fantasy Violence | **None** |
| Realistic Violence | **None** |
| Prolonged Graphic or Sadistic Realistic Violence | **None** |
| Guns or Other Weapons | **None** |

**Chance-Based Activities (may rủi, thi đấu)**

| Câu hỏi | Trả lời | Lý do |
|---|---|---|
| Gambling | **No** | |
| Simulated Gambling | **None** | |
| Contests | **None** | Bảng đóng góp là báo cáo tiến độ trong nhóm. Không có cuộc thi, giải thưởng hay bảng xếp hạng công khai. Nếu bạn thấy việc đánh số thứ tự 1, 2, 3 trong Bảng đóng góp (`src/app/(tabs)/account/contributions.tsx:39`) giống xếp hạng, chọn **Infrequent**: mức này vẫn cho 4+, không đổi kết quả. |
| Loot Boxes | **No** | |

Các câu trên hỏi về nội dung **do bạn làm ra**. Nội dung người dùng tự gửi đã được khai qua hai câu User-Generated Content và Messaging and Chat.

### 14.2. Kết quả và việc nâng mức tuổi lên 18+

- **Apple sẽ tính ra 4+.** Theo bảng của Apple, User-Generated Content và Messaging and Chat đều thuộc mức 4+. Không câu nào ở trên đẩy mức tuổi lên. Cứ trả lời đúng sự thật như bảng 14.1, **không** sửa câu trả lời để ép ra mức cao hơn.
- Ở bước **Age Categories and Override**:
  - **Made for Kids: không chọn.** App không làm cho trẻ em, và chọn rồi thì không đổi được.
  - **Override to Higher Age Rating: chọn 18+.**
- **Vì sao chọn được 18+:** từ bản cập nhật bảng xếp hạng tuổi (tin của Apple ngày 24/07/2025), App Store có năm mức 4+, 9+, 13+, 16+, 18+. Apple viết: nếu app có chính sách đòi tuổi tối thiểu cao hơn mức Apple tính, bạn đặt được mức cao hơn sau khi trả lời bộ câu hỏi. Trang "Set an app age rating" ghi thêm: app có EULA đặt tuổi tối thiểu cao hơn mức Apple tính thì **phải** nâng mức cho khớp. App Store sẽ hiện mức bạn chọn, còn phần mô tả nội dung vẫn lấy theo câu trả lời. Mức nâng áp cho mọi vùng app được phát hành.
- **Vì sao phải là 18+:** tuổi tối thiểu đã chốt là 18. Chính sách mới (`05-chinh-sach-bao-mat.md`, mục 12), điều khoản (`06-dieu-khoan-su-dung.md`, Điều 2.1) và trang hỗ trợ (`07-trang-ho-tro.md`) đều ghi 18. Màn đăng ký có ô bắt buộc "Tôi đủ 18 tuổi và đồng ý Điều khoản sử dụng, Chính sách quyền riêng tư" (`08-sua-code-truoc-khi-nop.md`, IOS-06). Lý do chọn 18: điều khoản Gemini API cấm dùng trong dịch vụ có khả năng được người dưới 18 tuổi truy cập, luật Việt Nam đòi cha mẹ đồng ý khi xử lý dữ liệu của trẻ dưới 16 tuổi, và người dùng chính là sinh viên đại học.
- **Hai con số khác nhau thế nào:**
  - *Mức xếp hạng nội dung* (content rating) là thứ Apple tính từ câu trả lời: app chứa gì. Với WeDo là 4+.
  - *Tuổi tối thiểu* là điều kiện dùng app mà WeDo tự đặt trong điều khoản: 18.
  - Override chỉ đổi mức hiện trên App Store thành 18+ để khớp tuổi tối thiểu. Nó không đổi câu trả lời, và cũng không phải xác minh tuổi.
- **Hệ quả nên biết:** iPhone đang bật giới hạn nội dung theo độ tuổi (Thời gian sử dụng, hoặc tài khoản trẻ em trong Chia sẻ trong gia đình) dưới 18+ sẽ không tải được WeDo. Người dùng như vậy không nằm trong đối tượng của WeDo, nên chấp nhận được.
- **Age Suitability URL** (không bắt buộc): để trống. Ô này dành cho một trang riêng giải thích app hợp với lứa tuổi nào. Trang điều khoản không phải loại trang đó.
- Việt Nam không có mức tuổi riêng theo vùng (chỉ Úc, Brazil và Hàn Quốc có), nên không có bước nào thêm.

Nếu lúc bấm, menu Override không có 18+ (giao diện có thể đổi), chọn mức cao nhất có trong menu và ghi lại để hỏi Apple qua trang liên hệ của Apple Developer. Đừng hạ tuổi tối thiểu trong điều khoản cho khớp: ba chỗ (App Store Connect, chính sách, điều khoản) phải cùng một con số, và con số đã chốt là 18.

Nhắc thêm (Guideline 2.3.8): ảnh chụp màn hình và mọi metadata phải phù hợp mức 4+, dù app được nâng lên 18+. Ảnh chụp dùng tên và tin nhắn giả, không dùng dữ liệu người thật.

---

## 15. Quyền nội dung (Content Rights)

Câu hỏi trong App Information: app có chứa, hiển thị hoặc truy cập nội dung của bên thứ ba không?

**Trả lời: Yes**, rồi xác nhận bạn có đủ quyền với nội dung đó.

**Lý do:**

- App hiển thị nội dung **người dùng khác** tạo: tin nhắn, ảnh, tệp, ảnh đại diện, tên.
- App hiển thị đề xuất công việc do **nhà cung cấp AI** bên ngoài tạo (Google Gemini hoặc Azure OpenAI/OpenAI, tuỳ cấu hình máy chủ).
- App mở phòng họp của **Daily.co** (trong Safari, bên ngoài app).

**Cơ sở để nói "có đủ quyền":**

- Với nội dung người dùng: bản nháp Điều khoản sử dụng (06, Điều 4.4) cho WeDo quyền lưu, xử lý và hiển thị nội dung người dùng gửi, trong phạm vi nêu ở Điều 4.3.
- Với kết quả AI và Daily.co: bạn dùng các dịch vụ này qua API theo điều khoản của từng nhà cung cấp. ⚠ Giả định: điều khoản của gói bạn đang dùng (Gemini, Azure OpenAI hoặc OpenAI, và Daily.co) cho phép hiển thị kết quả trong sản phẩm của bạn. Nên đọc lại một lần trước khi gửi.
- App không nhúng nhạc, phim, sách, tin tức hay hình ảnh có bản quyền của người khác. Bộ biểu tượng Ionicons dùng giấy phép MIT.

⚠ Giả định: trang điều khoản (06) đã được đăng và người dùng phải đồng ý trong app. Nếu chưa có, cơ sở pháp lý cho nội dung người dùng rất mỏng.

---

## 16. Tuân thủ xuất khẩu (Export Compliance)

**Kết luận: app chỉ dùng mã hoá có sẵn trong hệ điều hành Apple, thuộc diện miễn. Khai `ITSAppUsesNonExemptEncryption` = NO.**

Trong `app.json`, khoá này được đặt như sau:

```json
"ios": {
  "config": {
    "usesNonExemptEncryption": false
  }
}
```

Expo sẽ ghi `ITSAppUsesNonExemptEncryption = NO` vào `Info.plist`. Nhờ vậy App Store Connect và TestFlight không hỏi lại câu mã hoá ở mỗi build. `app.json` trên nhánh `ios` (thư mục `D:\WeDo_ChPlay-ios`, commit `dbbd5f0`) đã có dòng này, tôi kiểm ngày 26/09/2026. Nhánh `main` ở `D:\WeDo_ChPlay` cố ý chưa có, để không đổi vân tay của bản Android đang chạy. Chỉ cần kiểm lại trong `Info.plist` của bản build đầu tiên.

**Vì sao được miễn:**

- Gọi API qua HTTPS bằng `fetch`, bên dưới là NSURLSession của iOS.
- Trò chuyện thời gian thực qua socket.io trên TLS, do hệ điều hành xử lý.
- Lưu mã đăng nhập trong Keychain qua `expo-secure-store`.
- Google Sign-In và Sentry chỉ gửi dữ liệu qua HTTPS.
- Không có thư viện mã hoá riêng chạy trong app. `src/lib/chat/local-id.ts` cố ý dùng `Math.random`, không dùng thư viện mã hoá. Thư viện `node-forge` chỉ có trong công cụ build của Expo, không nằm trong app.

**Nếu App Store Connect vẫn hỏi** (ví dụ một build được tải lên thiếu khoá trên):

| Câu hỏi | Trả lời |
|---|---|
| Loại thuật toán mã hoá app dùng | **None of the algorithms mentioned above** (không dùng thuật toán riêng, không dùng thuật toán chuẩn nào ngoài phần có sẵn trong hệ điều hành Apple). Tên lựa chọn trên giao diện có thể khác đôi chút. |
| App có phát hành ở Pháp không | **No** (chỉ phát hành ở Việt Nam) |

Theo bảng của Apple, app chỉ dùng mã hoá có sẵn trong hệ điều hành thì **không cần nộp giấy tờ** gì.

⚠ Giả định: app không thêm thư viện mã hoá nào (ví dụ mã hoá đầu cuối cho tin nhắn). Nếu sau này thêm, phải xem lại mục này.

---

## 17. Các mục còn lại

### 17.1. License Agreement (EULA)

Giữ **EULA chuẩn của Apple** (mặc định, không phải làm gì). Người dùng đồng ý Điều khoản sử dụng WeDo ngay trong app. Chi tiết ở `06-dieu-khoan-su-dung.md`.

Đã làm trên nhánh `ios` (`08-sua-code-truoc-khi-nop.md`, IOS-06): màn đăng ký có ô bắt buộc "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư", nút Đăng ký tắt tới khi đánh dấu. Tài khoản chưa đồng ý (tạo trên web, bằng Google, hay trước khi có ô) gặp màn "Điều khoản sử dụng" một lần sau khi đăng nhập, với nút "Đồng ý và tiếp tục". Guideline 1.2 đòi người dùng phải đồng ý điều khoản cấm nội dung phản cảm, nên trang `dieu-khoan.html` phải đăng trước khi gửi.

### 17.2. Digital Services Act của EU (DSA)

Khi gửi app mới lần đầu, App Store Connect sẽ bắt bạn khai mình có phải "trader" (người kinh doanh) theo luật DSA của EU hay không, **kể cả khi không phát hành ở EU**.

- Theo hướng dẫn của Apple, nếu bạn **chỉ phát hành ngoài EU** thì bạn không hoạt động như trader trên App Store.
- Đã chốt: bản đầu chỉ phát hành ở Việt Nam, nên chọn **This is not a trader account**. Không có thông tin cá nhân nào bị công bố. `01-tai-khoan-va-build.md` bước 2.3 ghi cùng lựa chọn.
- Nếu sau này mở sang EU: phải khai lại. Tài khoản cá nhân là trader thì phải công bố **địa chỉ (hoặc hộp thư bưu điện), số điện thoại và email** trên trang App Store ở 27 nước EU. Nên chuẩn bị địa chỉ và số điện thoại dành riêng cho công việc, đừng dùng địa chỉ nhà.

### 17.3. Build và phát hành

| Mục | Chọn |
|---|---|
| Version | `1.0.13` |
| Build | `1.0.13 (1)` |
| Version Release | **Manually release this version** (tự bấm phát hành sau khi được duyệt, để chủ động giờ ra mắt) |
| Phased Release | Không áp dụng cho bản đầu tiên |

### 17.4. App Review Information

Phần ghi chú chi tiết (tiếng Anh kèm bản dịch) nằm ở `04-thong-tin-cho-reviewer.md`. Các ô còn lại:

| Ô | Điền |
|---|---|
| Sign-in required | Có đánh dấu |
| User name | `[EMAIL TÀI KHOẢN DEMO A]` |
| Password | `[MẬT KHẨU TÀI KHOẢN DEMO A]` |
| Contact first name | `Đại` (giống `04-thong-tin-cho-reviewer.md`, mục 5) |
| Contact last name | `Lê Hữu`. Ghi `Hữu Đại` / `Lê` cũng được, miễn là giống nhau ở mọi chỗ bạn khai với Apple. |
| Contact phone | `[SỐ ĐIỆN THOẠI, dạng +84…]` — Apple không nhận số thiếu dấu + và mã nước |
| Contact email | `wedosupport6886@gmail.com` (đã chốt; điều kiện đọc thư hằng ngày ở `07-trang-ho-tro.md` mục 0) |
| Notes | Dán từ `04-thong-tin-cho-reviewer.md`, mục 6. Tối đa **4000 byte**. |

Thông tin tài khoản demo B ghi trong Notes, không ghi ở đây.

---

## 18. Kiểm trước khi dán và bấm gửi

Các chữ ở trên chỉ đúng khi những việc sau đã xong. Phần mã của mọi dòng đã có trên nhánh iOS (`08-sua-code-truoc-khi-nop.md`, mục Đã làm). Việc còn lại là đưa máy chủ và web lên production (`08`, mục Thứ tự đưa lên) và thử trên TestFlight. Mục nào chưa xong thì sửa chữ tương ứng hoặc hoãn gửi.

- [ ] Máy chủ `ios-backend` và web `ios-web` đã lên production.
- [ ] Màn Đăng nhập và Đăng ký trên iPhone không có nút Google (mô tả: "Đăng nhập bằng email và mật khẩu").
- [ ] Tài khoản tạo bằng Google trên web đặt được mật khẩu qua "Quên mật khẩu?" rồi đăng nhập trên iPhone (mô tả, phần DÙNG CÙNG BẢN WEB).
- [ ] Báo cáo và chặn chạy được ở trò chuyện dự án, tin nhắn riêng và lời mời kết bạn (mô tả).
- [ ] Bộ lọc từ ngữ thay từ phản cảm trong tin nhắn và tên hiển thị bằng `***` (Guideline 1.2).
- [ ] Hộp thoại xin đồng ý dùng AI hiện trước lần đầu chọn "Tạo công việc bằng AI" (mô tả).
- [ ] Gửi ảnh chọn từ thư viện iPhone thành công. Mã đã đổi ảnh HEIC sang JPEG trước khi gửi (commit `0cc5b3b`); còn phải thử trên máy thật (mô tả: "chọn ảnh có sẵn để gửi").
- [ ] Thông báo đẩy tới được iPhone, tức là đã có khoá APNs (mô tả: phần Thông báo).
- [ ] Trang `https://wedofpt.com.vn/ho-tro.html` đã lên và có email liên hệ (Support URL).
- [ ] Trang "Chính sách quyền riêng tư" mới đã lên, phủ cả iPhone và nêu đúng việc gửi dữ liệu tới AI (Privacy Policy URL).
- [ ] Trang `https://wedofpt.com.vn/dieu-khoan.html` đã lên, tuổi tối thiểu 18 khớp mức 18+ đã khai (mục 14).
- [ ] Trên iOS không còn đường nào dẫn tới Bảng giá, thanh toán hay CH Play (mục 13).
- [ ] Ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư" hiện ở màn đăng ký trên bản TestFlight (mục 17.1).
- [ ] Age Rating đã chọn Override to Higher Age Rating → 18+ (mục 14.2).
- [x] `app.json` trên nhánh `ios` đã có `bundleIdentifier: vn.wedo.app`, `buildNumber: "1"`, `supportsTablet: false`, `usesNonExemptEncryption: false`, `locales.vi`, và biểu tượng iOS là logo WeDo (`assets/images/icon.png`), tôi kiểm ngày 26/09/2026. Chỉ cần xem lại trên bản build đầu tiên.
- [ ] Ba tài khoản demo A, B, C đã có dữ liệu mẫu (xem `04-thong-tin-cho-reviewer.md`, mục 4).

---

## 19. Nguồn đã kiểm

**Apple (đọc ngày 26/09/2026):**

- App information (tên 2–30 ký tự, phụ đề 30 ký tự, Content Rights, Primary Language, DSA, Availability in Vietnam): https://developer.apple.com/help/app-store-connect/reference/app-information/app-information/
- Platform version information (Promotional Text 170, Description 4000, Keywords 100 byte và mỗi từ khoá dài hơn 2 ký tự, Support URL, Copyright, What's New không có ở bản đầu, Notes 4000 byte, số điện thoại dạng +): https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/
- App Store localizations (App Store Việt Nam: mặc định English (U.K.), thêm Vietnamese): https://developer.apple.com/help/app-store-connect/reference/app-information/app-store-localizations/
- Age ratings values and definitions: https://developer.apple.com/help/app-store-connect/reference/app-information/age-ratings-values-and-definitions/
- Set an app age rating (Override, Made for Kids, Age Suitability URL): https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/
- Updated age ratings in App Store Connect (24/07/2025: thêm 13+, 16+, 18+; đặt được mức cao hơn khi app đòi tuổi tối thiểu cao hơn): https://developer.apple.com/news/?id=ks775ehf
- Choosing a category: https://developer.apple.com/app-store/categories/
- Export compliance documentation for encryption: https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption/
- Overview of export compliance: https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/
- EU DSA trader requirements: https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/
- App Review Guidelines, bản cập nhật ngày 8/6/2026 (1.2, 2.3.1, 2.3.7, 2.3.8, 2.3.10, 2.3.12, 3.1.3, 3.1.3(f), 4.8 và ngoại lệ cho app chỉ dùng tài khoản riêng, 5.1.2(i)): https://developer.apple.com/app-store/review/guidelines/
- Tra tên trùng: iTunes Search API, `https://itunes.apple.com/search?term=WeDo&country=vn&entity=software` (và `country=us`)
- EAS Submit, các khoá `ascAppId`, `appName`, `language`: https://docs.expo.dev/eas/json/

**Mã nguồn:**

- `D:\WeDo_ChPlay-ios\app.json` (nhánh `ios`: tên "WeDo", phiên bản 1.0.13, cấu hình iOS, quyền máy ảnh và thư viện ảnh) và `D:\WeDo_ChPlay-ios\locales\vi.json` (tên hiển thị "WeDo")
- `D:\WeDo_ChPlay\eas.json` (`submit.production` còn trống)
- Các màn hình trong `D:\WeDo_ChPlay\src\app` (xem bảng 7.2)
- `D:\WEDO_PC\FE_WEDO\public\privacy.html:44,126-129,140,144` (bản đang đăng: phạm vi "web và Android", tuổi 13 mà bản mới ở `05` đổi thành 18, email liên hệ, "© 2026 WeDo Team")
- `D:\WEDO_PC\FE_WEDO\src\views\LandingView.tsx:254,420,472,633` (Bảng giá và các câu chỉ đúng với bản web)
- `D:\WEDO_PC\BE_WEDO\src\chat\chat.service.ts`, `src\tasks\tasks.service.ts`, `src\meetings\meetings.service.ts`, `src\payments\billing-operations.service.ts` (quyền Leader, nhà cung cấp AI, thông báo gia hạn)
- Kết quả kiểm tra sẵn sàng iOS (`ios-audit.json`), chỉ dùng các kết luận không bị bác bỏ.
