# 06 — Điều khoản sử dụng (EULA) cho WeDo

Tài liệu này có ba phần chính:

1. Văn bản **Điều khoản sử dụng** tiếng Việt, sẵn để đăng lên web (mục 4).
2. Cách chọn giữa **EULA chuẩn của Apple** và **EULA riêng** trong App Store Connect (mục 3).
3. Chỗ đặt ô **"Tôi đồng ý Điều khoản"** trong ứng dụng, đúng như đã làm trên nhánh `ios` (mục 6).

Mọi chỗ dựa trên quyết định chưa chốt đều ghi **⚠ Giả định:** để bạn sửa. Mọi chỗ thiếu thông tin thật đều để trong ngoặc vuông, ví dụ `[ĐỊA CHỈ LIÊN HỆ]`. Email hỗ trợ đã chốt là `wedosupport6886@gmail.com` và đã điền sẵn.

---

## 1. Tóm tắt nhanh

**Hiện trạng (đã kiểm trong mã trên ba nhánh iOS ngày 26/09/2026):**

- Trang điều khoản đã làm: `D:\WEDO_PC\FE_WEDO-ios\public\dieu-khoan.html` (nhánh `ios-web`, commit `f6052b3`), theo văn bản ở mục 4. **Chưa đăng**: hôm nay `https://wedofpt.com.vn/dieu-khoan.html` còn trả 404. Đăng theo `08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên, Bước B.
- Bản HTML khác mục 4 ở ba chỗ: không có dòng "Phiên bản" (máy chủ không lưu phiên bản điều khoản); ngày ghi "Cập nhật ngày 26/09/2026, có hiệu lực từ ngày đăng tại trang này"; bỏ địa chỉ và điện thoại ở Điều 1.3, 16.8 và 19, chỉ giữ email (đường A cho phép, xem mục 8). Phần còn lại của mục 4 trùng với bản HTML; sửa một nơi thì sửa cả nơi kia.
- Ô đồng ý và màn đồng ý một lần **đã làm** trên app (nhánh `ios`, commit `899c8eb`, `dff8821`), máy chủ lưu mốc đồng ý (nhánh `ios-backend`, commit `3386c52`). Chi tiết ở mục 6.
- Báo cáo, chặn, bộ lọc từ ngữ và khoá tài khoản **đã làm** (`08`, IOS-03, IOS-04, IOS-05). Hộp thoại đồng ý AI **đã làm** trên app (IOS-08). Văn bản ở mục 4 đã sửa cho khớp chữ thật trên màn hình.
- Ứng dụng có nội dung do người dùng tạo: trò chuyện dự án, tin nhắn riêng, ảnh, tệp nộp bài, ảnh đại diện, lời mời kết bạn. Vì vậy Guideline 1.2 của Apple áp dụng đầy đủ.

**Việc còn lại, theo thứ tự:**

1. Đưa máy chủ mới lên production, rồi đăng trang `dieu-khoan.html` (`08`, Bước A, B). Văn bản mô tả bộ lọc, báo cáo, chặn, khoá tài khoản; những thứ đó chỉ chạy với máy chủ mới.
2. Quyết định có công bố địa chỉ và điện thoại không (mục 8). Bản HTML hiện chỉ có email.
3. Chuẩn bị người trực để xử lý báo cáo trong 24 giờ, và đặt `REPORT_NOTIFY_EMAIL` trên Azure (mục 7).
4. **Không** dán riêng đoạn tiếng Anh ở mục 9 vào App Review Notes. Đoạn đó đã được gộp vào khối Notes của tài liệu 04 (mục 6). Mục 9 chỉ dùng khi trả lời Apple về Guideline 1.2.

**Khuyến nghị:** giữ **EULA chuẩn của Apple** trong App Store Connect (không phải làm gì), và bắt người dùng đồng ý **Điều khoản sử dụng của WeDo** ngay trong ứng dụng (đã làm). Văn bản ở mục 4 vẫn có sẵn phần điều khoản tối thiểu của Apple (Điều 16), nên nếu sau này bạn muốn dùng EULA riêng thì chỉ việc dán vào.

---

## 2. Apple yêu cầu gì

### 2.1. Guideline 1.2 — Nội dung do người dùng tạo

Theo bản Guideline hiện hành (kiểm ngày 26/09/2026), ứng dụng có nội dung do người dùng tạo phải có đủ bốn thứ:

1. Cách lọc nội dung phản cảm trước khi nó xuất hiện trong ứng dụng.
2. Cách báo cáo nội dung xúc phạm, và phản hồi kịp thời.
3. Cách chặn người dùng lạm dụng.
4. Thông tin liên hệ được công bố để người dùng dễ tìm tới bạn.

Guideline cũng nói nhà phát triển có trách nhiệm gỡ nội dung vi phạm Guideline, vi phạm điều khoản dịch vụ hoặc tiêu chuẩn cộng đồng của chính ứng dụng. Nếu Apple thấy nội dung như vậy, Apple sẽ yêu cầu gỡ và yêu cầu một kế hoạch cải thiện. Vi phạm nặng hoặc lặp lại có thể khiến ứng dụng bị gỡ khỏi App Store và tài khoản bị loại khỏi Apple Developer Program.

### 2.2. Điều Apple đòi thêm khi từ chối ứng dụng

Thư từ chối vì Guideline 1.2 mà Apple hay gửi (nhiều nhà phát triển đã công khai) liệt kê năm yêu cầu. Ba yêu cầu trùng với Guideline (lọc, báo cáo, chặn). Hai yêu cầu còn lại không có trong chữ của Guideline. Đây là mẫu thư từ chối, **không phải** chữ trong Guideline, nhưng nên coi như bắt buộc:

- Người dùng phải **đồng ý với điều khoản (EULA)**, và điều khoản phải nói rõ **không khoan nhượng** với nội dung phản cảm hay người dùng lạm dụng.
- Nhà phát triển phải xử lý báo cáo **trong vòng 24 giờ**, bằng cách **gỡ nội dung** và **loại người đăng** nội dung đó.

Văn bản ở mục 4 đáp ứng cả hai điều này (lời mở đầu, Điều 5 và Điều 6).

### 2.3. Điều khoản tối thiểu khi dùng EULA riêng

Nếu bạn dùng EULA riêng thay cho EULA chuẩn, Apple yêu cầu EULA đó có đủ 10 điểm trong trang *Instructions for Minimum Terms of Developer's End-User License Agreement* (bản cho App Store, kiểm ngày 26/09/2026):

| # | Tên điểm | Nội dung phải có | Ở đâu trong văn bản |
|---|---|---|---|
| 1 | Acknowledgement | Thoả thuận giữa người dùng và nhà phát triển, không phải với Apple. Nhà phát triển chịu trách nhiệm duy nhất về ứng dụng. Không được trái với Apple Media Services Terms and Conditions. | 16.1 |
| 2 | Scope of License | Giấy phép không chuyển nhượng, dùng trên thiết bị Apple mà người dùng sở hữu hoặc kiểm soát, theo Usage Rules; có ngoại lệ cho Family Sharing và mua số lượng lớn. | 16.2 |
| 3 | Maintenance and Support | Nhà phát triển lo bảo trì, hỗ trợ. Apple không có nghĩa vụ nào. | 16.3 |
| 4 | Warranty | Nhà phát triển chịu mọi bảo đảm. Nếu ứng dụng không đúng bảo đảm, người dùng báo cho Apple và Apple hoàn tiền mua. Ngoài việc đó, Apple không có nghĩa vụ bảo đảm nào. | 16.4 |
| 5 | Product Claims | Nhà phát triển xử lý khiếu nại về trách nhiệm sản phẩm, về tuân thủ pháp luật, về bảo vệ người tiêu dùng và quyền riêng tư (Apple nêu cả HealthKit, HomeKit; WeDo không dùng). EULA không được giới hạn trách nhiệm của nhà phát triển quá mức luật cho phép. | 16.5 |
| 6 | Intellectual Property Rights | Nhà phát triển, không phải Apple, xử lý khiếu nại xâm phạm sở hữu trí tuệ. | 16.6 |
| 7 | Legal Compliance | Người dùng cam đoan không ở nước bị Hoa Kỳ cấm vận hoặc bị Hoa Kỳ xếp là nước "hỗ trợ khủng bố", và không có tên trong danh sách bị cấm hay bị hạn chế của Hoa Kỳ. | 16.7 |
| 8 | Developer Name and Address | Tên, địa chỉ, điện thoại, email của nhà phát triển. | 16.8 |
| 9 | Third Party Terms of Agreement | Người dùng phải tuân thủ thoả thuận với bên thứ ba khi dùng ứng dụng. | 16.9 |
| 10 | Third Party Beneficiary | Apple và các công ty con là bên thứ ba thụ hưởng, có quyền thực thi EULA. | 16.10 |

---

## 3. Chọn đường: EULA chuẩn của Apple hay EULA riêng

### Đường A — EULA chuẩn của Apple + Điều khoản WeDo trong ứng dụng (khuyến nghị)

- Không làm gì trong App Store Connect. Apple tự áp dụng *Licensed Application End User License Agreement* (EULA chuẩn) cho mọi quốc gia.
- EULA chuẩn chỉ nói về giấy phép dùng ứng dụng: phạm vi giấy phép, đồng ý dùng dữ liệu, chấm dứt, dịch vụ bên ngoài, không bảo đảm, giới hạn trách nhiệm, hạn chế xuất khẩu, luật áp dụng (bang California). Nó **không** có câu nào về không khoan nhượng với nội dung phản cảm, về báo cáo hay chặn người dùng, nên **không đủ** cho Guideline 1.2.
- Vì vậy vẫn phải đăng Điều khoản sử dụng của WeDo (mục 4) và bắt người dùng đồng ý **ngay trong ứng dụng** (mục 6).
- Ưu điểm: ít việc, không phải công bố địa chỉ và số điện thoại trong App Store Connect, không phải giữ hai bản văn bản khớp nhau.

### Đường B — EULA riêng dán vào App Store Connect

- Vào **Apps**, chọn WeDo. Ở thanh bên, dưới **General**, bấm **App Information**. Trong phần **General Information**, bấm **Edit** cạnh **License Agreement**.
- Trong hộp thoại, chọn **"Apply a custom EULA to all chosen countries or regions"**.
- Dán toàn bộ văn bản ở mục 4 vào ô **Custom License Agreement**. Ô này chỉ nhận văn bản thuần (không định dạng): mọi thẻ HTML bị bỏ, chỉ giữ dấu xuống dòng. Văn bản ở mục 4 đã viết dạng văn bản thuần nên dán được ngay.
- Ở **Countries or Regions**, chọn **Vietnam**. Bấm **Done**, rồi **Save**.
- Khi có EULA riêng, trang sản phẩm trên App Store sẽ hiện đường dẫn tới EULA đó. Khi không có, đường dẫn này không hiện.
- Nhược điểm: Điều 16.8 bắt buộc có địa chỉ và số điện thoại. Mỗi lần sửa điều khoản trên web phải dán lại vào App Store Connect.
- Trang trợ giúp của Apple không nêu giới hạn độ dài của ô này. Nếu ô báo quá dài, quay về đường A.

**Dù chọn đường nào**, ứng dụng vẫn phải có bước người dùng đồng ý điều khoản. EULA hiện trên trang App Store không thay được bước này.

⚠ Giả định: bạn chọn **đường A**. Nếu chọn đường B, Điều 16 phải điền đủ địa chỉ và số điện thoại.

---

## 4. Văn bản Điều khoản sử dụng (bản đăng web)

### 4.1. Những chỗ dựa trên giả định

Đọc kỹ trước khi đăng. Sửa văn bản nếu quyết định của bạn khác.

- ⚠ Giả định: Điều 1.2, 16 — bên cung cấp là **cá nhân Lê Hữu Đại**, vì bạn đăng ký Apple Developer Program dạng cá nhân và chưa có công ty. Tên người bán trên App Store sẽ là tên này. Khi lập công ty, phải sửa Điều 1.2, 16 và báo người dùng theo Điều 18.4.
- Đã chốt: Điều 2.1 — tuổi tối thiểu **18**, khớp với bản Chính sách quyền riêng tư mới (tài liệu 05, mục 12), trang hỗ trợ (tài liệu 07) và App Store Connect (tài liệu 02, mục 14). Lý do:
  1. Điều khoản Gemini API cấm dùng API trong ứng dụng hướng tới, hoặc có khả năng được truy cập bởi, người dưới 18 tuổi ("likely to be accessed by individuals under the age of 18", https://ai.google.dev/gemini-api/terms, kiểm ngày 26/09/2026). Máy chủ WeDo dùng Gemini trước tiên khi có `GEMINI_API_KEY` (`BE_WEDO\src\chat\chat.service.ts:954-966`).
  2. Nếu điều khoản của ứng dụng đặt tuổi tối thiểu cao hơn mức Apple tự tính, Apple yêu cầu nâng mức tuổi cho khớp (App Store Connect Help, *Set an app age rating*). Với tuổi 18, ở App Store Connect chọn **Override to Higher Age Rating → 18+**, như tài liệu 02 mục 14 đã ghi.
  3. Chính sách đang đăng hôm nay ghi 13 (`FE_WEDO\public\privacy.html:126-129`). Bản mới ở tài liệu 05 đổi thành 18.

- Đã chốt: Điều 3.1 — ứng dụng trên iPhone **chỉ đăng nhập bằng email và mật khẩu**, nút Google bị ẩn trên iPhone. Web và Android giữ Google. Không có Sign in with Apple ở bản này, nên văn bản không nhắc Apple. Câu "dùng Quên mật khẩu để đặt mật khẩu" đúng với mã máy chủ (tài liệu 08, IOS-02). Khi làm Sign in with Apple ở bản sau, thêm "hoặc bằng Apple (trên iPhone)" vào Điều 3.1 và "hoặc Apple" vào Điều 8.3.
- Đã làm: Điều 5.4 — bộ lọc từ ngữ tiếng Việt và tiếng Anh cho tin nhắn và tên hiển thị **thay từ phản cảm bằng `***`**, không từ chối cả tin (tài liệu 08, IOS-03). Văn bản nói đúng như vậy. Đăng điều khoản khi máy chủ mới đã chạy.
- ⚠ Giả định: Điều 4.3 — tệp bài nộp vẫn mở được bằng đường dẫn công khai, khó đoán (`BE_WEDO\src\tasks\task-submission-files.controller.ts:8-27`, route không cần đăng nhập). Nếu máy chủ thêm bước kiểm tra đăng nhập, bỏ câu về đường dẫn tệp bài nộp.
- Đã làm: Điều 6 — công cụ **báo cáo** và **chặn** (tài liệu 08, IOS-03, IOS-04). Chữ trên màn hình: nhấn giữ tin của người khác (trò chuyện dự án và tin nhắn riêng) có "Báo cáo tin nhắn" và "Chặn người này"; nút ba chấm ở đầu cuộc trò chuyện riêng và nút ba chấm ở mỗi dòng trong màn Bạn bè (bạn bè, lời mời đến, lời mời đã gửi, kết quả tìm) có "Báo cáo người này" và "Chặn người này"; bỏ chặn ở "Tài khoản → Người đã chặn". Phiếu báo cáo có sáu lý do. Văn bản Điều 6 đã sửa cho khớp.
- Đã làm: Điều 6.2 — chặn có tác dụng ngay, theo cả hai chiều: không nhắn riêng, không kết bạn, không tìm thấy nhau; quan hệ bạn bè bị xoá; tin của người bị chặn bị ẩn với người chặn, kể cả trong trò chuyện dự án chung; người chặn không nhận thông báo đẩy về tin của họ trong dự án chung. Người bị chặn không nhận thông báo nào về việc bị chặn.
- Đã làm: Điều 6.3 — khoá tài khoản: không đăng nhập được, mọi phiên đang mở bị ngắt (tài liệu 08, IOS-03).
- Đúng với mã: Điều 7.1 — trên web, mỗi tin trưởng nhóm vừa gửi trong trò chuyện dự án được **tự động** đưa cho AI, không hỏi ai (`FE_WEDO\src\views\ChatView.tsx:920-923`). Văn bản mô tả đúng hành vi này. Nếu web được sửa để chỉ gọi AI khi trưởng nhóm bấm chọn, sửa câu "Trên web..." ở Điều 7.1 và 7.3.
- Đã làm: Điều 7.3 — **hộp thoại xin đồng ý** trước lần đầu dùng AI trên điện thoại, và công tắc "Cho phép dùng AI" trong tab Tài khoản (tài liệu 08, IOS-08).
- Đúng với máy chủ mới: Điều 7.2 — đề xuất công việc gửi tin nhắn được chọn, tối đa 12 tin nhắn gần nhất của dự án kèm tên người gửi, tên dự án, danh sách thành viên (tên, vai trò). **Không gửi email hay số điện thoại** (máy chủ mới, commit `3386c52`). Tóm tắt cuộc họp: tên cuộc họp và bản ghi lời thoại. Góp ý: điểm và lời góp ý, không kèm tên hay email. Nếu production chỉ dùng một nhà cung cấp AI, có thể bỏ tên hai nhà cung cấp kia.
- ⚠ Giả định: Điều 8.1 — phòng họp Daily.co vẫn để chế độ công khai (`BE_WEDO\src\meetings\meetings.service.ts:1431`, `privacy: 'public'`). Nếu máy chủ chuyển sang phòng riêng có mã vào phòng, bỏ câu "Bất kỳ ai có đường dẫn...".
- ⚠ Giả định: Điều 9.1 — ứng dụng trên điện thoại **miễn phí**, **không có mua hàng trong ứng dụng**, không có lời mời mua ở nơi khác. Văn bản cố ý **không** nhắc tới gói trả phí trên web (xem mục 5).
- ⚠ Giả định: Điều 9.3, 11.4 — báo trước **30 ngày** nếu ngừng toàn bộ dịch vụ; người bị khoá có **30 ngày** để khiếu nại.
- ⚠ Giả định: Điều 13.2 — mức trần trách nhiệm là số lớn hơn giữa tiền đã trả trong 12 tháng và **500.000 đồng**. Đây là con số đề xuất, nên hỏi người có chuyên môn pháp lý.
- Điều 1.4, 4.3 — Chính sách quyền riêng tư mới (tài liệu 05) đã làm trên nhánh `ios-web` (commit `c4b98c2`). Bản đang sống, tên cũ "Chính sách bảo mật", chỉ ghi "web WeDo và ứng dụng Android" và mô tả sai phần AI. Đăng hai trang cùng lúc, không đăng điều khoản trước chính sách mới.

### 4.2. Văn bản để sao chép

```text
ĐIỀU KHOẢN SỬ DỤNG WEDO

