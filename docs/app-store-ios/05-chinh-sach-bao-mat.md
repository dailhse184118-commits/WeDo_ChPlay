# 05 — Chính sách quyền riêng tư WeDo (bản viết lại cho web, Android và iPhone)

Tên trang đã chốt là **"Chính sách quyền riêng tư"**. Tên tệp tài liệu này vẫn là `05-chinh-sach-bao-mat.md` để các liên kết giữa các tài liệu không gãy.

Tài liệu này thay toàn bộ nội dung trang `https://wedofpt.com.vn/privacy.html`. Trang đang sống là tệp `D:\WEDO_PC\FE_WEDO\public\privacy.html` (hiệu lực 15/08/2026, tên cũ "Chính sách bảo mật", chỉ ghi "web WeDo và ứng dụng Android").

**Trạng thái:** bản HTML theo tài liệu này đã làm xong ở `D:\WEDO_PC\FE_WEDO-ios\public\privacy.html` (nhánh `ios-web`, commit `c4b98c2`), **chưa đăng**. Đăng theo `08-sua-code-truoc-khi-nop.md`, mục Thứ tự đưa lên, Bước B, tức là **sau** khi máy chủ mới đã chạy: nhiều câu trong chính sách (bộ lọc `***`, AI không nhận email, xoá tệp khi xoá tài khoản, tìm bạn) chỉ đúng với máy chủ mới.

Cách dùng:

1. Đọc phần 1 để biết bản mới sửa những gì.
2. Làm hết danh sách ở phần 2: điền chỗ trống, xác nhận các giả định, chọn phương án.
3. Phần 3 là toàn văn. Bản HTML đã chép sẵn phần này, với câu trung tính ở chỗ chưa biết giá trị (phần 2.1). Khi đổi chữ, sửa cả hai nơi.
4. Làm các việc kèm theo ở phần 4.

Căn cứ để viết: bản đang đăng, bản rà soát `ios-audit.json` (chỉ dùng phát hiện không bị bác bỏ), và mã nguồn ba kho trên các nhánh iOS, đã đọc lại ngày 26/09/2026. Chỗ nào dựa vào mã, tôi ghi tệp.

Quy ước trong tài liệu:

- `[CHỮ HOA TRONG NGOẶC VUÔNG]` là chỗ phải điền trước khi đăng.
- **⚠ Giả định:** là chỗ dựa trên quyết định chưa chốt hoặc tính năng chưa làm. Nếu giả định sai, sửa hoặc bỏ đoạn văn tương ứng.
- Chữ trong khung `text` là chữ đăng lên web. Chữ ngoài khung là ghi chú cho bạn, không đăng.

---

## Phần 1. Những điểm đã sửa so với bản đang đăng

Tên phát hiện ghi theo `ios-audit.json`, kèm khu vực rà soát trong ngoặc vuông.

| # | Bản đang đăng | Bản mới | Phát hiện được xử lý |
|---|---|---|---|
| 1 | Chỉ áp dụng cho "web WeDo và ứng dụng Android WeDo" (`privacy.html:44`). Không nhắc iPhone. | Áp dụng cho web, Android và iPhone (mục 2 của chính sách). | [privacy-inventory] "Privacy policy does not cover the iOS app, does not name third parties, lacks the equal-protection statement, and has only a thin retention section"; [review-guidelines] "Privacy policy is inaccurate and incomplete for iOS, and no Terms of Use / EULA exists" (phần chính sách; phần điều khoản nằm ở tài liệu 06) |
| 2 | Hộp "Chúng tôi KHÔNG thu thập: … máy ảnh, micrô … thông tin tài chính" (`privacy.html:61-62`). Sai: app chụp và gửi ảnh, web có đơn thanh toán, web có chép lời cuộc họp. | Bỏ câu sai. Nói rõ máy ảnh và ảnh chỉ dùng khi bạn chụp hoặc chọn ảnh. Micrô chỉ dùng trong phòng họp mở trên trình duyệt. Có dữ liệu thanh toán trên web (mục 3.9, 3.11). | [privacy-inventory] "Privacy policy data list is inaccurate: camera, photos, files, push tokens, crash data, meetings and payments are missing or contradicted"; [listing-facts] "The privacy policy text is out of date for the iOS listing (camera and photos, crash reporting)" |
| 3 | Bảng dữ liệu chỉ có 4 dòng. Thiếu ảnh chat, tệp, mã thông báo đẩy, báo cáo lỗi, cuộc họp, thanh toán, góp ý, bạn bè. | Mục 3 liệt kê đủ 11 nhóm dữ liệu, khớp với kiểm kê trong bản rà soát. | Như dòng 2 |
| 4 | Mục AI nói "Chỉ tin nhắn bạn chủ động chọn mới được gửi đi" (`privacy.html:67-70`). Sai: máy chủ gửi thêm 12 tin gần nhất, tên và email người viết, danh sách thành viên kèm email. Không nêu tên nhà cung cấp. | Mục 8 nói đúng từng thứ được gửi theo máy chủ mới: tên dự án, tin được chọn, tối đa 12 tin gần nhất kèm tên, danh sách thành viên (tên, vai trò), **không có email hay số điện thoại** (máy chủ mới đã bỏ, commit `3386c52`). Nêu tên Google Gemini API, Azure OpenAI, OpenAI API. Thêm tóm tắt cuộc họp và tóm tắt góp ý. Nói thật rằng trên web, tin trưởng nhóm vừa gửi được tự động đưa cho AI (`FE_WEDO\src\views\ChatView.tsx:920-923`). | [listing-facts] "Messages are sent to a third-party AI without explicit consent, and the privacy policy describes this wrongly"; [review-guidelines] "Chat content, member names and emails are sent to a third-party AI (Gemini/OpenAI/Azure) on long-press with no disclosure or consent (5.1.2(i))"; [privacy-inventory] "AI task suggestion sends other users' messages, names and emails to a third-party AI (Gemini/OpenAI) without asking the user first"; [backend] "User content is sent to third-party AI and transcription services with no consent recorded or enforced" |
| 5 | "Dữ liệu này không được dùng để huấn luyện mô hình" (`privacy.html:70`). Chỉ đúng khi Gemini chạy gói trả phí, mà chưa ai kiểm. | Bỏ câu chưa kiểm chứng. Mục 8.4 có hai phương án, chọn theo gói Gemini thật. | [privacy-inventory] "The policy's claim that AI data is not used for training is only true on a paid Gemini tier" |
| 6 | Không có bước xin đồng ý trước khi gửi dữ liệu cho AI. | Mục 8.3 mô tả hộp thoại xin đồng ý trên ứng dụng và công tắc "Cho phép dùng AI" (đã làm, commit `0585335`, `43ad40d`), và nói thật rằng web chưa hỏi. | Các phát hiện AI ở dòng 4 |
| 7 | Chỉ nêu tên PostHog. Còn lại ghi chung "máy chủ, cơ sở dữ liệu, nhà cung cấp mô hình ngôn ngữ" (`privacy.html:97-103`). Không có câu cam kết bên thứ ba bảo vệ dữ liệu tương đương. | Mục 7 liệt kê 13 bên theo tên, việc họ làm, dữ liệu họ nhận và nơi xử lý. Có câu cam kết bảo vệ tương đương (Apple 5.1.1(i)). | Như dòng 1 |
| 8 | Không nói gì về cuộc họp. | Mục 3.3, 7, 8 nói về Daily.co, Deepgram, bản chép lời và tóm tắt AI tự động. Mục 6 nói thật rằng ai có đường dẫn phòng họp cũng vào được. | [backend] "User content is sent to third-party AI and transcription services with no consent recorded or enforced"; [backend] "Daily.co meeting rooms are public, so anyone with the URL can join and be transcribed" |
| 9 | "Người ngoài không xem được" (mục 5 bản cũ). Sai với máy chủ cũ: mọi người dùng đã đăng nhập tìm được bất kỳ ai theo một phần tên, email hoặc số điện thoại, và nhận về email, số điện thoại. | Máy chủ mới đã sửa phần tìm kiếm (commit `6384ab9`, `f76f0ec`, `db0322e`). Mục 6 nói thật ai thấy gì theo máy chủ mới: tìm từ 3 ký tự, email và số điện thoại chỉ khớp khi gõ đủ và không hiện cho người chưa là bạn; bạn bè, người nhận lời mời và người nhắn tin riêng vẫn thấy email, số điện thoại; trạng thái đang hoạt động, tệp nộp bài mở bằng đường dẫn, phòng họp, xem trước thông báo, nhóm vận hành và trang "Báo cáo vi phạm". | [review-guidelines] "Friend search exposes any user's email and phone number to every logged-in user (global directory)"; [privacy-inventory] "Friend search exposes every user's email address and phone number to any signed-in user"; [backend] "User search exposes strangers' email and phone and allows partial-match enumeration" |
| 10 | Lưu trữ chỉ có một câu: "Dữ liệu được lưu chừng nào tài khoản còn tồn tại" (`privacy.html:114-115`). | Mục 9 ghi thời hạn cho từng loại dữ liệu: phiên đăng nhập, mã đặt lại mật khẩu, Sentry, PostHog, Daily, nhật ký, sao lưu. | Như dòng 1 |
| 11 | Chỉ dẫn link sang trang xoá tài khoản. Trang đó hứa "Tệp bạn đã nộp" bị xoá vĩnh viễn, nhưng với máy chủ cũ tệp thật vẫn nằm trong Azure Blob. | Mục 10 nói rõ cách xoá trên iPhone, Android, qua email; thứ bị xoá; thứ còn lại. Máy chủ mới xoá tệp trên Azure Blob (commit `3386c52`), nên mục 10 ghi tệp bị xoá. Nói thật về bản sao ở Daily, PostHog, sao lưu, báo cáo vi phạm, và đơn thanh toán. | [privacy-inventory] "Account deletion leaves uploaded files in Azure Blob Storage although the app and web say files are deleted"; [backend] "Account deletion removes database rows but leaves uploaded files and third-party copies behind"; [backend] "Payment and invoice records are hard-deleted with the account (possible legal retention conflict)" |
| 12 | Không nhắc Sentry. | Mục 3.7 và 7 nêu Sentry: không kèm tên, email; có thể nhận địa chỉ IP; có thể chứa từ khoá tìm bạn bè. | [privacy-inventory] "Sentry may store IP addresses and full request URLs, including friend-search queries" |
| 13 | Cách rút lại đồng ý chỉ có Do Not Track cho PostHog. | Mục 11 liệt kê mọi cách rút lại đồng ý đang có, và cách gửi yêu cầu. | Như dòng 1 (Apple 5.1.1(i): "describe how a user can revoke consent") |
| 14 | Không nêu căn cứ xử lý, không nêu quyền theo luật Việt Nam, không nói máy chủ ở đâu. Hứa trả lời "trong vòng 30 ngày". | Mục 5, 11, 14: căn cứ xử lý bằng lời thường; quyền theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP; thời hạn trả lời; dữ liệu nằm ở Hồng Kông, Nhật Bản, Hoa Kỳ, châu Âu. | Dữ kiện `data_residency` trong [privacy-inventory]: mọi dữ liệu nằm ngoài Việt Nam |
| 15 | "Không chủ động thu thập dữ liệu của trẻ em dưới 13 tuổi", nhưng app không có bước nào khớp. | Mục 12: tuổi tối thiểu 18 (đã chốt), kèm lý do. | [critic] "The age rating questionnaire (new 2025 system) must declare Messaging/Chat and user-generated content, and the policy's minimum age has no matching check in the app" |
| 16 | Không nhắc báo cáo vi phạm, chặn người dùng, bộ lọc từ ngữ, và không nói iPhone đăng nhập bằng gì. | Mục 3.1 nói ứng dụng iPhone chỉ đăng nhập bằng email và mật khẩu (Google chỉ có trên web và Android). Mục 3.10, 4, 6, 9, 10, 11 mô tả báo cáo (kèm bản chụp nội dung), chặn, bộ lọc `***` và khoá tài khoản. Đăng nhập bằng Apple **không** có ở bản này; đoạn chữ cho lúc làm nằm ở Phần 5 (Bản sau). | [review-guidelines] "Google Sign-In offered without Sign in with Apple or another equivalent privacy-preserving login (4.8)"; [review-guidelines] "No way to report objectionable content or block abusive users anywhere in the app (1.2)"; [critic] "Sign in with Apple must take the user's name from the first credential and must never ask for a name or email afterwards"; [backend] "Emails to Apple private relay addresses will bounce until the WeDo mail domain is registered with Apple"; [backend] "Account deletion cannot revoke Sign in with Apple tokens, because no Apple refresh token is stored" |
| 17 | Chỉ có tiếng Việt. | Thêm phụ lục tóm tắt tiếng Anh cho người duyệt của Apple. Bản dịch đầy đủ để đợt sau. | [privacy-inventory] "Privacy policy and account deletion page are Vietnamese-only" (xử lý một phần) |
| 18 | Mục PostHog chỉ nói "trên web WeDo". | Mục 2 và 3.8 nói thêm: trang web mở từ trong ứng dụng (ví dụ Bảng đóng góp trên Android) cũng thuộc phần đo lường web; bốn trang pháp lý là trang tĩnh, không đo lường. | Dữ kiện `usage_data.product_interaction` trong [privacy-inventory] (`src\app\(tabs)\account\contributions.tsx:164`) |
| 19 | Tên trang là "Chính sách bảo mật", còn app gọi là "Chính sách quyền riêng tư". | Một tên cho mọi nơi: "Chính sách quyền riêng tư". | Quyết định của chủ dự án |