Phiên bản: [PHIÊN BẢN, ví dụ 2026-10]
Có hiệu lực từ: [NGÀY HIỆU LỰC]
Áp dụng cho: web WeDo (wedofpt.com.vn), ứng dụng WeDo trên Android và trên iPhone.

Cảm ơn bạn đã dùng WeDo. Xin đọc kỹ văn bản này. Khi bạn đánh dấu ô đồng ý, bấm "Đồng ý và tiếp tục", hoặc tiếp tục dùng WeDo, bạn đồng ý với Điều khoản này. Nếu không đồng ý, xin đừng dùng WeDo.

ĐIỀU QUAN TRỌNG NHẤT
WeDo KHÔNG KHOAN NHƯỢNG với nội dung phản cảm và với người dùng có hành vi lạm dụng, quấy rối hay bắt nạt người khác. Bạn có thể báo cáo tin nhắn và chặn người dùng ngay trong ứng dụng. Chúng tôi xem xét mọi báo cáo trong vòng 24 giờ. Nếu nội dung vi phạm, chúng tôi gỡ nội dung đó và loại người đăng khỏi WeDo.


1. VỀ WEDO VÀ BÊN CUNG CẤP

1.1. WeDo là dịch vụ giúp sinh viên làm việc nhóm. WeDo có không gian làm việc, dự án, công việc, trò chuyện dự án, tin nhắn riêng, bạn bè, cuộc họp, lịch, bảng đóng góp và một số tính năng dùng trí tuệ nhân tạo (AI).

1.2. Bên cung cấp WeDo là cá nhân Lê Hữu Đại. Cá nhân này phát triển và vận hành WeDo cùng nhóm WeDo Team, và chịu trách nhiệm với bạn theo Điều khoản này. Trong văn bản này, "WeDo", "chúng tôi" là bên cung cấp nói trên. "Bạn" là người dùng WeDo.

1.3. Liên hệ: email wedosupport6886@gmail.com. Địa chỉ: [ĐỊA CHỈ LIÊN HỆ]. Điện thoại: [SỐ ĐIỆN THOẠI].

1.4. Điều khoản này đi cùng Chính sách quyền riêng tư tại https://wedofpt.com.vn/privacy.html. Chính sách quyền riêng tư nói rõ chúng tôi thu thập dữ liệu gì, dùng để làm gì, gửi cho ai và giữ trong bao lâu.


2. NGƯỜI ĐƯỢC DÙNG WEDO

2.1. Bạn phải đủ 18 tuổi trở lên. Khi tạo tài khoản hoặc bấm đồng ý với Điều khoản này, bạn xác nhận mình đủ 18 tuổi. Nếu biết một tài khoản thuộc về người chưa đủ 18 tuổi, chúng tôi sẽ xoá tài khoản đó.

2.2. Bạn không được dùng WeDo nếu chúng tôi đã chấm dứt tài khoản của bạn vì vi phạm, trừ khi chúng tôi cho phép bằng văn bản.

2.3. Nếu bạn dùng WeDo thay mặt một nhóm, câu lạc bộ hay tổ chức, bạn xác nhận mình có quyền làm việc đó.


3. TÀI KHOẢN

3.1. Bạn có thể tạo tài khoản bằng email và mật khẩu. Trên web WeDo và ứng dụng Android, bạn cũng có thể đăng nhập bằng Google. Ứng dụng trên iPhone chỉ đăng nhập bằng email và mật khẩu; nếu bạn đã tạo tài khoản bằng Google, hãy dùng "Quên mật khẩu" để đặt mật khẩu.

3.2. Thông tin bạn cung cấp phải đúng. Hãy dùng tên mà nhóm của bạn nhận ra được. Không mạo danh người khác.

3.3. Hãy giữ mật khẩu an toàn. Bạn chịu trách nhiệm về mọi hoạt động diễn ra dưới tài khoản của mình. Nếu thấy tài khoản bị dùng trái phép, hãy báo ngay cho chúng tôi qua email ở Điều 1.3.

3.4. Tài khoản là của riêng bạn. Không bán, cho mượn hay chuyển tài khoản cho người khác.


4. NỘI DUNG CỦA BẠN

4.1. "Nội dung" là mọi thứ bạn đưa lên WeDo, ví dụ: tin nhắn, ảnh, tệp đính kèm, tên và mô tả công việc, bài nộp, thông tin cuộc họp, tên hiển thị, ảnh đại diện và góp ý gửi cho chúng tôi.

4.2. Bạn vẫn là chủ sở hữu Nội dung của mình. Bạn chịu trách nhiệm về Nội dung đó. Bạn phải có quyền đăng Nội dung, kể cả khi Nội dung có ảnh hay tài liệu của người khác.

4.3. Người xem được Nội dung của bạn:
- Tin nhắn trong trò chuyện dự án, công việc, bài nộp và cuộc họp: thành viên của dự án đó, cùng chủ và quản trị viên của không gian làm việc chứa dự án.
- Tệp bài nộp được mở bằng một đường dẫn riêng, khó đoán. Ai có đường dẫn đó cũng mở được tệp, nên đừng chia sẻ đường dẫn ra ngoài nhóm.
- Tin nhắn riêng: những người trong cuộc trò chuyện đó.
- Người dùng khác có thể tìm thấy bạn để gửi lời mời kết bạn. Những thông tin hiện ra khi người khác tìm bạn được nêu ở mục 6 của Chính sách quyền riêng tư.

4.4. Bạn cho phép chúng tôi lưu trữ, sao lưu, sao chép, xử lý, hiển thị và truyền Nội dung của bạn. Quyền này không độc quyền, miễn phí và áp dụng ở mọi nơi có máy chủ của chúng tôi hoặc của nhà cung cấp hạ tầng. Chúng tôi CHỈ dùng quyền này để:
a) vận hành WeDo và cung cấp tính năng mà bạn hoặc nhóm của bạn dùng, ví dụ hiển thị tin nhắn cho thành viên dự án, gửi thông báo đẩy, và gửi dữ liệu cho nhà cung cấp AI khi tính năng AI được dùng (Điều 7);
b) giữ an toàn cho WeDo và người dùng, gồm cả việc xem xét báo cáo vi phạm (Điều 6);
c) làm theo yêu cầu của pháp luật.
Chúng tôi không bán Nội dung của bạn và không dùng Nội dung của bạn cho quảng cáo.

4.5. Quyền nói ở Điều 4.4 chấm dứt khi bạn xoá Nội dung hoặc xoá tài khoản. Chúng tôi có thể giữ lại một phần dữ liệu trong thời gian ghi ở Chính sách quyền riêng tư, hoặc lâu hơn nếu pháp luật yêu cầu hay nếu dữ liệu đó liên quan tới một báo cáo vi phạm.

4.6. Hãy tự lưu bản sao các tệp quan trọng. WeDo không thay thế cho nơi lưu trữ tài liệu lâu dài của bạn.


5. QUY TẮC NỘI DUNG VÀ HÀNH VI — KHÔNG KHOAN NHƯỢNG

5.1. WeDo là nơi để học và làm việc nhóm. Chúng tôi không khoan nhượng với nội dung phản cảm và người dùng lạm dụng. Một vi phạm nghiêm trọng là đủ để chúng tôi khoá tài khoản vĩnh viễn, không cần cảnh báo trước.

5.2. Bạn KHÔNG được đăng, gửi hay chia sẻ trên WeDo, kể cả trong tên hiển thị, ảnh đại diện, tệp và tin nhắn riêng:
a) nội dung khiêu dâm, gợi dục; bất kỳ nội dung tình dục nào liên quan đến người chưa thành niên;
b) nội dung bạo lực, đe doạ người khác, kích động bạo lực, cổ vũ tự làm hại bản thân hay tự tử;
c) nội dung quấy rối, bắt nạt, lăng mạ, bôi nhọ hoặc làm nhục người khác;
d) nội dung thù ghét hoặc phân biệt đối xử vì dân tộc, quê quán, tôn giáo, giới tính, xu hướng tính dục, khuyết tật, ngoại hình hay hoàn cảnh;
e) thông tin cá nhân hoặc ảnh riêng tư của người khác khi họ chưa đồng ý;
f) nội dung mạo danh người khác, tổ chức khác hoặc WeDo;
g) nội dung lừa đảo, tin rác (spam), quảng cáo không được mời, lôi kéo đa cấp;
h) mã độc, đường dẫn độc hại, hoặc nội dung nhằm lấy mật khẩu hay tài khoản của người khác;
i) nội dung xâm phạm quyền tác giả, nhãn hiệu hay bí mật kinh doanh của người khác;
j) nội dung về ma tuý, vũ khí, cờ bạc trái phép hay hàng hoá bị cấm;
k) đề thi, bài làm hộ hay nội dung khác nhằm gian lận trong học tập, khi quy chế của trường bạn cấm việc đó;
l) nội dung khác mà pháp luật Việt Nam cấm đăng tải hoặc chia sẻ.