Không thuộc tài liệu này, xem phần 4: trang Điều khoản sử dụng (tài liệu 06), trang xoá tài khoản, mục An toàn dữ liệu trên Google Play.

Một điều chỉnh so với yêu cầu ban đầu: Nghị định 13/2023/NĐ-CP **đã hết hiệu lực từ 01/01/2026**. Nghị định 356/2025/NĐ-CP (ngày 31/12/2025, hiệu lực 01/01/2026) thay thế nó và hướng dẫn Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (Quốc hội thông qua 26/06/2025, hiệu lực 01/01/2026). Vì vậy chính sách chỉ dẫn luật 91/2025 và nghị định 356/2025.

---

## Phần 2. Trước khi đăng: điền, xác nhận, chọn

### 2.1. Chỗ trống phải điền

Bản HTML trên nhánh `ios-web` không để ngoặc vuông nào. Ở mỗi chỗ chưa biết giá trị thật, nó dùng một câu trung tính, đúng sự thật nhưng kém cụ thể. Khi biết giá trị, thay câu trung tính bằng giá trị thật, ở cả trang HTML lẫn phần 3 dưới đây.

| Chỗ trống | Nằm ở mục | Lấy ở đâu | Câu trung tính trên bản HTML |
|---|---|---|---|
| `[NGÀY HIỆU LỰC]` | Đầu trang | Ngày bạn đăng trang. Viết dạng 01/10/2026. | "Cập nhật ngày 26/09/2026, có hiệu lực từ ngày đăng tại trang này." |
| `[VÙNG LƯU TỆP AZURE]` | 7, 14 | Azure Portal → Storage accounts → tài khoản chứa container `wedo-chat` → Overview → Location. Ví dụ "East Asia" là Hồng Kông, "Southeast Asia" là Singapore. | "kho tệp ở một vùng máy chủ Azure ở nước ngoài" |
| `[VÙNG CƠ SỞ DỮ LIỆU]` | 7, 14 | Supabase → project production → Settings → General. Tệp cấu hình ở máy gợi ý Tokyo (`aws-1-ap-northeast-1`), nhưng chưa ai xác nhận project production. | "một vùng máy chủ ở nước ngoài, trên hạ tầng Amazon Web Services" |
| `[SỐ NGÀY SAO LƯU]` | 9, 10 | Supabase → project production → Database → Backups. Ghi số ngày bản sao lưu cũ nhất còn giữ. Nếu gói không có sao lưu, xoá dòng sao lưu. | "nếu có, bản sao lưu bị ghi đè theo chu kỳ sao lưu của Supabase" |
| `[SỐ NGÀY NHẬT KÝ]` | 9 | Azure Portal → App Service `api-wedo-backend-dai` → App Service logs → Retention Period (Days). Nếu có cả Log Analytics, lấy số lớn hơn. | "chỉ dùng để tìm lỗi" (không nêu số ngày) |
| `[THỜI HẠN SENTRY]` | 9 | Sentry → Settings → Subscription. Gói miễn phí giữ lỗi 30 ngày, gói Team giữ 90 ngày (theo bảng giá Sentry). Chưa ai xem gói thật. | "Sentry tự xoá sau thời hạn lưu trữ của gói dịch vụ WeDo dùng" |
| `[THỜI HẠN POSTHOG]` | 9 | PostHog → Settings → Data retention. Theo bảng giá PostHog, gói miễn phí giữ sự kiện 1 năm và bản ghi phiên 1 tháng. | "được giữ theo thời hạn lưu trữ của gói PostHog mà WeDo dùng" |
| `[THỜI HẠN GIỮ BÁO CÁO]` | 9 | Chủ dự án chọn. Hôm nay máy chủ **không** tự xoá báo cáo: bảng `ContentReport` giữ mãi, kể cả khi tài khoản liên quan bị xoá (liên kết thành rỗng). Chọn một thời hạn thì phải có người xoá tay, hoặc thêm việc định kỳ ở máy chủ. | "được giữ làm hồ sơ xử lý… Hiện chưa có thời hạn tự xoá. Bạn có thể yêu cầu xoá theo mục 11." |

### 2.2. Đã chốt, đã làm và giả định