5.3. Bạn KHÔNG được:
a) gửi tin nhắn hay lời mời kết bạn liên tục cho người đã từ chối, đã phớt lờ hoặc đã chặn bạn;
b) thêm người khác vào không gian làm việc hay dự án để quấy rối họ;
c) dùng tài khoản khác để lách việc bị chặn hoặc bị khoá;
d) báo cáo sai sự thật một cách cố ý để hại người khác;
e) dùng tính năng AI của WeDo để tạo nội dung bị cấm ở Điều 5.2;
f) dò tìm lỗ hổng, dùng công cụ tự động để thu thập dữ liệu, làm quá tải hệ thống, dịch ngược hay sửa đổi ứng dụng, trừ khi pháp luật cho phép;
g) dùng WeDo vào mục đích trái pháp luật.

5.4. Chúng tôi không xem trước mọi Nội dung trước khi nó hiện ra. Chúng tôi dùng bộ lọc tự động thay những từ ngữ thô tục trong tin nhắn và tên hiển thị bằng dấu ***, và có thể gỡ bất kỳ Nội dung nào vi phạm Điều khoản này.


6. BÁO CÁO VÀ CHẶN

6.1. Báo cáo. Khi thấy nội dung hay người dùng vi phạm Điều 5, hãy báo cho chúng tôi:
- Trong ứng dụng: nhấn giữ tin nhắn vi phạm, trong trò chuyện dự án hoặc tin nhắn riêng, rồi chọn "Báo cáo tin nhắn". Để báo cáo một người, bấm nút ba chấm ở đầu cuộc trò chuyện riêng với họ, hoặc nút ba chấm cạnh tên họ ở màn Bạn bè, rồi chọn "Báo cáo người này". Sau đó chọn lý do và gửi.
- Qua email wedosupport6886@gmail.com: ghi tên người dùng, dự án hoặc cuộc trò chuyện, thời gian, và ảnh chụp màn hình nếu có.

6.2. Chặn. Nhấn giữ tin nhắn của người đó, bấm nút ba chấm ở đầu cuộc trò chuyện riêng với họ, hoặc bấm nút ba chấm cạnh tên họ ở màn Bạn bè, rồi chọn "Chặn người này". Việc chặn có tác dụng ngay. Hai người không thể nhắn tin riêng hay kết bạn với nhau nữa, và không tìm thấy nhau khi tìm kiếm. Quan hệ bạn bè và lời mời kết bạn giữa hai người bị xoá. Trong ứng dụng, tin nhắn của người bị chặn bị ẩn với bạn, kể cả trong trò chuyện dự án chung. Người bị chặn không nhận được thông báo nào. Bạn có thể bỏ chặn trong Tài khoản → Người đã chặn.

6.3. Cam kết xử lý trong 24 giờ. Chúng tôi xem xét mọi báo cáo trong vòng 24 giờ kể từ khi nhận được. Nếu nội dung vi phạm Điều khoản này, chúng tôi:
a) gỡ nội dung vi phạm; và
b) loại người đăng khỏi WeDo bằng cách khoá hoặc chấm dứt tài khoản của họ.
Tài khoản bị khoá không đăng nhập được, và mọi phiên đăng nhập đang mở của tài khoản đó bị ngắt. Với vi phạm rất nghiêm trọng, như nội dung tình dục liên quan đến người chưa thành niên hay đe doạ tính mạng, chúng tôi khoá tài khoản ngay khi xác nhận, và báo cơ quan có thẩm quyền khi pháp luật yêu cầu.

6.4. Chúng tôi có thể cho người báo cáo biết kết quả xử lý. Chúng tôi không tiết lộ người báo cáo cho người bị báo cáo, trừ khi pháp luật buộc phải làm.

6.5. Nếu bạn hoặc người khác đang gặp nguy hiểm, hãy gọi ngay 113 (công an) hoặc 115 (cấp cứu). Đừng chờ phản hồi từ WeDo.


7. TÍNH NĂNG AI

7.1. WeDo có tính năng dùng AI, ví dụ:
- Trong trò chuyện dự án, AI có thể đọc một tin nhắn và đề xuất một công việc (tên việc, mô tả, người phụ trách, hạn chót). Chỉ trưởng nhóm dự án hoặc chủ không gian làm việc dùng được tính năng này. Trên điện thoại, trưởng nhóm nhấn giữ một tin nhắn rồi chọn "Tạo công việc bằng AI". Trên web, trưởng nhóm có thể bấm phân tích một tin nhắn; ngoài ra, mỗi tin trưởng nhóm vừa gửi được tự động đưa cho AI để đề xuất.
- Trên web WeDo, AI có thể tạo bản tóm tắt cuộc họp, các quyết định và việc cần làm từ bản ghi lời thoại của cuộc họp. Ứng dụng trên điện thoại hiển thị các kết quả này.

7.2. Để tạo kết quả, WeDo gửi dữ liệu cho nhà cung cấp AI bên thứ ba (Google Gemini, Microsoft Azure OpenAI hoặc OpenAI). Với đề xuất công việc, dữ liệu gồm: tin nhắn cần phân tích, tối đa 12 tin nhắn gần nhất của dự án kèm tên người gửi, tên dự án, và danh sách thành viên dự án (tên, vai trò). WeDo không gửi email hay số điện thoại cho AI. Với tóm tắt cuộc họp, dữ liệu gồm tên cuộc họp và bản ghi lời thoại. Điểm đánh giá và lời góp ý bạn gửi ở mục "Góp ý cho WeDo" có thể được gửi cho AI, không kèm tên hay email, để nhóm WeDo tổng hợp ý kiến. Chi tiết có trong Chính sách quyền riêng tư.

7.3. Trước lần đầu bạn dùng tính năng AI trong ứng dụng WeDo trên điện thoại, ứng dụng hỏi bạn có đồng ý gửi dữ liệu như trên hay không. Nếu bạn không đồng ý, bạn vẫn dùng được các tính năng khác của WeDo. Bạn có thể tắt "Cho phép dùng AI" trong tab Tài khoản bất cứ lúc nào. Trên web, việc tự đề xuất nói ở Điều 7.1 hiện chạy mà không hỏi trước.

7.4. Kết quả của AI CHỈ LÀ GỢI Ý. AI có thể sai, thiếu, hiểu nhầm ý, chọn nhầm người hay nhầm hạn chót. Hãy kiểm tra và sửa trước khi tạo công việc hay dùng bản tóm tắt. Đừng dựa vào AI cho các quyết định quan trọng về điểm số, học tập, tài chính, sức khoẻ hay pháp lý. Bạn và nhóm của bạn chịu trách nhiệm về quyết định cuối cùng.

7.5. Tính năng AI có giới hạn số lần dùng mỗi tháng. Giới hạn này có thể thay đổi.

7.6. Đừng đưa vào tin nhắn những thông tin nhạy cảm mà bạn không muốn gửi cho nhà cung cấp AI.


8. CUỘC HỌP VÀ DỊCH VỤ CỦA BÊN THỨ BA

8.1. Phòng họp video chạy trên dịch vụ Daily.co và mở trong trình duyệt. Bất kỳ ai có đường dẫn phòng họp đều có thể vào phòng, nên đừng chia sẻ đường dẫn cho người ngoài nhóm.

8.2. Nếu nhóm bật chức năng ghi biên bản, lời nói trong cuộc họp được Daily.co chuyển thành văn bản. Bản ghi lời thoại này có thể được gửi cho AI để tóm tắt (Điều 7). Người bật chức năng này phải báo cho mọi người trong cuộc họp biết trước.

8.3. WeDo dùng một số dịch vụ của bên thứ ba, như đăng nhập bằng Google, dịch vụ gửi thông báo đẩy, dịch vụ lưu trữ và dịch vụ họp video. Khi dùng các dịch vụ này qua WeDo, bạn cũng phải tuân thủ điều khoản của họ. Chúng tôi không chịu trách nhiệm về nội dung hay hoạt động của dịch vụ bên thứ ba.


9. DỊCH VỤ, THAY ĐỔI VÀ GIÁN ĐOẠN

9.1. Ứng dụng WeDo trên điện thoại được tải và dùng miễn phí, và không bán hàng hoá hay dịch vụ nào bên trong ứng dụng.

9.2. Một số tính năng, như tạo dự án hay thêm thành viên, hiện chỉ có trên web WeDo.

9.3. Chúng tôi cố gắng giữ WeDo chạy ổn định, nhưng không bảo đảm WeDo luôn chạy liên tục, không lỗi hay không mất dữ liệu. WeDo có thể tạm dừng để bảo trì, sửa lỗi hoặc vì sự cố ngoài tầm kiểm soát của chúng tôi. Chúng tôi có thể thêm, sửa hoặc bỏ tính năng. Nếu ngừng toàn bộ dịch vụ, chúng tôi sẽ báo trước ít nhất 30 ngày qua ứng dụng hoặc email.

9.4. Để dùng tiếp WeDo, đôi khi bạn cần cập nhật ứng dụng lên phiên bản mới.


10. QUYỀN SỞ HỮU TRÍ TUỆ CỦA WEDO

10.1. Tên WeDo, logo, giao diện, mã nguồn và tài liệu của WeDo thuộc về chúng tôi hoặc bên cấp phép cho chúng tôi. Điều khoản này không chuyển các quyền đó cho bạn.

10.2. Chúng tôi cho bạn quyền dùng ứng dụng WeDo cho mục đích cá nhân, theo Điều khoản này. Quyền này có giới hạn, không độc quyền, không chuyển nhượng được và có thể bị thu hồi. Nếu bạn tải WeDo từ App Store, phạm vi quyền còn tuân theo Điều 16.2.

10.3. Bạn không được sao chép, sửa đổi, phân phối, bán hay cho thuê ứng dụng, và không được dịch ngược mã nguồn, trừ khi pháp luật cho phép.

10.4. Nếu bạn gửi góp ý hay ý tưởng cho WeDo, chúng tôi được dùng góp ý đó để cải thiện WeDo mà không phải trả phí hay có nghĩa vụ nào với bạn.

10.5. Nếu bạn cho rằng Nội dung trên WeDo xâm phạm quyền của bạn, hãy gửi email tới wedosupport6886@gmail.com. Chúng tôi sẽ xử lý như một báo cáo theo Điều 6.


11. CHẤM DỨT

11.1. Bạn có thể ngừng dùng WeDo bất cứ lúc nào. Để xoá tài khoản, vào Tài khoản → Xoá tài khoản trong ứng dụng, hoặc làm theo hướng dẫn tại https://wedofpt.com.vn/xoa-tai-khoan.html. Nếu bạn là chủ một không gian làm việc còn thành viên khác, bạn cần chuyển quyền chủ trước khi xoá. Dữ liệu sau khi xoá được xử lý theo Chính sách quyền riêng tư.

11.2. Chúng tôi có thể tạm khoá hoặc chấm dứt tài khoản của bạn, và gỡ Nội dung của bạn, nếu:
a) bạn vi phạm Điều khoản này, đặc biệt là Điều 5;
b) cơ quan nhà nước có thẩm quyền yêu cầu;
c) việc đó cần để bảo vệ người dùng khác, WeDo hoặc bên thứ ba.
Với vi phạm nghiêm trọng, chúng tôi làm ngay mà không báo trước. Với vi phạm nhẹ, chúng tôi có thể nhắc nhở trước.

11.3. Người bị chấm dứt tài khoản vì vi phạm không được tạo tài khoản mới.

11.4. Nếu bạn cho rằng chúng tôi xử lý nhầm, hãy gửi email tới wedosupport6886@gmail.com trong vòng 30 ngày kể từ khi bị khoá. Chúng tôi sẽ xem xét lại và trả lời bạn.

11.5. Các Điều 4.5, 10, 12, 13, 14, 15 và 16 vẫn còn hiệu lực sau khi tài khoản bị chấm dứt.


12. KHÔNG BẢO ĐẢM

12.1. Trong phạm vi pháp luật cho phép, WeDo được cung cấp "như hiện có" và "khi sẵn có". Chúng tôi không bảo đảm WeDo đáp ứng mọi nhu cầu của bạn, không bảo đảm kết quả của AI là đúng, và không bảo đảm Nội dung do người dùng khác đăng là đúng hay phù hợp.

12.2. Chúng tôi không chịu trách nhiệm về Nội dung do người dùng khác đăng. Chúng tôi vẫn xử lý Nội dung vi phạm khi được báo cáo, theo Điều 6.

12.3. Điều này không làm mất các quyền mà pháp luật Việt Nam về bảo vệ quyền lợi người tiêu dùng dành cho bạn.


13. GIỚI HẠN TRÁCH NHIỆM

13.1. Trong phạm vi pháp luật cho phép, chúng tôi không chịu trách nhiệm về thiệt hại gián tiếp, như mất lợi nhuận, mất dữ liệu, mất cơ hội học tập, hay ảnh hưởng tới điểm số, phát sinh từ việc bạn dùng hoặc không dùng được WeDo.

13.2. Trong phạm vi pháp luật cho phép, tổng trách nhiệm của chúng tôi đối với bạn không vượt quá số lớn hơn giữa: (a) số tiền bạn đã trả cho WeDo trong 12 tháng trước sự việc; và (b) 500.000 đồng.

13.3. Điều 13 không loại trừ trách nhiệm của chúng tôi trong những trường hợp pháp luật không cho phép loại trừ, như lỗi cố ý của chúng tôi.


14. TRÁCH NHIỆM CỦA BẠN KHI VI PHẠM

Nếu bạn vi phạm Điều khoản này hoặc pháp luật và việc đó gây thiệt hại cho chúng tôi hay cho người khác, bạn chịu trách nhiệm bồi thường theo quy định của pháp luật Việt Nam.


15. LUẬT ÁP DỤNG VÀ GIẢI QUYẾT TRANH CHẤP

15.1. Điều khoản này được điều chỉnh bởi pháp luật Việt Nam.

15.2. Nếu có tranh chấp, trước hết hãy liên hệ chúng tôi qua email wedosupport6886@gmail.com để thương lượng. Nếu sau 30 ngày không thương lượng được, mỗi bên có quyền đưa tranh chấp ra Toà án nhân dân có thẩm quyền của Việt Nam.


16. ĐIỀU KHOẢN RIÊNG KHI BẠN TẢI WEDO TỪ APP STORE CỦA APPLE