- ⚠ Giả định: bên chịu trách nhiệm là **cá nhân Lê Hữu Đại**, vì bạn đăng ký Apple Developer Program dạng cá nhân và chưa có công ty. Tài liệu 06 cũng ghi như vậy. Nếu tài khoản Google Play ("WeDo FPTU") đứng tên người khác, sửa mục 1 và 16.
- Đã chốt: **tên trang là "Chính sách quyền riêng tư"** ở mọi nơi. App (ô đồng ý khi đăng ký, tab Tài khoản), trang web, điều khoản và tài liệu đều dùng tên này.
- Đã chốt: ứng dụng trên iPhone **chỉ đăng nhập bằng email và mật khẩu**. Nút Google bị ẩn trên iPhone; web và Android giữ Google. **Không có Đăng nhập bằng Apple** ở bản này. Đoạn chữ để thêm khi làm tính năng đó nằm ở Phần 5.
- Đã làm (`08-sua-code-truoc-khi-nop.md`, IOS-03, IOS-04): **báo cáo vi phạm**, **chặn người dùng**, **bộ lọc từ ngữ** tiếng Việt và tiếng Anh (thay từ bằng `***`), **khoá tài khoản**. Tên trên màn hình: "Báo cáo tin nhắn", "Báo cáo người này", "Chặn người này", "Người đã chặn". Chỉ đăng chính sách khi máy chủ mới đã chạy trên production.
- Đã làm trên **ứng dụng điện thoại** (IOS-08): hộp thoại xin đồng ý trước lần đầu dùng AI, và công tắc **"Cho phép dùng AI"** trong tab Tài khoản để rút lại. **Web chưa có** bước hỏi: web vẫn tự gửi mỗi tin trưởng nhóm vừa gõ cho AI (`FE_WEDO\src\views\ChatView.tsx:920-923`), không hỏi ai. Vì vậy mục 8.3 dùng câu nói thật về web.
- Đã làm (IOS-09): máy chủ mới **không gửi email** của ai cho AI. Vẫn gửi tối đa 12 tin gần nhất kèm tên người viết.
- Đã làm (IOS-06): màn **đăng ký** trên ứng dụng có ô bắt buộc "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư", kèm hai đường dẫn. Tài khoản chưa đồng ý gặp màn "Điều khoản sử dụng" một lần sau khi đăng nhập. **Web đăng ký chưa có ô này.** Mục 5 và 12 dựa vào ô trên ứng dụng.
- Đã làm (IOS-11): trên iPhone, nút **"Xem đầy đủ trên web"** ở Bảng đóng góp bị ẩn. Trên Android nút vẫn còn, nên câu "Khi ứng dụng mở một trang web WeDo…" ở mục 2 vẫn đúng và phải giữ.
- Đã làm (IOS-20): máy chủ mới xoá tệp trên Azure Blob khi xoá tài khoản. Mục 10 dùng câu "tệp bị xoá", chỉ đúng khi máy chủ mới đã chạy.
- Đã làm (IOS-19): tìm bạn cần tối thiểu 3 ký tự; email và số điện thoại chỉ khớp khi gõ đủ; người chưa là bạn không thấy email, số điện thoại trong kết quả; người nhận lời mời chưa đồng ý thì người gửi chưa thấy email, số điện thoại của họ.
- ⚠ Giả định: thư đặt lại mật khẩu và thư báo cáo vi phạm đi qua **Brevo**. `BE_WEDO\.env.example` ghi "Hiện dùng Brevo", còn chú thích trong `src\mail\mail.service.ts` nói hộp thư P.A Việt Nam. Xem `MAIL_HOST` trên Azure. Nếu là P.A Việt Nam, sửa dòng Brevo ở mục 7 và 14 thành "P.A Việt Nam — hộp thư trên tên miền của WeDo — Việt Nam".
- ⚠ Giả định: thư báo cáo vi phạm gửi tới hộp thư `wedosupport6886@gmail.com` (giá trị nên đặt cho `REPORT_NOTIFY_EMAIL`). Hộp thư đó là Gmail, nên mục 7 có dòng Gmail. Đặt địa chỉ khác thì sửa câu tương ứng.
- ⚠ Chưa biết: production dùng nhà cung cấp AI nào, nên chính sách nêu cả ba. Mã chỉ dùng **một** nhà cung cấp tại một thời điểm: Gemini nếu có `GEMINI_API_KEY`; không có thì Azure OpenAI nếu đủ `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`; không có nữa thì OpenAI nếu có `OPENAI_API_KEY`. Nhà cung cấp gặp lỗi thì máy chủ dùng quy tắc có sẵn, không chuyển sang nhà cung cấp kế tiếp. Hộp thoại trong app ghi "Google Gemini hoặc OpenAI". Khi biết cấu hình thật, bỏ nhà cung cấp không dùng khỏi mục 7, 8, 14 và phụ lục, và sửa câu trong app nếu cần.
- Đã chốt: **tuổi tối thiểu 18**. Lý do:
  1. Điều khoản Gemini API cấm dùng API trong dịch vụ "hướng tới hoặc có khả năng được người dưới 18 tuổi truy cập" (https://ai.google.dev/gemini-api/terms). Mã WeDo ưu tiên Gemini.
  2. Theo luật Việt Nam, xử lý dữ liệu của trẻ em (dưới 16 tuổi) cần cha mẹ hoặc người giám hộ đồng ý. WeDo không có bước đó.
  3. Người dùng chính là sinh viên đại học.

  Tài liệu 06 (Điều khoản, Điều 2.1), tài liệu 07 (trang hỗ trợ) và tài liệu 02 (mục 14: Override to Higher Age Rating → 18+ trong App Store Connect) ghi cùng số 18.
- ⚠ Giả định: thời hạn thực hiện yêu cầu ở mục 11 lấy theo Điều 5 Nghị định 356/2025/NĐ-CP. Tôi đã đối chiếu với bản dịch tiếng Anh của nghị định (tệp PDF đăng tại qtsc.com.vn), không phải bản tiếng Việt trên Công báo. Mỗi loại yêu cầu có hạn riêng: 10 ngày (xem, sửa, cung cấp), 15 ngày (rút lại đồng ý, hạn chế, phản đối), 20 ngày (xoá). Nhờ người có chuyên môn pháp lý đối chiếu với bản tiếng Việt một lần.

### 2.3. Chọn phương án

| Chỗ chọn | Phương án A | Phương án B | Bản HTML đang dùng |
|---|---|---|---|
| Mục 8.4: Gemini có dùng dữ liệu để cải thiện sản phẩm không | Đã bật thanh toán (Cloud Billing) cho project Google Cloud chứa `GEMINI_API_KEY`. Nên chọn A: bật thanh toán rồi đăng. | Chưa bật thanh toán. Phải nói thật rằng Google có thể dùng dữ liệu và người của Google có thể đọc. | Câu trung tính: nêu điều khoản của **cả hai** gói. Khi biết gói thật, thay bằng A hoặc B. |
| Mục 3.7 và 9: địa chỉ IP trong Sentry | Hôm nay: Sentry có thể nhận IP. | Sau khi bật "Prevent Storing of IP Addresses" ở cả hai project Sentry: Sentry không lưu IP. | A |
| Mục 10: đơn thanh toán sau khi xoá tài khoản | Hôm nay: đơn bị xoá cùng tài khoản (`schema.prisma`, `PaymentOrder`, `onDelete: Cascade`). | Sau khi hỏi người làm kế toán và đổi backend sang giữ đơn đã tách khỏi tài khoản. | A |

Phương án "tệp còn nằm trong Azure Blob sau khi xoá tài khoản" của bản trước đã bỏ: máy chủ mới xoá tệp (IOS-20), và chính sách chỉ đăng sau khi máy chủ mới chạy.

---

## Phần 3. Toàn văn chính sách (chép lên web)

Bản HTML theo phần này đã có ở `D:\WEDO_PC\FE_WEDO-ios\public\privacy.html` (nhánh `ios-web`, commit `c4b98c2`), chưa đăng. Sửa chữ ở đây thì sửa cả trang đó, và ngược lại. Mỗi mục có mốc neo `#muc-1` … `#muc-16`.

```text
CHÍNH SÁCH QUYỀN RIÊNG TƯ CỦA WEDO

Có hiệu lực từ [NGÀY HIỆU LỰC]. Bản này thay cho bản có hiệu lực từ 15/08/2026.
Áp dụng cho web WeDo, ứng dụng WeDo trên Android và ứng dụng WeDo trên iPhone.

WeDo là công cụ làm việc nhóm cho sinh viên: giao việc, trò chuyện theo dự án, nhắn tin riêng, kết bạn, cuộc họp và lịch. Chính sách này nói rõ chúng tôi thu thập dữ liệu gì, dùng để làm gì, gửi cho ai, giữ trong bao lâu, và bạn có quyền gì với dữ liệu của mình.

Tóm tắt:
- Chúng tôi không bán dữ liệu của bạn và không dùng dữ liệu để quảng cáo.
- Ứng dụng trên điện thoại không chứa công cụ quảng cáo, không theo dõi bạn qua ứng dụng hay trang web của bên khác.
- Một số tính năng dùng AI của bên thứ ba. Mục 8 nói rõ gửi gì, gửi cho ai và khi nào.
- Người dùng WeDo khác có thể tìm thấy bạn theo tên. Mục 6 nói rõ ai thấy gì.
- Bạn báo cáo được nội dung xấu và chặn được người dùng ngay trong ứng dụng.
- Bạn xoá được tài khoản ngay trong ứng dụng: Tài khoản → Xoá tài khoản.
```

```text
1. CHÚNG TÔI LÀ AI VÀ CÁCH LIÊN HỆ

WeDo do nhóm WeDo phát triển và vận hành. Nhóm gồm các sinh viên đến từ các trường Đại học FPT.

Người chịu trách nhiệm về việc xử lý dữ liệu cá nhân trong WeDo là cá nhân Lê Hữu Đại, người phát hành ứng dụng WeDo. Theo pháp luật Việt Nam, đây là bên kiểm soát và xử lý dữ liệu cá nhân. Trong chính sách này, "chúng tôi" là cá nhân Lê Hữu Đại cùng nhóm WeDo.

Mọi câu hỏi và yêu cầu về dữ liệu cá nhân, gửi về: wedosupport6886@gmail.com
Chúng tôi xác nhận đã nhận yêu cầu trong vòng 02 ngày làm việc.
```

```text
2. CHÍNH SÁCH NÀY ÁP DỤNG CHO ĐÂU

- Web WeDo tại https://wedofpt.com.vn và https://fe-wedo.vercel.app.
- Ứng dụng WeDo trên Android, tải từ Google Play.
- Ứng dụng WeDo trên iPhone, tải từ App Store.

Ba nơi dùng chung một tài khoản và một máy chủ. Một số việc chỉ làm được trên web, như tạo dự án, mời thành viên và ghi biên bản cuộc họp. Ứng dụng trên điện thoại không có chức năng thanh toán. Dữ liệu thanh toán chỉ phát sinh trên web (mục 3.9).

Khi ứng dụng mở một trang web WeDo (ví dụ trang Bảng đóng góp), trang đó là web WeDo và theo các điều về đo lường trên web ở mục 3.8. Riêng các trang Chính sách quyền riêng tư, Điều khoản sử dụng, Hỗ trợ và Xoá tài khoản là trang tĩnh: không cần đăng nhập và không dùng công cụ đo lường.

Chính sách này không áp dụng cho dịch vụ của bên khác mà bạn tự mở, như trang đăng nhập của Google, trang thanh toán payOS, hay phòng họp Daily.co. Các dịch vụ đó có chính sách riêng.
```

> Trên bản HTML, địa chỉ web WeDo ở mục 2 chỉ là chữ thường, không phải liên kết (nhánh `ios-web`, commit `3e81a48`). Trang chủ web có mục "Bảng giá", mà app mở trang chính sách trong trình duyệt trong app; một liên kết là một lần chạm tới trang giá (Guideline 3.1.1, 3.1.3(f)). Giữ như vậy.

```text
3. DỮ LIỆU CHÚNG TÔI THU THẬP

3.1. Tài khoản
- Họ tên, email và mật khẩu. Mật khẩu chỉ lưu dạng băm (bcrypt); chúng tôi không đọc được mật khẩu gốc.
- Nếu bạn đăng nhập bằng Google (trên web hoặc ứng dụng Android): Google gửi cho chúng tôi họ tên, email và đường dẫn ảnh hồ sơ Google của bạn. Chúng tôi không nhận mật khẩu Google.
- Ứng dụng trên iPhone chỉ đăng nhập bằng email và mật khẩu. Nếu bạn đã tạo tài khoản bằng Google, bạn đặt mật khẩu qua "Quên mật khẩu" để đăng nhập trên iPhone.
- Mã phiên đăng nhập, để bạn không phải đăng nhập lại mỗi lần mở ứng dụng. Trên máy chủ, mã gia hạn phiên chỉ lưu dạng băm.
- Mã đặt lại mật khẩu gồm 6 chữ số, gửi qua email khi bạn chọn "Quên mật khẩu". Mã chỉ lưu dạng băm và hết hạn sau 10 phút.
- Thời điểm bạn đồng ý Điều khoản sử dụng và xác nhận đủ 18 tuổi, và thời điểm bạn đồng ý dùng AI trong ứng dụng.

3.2. Hồ sơ
- Số điện thoại và ngày sinh: không bắt buộc, chỉ lưu nếu bạn tự điền.
- Ảnh đại diện: trên ứng dụng, bạn chọn một ảnh trong thư viện ảnh, và ảnh được thu nhỏ còn 256 × 256 điểm ảnh trước khi lưu. Trên web, bạn tải ảnh lên. Ảnh bạn chọn được lưu ngay trong hồ sơ của bạn. Nếu bạn đăng nhập bằng Google và chưa có ảnh đại diện, ảnh hồ sơ Google được dùng làm ảnh đại diện.
- Cài đặt thông báo, và việc bạn đã hoãn hay đã tắt lời mời góp ý.

3.3. Nội dung bạn tạo
- Không gian làm việc và dự án: tên, thành viên, vai trò.
- Công việc: tên, mô tả, hạn chót, người phụ trách, trạng thái, lý do từ chối hoặc trả lại.
- Bài nộp: các tệp bạn nộp cho một công việc.
- Tin nhắn trong trò chuyện dự án và tin nhắn riêng: nội dung, ảnh, tệp đính kèm, biểu cảm, trả lời, chuyển tiếp, ghim, thu hồi, và thời điểm bạn đã đọc.
- Ảnh gửi trong trò chuyện: trên ứng dụng điện thoại, bạn chụp bằng máy ảnh hoặc chọn từ thư viện, tối đa 5 ảnh mỗi lần gửi. Ảnh được nén lại trước khi gửi.
- Cuộc họp: tiêu đề, nội dung dự kiến, thời gian, người tham dự. Nếu một thành viên bật ghi biên bản trên web, hoặc trưởng nhóm dán bản chép lời vào trên web, chúng tôi lưu thêm bản chép lời, bản tóm tắt, các quyết định và việc cần làm.
- Lịch: sự kiện, hạn chót và cuộc họp của bạn.
- Góp ý cho WeDo: điểm từ 1 đến 5 và lời nhận xét của bạn.

3.4. Bạn bè và nhóm
- Danh sách bạn bè, lời mời kết bạn đã gửi và đã nhận.
- Bạn thuộc không gian làm việc và dự án nào, với vai trò gì.
Chúng tôi không đọc danh bạ trong điện thoại của bạn.

3.5. Dữ liệu của tính năng AI
- Dữ liệu gửi cho nhà cung cấp AI: xem mục 8.
- Dữ liệu chúng tôi lưu: kết quả AI trả về (đề xuất công việc, bản tóm tắt cuộc họp), tên nhà cung cấp và mô hình đã dùng, số lần bạn dùng AI trong tháng.

3.6. Thiết bị và thông báo đẩy
- Mã nhận thông báo đẩy (push token) của máy bạn, kèm loại hệ điều hành (Android hoặc iOS). Mã này gắn với tài khoản để thông báo tới đúng máy. Mã bị xoá khi bạn đăng xuất trên máy đó.
- Khi ứng dụng kiểm tra bản cập nhật, máy chủ cập nhật của Expo nhận phiên bản ứng dụng, hệ điều hành và một mã ngẫu nhiên riêng cho mỗi lần cài đặt. Yêu cầu này không kèm thông tin tài khoản.

3.7. Báo cáo lỗi và hiệu năng
- Khi ứng dụng trên điện thoại gặp lỗi hoặc bị treo, ứng dụng gửi báo cáo lỗi cho Sentry. Báo cáo gồm: loại lỗi, vị trí lỗi trong mã, dòng máy, phiên bản hệ điều hành và ứng dụng, một mã ngẫu nhiên của lần cài đặt, và các thao tác ngay trước lỗi. Các thao tác này có thể gồm địa chỉ những yêu cầu mạng gần nhất, ví dụ từ khoá bạn vừa gõ để tìm bạn bè.
- Báo cáo lỗi không kèm họ tên, email hay nội dung tin nhắn. Khi báo cáo được gửi đi, Sentry có thể nhận địa chỉ IP của máy bạn.
- Máy chủ WeDo cũng gửi báo cáo lỗi của máy chủ cho Sentry, cùng số liệu thời gian xử lý của khoảng 10% lượt gọi tới máy chủ.
- Nếu bạn cho phép trong cài đặt điện thoại, Apple hoặc Google có thể gửi cho chúng tôi báo cáo sự cố và số liệu dùng ứng dụng ở dạng tổng hợp.

3.8. Dữ liệu hoạt động và đo lường
Trong ứng dụng điện thoại và trên máy chủ:
- Máy chủ lưu thời điểm của các hành động như gửi tin nhắn, nhận, từ chối hoặc hoàn thành việc, nộp bài, tạo cuộc họp, dùng AI. Chúng tôi dùng các mốc này để đếm số người hoạt động mỗi ngày.
- Máy chủ dùng địa chỉ IP trong bộ nhớ tạm để chặn các yêu cầu gửi quá dồn dập. Địa chỉ IP không được ghi vào cơ sở dữ liệu.
- Ứng dụng trên điện thoại không dùng công cụ đo lường hay quảng cáo nào. Ngoài báo cáo lỗi ở mục 3.7, ứng dụng không gửi dữ liệu sử dụng cho bên thứ ba.

Trên web WeDo (kể cả khi trang web được mở từ trong ứng dụng):
- Chúng tôi dùng dịch vụ PostHog để biết tính năng nào được dùng và người dùng vướng ở đâu. PostHog ghi nhận trang bạn mở, thao tác bạn làm, loại thiết bị và trình duyệt, và vị trí gần đúng ở mức tỉnh, thành suy ra từ địa chỉ IP.
- PostHog cũng ghi lại phiên sử dụng, tức là quay lại thao tác của bạn trên màn hình để chúng tôi xem chỗ nào gây khó. Nội dung hiển thị trên màn hình lúc đó, gồm tên công việc và tin nhắn, sẽ nằm trong bản ghi. Những gì bạn gõ vào ô nhập liệu, như mật khẩu hay tin đang soạn, đều bị che.
- Chúng tôi chỉ gửi cho PostHog mã tài khoản của bạn, không gửi tên hay email.
- WeDo tự đếm lượt truy cập web bằng một mã ngẫu nhiên lưu trong trình duyệt: trang bạn vào đầu tiên, các trang đã xem, và trang web đã dẫn bạn tới. Số liệu này không gắn với tài khoản của bạn.
- Trang web tải phông chữ từ Google Fonts và một số hình minh hoạ từ Unsplash và Transparent Textures. Khi tải, các dịch vụ này nhận địa chỉ IP và thông tin trình duyệt của bạn.
Muốn không bị PostHog ghi nhận, hãy bật Do Not Track trong trình duyệt, hoặc gửi email theo mục 16.

3.9. Thanh toán trên web
- Nếu bạn thanh toán trên web WeDo: họ tên, email, số điện thoại người mua; gói dịch vụ, số tiền, mã đơn, trạng thái và thời điểm thanh toán.
- Nếu bạn yêu cầu hoá đơn: tên công ty, mã số thuế và địa chỉ xuất hoá đơn.
- Thanh toán đi qua cổng payOS. Chúng tôi không lưu số thẻ hay số tài khoản ngân hàng của bạn.
- Ứng dụng trên điện thoại chỉ đọc gói hiện tại và số lượt AI còn lại của bạn. Ứng dụng không có mua bán. Ứng dụng trên iPhone không nhận thông báo về gói hay thanh toán.

3.10. Báo cáo vi phạm, chặn người dùng và khoá tài khoản
- Khi bạn báo cáo một tin nhắn hoặc một người dùng, chúng tôi lưu: lý do bạn chọn (Spam, quảng cáo; Quấy rối, bắt nạt; Thù ghét, phân biệt đối xử; Nội dung tình dục; Bạo lực, đe doạ; Lý do khác), lời mô tả thêm nếu có (tối đa 500 ký tự), tài khoản của bạn, tài khoản bị báo cáo và thời điểm báo cáo.
- Với tin nhắn bị báo cáo, máy chủ lưu thêm một bản chụp phần chữ của tin và tên các tệp đính kèm, lúc bạn gửi báo cáo. Nhờ vậy, chúng tôi vẫn xem xét được nếu sau đó tin bị thu hồi hay bị xoá.
- Người bị báo cáo không được biết ai đã báo cáo, trừ khi pháp luật buộc phải tiết lộ.
- Khi bạn chặn ai đó: danh sách người bạn đã chặn.
- Nếu tài khoản bị khoá vì vi phạm: thời điểm khoá và lý do khoá.

3.11. Quyền truy cập trên điện thoại
- Máy ảnh: chỉ dùng khi bạn bấm chụp ảnh để gửi trong trò chuyện.
- Ảnh: ứng dụng chỉ nhận những ảnh bạn tự chọn, để gửi trong trò chuyện hoặc làm ảnh đại diện.
- Tệp: ứng dụng chỉ nhận những tệp bạn tự chọn để nộp bài.
- Thông báo: chỉ khi bạn cho phép. Trên iPhone, WeDo chỉ hỏi quyền này khi bạn bấm "Bật thông báo" ở tab Thông báo.
Ứng dụng không dùng micrô, vị trí, danh bạ hay lịch của điện thoại, và không xin quyền theo dõi quảng cáo.

Chúng tôi KHÔNG thu thập: vị trí chính xác từ GPS, danh bạ điện thoại, tin nhắn SMS, nhật ký cuộc gọi, danh sách ứng dụng đã cài, dữ liệu sức khoẻ, số thẻ hay số tài khoản ngân hàng, mã quảng cáo của thiết bị. Ứng dụng trên điện thoại không ghi âm. Phòng họp video mở trên trình duyệt, không nằm trong ứng dụng; ở đó micrô và máy ảnh chỉ bật khi bạn cho trình duyệt quyền (xem mục 7, dòng Daily.co).
```

> Câu "đặt mật khẩu qua Quên mật khẩu" ở 3.1 đúng với mã: máy chủ tìm tài khoản theo email, không phân biệt cách đăng ký (`BE_WEDO\src\auth\password-reset.service.ts`; tài liệu 08, IOS-02). Mục 3.10 đúng với máy chủ mới (`BE src/moderation/*`, nhánh `ios-backend`): sáu lý do, ghi chú tối đa 500 ký tự, bản chụp tối đa 2.000 ký tự.
>
> Nếu chọn **phương án B cho Sentry** (đã bật chặn lưu IP), thay câu "Khi báo cáo được gửi đi, Sentry có thể nhận địa chỉ IP của máy bạn." bằng câu dưới. Nếu đã thêm `beforeBreadcrumb` bỏ phần truy vấn khỏi địa chỉ yêu cầu (chưa làm, `08` IOS-24), bỏ luôn câu "ví dụ từ khoá bạn vừa gõ để tìm bạn bè".

```text
Sentry được cấu hình để không lưu địa chỉ IP của máy bạn.
```

```text
4. CHÚNG TÔI DÙNG DỮ LIỆU ĐỂ LÀM GÌ

- Tạo và bảo vệ tài khoản: đăng ký, đăng nhập, đặt lại mật khẩu.
- Cung cấp các tính năng bạn dùng: giao việc, trò chuyện dự án, nhắn tin riêng, kết bạn, cuộc họp, lịch, bảng đóng góp.
- Gửi thông báo đẩy về công việc, cuộc họp, tin nhắn, lời mời kết bạn; gửi email mã đặt lại mật khẩu. Chúng tôi không gửi email quảng cáo.
- Chạy tính năng AI khi bạn hoặc nhóm của bạn dùng (mục 8).
- Tính số lượt AI và quản lý gói dịch vụ đã thanh toán trên web.
- Tìm và sửa lỗi, đo tốc độ của ứng dụng và máy chủ.
- Hiểu cách mọi người dùng WeDo để cải thiện sản phẩm: số người hoạt động mỗi ngày, tính năng nào được dùng.
- Giữ an toàn cho WeDo và người dùng: chặn yêu cầu dồn dập; tự động thay từ ngữ thô tục trong tin nhắn và tên hiển thị bằng dấu ***; xem xét báo cáo vi phạm; gỡ nội dung vi phạm và khoá tài khoản vi phạm Điều khoản sử dụng. Bộ lọc chỉ đọc nội dung lúc bạn gửi và không lưu thêm dữ liệu nào.
- Tuân thủ pháp luật và trả lời yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.

Chúng tôi không dùng dữ liệu của bạn để quảng cáo, không lập hồ sơ quảng cáo và không bán dữ liệu. Nếu muốn dùng dữ liệu cho một mục đích mới, chúng tôi sẽ báo trước và hỏi lại khi pháp luật yêu cầu.
```

```text
5. CĂN CỨ ĐỂ CHÚNG TÔI XỬ LÝ DỮ LIỆU

- Sự đồng ý của bạn. Trong ứng dụng, bạn đánh dấu ô "Tôi đủ 18 tuổi và đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư" khi đăng ký, hoặc ở màn Điều khoản sử dụng hiện một lần sau khi đăng nhập. Bạn cũng đồng ý khi cho ứng dụng dùng máy ảnh, ảnh hoặc thông báo, và khi đồng ý dùng tính năng AI trong ứng dụng. Bạn rút lại được sự đồng ý bất cứ lúc nào (mục 11).
- Để thực hiện thoả thuận giữa bạn và WeDo. Khi bạn gửi tin nhắn, chúng tôi phải chuyển nó tới người nhận. Khi bạn nộp bài, chúng tôi phải lưu tệp để trưởng nhóm xem. Không có các dữ liệu này thì dịch vụ không chạy được.
- Để làm đúng nghĩa vụ pháp luật. Ví dụ: cung cấp dữ liệu theo yêu cầu hợp pháp của cơ quan nhà nước có thẩm quyền.
- Trong trường hợp khẩn cấp, để bảo vệ tính mạng, sức khoẻ của bạn hoặc người khác, khi pháp luật cho phép.

Họ tên, email và mật khẩu là bắt buộc để tạo tài khoản. Số điện thoại, ngày sinh và ảnh đại diện có thể bỏ trống.
```

> Câu "Trong ứng dụng, bạn đánh dấu ô…" đúng với app mới (`08`, IOS-06). Web đăng ký chưa có ô này; người đăng ký trên web sẽ gặp màn đồng ý một lần khi mở ứng dụng. Nếu web thêm ô đồng ý, sửa câu thành "Khi đăng ký trên ứng dụng hoặc web, …".

```text
6. AI NHÌN THẤY DỮ LIỆU CỦA BẠN

Người dùng WeDo khác:
- Người cùng không gian làm việc thấy họ tên, email, ảnh đại diện và vai trò của bạn, và có thể nhắn tin riêng cho bạn.
- Người cùng dự án thấy tin nhắn, ảnh, tệp bạn gửi trong trò chuyện dự án, và biết khi bạn đang gõ. Họ cũng thấy công việc, bài nộp, cuộc họp, biên bản và Bảng đóng góp (số việc hoàn thành, chưa xong, trễ hạn và số bài đã nộp của từng thành viên).
- Người nhắn tin riêng với bạn thấy tin nhắn, ảnh, tệp trong cuộc trò chuyện đó, cùng họ tên, email, ảnh đại diện và số điện thoại của bạn (nếu bạn đã điền).
- Bạn bè thấy họ tên, email, ảnh đại diện và số điện thoại của bạn (nếu bạn đã điền), và có thể nhắn tin riêng cho bạn. Khi bạn gửi lời mời kết bạn cho ai, người đó cũng thấy các thông tin này. Ngược lại, khi người nhận chưa đồng ý, bạn chưa thấy email và số điện thoại của họ.
- Tìm kiếm: mọi người dùng WeDo đã đăng nhập có thể tìm thấy bạn khi gõ ít nhất 3 ký tự trong tên của bạn, hoặc gõ đúng và đủ email hay số điện thoại của bạn. Người chưa là bạn bè chỉ thấy họ tên và ảnh đại diện của bạn trong kết quả, không thấy email hay số điện thoại. Họ có thể gửi lời mời kết bạn cho bạn. Người bạn đã chặn, và người đã chặn bạn, không tìm thấy bạn.
- Trạng thái đang hoạt động: khi bạn đang mở WeDo, máy chủ báo cho các ứng dụng WeDo đang kết nối rằng tài khoản của bạn đang trực tuyến. Thông báo này chỉ kèm mã tài khoản, không kèm tên. Người nhắn tin riêng với bạn thấy dấu "đang hoạt động" cạnh tên bạn.

Ai có đường dẫn:
- Phòng họp video: ai có đường dẫn phòng họp cũng vào được. Đừng chia sẻ đường dẫn ra ngoài nhóm.
- Tệp nộp bài: ai có đường dẫn tệp cũng tải được. Đường dẫn chứa một mã ngẫu nhiên rất khó đoán, nhưng đừng chia sẻ nó ra ngoài nhóm.
- Ảnh và tệp gửi trong trò chuyện thì khác: chỉ người đã đăng nhập và thuộc đúng dự án hoặc cuộc trò chuyện đó mới mở được.

Trên màn hình điện thoại:
- Thông báo đẩy hiện tên người gửi và tối đa 120 ký tự đầu của tin nhắn, có thể hiện cả trên màn hình khoá. Bạn có thể tắt phần xem trước trong cài đặt thông báo của điện thoại.
- Nếu bạn đã chặn một người, bạn không nhận thông báo đẩy về tin họ gửi trong trò chuyện dự án chung.

Nhóm vận hành WeDo:
- Một số ít thành viên nhóm WeDo có quyền quản trị. Trang quản trị cho xem danh sách tài khoản (họ tên, email, số điện thoại, ngày sinh), không gian làm việc, gói dịch vụ, đơn hàng, góp ý, và số liệu hoạt động.
- Trang "Báo cáo vi phạm" cho xem các báo cáo: lý do, lời mô tả, bản chụp nội dung bị báo cáo, họ tên và email của người báo cáo và người bị báo cáo. Người vận hành có thể gỡ tin nhắn vi phạm và khoá tài khoản vi phạm. Ngoài bản chụp trong báo cáo, trang quản trị không hiển thị nội dung tin nhắn.
- Khi có báo cáo mới, máy chủ có thể gửi một thư báo tới hộp thư của nhóm vận hành. Thư gồm lý do, lời mô tả, họ tên người báo cáo và người bị báo cáo, và bản chụp nội dung.
- Người vận hành chỉ xem nội dung cụ thể khi xử lý báo cáo vi phạm, khi bạn nhờ hỗ trợ, hoặc khi pháp luật yêu cầu.

Bên khác:
- Nhà cung cấp dịch vụ ở mục 7, chỉ để làm việc của họ cho WeDo.
- Cơ quan nhà nước có thẩm quyền, khi có yêu cầu hợp pháp.
- Nếu WeDo được chuyển giao cho người khác vận hành, dữ liệu có thể được chuyển theo. Bên nhận phải tuân theo chính sách này, và chúng tôi sẽ báo trước cho bạn.
```

> Đoạn tìm kiếm và lời mời mô tả đúng máy chủ mới (`BE src/friends/friends.service.ts`, `search`, `anLienHeNguoiNhan`; `BE src/chat/chat.service.ts`, `searchDirectUsers`). Người nhắn tin riêng và bạn bè vẫn nhận email, số điện thoại của nhau (`directUserSelect`, `userSelect` còn hai trường này). Thành viên không gian làm việc và dự án không nhận số điện thoại.
>
> Trạng thái đang hoạt động: `BE_WEDO\src\chat\chat.gateway.ts` phát `presence:online` và `presence:offline` (chỉ kèm `userId`) cho **mọi** kết nối, không chỉ người quen. Nếu backend thu hẹp lại, rút gọn câu này.
>
> Trang "Báo cáo vi phạm" là `FE src/views/admin/AdminReportsView.tsx` (nhánh `ios-web`); nó hiện email người báo cáo và người bị báo cáo (`BE src/moderation/moderation-admin.service.ts`, `REPORT_SELECT`).

```text
7. BÊN THỨ BA XỬ LÝ DỮ LIỆU CHO WEDO

Chúng tôi dùng các nhà cung cấp dưới đây để vận hành WeDo. Mỗi bên chỉ nhận phần dữ liệu cần cho việc của mình.

- Microsoft Azure (Microsoft). Việc: chạy máy chủ WeDo (Azure App Service) và lưu ảnh, tệp gửi trong trò chuyện và bài nộp (Azure Blob Storage). Dữ liệu: mọi dữ liệu đi qua máy chủ WeDo; ảnh và tệp. Nơi xử lý: máy chủ ở Hồng Kông (vùng East Asia); kho tệp ở [VÙNG LƯU TỆP AZURE].
- Supabase. Việc: cơ sở dữ liệu chứa tài khoản và nội dung. Dữ liệu: dữ liệu ở mục 3, trừ ảnh và tệp. Nơi xử lý: [VÙNG CƠ SỞ DỮ LIỆU] (hạ tầng Amazon Web Services).
- Vercel. Việc: lưu và phát trang web WeDo. Dữ liệu: địa chỉ IP, thông tin trình duyệt, trang bạn mở. Nơi xử lý: Hoa Kỳ và mạng máy chủ của Vercel ở nhiều nước.
- Google (Đăng nhập bằng Google, trên web và ứng dụng Android). Việc: xác minh tài khoản Google khi bạn chọn đăng nhập bằng Google. Dữ liệu: Google cho chúng tôi biết họ tên, email, ảnh hồ sơ của bạn; Google biết bạn đã đăng nhập vào WeDo.
- Gmail (Google). Việc: hộp thư hỗ trợ wedosupport6886@gmail.com. Dữ liệu: thư bạn gửi cho chúng tôi, kể cả yêu cầu về dữ liệu và báo cáo qua email.
- Expo (650 Industries, Inc.). Việc: chuyển thông báo đẩy tới điện thoại, và phát bản cập nhật ứng dụng. Dữ liệu: mã nhận thông báo, tiêu đề và nội dung thông báo (ví dụ tên người gửi và tối đa 120 ký tự đầu của tin nhắn, tên công việc, tên cuộc họp); yêu cầu kiểm tra cập nhật ở mục 3.6. Nơi xử lý: Hoa Kỳ.
- Apple Push Notification service (Apple) và Firebase Cloud Messaging (Google). Việc: đưa thông báo tới iPhone và điện thoại Android. Dữ liệu: như dòng Expo.
- Sentry (Functional Software, Inc.). Việc: nhận báo cáo lỗi và số liệu hiệu năng. Dữ liệu: như mục 3.7. Nơi xử lý: Hoa Kỳ.
- Nhà cung cấp AI: Google Gemini API (Google), Azure OpenAI (Microsoft), OpenAI API (OpenAI). Việc: tạo đề xuất công việc, tóm tắt cuộc họp, tổng hợp góp ý. Dữ liệu và điều kiện: xem mục 8. Nơi xử lý: Hoa Kỳ hoặc vùng máy chủ của nhà cung cấp.
- Daily.co (Daily) và Deepgram. Việc: phòng họp video chạy trên trình duyệt; chuyển lời nói thành văn bản khi một thành viên bật ghi biên bản trên web (Daily dùng Deepgram cho việc này). Dữ liệu: hình và tiếng trong phòng họp (truyền trực tiếp; WeDo không bật ghi hình hay ghi âm), tên bạn nhập khi vào phòng, bản chép lời. Daily lưu một bản chép lời trong kho của Daily. Nơi xử lý: Hoa Kỳ.
- Brevo (Pháp). Việc: gửi email mã đặt lại mật khẩu, và có thể gửi thư báo có báo cáo vi phạm mới tới hộp thư của nhóm vận hành. Dữ liệu: email của bạn và mã; với thư báo cáo: lý do, lời mô tả, họ tên người báo cáo và người bị báo cáo, bản chụp nội dung. Nơi xử lý: Liên minh châu Âu.
- payOS. Việc: cổng thanh toán của web WeDo. Dữ liệu: như mục 3.9. Nơi xử lý: Việt Nam.
- PostHog (PostHog, Inc.). Việc: đo lường trên web (mục 3.8). Máy chủ WeDo cũng báo cho PostHog khi một đơn thanh toán trên web thành công, kèm mã tài khoản, mã đơn, gói và số tiền; không kèm tên hay email. Nơi xử lý: Hoa Kỳ.

Các bên trên xử lý dữ liệu theo hợp đồng hoặc điều khoản dịch vụ với chúng tôi, chỉ để cung cấp dịch vụ cho WeDo. Họ phải bảo vệ dữ liệu ở mức ít nhất tương đương chính sách này. Ngoại lệ, nếu có, được nêu rõ ở mục 8.4.

Chúng tôi không bán dữ liệu, không chia sẻ dữ liệu cho mục đích quảng cáo, và không cho bên nào dùng dữ liệu để theo dõi bạn qua ứng dụng hay trang web khác.
```

> ⚠ Giả định: dòng Brevo, dòng Supabase và danh sách nhà cung cấp AI phải khớp cấu hình production (xem phần 2.2). Dòng "Apple Push Notification service" vẫn giữ: đó là đường đi của thông báo đẩy tới iPhone, không phải đăng nhập.
>
> Nguồn: Azure Blob `BE_WEDO\src\chat\chat-storage.service.ts`; Expo push `src\notifications\expo-push.service.ts`; nội dung thông báo `src\chat\chat-push.service.ts`, `src\notifications\notifications.service.ts`, `src\tasks\tasks.service.ts`; Sentry `M src\lib\observability\sentry.ts` (máy nhận `ingest.us.sentry.io`), `BE_WEDO\src\observability\sentry-config.ts`; AI `src\chat\chat.service.ts`; Daily `src\meetings\meetings.service.ts` (mô hình `nova-2` là của Deepgram); payOS và PostHog máy chủ `src\payments\payments.service.ts`; thư báo cáo `src\mail\mail.service.ts` (`sendReportNotice`); web tải Google Fonts, Unsplash, Transparent Textures (`FE_WEDO\index.html`, `src`).

```text
8. TÍNH NĂNG AI

8.1. Tính năng nào gửi dữ liệu cho AI

a) Đề xuất công việc từ tin nhắn (ứng dụng và web)
Chỉ trưởng nhóm dự án hoặc chủ không gian làm việc dùng được.
- Trên ứng dụng điện thoại: trưởng nhóm nhấn giữ một tin nhắn trong trò chuyện dự án, rồi chọn "Tạo công việc bằng AI".
- Trên web: trưởng nhóm bấm phân tích một tin nhắn. Ngoài ra, khi trưởng nhóm gửi một tin trong trò chuyện dự án trên web, web tự đưa tin vừa gửi cho AI để gợi ý công việc.
Mỗi lần như vậy, máy chủ WeDo gửi cho nhà cung cấp AI:
- tên dự án;
- tin nhắn được chọn, kèm mã tài khoản, họ tên người viết và thời điểm gửi;
- tối đa 12 tin nhắn gần nhất trong trò chuyện dự án, kèm mã tài khoản, họ tên người viết và thời điểm gửi. Các tin này có thể do thành viên khác viết;
- danh sách thành viên dự án: mã tài khoản, họ tên, vai trò;
- ngày giờ hiện tại và múi giờ.
Máy chủ không gửi email hay số điện thoại của ai cho AI. Chỉ phần chữ của tin nhắn được gửi. Ảnh và tệp không được gửi.
AI trả về gợi ý: tên việc, mô tả, người phụ trách, hạn chót, mức độ chắc chắn. Trưởng nhóm xem và sửa trước khi tạo việc. Không có công việc nào được tạo tự động.

b) Tóm tắt cuộc họp (web)
Khi một thành viên bật ghi biên bản trong phòng họp trên web, Daily.co chuyển lời nói của mọi người trong phòng thành văn bản. Khi bản chép lời sẵn sàng, máy chủ WeDo tự gửi tiêu đề cuộc họp và bản chép lời (tối đa 60.000 ký tự) cho nhà cung cấp AI để tạo tóm tắt, quyết định và việc cần làm. Trên web, trưởng nhóm cũng có thể dán hoặc sửa bản chép lời rồi bấm tạo lại bản tóm tắt; khi đó phần chữ đã dán được gửi cho nhà cung cấp AI theo cách trên. Ứng dụng điện thoại chỉ hiển thị kết quả. Hãy báo cho mọi người trong phòng trước khi bật ghi biên bản.

c) Tổng hợp góp ý (nội bộ)
Quản trị viên WeDo có thể gửi tối đa 120 góp ý gần nhất cho AI để tổng hợp ý kiến chung. Mỗi góp ý chỉ gồm điểm và tối đa 800 ký tự lời nhận xét, không kèm tên hay tài khoản. Lời nhận xét được gửi nguyên văn, nên đừng ghi thông tin cá nhân vào góp ý.

8.2. Nhà cung cấp AI
Mỗi lúc, máy chủ chỉ dùng một nhà cung cấp: Google Gemini API nếu đã được cấu hình; nếu không thì Azure OpenAI (Microsoft); nếu không nữa thì OpenAI API. Nếu nhà cung cấp đó gặp lỗi, máy chủ dùng quy tắc có sẵn của WeDo, không chuyển dữ liệu sang nhà cung cấp khác. Nếu không có nhà cung cấp nào, máy chủ dùng quy tắc có sẵn và không gửi dữ liệu đi đâu.

8.3. Hỏi ý bạn trước khi gửi
Trên ứng dụng điện thoại, trước lần đầu bạn dùng "Tạo công việc bằng AI", WeDo hỏi bạn có đồng ý gửi dữ liệu nêu ở 8.1a cho nhà cung cấp AI hay không. Nếu bạn không đồng ý, không có gì được gửi, và bạn vẫn tạo công việc bằng tay như bình thường. Bạn rút lại sự đồng ý được bất cứ lúc nào: tắt công tắc "Cho phép dùng AI" trong tab Tài khoản, hoặc gửi email theo mục 16. Việc rút lại không thu hồi được dữ liệu đã gửi trước đó.

Trên web, tính năng này hiện chạy mà không hỏi trước. Công tắc "Cho phép dùng AI" trong ứng dụng không áp dụng cho web: nếu bạn là trưởng nhóm và gửi tin trong trò chuyện dự án trên web, web vẫn tự đưa tin đó cho AI.

Vì 12 tin gần nhất có thể do người khác viết, dữ liệu của cả nhóm có thể được gửi đi khi trưởng nhóm dùng AI, trên ứng dụng hoặc trên web. Nếu bạn không muốn tin nhắn của mình được gửi cho AI, hãy báo trưởng nhóm, và đừng viết thông tin nhạy cảm trong trò chuyện dự án.
```

> Mục 8.1a và 8.3 đúng với mã: ứng dụng hỏi trước (`M src/lib/ai/dong-y-ai.ts`), máy chủ mới không gửi email (`BE src/chat/chat.service.ts`, `thanhVienChoAi`, `tacGiaChoAi`), web tự gửi (`FE src/views/ChatView.tsx:920-923`). Khi web thêm bước hỏi, bỏ đoạn "Trên web, tính năng này hiện chạy mà không hỏi trước…" và sửa phụ lục tiếng Anh cùng lúc.

Mục 8.4 có ba cách viết. Chỉ chép một. Bản HTML đang dùng cách trung tính.

Phương án A — đã bật thanh toán cho project Google Cloud chứa `GEMINI_API_KEY` (nên chọn):

```text
8.4. Nhà cung cấp AI làm gì với dữ liệu
- Google Gemini API: WeDo dùng gói trả phí. Theo điều khoản của Google cho gói này, Google không dùng nội dung gửi tới và kết quả trả về để cải thiện sản phẩm của Google. Google lưu nhật ký trong một thời gian giới hạn, chỉ để phát hiện hành vi vi phạm chính sách sử dụng và khi pháp luật yêu cầu.
- Azure OpenAI và OpenAI API: theo điều khoản của Microsoft và OpenAI, dữ liệu gửi qua API không được dùng để huấn luyện mô hình. Nhà cung cấp có thể lưu tạm dữ liệu để phát hiện lạm dụng.
```

Phương án B — chưa bật thanh toán:

```text
8.4. Nhà cung cấp AI làm gì với dữ liệu
- Google Gemini API: WeDo đang dùng gói miễn phí. Theo điều khoản của Google cho gói này, Google có thể dùng nội dung gửi tới và kết quả trả về để cung cấp, cải thiện và phát triển sản phẩm của Google, và người đánh giá của Google có thể đọc nội dung sau khi nội dung đã được tách khỏi tài khoản của WeDo. Đây là ngoại lệ so với cam kết ở mục 7. Nếu bạn không muốn điều này, đừng dùng tính năng AI.
- Azure OpenAI và OpenAI API: theo điều khoản của Microsoft và OpenAI, dữ liệu gửi qua API không được dùng để huấn luyện mô hình. Nhà cung cấp có thể lưu tạm dữ liệu để phát hiện lạm dụng.
```

Cách trung tính — dùng khi chưa biết gói (bản HTML hiện dùng cách này):

```text
8.4. Nhà cung cấp AI làm gì với dữ liệu
- Google Gemini API: điều khoản của Google cho gói trả phí và gói miễn phí khác nhau. Ở gói trả phí, Google không dùng nội dung gửi tới và kết quả trả về để cải thiện sản phẩm của Google. Ở gói miễn phí, Google có thể dùng nội dung gửi tới và kết quả trả về để cung cấp, cải thiện và phát triển sản phẩm của Google, và người đánh giá của Google có thể đọc nội dung. Nếu bạn không muốn nội dung của mình có thể bị dùng như vậy, đừng dùng tính năng AI.
- Azure OpenAI và OpenAI API: theo điều khoản của Microsoft và OpenAI, dữ liệu gửi qua API không được dùng để huấn luyện mô hình. Nhà cung cấp có thể lưu tạm dữ liệu để phát hiện lạm dụng.
```

Chép tiếp sau mục 8.4, dù chọn cách nào:

```text
8.5. Kết quả AI được lưu ở đâu
WeDo lưu kết quả AI trả về, tên nhà cung cấp, mô hình và số lượt dùng, để hiện lại kết quả và tính số lượt AI mỗi tháng. Các bản ghi này bị xoá khi bạn xoá tài khoản.
```

> Nguồn điều khoản Gemini: https://ai.google.dev/gemini-api/terms (bản cập nhật 28/04/2026, đọc ngày 26/09/2026). Gói trả phí là khi gọi API qua một project Google Cloud có tài khoản thanh toán đang hoạt động. Với gói miễn phí, điều khoản còn dặn không gửi thông tin cá nhân, nhạy cảm hay bí mật, trong khi WeDo vẫn gửi họ tên (không còn gửi email). Phương án B và cách trung tính vì vậy vẫn để lại một rủi ro điều khoản. Bật thanh toán là cách gọn nhất.

```text
9. DỮ LIỆU ĐƯỢC GIỮ TRONG BAO LÂU

Chúng tôi giữ dữ liệu chừng nào còn cần để cung cấp dịch vụ, rồi xoá. Cụ thể:
- Tài khoản, hồ sơ, bạn bè, cài đặt: tới khi bạn xoá tài khoản.
- Tin nhắn, ảnh, tệp, công việc, bài nộp, cuộc họp, sự kiện lịch: tới khi bạn hoặc người có quyền trong nhóm xoá hay thu hồi chúng, khi không gian làm việc chứa chúng bị xoá, hoặc khi bạn xoá tài khoản. Mục 10 nói rõ phần còn lại sau khi xoá tài khoản.
- Mã nhận thông báo đẩy: tới khi bạn đăng xuất trên máy đó, khi hệ thống báo mã không còn dùng được, khi tài khoản bị khoá, hoặc khi bạn xoá tài khoản.
- Phiên đăng nhập: mã gia hạn phiên hết hạn sau 60 ngày kể từ lần dùng gần nhất.
- Mã đặt lại mật khẩu: hết hiệu lực sau 10 phút, hoặc ngay sau khi dùng.
- Thời điểm đồng ý Điều khoản và xác nhận đủ 18 tuổi: tới khi bạn xoá tài khoản. Thời điểm đồng ý dùng AI bị xoá ngay khi bạn tắt "Cho phép dùng AI".
- Kết quả AI và số lượt dùng AI: tới khi bạn xoá tài khoản.
- Góp ý cho WeDo: tới khi bạn xoá tài khoản.
- Báo cáo vi phạm: được giữ làm hồ sơ xử lý, kể cả sau khi tài khoản liên quan bị xoá; khi đó báo cáo không còn gắn với tài khoản. Thời hạn giữ: [THỜI HẠN GIỮ BÁO CÁO]. Bạn có thể yêu cầu xoá theo mục 11.
- Danh sách người bạn đã chặn: tới khi bạn bỏ chặn hoặc xoá tài khoản.
- Bản chép lời cuộc họp lưu tại Daily.co: hiện chưa được xoá tự động. Bạn có thể yêu cầu xoá theo mục 11.
- Báo cáo lỗi tại Sentry: tự xoá sau [THỜI HẠN SENTRY].
- Đo lường web tại PostHog: bản ghi phiên và các sự kiện được giữ [THỜI HẠN POSTHOG].
- Thống kê lượt truy cập web của riêng WeDo: không gắn với tài khoản hay tên của bạn.
- Nhật ký kỹ thuật của máy chủ: [SỐ NGÀY NHẬT KÝ] ngày, chỉ dùng để tìm lỗi. Nhật ký chủ yếu ghi mã tài khoản. Riêng khi gửi thư mã đặt lại mật khẩu, nhật ký có ghi địa chỉ email nhận thư.
- Bản sao lưu cơ sở dữ liệu: [SỐ NGÀY SAO LƯU] ngày, sau đó bị ghi đè.
- Đơn thanh toán trên web: xem mục 10.
- Dữ liệu tạm trên điện thoại: bộ nhớ đệm của ứng dụng bị xoá khi bạn đăng xuất. Trên iPhone, nếu bạn gỡ ứng dụng mà chưa đăng xuất, thông tin đăng nhập có thể vẫn nằm trong Keychain của máy. Hãy đăng xuất trước khi gỡ ứng dụng.
```

> Nguồn: mã gia hạn phiên 60 ngày `BE_WEDO\src\auth\refresh-token.service.ts`; mã đặt lại mật khẩu 10 phút, 5 lần sai `src\auth\password-reset.service.ts`; xoá mã thông báo khi đăng xuất, khi mã chết và khi bị khoá (`src\notifications\push-token.service.ts`, `src\moderation\moderation-admin.service.ts`); rút đồng ý AI đặt `aiConsentAt` về rỗng (`src\users\users.service.ts`, `setAiConsent`); báo cáo không có lệnh xoá tự động (`ContentReport`, `onDelete: SetNull`); xoá bộ nhớ đệm khi đăng xuất `M src\lib\query.ts`, `src\lib\auth\auth-context.tsx`; nhật ký vận hành che email, số điện thoại, họ tên (`BE_WEDO\src\common\operational-logger.ts`), nhưng dòng log của `BE_WEDO\src\mail\mail.service.ts` ghi địa chỉ email nhận mã đặt lại mật khẩu, nên chính sách không hứa "đã che email". Daily: máy chủ chỉ đọc bản chép lời, không có lệnh xoá. Các chỗ trống: xem phần 2.1 và câu trung tính tương ứng.

```text
10. XOÁ TÀI KHOẢN

Cách 1 — Trong ứng dụng trên iPhone hoặc Android:
1) Mở WeDo và đăng nhập.
2) Vào tab Tài khoản, chọn Xoá tài khoản.
3) Đọc danh sách dữ liệu sẽ bị xoá, gõ XOA để xác nhận.
4) Nhấn Xoá tài khoản vĩnh viễn, rồi xác nhận thêm một lần.
Tài khoản bị xoá ngay và ứng dụng tự đăng xuất. Không có thời gian chờ và không khôi phục được.

Cách 2 — Qua email (ví dụ khi bạn chỉ dùng web, vì web chưa có nút xoá tài khoản):
Gửi email từ chính địa chỉ đã đăng ký tới wedosupport6886@gmail.com, tiêu đề "Yêu cầu xoá tài khoản WeDo". Chúng tôi xác minh, xoá trong vòng 20 ngày và báo lại cho bạn.
Hướng dẫn chi tiết: https://wedofpt.com.vn/xoa-tai-khoan.html

Trước khi xoá: nếu bạn là chủ một không gian làm việc còn thành viên khác, ứng dụng yêu cầu bạn chuyển quyền chủ cho một thành viên trước. Việc này để một người không vô tình xoá dữ liệu của cả nhóm.

Bị xoá ngay khi tài khoản bị xoá:
- Hồ sơ, email, mật khẩu, số điện thoại, ngày sinh, ảnh đại diện.
- Tin nhắn bạn đã gửi trong trò chuyện dự án và tin nhắn riêng, cùng biểu cảm của bạn.
- Bạn bè và lời mời kết bạn.
- Thông báo của bạn, mã nhận thông báo đẩy, phiên đăng nhập.
- Bài nộp và tệp đính kèm của bạn (xem phần tệp bên dưới).
- Cuộc họp và sự kiện lịch do bạn tạo.
- Góp ý, kết quả AI và số lượt dùng AI gắn với bạn.
- Danh sách người bạn đã chặn.
- Thời điểm bạn đồng ý Điều khoản và đồng ý dùng AI.
- Không gian làm việc chỉ có mình bạn, cùng toàn bộ dự án, công việc, tin nhắn và tệp bên trong.

Tệp và ảnh bạn đã gửi hoặc nộp:
Ảnh, tệp đính kèm và bài nộp bạn đã tải lên bị xoá khỏi kho lưu trữ Azure Blob ngay sau khi tài khoản bị xoá. Tệp trong các không gian làm việc bị xoá theo tài khoản cũng bị xoá. Ảnh đại diện nằm trong hồ sơ, nên mất cùng hồ sơ.

Vẫn còn lại, vì thuộc về nhóm hoặc người khác:
- Công việc bạn từng phụ trách vẫn nằm trong dự án, chuyển thành chưa giao cho ai.
- Tin nhắn người khác chuyển tiếp từ tin của bạn là bản sao do họ gửi, kể cả ảnh và tệp kèm theo. Bản sao đó vẫn còn và có thể ghi tên bạn là người viết gốc.
- Bản chép lời và bản tóm tắt của cuộc họp do người khác tạo có thể chứa lời nói hoặc tên của bạn.
- Tin nhắn và công việc do người khác viết có thể nhắc tới bạn.
- Báo cáo vi phạm do bạn gửi hoặc về bạn: được giữ làm hồ sơ xử lý vi phạm, nhưng không còn gắn với tài khoản của bạn. Bản chụp nội dung bị báo cáo vẫn nằm trong hồ sơ đó.

Đơn thanh toán trên web:
Đơn hàng lưu trong WeDo bị xoá cùng tài khoản. payOS và ngân hàng của bạn vẫn giữ bản ghi giao dịch theo chính sách của họ và theo pháp luật.

Bản sao ở nơi khác:
- Dữ liệu đã xoá có thể còn trong bản sao lưu cơ sở dữ liệu tối đa [SỐ NGÀY SAO LƯU] ngày, rồi mất hẳn khi bản sao lưu bị ghi đè. Chúng tôi chỉ dùng bản sao lưu để khắc phục sự cố.
- Báo cáo lỗi tại Sentry không gắn với tài khoản và tự xoá theo mục 9.
- Nếu bạn từng dùng web: sự kiện đo lường tại PostHog gắn với mã tài khoản hiện chưa tự xoá. Gửi email nếu bạn muốn xoá.
- Bản chép lời cuộc họp tại Daily.co hiện chưa tự xoá. Gửi email nếu bạn muốn xoá.
- Nếu bạn đăng nhập bằng Google: bạn gỡ được liên kết với WeDo trong phần bảo mật của Tài khoản Google.
```

> Phần tệp đúng với máy chủ mới (`BE src/users/users.service.ts`, `gomTepCanDon`, `donTepSauKhiXoa`, commit `3386c52`): gom tệp đính kèm và bài nộp do người đó tải lên và của không gian bị xoá theo, xoá xong trong cơ sở dữ liệu thì xoá trên Azure Blob, chỉ xoá tệp không còn dòng nào trỏ tới. Việc xoá tệp chạy ngầm; lỗi thì máy chủ ghi log. Chỉ đăng câu này khi máy chủ mới đã chạy. Câu về thu hồi quyền Apple để dành cho Phần 5.

Phương án B cho phần thanh toán — dùng khi backend đã đổi sang giữ đơn đã thanh toán, tách khỏi tài khoản (sau khi hỏi người làm kế toán, thuế):

```text
Đơn thanh toán trên web:
Đơn hàng đã thanh toán được giữ lại [SỐ NĂM] năm theo pháp luật về kế toán và thuế, nhưng được tách khỏi tài khoản đã xoá. Chúng tôi chỉ giữ những thông tin cần cho chứng từ: mã đơn, gói, số tiền, ngày thanh toán, và thông tin xuất hoá đơn nếu bạn đã yêu cầu. Hết thời hạn, đơn hàng bị xoá.
```

```text
11. QUYỀN CỦA BẠN

Theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 (hiệu lực từ 01/01/2026) và Nghị định 356/2025/NĐ-CP hướng dẫn luật này, bạn có các quyền:
- Được biết dữ liệu nào của bạn được xử lý, để làm gì và bởi ai. Chính sách này là thông báo đó.
- Đồng ý hoặc không đồng ý, và rút lại sự đồng ý.
- Xem và sửa dữ liệu của bạn.
- Yêu cầu cung cấp bản sao dữ liệu của bạn.
- Yêu cầu xoá dữ liệu.
- Yêu cầu hạn chế xử lý, và phản đối việc xử lý dữ liệu.
- Khiếu nại, tố cáo, khởi kiện và yêu cầu bồi thường thiệt hại theo quy định của pháp luật.

Cách làm:
- Xem và sửa họ tên, số điện thoại, ngày sinh, ảnh đại diện: Tài khoản → Thông tin cá nhân.
- Tắt từng loại thông báo (Giao việc, Duyệt việc, Nhắc hạn chót, Cuộc họp): Tài khoản → Cài đặt thông báo. Muốn tắt mọi thông báo, kể cả tin nhắn và lời mời kết bạn: tắt trong cài đặt thông báo của điện thoại.
- Rút quyền máy ảnh hoặc ảnh: trong Cài đặt của điện thoại.
- Rút lại đồng ý dùng AI: tắt công tắc "Cho phép dùng AI" trong tab Tài khoản của ứng dụng, hoặc gửi email.
- Không bị PostHog đo lường trên web: bật Do Not Track trong trình duyệt, hoặc gửi email.
- Báo cáo: nhấn giữ tin nhắn cần báo cáo rồi chọn "Báo cáo tin nhắn". Muốn báo cáo một người, bấm nút ba chấm ở đầu cuộc trò chuyện riêng với họ, hoặc nút ba chấm cạnh tên họ ở màn Bạn bè, rồi chọn "Báo cáo người này".
- Chặn một người dùng: nhấn giữ tin nhắn của họ, hoặc bấm một trong hai nút ba chấm nói trên, rồi chọn "Chặn người này". Bỏ chặn: Tài khoản → Người đã chặn.
- Xoá tài khoản: xem mục 10.
- Mọi yêu cầu khác (bản sao dữ liệu, xoá một phần, hạn chế, phản đối, xoá dữ liệu ở bên thứ ba như PostHog hay Daily.co): gửi email tới wedosupport6886@gmail.com từ địa chỉ đã đăng ký. Chúng tôi có thể hỏi thêm để chắc bạn là chủ tài khoản. Chúng tôi không thu phí.

Thời hạn:
- Chúng tôi xác nhận đã nhận yêu cầu trong vòng 02 ngày làm việc.
- Chúng tôi thực hiện trong 10 ngày với yêu cầu xem, sửa hoặc cung cấp dữ liệu; 15 ngày với yêu cầu rút lại đồng ý, hạn chế hoặc phản đối; 20 ngày với yêu cầu xoá.
- Nếu cần bên thứ ba cùng thực hiện, thời hạn lần lượt là 15, 20 và 30 ngày.
- Nếu phải gia hạn, chúng tôi báo lý do cho bạn và chỉ gia hạn một lần: không quá 10 ngày với yêu cầu xem, sửa hoặc cung cấp dữ liệu; 15 ngày với yêu cầu rút lại đồng ý, hạn chế hoặc phản đối; 20 ngày với yêu cầu xoá.

Việc rút lại sự đồng ý không làm mất hiệu lực của việc xử lý đã làm trước đó. Một số tính năng cần dữ liệu mới chạy được; nếu bạn rút lại, tính năng đó sẽ ngừng với bạn. Trong một số trường hợp pháp luật cho phép, chúng tôi có thể từ chối hoặc chỉ thực hiện một phần yêu cầu, và sẽ nói rõ lý do.

Nếu bạn không hài lòng với cách chúng tôi xử lý, bạn có quyền khiếu nại tới cơ quan chuyên trách bảo vệ dữ liệu cá nhân thuộc Bộ Công an.
```

> Tên "Cho phép dùng AI", "Báo cáo tin nhắn", "Báo cáo người này", "Chặn người này", "Người đã chặn" đúng với app trên nhánh `ios` (`08`, IOS-04, IOS-08). Các thời hạn lấy theo Điều 5 Nghị định 356/2025/NĐ-CP (khoản 2, 3, 4) như đã nói ở phần 2.2; nên nhờ người có chuyên môn đối chiếu với bản tiếng Việt.

```text
12. TUỔI TỐI THIỂU

WeDo dành cho người từ đủ 18 tuổi trở lên. Chúng tôi không cố ý thu thập dữ liệu của người dưới 18 tuổi. Nếu biết một tài khoản thuộc về người dưới 18 tuổi, chúng tôi sẽ xoá tài khoản đó. Nếu bạn là cha mẹ hoặc người giám hộ và nghĩ con mình đã tạo tài khoản WeDo, hãy báo cho chúng tôi qua email ở mục 16.
```

> Đã chốt: tuổi tối thiểu 18, lý do ở phần 2.2. Khớp với tài liệu 06 (Điều 2.1), trang hỗ trợ (tài liệu 07) và mức 18+ trong App Store Connect (tài liệu 02, mục 14). Câu này dựa vào ô bắt buộc ở màn đăng ký và màn đồng ý một lần trên ứng dụng (đã làm, `08` IOS-06). Web đăng ký chưa có ô xác nhận tuổi.

```text
13. BẢO MẬT

- Mọi kết nối giữa thiết bị của bạn và máy chủ WeDo đều được mã hoá bằng HTTPS.
- Mật khẩu chỉ lưu dạng băm (bcrypt). Mã gia hạn phiên và mã đặt lại mật khẩu cũng chỉ lưu dạng băm. Mã đặt lại mật khẩu chỉ cho nhập sai 5 lần.
- Trên điện thoại, mã đăng nhập nằm trong kho bảo mật của hệ điều hành (Keychain trên iPhone, Keystore trên Android). Dữ liệu tạm của ứng dụng bị xoá khi bạn đăng xuất.
- Ảnh và tệp trong trò chuyện nằm trong kho lưu trữ riêng tư. Máy chủ chỉ trả tệp cho người đã đăng nhập và thuộc đúng dự án hoặc cuộc trò chuyện đó.
- Nhật ký kỹ thuật của máy chủ không ghi mật khẩu, mã đặt lại mật khẩu hay mã đăng nhập.
- Chỉ một số ít thành viên nhóm WeDo có quyền quản trị.

Không hệ thống nào an toàn tuyệt đối. Nếu xảy ra sự cố làm lộ dữ liệu cá nhân, chúng tôi sẽ khắc phục, và thông báo cho cơ quan chuyên trách bảo vệ dữ liệu cá nhân và cho người bị ảnh hưởng trong thời hạn pháp luật quy định.

Bạn giúp giữ an toàn bằng cách dùng mật khẩu riêng cho WeDo, không chia sẻ tài khoản, và đăng xuất trên máy không phải của mình.
```

> Nguồn: bcrypt, băm mã phiên và mã đặt lại mật khẩu `BE_WEDO\prisma\schema.prisma`; Keychain qua `expo-secure-store` `M src\lib\auth\token-storage.ts`; kiểm quyền tệp chat `BE_WEDO\src\chat\chat.service.ts`.

```text
14. DỮ LIỆU ĐƯỢC LƯU Ở ĐÂU

WeDo chưa đặt máy chủ tại Việt Nam. Dữ liệu của bạn được lưu và xử lý ở nước ngoài:
- Hồng Kông: máy chủ WeDo (Microsoft Azure, vùng East Asia).
- [VÙNG LƯU TỆP AZURE]: ảnh và tệp (Azure Blob Storage).
- [VÙNG CƠ SỞ DỮ LIỆU]: cơ sở dữ liệu (Supabase, trên hạ tầng Amazon Web Services).
- Hoa Kỳ: báo cáo lỗi (Sentry), đo lường web (PostHog), thông báo đẩy và cập nhật ứng dụng (Expo, Apple, Google), phòng họp và chép lời (Daily.co, Deepgram), AI (Google, Microsoft, OpenAI, tuỳ vùng máy chủ của nhà cung cấp), đăng nhập bằng Google, lưu trang web (Vercel, có máy chủ ở nhiều nước).
- Liên minh châu Âu: gửi email (Brevo).
- Việt Nam: thanh toán (payOS).
- Hộp thư hỗ trợ (Gmail): trên hạ tầng của Google.

Chúng tôi chỉ chuyển phần dữ liệu cần cho từng việc, và chỉ dùng nhà cung cấp có cam kết bảo vệ dữ liệu như mục 7.
```

> ⚠ Việc của bạn, không đăng. Theo bản dịch tiếng Anh của Nghị định 356/2025/NĐ-CP:
>
> - Lưu dữ liệu cá nhân thu ở Việt Nam trên máy chủ hoặc dịch vụ đám mây ở nước ngoài **là** chuyển dữ liệu xuyên biên giới (Điều 17 khoản 1 điểm a). WeDo đang làm đúng việc này.
> - Bên chuyển phải lập hồ sơ đánh giá tác động chuyển dữ liệu xuyên biên giới (Điều 20 của Luật) và nộp cho cơ quan chuyên trách **trong 60 ngày** kể từ khi bắt đầu chuyển (Điều 18 khoản 4 của Nghị định).
> - Điều 41 của Nghị định (hướng dẫn Điều 38 của Luật) chỉ cho doanh nghiệp nhỏ, khởi nghiệp được chọn không làm Điều 21, Điều 22 và khoản 2 Điều 33 của Luật trong 5 năm; hộ kinh doanh, doanh nghiệp siêu nhỏ thì không phải làm. Danh sách này **không có Điều 20**. Hơn nữa, WeDo đang do một cá nhân phát hành, không phải doanh nghiệp.
>
> Vì vậy chính sách không viết câu "đã làm đúng thủ tục". Hãy hỏi người có chuyên môn pháp lý: WeDo có phải nộp hồ sơ chuyển dữ liệu xuyên biên giới không, và nếu có thì nộp thế nào.

```text
15. THAY ĐỔI CHÍNH SÁCH

Khi sửa chính sách, chúng tôi cập nhật ngày hiệu lực ở đầu trang. Với thay đổi quan trọng, như thu thập loại dữ liệu mới, dùng dữ liệu cho mục đích mới hay thêm bên nhận dữ liệu mới, chúng tôi báo trong ứng dụng hoặc qua email trước khi áp dụng. Nếu thay đổi cần sự đồng ý của bạn, chúng tôi sẽ hỏi lại. Bạn có thể xin bản cũ của chính sách qua email.
```

```text
16. LIÊN HỆ

Email: wedosupport6886@gmail.com
Bên chịu trách nhiệm về dữ liệu cá nhân: cá nhân Lê Hữu Đại, đại diện nhóm WeDo.
Chính sách quyền riêng tư: https://wedofpt.com.vn/privacy.html
Điều khoản sử dụng: https://wedofpt.com.vn/dieu-khoan.html
Hướng dẫn xoá tài khoản: https://wedofpt.com.vn/xoa-tai-khoan.html
Hỗ trợ: https://wedofpt.com.vn/ho-tro.html

© 2026 WeDo Team
```

> Bốn trang pháp lý đều đã có trên nhánh `ios-web` và đăng cùng lúc (`08`, Bước B), nên các dòng liên kết ở mục 16 đều dùng được.

Phụ lục tiếng Anh, đặt ở cuối trang, sau mục 16. Người duyệt của Apple đọc phần này.

```text
SUMMARY IN ENGLISH
(For App Review and English readers. The Vietnamese text above is the official version.)

- Who we are: WeDo is built and run by the WeDo student team. The individual responsible for personal data is Lê Hữu Đại. Contact: wedosupport6886@gmail.com. We acknowledge requests within 2 working days.
- Scope: the WeDo website, the Android app and the iPhone app.
- Sign-in: the iPhone app signs in with email and password only. Google sign-in exists on the website and the Android app; Google accounts can set a password with "Quên mật khẩu" (Forgot password).
- Data we collect: account data (name, email, hashed password; Google profile data if you signed in with Google; when you accepted the Terms, confirmed you are 18 or older, and allowed AI); optional profile data (phone, date of birth, avatar); content you create (tasks, task submissions, project chat and direct messages, photos and files you choose, meetings, calendar, feedback); friends, blocked users and team membership; reports you file; push token; crash and performance diagnostics (Sentry, not linked to your name or email); activity timestamps; web-only analytics (PostHog); payment records if you paid on the website (payOS). The iPhone app has no payment features.
- Device access: camera only when you take a photo to send in a chat; photos only when you pick one; notifications only if you allow them. No microphone, location, contacts or ad tracking.
- AI: when a project leader asks for an AI task suggestion, WeDo sends the project name, the selected message, up to 12 recent project messages with author IDs and names, and the member list (IDs, names, roles) to one AI provider: Google Gemini API, Azure OpenAI or OpenAI. No email addresses or phone numbers are sent. Meeting transcripts made on the website are summarized the same way. The mobile app asks for permission before the first AI use, and you can withdraw it with the "Cho phép dùng AI" (Allow AI) switch in the Account tab. On the website, a leader's newly sent project message is currently sent to the AI provider automatically, without that prompt.
- Third parties: Microsoft Azure, Supabase, Vercel, Google Sign-In (website and Android), Gmail (support mailbox), Expo push and updates, Apple Push Notification service, Firebase Cloud Messaging, Sentry, Google Gemini API, Azure OpenAI, OpenAI, Daily.co and Deepgram, Brevo, payOS, PostHog. They process data only to provide their service to WeDo and must protect it at least as well as this policy; section 8.4 explains how Gemini's terms differ between its paid and unpaid tiers.
- We do not sell your data, show ads, or track you across other companies' apps and websites.
- Safety: objectionable words in messages and display names are replaced with *** by an automatic filter. You can report messages and users and block users in the app. Blocked users cannot send you direct messages or friend requests and cannot find you in search. Their messages, including those in shared project chats, are hidden from you in the app. We review reports within 24 hours, remove violating content and suspend the accounts that posted it. Suspended accounts cannot sign in.
- Other users: people in your workspaces and projects see your name, email, avatar and the content you share there. Any signed-in WeDo user (except users with a block between you) can find you by typing at least 3 characters of your name, or your full email or phone number; people who are not your friends only see your name and avatar in results. Friends, people you send a friend request to, and direct-message partners also see your email and, if you added one, your phone number.
- Account deletion: in the app, Tài khoản (Account) > Xoá tài khoản (Delete account); it takes effect immediately. Photos, attachments and task files you uploaded are then deleted from storage. You can also email us. Section 10 lists what is deleted and what remains.
- Your rights under Vietnam's Personal Data Protection Law No. 91/2025/QH15 and Decree 356/2025/ND-CP: to be informed, to consent or withdraw consent, to access, correct and obtain a copy of your data, to request deletion or restriction, to object, and to complain.
- Minimum age: 18.
- Data is stored and processed mostly outside Vietnam, including Hong Kong, the United States and the European Union.
```

> Phụ lục khớp bản HTML trên nhánh `ios-web`. Sửa phần tiếng Việt ở đâu thì sửa phụ lục ở đó. Nếu chọn phương án A hay B ở mục 8.4, sửa câu "section 8.4 explains…" cho đúng gói đã chọn. Khi biết vùng thật của kho tệp và cơ sở dữ liệu, thêm tên nước vào dòng cuối.

---

## Phần 4. Việc kèm theo

Những việc này không nằm trong trang chính sách, nhưng thiếu chúng thì chính sách hoặc hồ sơ Apple sẽ lệch nhau.

| # | Việc | Trạng thái |
|---|---|---|
| 1 | **Trang xoá tài khoản** `FE public/xoa-tai-khoan.html`: phạm vi gồm iPhone, hạn 20 ngày, phần tệp khớp mục 10. | **Đã làm** trên nhánh `ios-web` (commit `2d02fa7`). Còn đăng (`08`, Bước B). |
| 2 | **Đường dẫn chính sách trong app** không được biến mất khi thiếu biến EAS. | **Đã làm** (`M src/lib/legal-links.ts`, commit `899c8eb`, `dd1fa4e`): có địa chỉ dự phòng. Nếu `EXPO_PUBLIC_PRIVACY_URL` có trên EAS, nên đặt `https://wedofpt.com.vn/privacy.html`. |
| 3 | **App Store Connect**: dán `https://wedofpt.com.vn/privacy.html` vào ô Privacy Policy URL, khai App Privacy theo tài liệu 03. | Chủ dự án làm. |
| 4 | **Google Play → An toàn dữ liệu**: sửa cho khớp danh sách ở tài liệu 03 mục 8. | Chủ dự án làm. |
| 5 | **Màn đăng ký** có ô bắt buộc 18+ và đồng ý, kèm hai đường dẫn. | **Đã làm** trên app (commit `899c8eb`). Web đăng ký chưa có ô: còn lại. |
| 6 | **Sentry**: bật "Prevent Storing of IP Addresses" ở cả hai project; thêm `beforeBreadcrumb` bỏ phần truy vấn khỏi địa chỉ yêu cầu. Xong thì dùng phương án B ở mục 3.7. | Chủ dự án làm (công tắc). `beforeBreadcrumb`: còn lại (`08` IOS-24). |
| 7 | **Gemini**: bật thanh toán cho project Google Cloud chứa `GEMINI_API_KEY`, rồi dùng phương án A ở mục 8.4. | Chủ dự án làm. |
| 8 | **Web**: dừng việc tự gửi tin của trưởng nhóm cho AI, hoặc đặt nó sau bước xin đồng ý (`FE_WEDO\src\views\ChatView.tsx:920-923`). Làm xong thì bỏ đoạn "Trên web…" ở mục 8.3 và phụ lục. | Còn lại. |
| 9 | **Máy chủ**: xoá tệp trên Azure Blob khi xoá tài khoản; bỏ email khỏi dữ liệu gửi AI; không trả email, số điện thoại cho người lạ khi tìm bạn. | **Đã làm** trên nhánh `ios-backend` (commit `3386c52`, `6384ab9`, `f76f0ec`, `db0322e`). Còn đăng (`08`, Bước A). |
| 10 | **Máy chủ, làm sau**: phòng họp Daily riêng tư (bỏ câu "ai có đường dẫn phòng họp cũng vào được"); xoá bản chép lời ở Daily; gọi API xoá người dùng của PostHog khi xoá tài khoản; giữ đơn đã thanh toán tách khỏi tài khoản (mục 10, phương án B); chỉ phát trạng thái đang hoạt động cho người quen; tự xoá báo cáo vi phạm sau `[THỜI HẠN GIỮ BÁO CÁO]`. | Còn lại. |
| 11 | **Bản tiếng Anh đầy đủ** (không bắt buộc): dịch toàn văn thành `privacy-en.html` và dẫn chéo hai trang. | Còn lại. |
| 12 | **Mức tuổi trong App Store Connect**: Override to Higher Age Rating → 18+ (tài liệu 02, mục 14). | Chủ dự án làm. |
| 13 | **Hồ sơ chuyển dữ liệu ra nước ngoài**: hỏi người có chuyên môn pháp lý theo ghi chú dưới mục 14. | Chủ dự án làm. |
| 14 | **Điền giá trị thật** thay cho câu trung tính (phần 2.1). | Chủ dự án làm. |

---

## Phần 5. Bản sau (1.1): thêm khi có Đăng nhập bằng Apple

Bản này không có Đăng nhập bằng Apple. Khi làm tính năng đó (tài liệu 08, SAU-01 … SAU-04), sửa chính sách như dưới đây **trước** khi nộp bản có nút Apple.

Mục 3.1, thay gạch đầu dòng "Ứng dụng trên iPhone chỉ đăng nhập bằng email và mật khẩu…" bằng:

```text
- Nếu bạn đăng nhập bằng Apple (trên iPhone): Apple gửi cho chúng tôi một mã định danh chỉ dùng cho WeDo, email của bạn, và họ tên ở lần đăng nhập đầu tiên. Nếu bạn chọn "Ẩn địa chỉ email", chúng tôi chỉ nhận một địa chỉ chuyển tiếp của Apple (dạng ...@privaterelay.appleid.com); thư gửi tới địa chỉ đó được Apple chuyển về email thật của bạn. Chúng tôi lưu thêm mã do Apple cấp để có thể thu hồi quyền đăng nhập khi bạn xoá tài khoản.
```

Mục 7, thêm sau dòng Google:

```text
- Apple (Đăng nhập bằng Apple). Việc: xác minh tài khoản Apple trên iPhone, chuyển tiếp email nếu bạn chọn ẩn email. Dữ liệu: mã định danh, email hoặc địa chỉ chuyển tiếp, họ tên ở lần đầu.
```

Mục 10, thêm vào cuối "Cách 2" và cuối "Bản sao ở nơi khác":

```text
Nếu bạn đăng nhập bằng Apple với email ẩn, hãy xoá trong ứng dụng (cách 1), vì chúng tôi không đối chiếu được địa chỉ email thật của bạn.
```

```text
- Nếu bạn đăng nhập bằng Apple: khi bạn xoá tài khoản, chúng tôi thu hồi quyền đăng nhập WeDo đã được cấp qua Apple. Bạn cũng tự gỡ được trong Cài đặt của iPhone, phần Tài khoản Apple, mục Đăng nhập bằng Apple.
```

Điều kiện: câu "thư gửi tới địa chỉ đó được Apple chuyển về email thật" chỉ đúng khi địa chỉ gửi thư của WeDo đã đăng ký với dịch vụ chuyển tiếp email của Apple (hôm nay thư đi từ một hộp thư `@gmail.com` qua Brevo, `BE_WEDO\.env.example:53-60`). Câu thu hồi quyền chỉ đúng khi máy chủ gọi `https://appleid.apple.com/auth/revoke` lúc xoá tài khoản. Sửa cả mục 14 (thêm Apple vào "đăng nhập") và phụ lục tiếng Anh (thêm "Sign in with Apple" vào danh sách bên thứ ba).