Điều 16 áp dụng khi bạn tải ứng dụng WeDo từ App Store. Với ứng dụng tải từ App Store, Thoả thuận cấp phép người dùng cuối chuẩn của Apple (Licensed Application End User License Agreement, tại https://www.apple.com/legal/internet-services/itunes/dev/stdeula/) cũng áp dụng giữa bạn và bên cung cấp WeDo, cùng với Điều khoản này. Nếu Điều 16 khác với phần còn lại của Điều khoản này, Điều 16 được ưu tiên đối với ứng dụng tải từ App Store.

16.1. Ghi nhận. Điều khoản này là thoả thuận giữa bạn và bên cung cấp WeDo nêu ở Điều 1.2, không phải với Apple Inc. ("Apple"). Bên cung cấp WeDo, không phải Apple, chịu trách nhiệm duy nhất về ứng dụng WeDo và nội dung của ứng dụng. Điều khoản này không đặt ra quy tắc sử dụng nào trái với Điều khoản và Điều kiện của Dịch vụ Truyền thông Apple (Apple Media Services Terms and Conditions) tại thời điểm Điều khoản này có hiệu lực.

16.2. Phạm vi giấy phép. Bạn được cấp giấy phép không được chuyển nhượng để dùng ứng dụng WeDo trên các thiết bị mang thương hiệu Apple mà bạn sở hữu hoặc kiểm soát, theo Quy tắc sử dụng (Usage Rules) trong Điều khoản và Điều kiện của Dịch vụ Truyền thông Apple. Ngoại lệ: các tài khoản khác liên kết với người mua qua tính năng Chia sẻ trong gia đình (Family Sharing) hoặc mua số lượng lớn (volume purchasing) cũng được truy cập và dùng ứng dụng.

16.3. Bảo trì và hỗ trợ. Bên cung cấp WeDo chịu trách nhiệm duy nhất về việc bảo trì và hỗ trợ ứng dụng, như nêu trong Điều khoản này hoặc theo quy định của pháp luật. Bạn và bên cung cấp WeDo cùng ghi nhận rằng Apple không có bất kỳ nghĩa vụ nào phải cung cấp dịch vụ bảo trì hay hỗ trợ cho ứng dụng.

16.4. Bảo đảm. Bên cung cấp WeDo chịu trách nhiệm duy nhất về mọi bảo đảm đối với ứng dụng, dù được nêu rõ hay do pháp luật quy định, trong phạm vi không được miễn trừ hợp lệ. Nếu ứng dụng không đúng với một bảo đảm áp dụng, bạn có thể báo cho Apple, và Apple sẽ hoàn lại giá mua ứng dụng cho bạn (nếu có; ứng dụng WeDo hiện miễn phí). Trong phạm vi tối đa pháp luật cho phép, Apple không có nghĩa vụ bảo đảm nào khác đối với ứng dụng. Mọi khiếu nại, tổn thất, trách nhiệm, thiệt hại, chi phí khác do ứng dụng không đúng với bảo đảm thuộc trách nhiệm duy nhất của bên cung cấp WeDo.

16.5. Khiếu nại về sản phẩm. Bên cung cấp WeDo, không phải Apple, chịu trách nhiệm giải quyết mọi khiếu nại của bạn hoặc của bên thứ ba liên quan đến ứng dụng, hoặc đến việc bạn sở hữu và dùng ứng dụng, gồm nhưng không giới hạn: (i) khiếu nại về trách nhiệm sản phẩm; (ii) khiếu nại rằng ứng dụng không tuân thủ yêu cầu pháp lý hoặc quy định hiện hành; và (iii) khiếu nại phát sinh theo pháp luật về bảo vệ người tiêu dùng, quyền riêng tư hoặc pháp luật tương tự. Điều khoản này không giới hạn trách nhiệm của bên cung cấp WeDo đối với bạn quá mức mà pháp luật cho phép.

16.6. Quyền sở hữu trí tuệ. Nếu bên thứ ba khiếu nại rằng ứng dụng, hoặc việc bạn sở hữu và dùng ứng dụng, xâm phạm quyền sở hữu trí tuệ của họ, thì bên cung cấp WeDo, không phải Apple, chịu trách nhiệm duy nhất về việc điều tra, bảo vệ, dàn xếp và giải quyết khiếu nại đó.

16.7. Tuân thủ pháp luật. Bạn cam đoan rằng: (i) bạn không ở quốc gia bị Chính phủ Hoa Kỳ cấm vận, hoặc bị Chính phủ Hoa Kỳ xếp vào nhóm quốc gia "hỗ trợ khủng bố"; và (ii) bạn không có tên trong bất kỳ danh sách các bên bị cấm hoặc bị hạn chế nào của Chính phủ Hoa Kỳ.

16.8. Tên và địa chỉ nhà phát triển. Mọi câu hỏi, khiếu nại hoặc yêu cầu về ứng dụng xin gửi tới: Lê Hữu Đại. Địa chỉ: [ĐỊA CHỈ LIÊN HỆ]. Email: wedosupport6886@gmail.com. Điện thoại: [SỐ ĐIỆN THOẠI].

16.9. Điều khoản của bên thứ ba. Khi dùng ứng dụng, bạn phải tuân thủ các thoả thuận đang áp dụng giữa bạn và bên thứ ba, ví dụ hợp đồng dịch vụ dữ liệu di động với nhà mạng của bạn.

16.10. Bên thứ ba thụ hưởng. Bạn và bên cung cấp WeDo ghi nhận và đồng ý rằng Apple và các công ty con của Apple là bên thứ ba thụ hưởng của Điều khoản này. Khi bạn chấp nhận Điều khoản này, Apple có quyền (và được coi là đã chấp nhận quyền) thực thi Điều khoản này đối với bạn với tư cách bên thứ ba thụ hưởng.


17. THAY ĐỔI ĐIỀU KHOẢN

17.1. Chúng tôi có thể sửa Điều khoản này. Mỗi lần sửa, chúng tôi cập nhật ngày ở đầu trang.

17.2. Với thay đổi lớn, chúng tôi báo trong ứng dụng hoặc qua email trước khi áp dụng, và có thể đề nghị bạn đồng ý lại. Nếu bạn không đồng ý, bạn có thể ngừng dùng và xoá tài khoản theo Điều 11.1.

17.3. Với thay đổi nhỏ, như sửa câu chữ hay sửa thông tin liên hệ, việc bạn tiếp tục dùng WeDo nghĩa là bạn đồng ý với bản mới.


18. ĐIỀU KHOẢN CHUNG

18.1. Điều khoản này cùng với Chính sách quyền riêng tư là toàn bộ thoả thuận giữa bạn và chúng tôi về việc dùng WeDo, bên cạnh thoả thuận cấp phép của Apple nêu ở Điều 16 khi bạn tải ứng dụng từ App Store.

18.2. Nếu một phần của Điều khoản này bị coi là vô hiệu, các phần còn lại vẫn có hiệu lực.

18.3. Việc chúng tôi chưa thực thi một quyền nào đó không có nghĩa là chúng tôi từ bỏ quyền đó.

18.4. Chúng tôi có thể chuyển Điều khoản này cho một tổ chức tiếp quản việc vận hành WeDo, ví dụ một công ty do chúng tôi thành lập. Khi đó, chúng tôi sẽ báo cho bạn. Bạn không được chuyển quyền và nghĩa vụ của mình theo Điều khoản này cho người khác.

18.5. Điều khoản này được viết bằng tiếng Việt. Nếu có bản dịch sang ngôn ngữ khác, bản tiếng Việt được ưu tiên.


19. LIÊN HỆ

Câu hỏi về Điều khoản này, báo cáo vi phạm hay khiếu nại, xin gửi về: wedosupport6886@gmail.com.
Bên cung cấp: Lê Hữu Đại — nhóm WeDo Team.
Địa chỉ: [ĐỊA CHỈ LIÊN HỆ]. Điện thoại: [SỐ ĐIỆN THOẠI].
```

Số ký tự của văn bản trên: **21.436** ký tự (27.941 byte UTF-8; đếm theo NFC, tính cả các chỗ trống `[...]` còn lại, email hỗ trợ đã điền). Con số này chỉ để bạn biết độ dài. Trang trợ giúp của App Store Connect không nêu giới hạn cho ô EULA riêng.

---

## 5. Đăng trang web

- Đã làm: tệp `public/dieu-khoan.html` trên nhánh `ios-web` (commit `f6052b3`), cùng kiểu trình bày với các trang pháp lý khác. Vite chép nguyên thư mục `public` vào bản build, nên sau khi gộp vào `main` trang sẽ có ở:
  - `https://wedofpt.com.vn/dieu-khoan.html`
  - `https://fe-wedo.vercel.app/dieu-khoan.html`
- Đường dẫn chính thức là `https://wedofpt.com.vn/dieu-khoan.html`. App đã dùng đúng đường dẫn này (`M src/lib/legal-links.ts`, `TERMS_URL`), App Review Notes cũng vậy.
- Chân trang trang chủ web đã có đường dẫn tới bốn trang pháp lý (nhánh `ios-web`, commit `85cf0b5`). Còn lại: chỗ `FE src/views/CheckoutView.tsx:351` đang nhắc tới "Điều khoản dịch vụ" chưa tồn tại.
- **Không** đưa giá gói, nút nâng cấp hay đường dẫn tới trang thanh toán vào trang điều khoản. Ứng dụng iPhone sẽ mở trang này, nên mọi lời mời mua ở đây có thể bị coi là lái người dùng sang mua ngoài ứng dụng (Guideline 3.1.3 không cho ứng dụng, ngay bên trong ứng dụng, khuyến khích người dùng mua bằng cách khác ngoài mua hàng trong ứng dụng; ngoại lệ chỉ dành cho kho App Store Hoa Kỳ, mà WeDo chỉ phát hành ở Việt Nam. 3.1.3(f) chỉ miễn dùng mua hàng trong ứng dụng khi ứng dụng không bán gì bên trong và không có lời mời mua ở bên ngoài). Nếu cần điều khoản thanh toán cho gói web, viết thành trang riêng và chỉ dẫn tới từ trang thanh toán trên web.
- Bốn trang pháp lý trên nhánh `ios-web` có đường dẫn chéo ở chân trang. Đăng trang này cùng lúc với Chính sách quyền riêng tư mới (xem mục 4.1), sau khi máy chủ mới đã chạy.

---

## 6. Chỗ đồng ý Điều khoản trong ứng dụng (đã làm)

Đã chốt: trên iPhone, màn đăng nhập và màn đăng ký **chỉ có email và mật khẩu** (nút Google bị ẩn, tài liệu 08, IOS-02). Android và web vẫn có nút Google. Không có nút Sign in with Apple ở bản này.

Mọi chỗ dưới đây đã có trên nhánh `ios` (commit `899c8eb`, `dff8821`, `43ad40d`, `dd1fa4e`) và nhánh `ios-backend` (commit `3386c52`).

### 6.1. Máy chủ lưu gì

- Cột `User.termsAcceptedAt` và `User.adultConfirmedAt`. Hai cột này có giá trị khi người dùng đánh dấu ô lúc đăng ký (thân yêu cầu có `acceptTerms: true` và `confirmAdult: true`), hoặc bấm "Đồng ý và tiếp tục" ở màn đồng ý một lần (`POST /users/me/accept-terms` với `{ confirmAdult: true }`).
- `GET /users/me` trả hai mốc này. Gọi lại thì giữ mốc đầu tiên.
- Máy chủ **không** lưu phiên bản điều khoản. Muốn hỏi lại mọi người khi điều khoản đổi lớn (Điều 17.2) thì phải thêm trường này sau.
- Web và bản Android cũ không gửi hai trường trên, nên tài khoản tạo ở đó không có mốc đồng ý. Họ gặp màn đồng ý một lần khi mở bản app mới.

### 6.2. Chỗ 1 — Màn đăng ký (chỗ chính, người duyệt của Apple sẽ nhìn thấy)

- Ô đánh dấu nằm **ngay dưới ô Mật khẩu và trên nút Đăng ký**, không đánh dấu sẵn (`M src/components/auth/ODongYDieuKhoan.tsx`).
- Hai cụm "Điều khoản sử dụng" và "Chính sách quyền riêng tư" là đường dẫn, mở trong trình duyệt trong ứng dụng (`M src/lib/legal-links.ts`).
- Nút **Đăng ký** bị tắt tới khi đánh dấu ô. Mã còn chốt thêm: nếu vẫn gửi được khi chưa đánh dấu thì hiện lỗi, không gửi gì lên máy chủ.
- Một ô gộp cả hai việc: xác nhận đủ tuổi (Điều 2.1) và đồng ý điều khoản.

Chữ của ô, đúng như trong mã:

```text
Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư
```

Câu báo lỗi dự phòng:

```text
Bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng để tạo tài khoản.
```

Trên Android, nút Google ở màn đăng ký không đòi đánh dấu ô. Tài khoản Google mới gặp màn đồng ý một lần ngay sau khi vào.

### 6.3. Chỗ 2 — Màn đăng nhập (không làm)

Bản nháp trước đề xuất một dòng chữ nhỏ dưới nút Google. Dòng này **không làm**: nó chỉ để báo trước, không thay được bước đồng ý thật, và màn đồng ý một lần ở 6.4 đã bắt mọi đường vào. Trên iPhone không có nút Google nên không cần dòng này.

### 6.4. Chỗ 3 — Màn đồng ý một lần sau khi đăng nhập

Đây là lưới an toàn cho mọi đường vào: tài khoản tạo bằng Google (Android, web), tài khoản tạo trên web, và tài khoản cũ đã đăng ký trước khi có ô đồng ý.

- `M src/components/auth/CongDieuKhoan.tsx` bọc toàn bộ ứng dụng. Người đã đăng nhập mà `termsAcceptedAt` là rỗng không vào được màn nào, kể cả màn mở từ thông báo.
- Không hỏi thêm tên hay email ở màn này.
- Nếu máy chủ không trả trường `termsAcceptedAt` (máy chủ cũ), màn này không hiện, để không nhốt người dùng.

Chữ trên màn, đúng như trong mã:

```text
Điều khoản sử dụng
```

```text
Trước khi tiếp tục dùng WeDo, bạn cần xác nhận đủ 18 tuổi và đồng ý với Điều khoản sử dụng.
```

```text
WeDo không chấp nhận nội dung phản cảm, quấy rối hay lạm dụng. Bạn có thể báo cáo tin nhắn hoặc chặn người vi phạm ngay trong app, và WeDo xem xét mọi báo cáo trong vòng 24 giờ.
```

Tiếp theo là cùng ô đánh dấu như màn đăng ký, rồi hai nút:

```text
Đồng ý và tiếp tục
```

```text
Đăng xuất
```

### 6.5. Trong tab Tài khoản

Thứ tự các dòng liên quan, từ trên xuống: "Người đã chặn" (gợi ý "Xem và bỏ chặn"), công tắc "Cho phép dùng AI", "Điều khoản sử dụng", "Chính sách quyền riêng tư", "Hỗ trợ", "Liên hệ: wedosupport6886@gmail.com", "Xoá tài khoản", "Đăng xuất". Các đường dẫn pháp lý có địa chỉ cố định hoặc địa chỉ dự phòng trong mã, nên không bao giờ biến mất.

### 6.6. Chụp màn hình cho người duyệt

Khi nộp, chụp sẵn màn đăng ký có ô đồng ý và màn đồng ý một lần. Nếu Apple hỏi lại về Guideline 1.2, gửi kèm hai ảnh này trong phần trả lời.

---

## 7. Để lời hứa "24 giờ" là thật

Điều 6.3 là một cam kết. Người duyệt có thể bấm thử báo cáo và chặn trên tài khoản demo, và Apple có thể hỏi lại quy trình xử lý bất cứ lúc nào.

Đã có trong mã (chưa lên production):

- **Nơi nhận báo cáo:** mỗi báo cáo tạo một dòng `ContentReport` trên máy chủ, kèm bản chụp nội dung, và gửi một thư tới hộp thư ở biến `REPORT_NOTIFY_EMAIL` (`BE src/moderation/reports.service.ts`). Biến trống thì không gửi thư.
- **Công cụ xử lý:** trang quản trị "Báo cáo vi phạm" (`#/admin/moderation`, nhánh `ios-web`) cho xem báo cáo, **Gỡ nội dung**, **Khoá tài khoản**, **Gỡ nội dung và khoá**, **Bỏ qua**, **Mở khoá**, kèm ô ghi chú. Báo cáo chờ quá 24 giờ có nhãn "Quá hạn".
- **Khoá có hiệu lực thật:** tài khoản bị khoá không đăng nhập được, không làm mới được phiên, mọi lượt gọi API bị từ chối, kết nối trò chuyện bị ngắt, thông báo đẩy ngừng.
- **Bộ lọc:** thay từ phản cảm tiếng Việt và tiếng Anh bằng `***` khi gửi tin nhắn và khi đặt tên hiển thị (`BE src/moderation/word-filter.ts`). Điều 5.4 nói đúng điều này.
- **Giới hạn báo cáo:** mỗi người tối đa 30 báo cáo trong 24 giờ.

Còn thiếu, việc của chủ dự án:

- **Người trực:** ít nhất hai người biết dùng trang "Báo cáo vi phạm", để có người trực vào cuối tuần, ngày lễ và Tết. Ghi lại thời điểm nhận và thời điểm xử lý của mỗi báo cáo.
- **Biến `REPORT_NOTIFY_EMAIL`** trên Azure (`08`, Bước A2).
- **Hộp thư:** báo cáo qua email `wedosupport6886@gmail.com` cũng tính vào lời hứa 24 giờ. Điều kiện đọc thư nằm ở tài liệu 07, mục 0.

Vài lỗ hổng còn lại (đã kiểm trong mã, xem `08`, Phần còn lại của các việc đã làm):

- Lời mời kết bạn đã bị từ chối vẫn gửi lại được ngay, mỗi lần kèm một thông báo đẩy. Người bị làm phiền có thể chặn để dừng hẳn.
- Ai cũng có thể bị thêm vào dự án mà không cần đồng ý, và người mình đã chặn vẫn thêm được mình vào dự án. Thành viên không tự rời dự án được. Người bị quấy rối trong trò chuyện dự án chung chỉ còn cách chặn để ẩn tin, và báo cáo.
- Tìm bạn bè đã sửa: không còn trả email, số điện thoại của người lạ.

---

## 8. Những chỗ bạn phải tự điền hoặc tự kiểm

| Chỗ trống | Điền gì | Gợi ý |
|---|---|---|
| `[ĐỊA CHỈ LIÊN HỆ]` | Địa chỉ nhận thư | Bắt buộc nếu dùng EULA riêng (đường B). Khi đó địa chỉ hiện công khai trong EULA trên trang App Store và trên trang web; với tài khoản cá nhân, đây là thông tin của riêng bạn, nên chọn địa chỉ bạn chấp nhận công bố. Nếu chọn đường A và không muốn công bố, có thể bỏ dòng địa chỉ và điện thoại ở Điều 1.3, 16.8 và 19, chỉ giữ email. |
| `[SỐ ĐIỆN THOẠI]` | Số điện thoại dạng +84... | Như trên. |
| `[PHIÊN BẢN]` | Mã phiên bản điều khoản, ví dụ `2026-10` | Máy chủ không lưu phiên bản điều khoản, nên dòng này chỉ để đọc. Bản HTML bỏ dòng này. |
| `[NGÀY HIỆU LỰC]` | Ngày đăng trang | Không để ngày trước ngày máy chủ mới (báo cáo, chặn, bộ lọc) chạy thật. Bản HTML ghi "Cập nhật ngày 26/09/2026, có hiệu lực từ ngày đăng tại trang này". |

Trước khi đăng:

1. Tìm ký tự `[` trong văn bản. Không được còn chỗ trống nào. Email hỗ trợ `wedosupport6886@gmail.com` đã điền sẵn ở Điều 1.3, 6.1, 10.5, 11.4, 15.2, 16.8 và 19.
2. Đối chiếu Điều 6 với chữ thật trên màn hình ứng dụng (đã đối chiếu với mã ngày 26/09/2026; thử lại trên TestFlight).
3. Đối chiếu Điều 7.2 với dữ liệu thật gửi cho AI, và với Chính sách quyền riêng tư mới.
4. Đối chiếu tuổi ở Điều 2.1 với Chính sách quyền riêng tư mới (tài liệu 05) và với mức tuổi đã chọn trong App Store Connect.
5. Nhờ một người có chuyên môn pháp lý Việt Nam đọc lại Điều 2, 12, 13, 14 và 15. Tài liệu này không phải ý kiến pháp lý.

---

## 9. Đoạn tiếng Anh về Guideline 1.2 (bản đầy đủ)

**Không dán đoạn này vào ô Notes.** Tài liệu 04 (mục 6.2) đã gộp một bản ngắn hơn của đoạn này vào khối Notes (3.674 ký tự, 3.850/4.000 byte). Dán thêm sẽ trùng ý và vượt giới hạn 4.000 byte của ô Notes.

Dùng đoạn này khi:

- Apple hỏi lại về Guideline 1.2 trong App Review (trả lời trong mục tin nhắn của bản nộp), kèm hai ảnh chụp ở mục 6.6.
- Bạn không dùng khối Notes của tài liệu 04. Khi đó, cộng số ký tự của đoạn này với phần ghi chú còn lại.

Tên nút và chỗ đặt nút dưới đây đúng với mã trên nhánh `ios` (mục 4.1 và mục 6). Chỉ gửi đoạn này khi build đang duyệt có các tính năng đó và máy chủ mới đã chạy.

```text
User-generated content (Guideline 1.2)
- Terms: every user must accept the WeDo Terms of Use. New users tick the required box "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư" (I am 18 or older and agree to the Terms of Use and Privacy Policy) on the Đăng ký (Sign up) screen; the Sign up button stays disabled until then. Accounts that have not agreed yet see a one-time Terms screen and must tap "Đồng ý và tiếp tục" (Agree and continue). The Terms (in Vietnamese) state zero tolerance for objectionable content and abusive users in the opening section and in Articles 5 and 6: https://wedofpt.com.vn/dieu-khoan.html
- Filter: objectionable Vietnamese and English words in messages and display names are replaced with *** automatically.
- Report: long-press another user's message in a project chat or a direct message and tap "Báo cáo tin nhắn" (Report message), then pick one of six reasons. To report a person, tap the ⋯ button at the top of a direct message or the ⋮ button on any row of the "Bạn bè" (Friends) screen, friend requests included, then "Báo cáo người này" (Report user).
- Block: the same menus, then "Chặn người này" (Block this user). Blocking takes effect immediately: neither user can message the other or send friend requests, they cannot find each other in search, and the blocked user's messages are hidden. Unblock in "Tài khoản" (Account) > "Người đã chặn" (Blocked users).
- Moderation: every report is emailed to our team and listed in our admin console. We review every report within 24 hours, remove the offending content and suspend the account that posted it. Suspended accounts cannot sign in.
- Contact: wedosupport6886@gmail.com
```

Số ký tự: **1.695/4.000** (1.769 byte UTF-8). đã điền email hỗ trợ. Nếu dùng đoạn này trong ô Notes thay cho khối của tài liệu 04. phần ghi chú còn lại chỉ được dùng tối đa 2.231 byte.

Bản dịch tiếng Việt (để bạn đối chiếu, không dán):

```text
Nội dung do người dùng tạo (Guideline 1.2)
- Điều khoản: mọi người dùng phải chấp nhận Điều khoản sử dụng WeDo. Người dùng mới đánh dấu ô bắt buộc "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư" ở màn Đăng ký; nút Đăng ký tắt cho tới lúc đó. Tài khoản chưa đồng ý sẽ thấy màn Điều khoản một lần và phải bấm "Đồng ý và tiếp tục". Điều khoản (tiếng Việt) nói rõ không khoan nhượng với nội dung phản cảm và người dùng lạm dụng, ở phần mở đầu và ở Điều 5, Điều 6: https://wedofpt.com.vn/dieu-khoan.html
- Bộ lọc: từ ngữ phản cảm tiếng Việt và tiếng Anh trong tin nhắn và tên hiển thị tự động bị thay bằng ***.
- Báo cáo: nhấn giữ tin nhắn của người khác trong trò chuyện dự án hoặc tin nhắn riêng, bấm "Báo cáo tin nhắn", rồi chọn một trong sáu lý do. Để báo cáo một người, bấm nút ⋯ ở đầu tin nhắn riêng, hoặc nút ⋮ ở bất kỳ dòng nào trong màn "Bạn bè", kể cả lời mời kết bạn, rồi bấm "Báo cáo người này".
- Chặn: cùng các trình đơn đó, bấm "Chặn người này". Việc chặn có tác dụng ngay: hai bên không nhắn tin hay gửi lời mời kết bạn cho nhau được, không tìm thấy nhau, và tin nhắn của người bị chặn bị ẩn. Bỏ chặn trong "Tài khoản" > "Người đã chặn".
- Kiểm duyệt: mọi báo cáo được gửi qua email tới đội ngũ và hiện trong trang quản trị. Chúng tôi xem xét mọi báo cáo trong vòng 24 giờ, gỡ nội dung vi phạm và khoá tài khoản đã đăng. Tài khoản bị khoá không đăng nhập được.
- Liên hệ: wedosupport6886@gmail.com
```

---

## 10. Nguồn

Trang của Apple (kiểm ngày 26/09/2026):

- App Review Guidelines, mục 1.2: https://developer.apple.com/app-store/review/guidelines/#user-generated-content
- Instructions for Minimum Terms of Developer's End-User License Agreement (bản App Store): https://www.apple.com/legal/internet-services/itunes/appstore/dev/minterms/
- Licensed Application End User License Agreement (EULA chuẩn): https://www.apple.com/legal/internet-services/itunes/appstore/dev/stdeula/
- Provide a custom license agreement (App Store Connect Help): https://developer.apple.com/help/app-store-connect/manage-app-information/provide-a-custom-license-agreement/
- Set an app age rating (App Store Connect Help, phần Override to Higher Age Rating): https://developer.apple.com/help/app-store-connect/manage-app-information/set-an-app-age-rating/

Trang khác (kiểm ngày 26/09/2026):

- Gemini API Additional Terms of Service (điều kiện 18 tuổi): https://ai.google.dev/gemini-api/terms

Ví dụ thư từ chối vì Guideline 1.2 được công khai (nguồn không chính thức, dùng để biết Apple hay đòi gì). Cả hai trích nguyên văn năm yêu cầu: đồng ý EULA không khoan nhượng, lọc, báo cáo, chặn, xử lý trong 24 giờ. Trong thread 116703, một nhà phát triển khác (không phải Apple) trả lời rằng câu "Khi đăng ký, bạn đồng ý..." là chưa đủ:

- https://developer.apple.com/forums/thread/116703
- https://github.com/QuickBlox/q-municate-ios/issues/320

Mã đã kiểm:

Mã trên nhánh iOS (`D:\WeDo_ChPlay-ios` nhánh `ios`, `D:\WEDO_PC\BE_WEDO-ios` nhánh `ios-backend`, `D:\WEDO_PC\FE_WEDO-ios` nhánh `ios-web`):

- `src\components\auth\ODongYDieuKhoan.tsx`, `src\app\(auth)\register.tsx` — ô 18+ và đồng ý ở màn đăng ký, nút Đăng ký tắt tới khi đánh dấu.
- `src\components\auth\CongDieuKhoan.tsx`, `src\app\_layout.tsx` — màn đồng ý một lần bọc toàn bộ ứng dụng.
- `src\app\(tabs)\account\index.tsx` — các dòng Người đã chặn, Cho phép dùng AI, Điều khoản sử dụng, Chính sách quyền riêng tư, Hỗ trợ, Liên hệ.
- `src\components\moderation\BangThaoTac.tsx`, `PhieuBaoCao.tsx`, `src\lib\moderation\noi-dung.ts` — bảng thao tác, phiếu báo cáo, sáu lý do, câu xác nhận chặn.
- `src\app\(tabs)\chat\[projectId].tsx`, `src\app\(tabs)\chat\dm\[conversationId].tsx`, `src\app\(tabs)\chat\friends.tsx`, `src\components\friends\FriendRow.tsx` — chỗ đặt nút báo cáo và chặn.
- `src\lib\ai\dong-y-ai.ts` — hộp thoại đồng ý AI.
- Máy chủ `src\moderation\*` (báo cáo, chặn, bộ lọc `word-filter.ts`, trang quản trị), `src\auth\tai-khoan-bi-khoa.ts` (khoá tài khoản), `src\users\users.controller.ts` (`POST /users/me/accept-terms`, `/users/me/ai-consent`).
- Web `public\dieu-khoan.html` — bản HTML của mục 4.

Mã trên nhánh chính (đọc lúc kiểm tra):

- `D:\WEDO_PC\BE_WEDO\src\auth\auth.service.ts:73-100` — đăng nhập Google tự tạo tài khoản.
- `D:\WEDO_PC\BE_WEDO\src\chat\chat.service.ts:131, 752-763, 954-993` — chỉ trưởng nhóm dự án hoặc chủ không gian làm việc được dùng AI đề xuất công việc; nhà cung cấp là Gemini, Azure OpenAI hoặc OpenAI. Nhánh `ios-backend` bỏ email khỏi dữ liệu gửi AI.
- `D:\WEDO_PC\BE_WEDO\src\chat\chat.service.ts:728-737` — ai xem được trò chuyện dự án (thành viên dự án, chủ và quản trị viên không gian làm việc).
- `D:\WEDO_PC\FE_WEDO\src\views\ChatView.tsx:920-923` — trên web, tin trưởng nhóm vừa gửi được tự động đưa cho AI (nhánh `ios-web` vẫn vậy).
- `D:\WEDO_PC\BE_WEDO\src\tasks\task-submission-files.controller.ts:8-27` — tệp bài nộp mở công khai bằng tên tệp ngẫu nhiên.
- `D:\WEDO_PC\BE_WEDO\src\projects\projects.service.ts:90-130, 138-139` — thêm thành viên không cần đồng ý; chỉ người quản lý gỡ được thành viên.
- `D:\WEDO_PC\BE_WEDO\src\meetings\meetings.service.ts:209-236, 1086, 1147-1176, 1431` — Daily.co ghi lời thoại, tự gửi bản ghi cho AI tóm tắt, phòng họp để chế độ công khai.
- `D:\WEDO_PC\BE_WEDO\src\feedback\feedback.service.ts:423-431, 476-480` — góp ý gửi cho AI chỉ gồm điểm và lời góp ý.
- `D:\WEDO_PC\BE_WEDO\src\friends\friends.service.ts:63-78` — lời mời bị từ chối gửi lại được, kèm thông báo đẩy (nhánh `ios-backend` vẫn vậy; phần tìm bạn đã sửa).
- `D:\WEDO_PC\FE_WEDO\public\privacy.html:44, 126-129, 140` — bản đang sống: phạm vi chính sách, tuổi tối thiểu 13, email liên hệ.
- `D:\WEDO_PC\FE_WEDO\public\xoa-tai-khoan.html:69, 106` — cùng email liên hệ.
