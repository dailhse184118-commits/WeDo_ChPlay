# Đồng bộ lịch WeDo sang Google Calendar, Lịch Apple, Outlook

Ngày: 03/10/2026. Chủ dự án đã duyệt các quyết định ở mục 1 và ba phần thiết kế trong phiên làm việc.

Đây là phần đầu của hướng 3 ("Export lịch/task"). Phần sau, AI Daily Planner, sẽ có thiết kế riêng khi phần này xong.

## 1. Mục tiêu và quyết định đã chốt

**Mục tiêu.** Sinh viên vẫn sống trong Google Calendar hoặc Lịch iPhone. Họ dán một link riêng một lần, rồi hạn chót, cuộc họp và sự kiện WeDo tự hiện và tự cập nhật trong lịch quen thuộc của họ.

**Quyết định của chủ dự án:**
1. **Hình thức:** một **link đăng ký lịch tự đồng bộ** (chuẩn iCalendar, `.ics`). Không làm tệp `.ics` tải một lần, không làm xuất Excel danh sách việc.
2. **Ai dùng:** đúng bảng giá, chỉ **gói Pro và Team** (`exportTasksAndCalendar` đã khai trong `src/payments/subscription-entitlements.ts`). Gói Miễn phí thấy mục bị khoá kèm lời mời nâng cấp trên web và Android; **iPhone ẩn hẳn**, vì app iPhone luôn tính là gói Miễn phí (Apple 3.1.1).
3. **Phạm vi:** **một link cho cả người**, gộp mọi workspace người đó được dùng tính năng.
4. **Nền tảng:** **web** (màn Lịch) và **app Android** (Tài khoản). Android chỉ dùng thứ sẵn có, phát qua OTA.
5. **Cách làm link:** **mã bí mật lưu ở máy chủ**, thu hồi được ngay. Mã lưu **nguyên văn** (không băm) để mở hộp thoại lúc nào cũng hiện lại được link. Ai đọc được cơ sở dữ liệu thì đã đọc được chính lịch và việc, nên băm không thêm an toàn đáng kể.
6. **Link đẹp:** `https://wedofpt.com.vn/lich/<mã>.ics`, Vercel chuyển tiếp tới máy chủ API.

**Ngoài phạm vi:**
- đồng bộ hai chiều (sửa trong Google không về WeDo);
- mỗi workspace một link, lịch dự án dùng chung;
- báo thức trong lịch (WeDo đã tự nhắc hạn, thêm vào sẽ nhắc hai lần);
- đưa link phòng họp (`roomUrl`) vào lịch;
- tệp `.ics` tải một lần, xuất Excel danh sách việc;
- đường dẫn web mở thẳng một việc hay một cuộc họp (link trong lịch mở tới đúng màn);
- app iPhone.

## 2. Nội dung lịch

### 2.1 Gồm những gì
Đúng ba loại như màn Lịch hiện tại (`EventsService.findCalendarItems`, `src/events/events.service.ts`), cùng luật:
- **Hạn chót việc**: việc giao cho người đó, `assignmentStatus = ACCEPTED`, `status ≠ DONE`, có `dueDate`. Việc chưa nhận thì không hiện.
- **Cuộc họp**: `status ≠ CANCELLED`; người đó là thành viên **hiện tại** của dự án, hoặc là chủ workspace đã tạo cuộc họp.
- **Sự kiện cá nhân**: `Event` do người đó tạo.

**Khoảng thời gian:** từ 30 ngày trước tới 180 ngày sau thời điểm lấy. **Trần 2.000 mục**, lấy các mục sớm nhất theo giờ bắt đầu.

### 2.2 Workspace nào được tính
Tính lại **mỗi lần lịch được lấy**, đọc thẳng bảng `Subscription`, chỉ đọc, không sửa dữ liệu:
- Người đó có **PERSONAL_PRO** đang hiệu lực (`status = ACTIVE` và `currentPeriodEnd > bây giờ`): mọi workspace người đó là thành viên.
- Nếu không: các workspace người đó là thành viên **và** có gói **TEAM_GROWTH** đang hiệu lực.
- Không có workspace nào: lịch hợp lệ chỉ gồm **một mục thông báo** vào hôm nay (cả ngày): "Đồng bộ lịch WeDo đã tạm dừng vì gói đã hết hạn. Gia hạn tại wedofpt.com.vn để lịch tự có lại." Như vậy dữ liệu cũ không nằm lại lỗi thời trong lịch của người dùng.

**Không dùng `EntitlementsService.resolve()`**: Lịch iPhone lấy dữ liệu với User-Agent CFNetwork, nên `laYeuCauTuIPhone()` sẽ trả gói Miễn phí và chặn nhầm người có Pro. Hàm tính phạm vi mới không đọc ngữ cảnh nền tảng.

### 2.3 Mỗi mục trong tệp `.ics`
| Loại | Tên (vi / en) | Giờ |
|---|---|---|
| Hạn chót | `Hạn: <tên việc> · <tên dự án>` / `Due: …` | khối 30 phút **kết thúc đúng giờ hạn** |
| Cuộc họp | `Họp: <tên cuộc họp> · <tên dự án>` / `Meeting: …` | `startTime` tới `endTime`; không có `endTime` thì 60 phút |
| Sự kiện | `<tên sự kiện>` | `startTime` tới `endTime` |

- **Mô tả:** mô tả việc, chương trình họp hoặc ghi chú sự kiện (cắt ở 1.000 ký tự), tên dự án, và một dòng link về WeDo.
- **Link về WeDo** (thuộc tính `URL` và dòng cuối mô tả) mở đúng **màn**: việc tới `https://wedofpt.com.vn/#/taskboard`, họp tới `#/meeting`, sự kiện tới `#/calendar`. Web hiện chưa có đường dẫn mở thẳng một việc hay một cuộc họp (`src/App.tsx` chỉ đọc tên màn), nên không mở thẳng mục; làm đường dẫn theo mục là ngoài phạm vi.
- **Mã mục cố định**: `task-<id>@wedofpt.com.vn`, `meeting-<id>@…`, `event-<id>@…`, để lịch cập nhật đúng mục cũ chứ không nhân đôi.
- **`DTSTAMP` và `LAST-MODIFIED`** lấy từ `updatedAt` của bản ghi, không lấy giờ hiện tại, để cùng dữ liệu thì tệp giống hệt từng byte (cần cho ETag).
- Giờ ghi theo **UTC** (`YYYYMMDDTHHMMSSZ`). Không có `VALARM`.

**Phần đầu lịch:**
- `PRODID:-//WeDo//Dong bo lich//VI`, `VERSION:2.0`, `CALSCALE:GREGORIAN`, `METHOD:PUBLISH`;
- `X-WR-CALNAME:WeDo · <họ tên>`, `X-WR-TIMEZONE:Asia/Ho_Chi_Minh`;
- `REFRESH-INTERVAL;VALUE=DURATION:PT1H` và `X-PUBLISHED-TTL:PT1H` (Apple/Outlook theo; Google tự quyết, thường vài giờ).

**Viết tệp theo RFC 5545, không thêm thư viện:**
- xuống dòng CRLF;
- thoát `\`, `;`, `,` và xuống dòng;
- gập dòng ở 75 **byte** UTF-8 mà không cắt đôi một ký tự có dấu (dòng tiếp theo bắt đầu bằng một dấu cách);
- chuẩn hoá chữ về NFC trước khi viết.

**Ngôn ngữ của lịch** lưu theo ngôn ngữ giao diện lúc tạo link (`vi` hoặc `en`).

## 3. Máy chủ

### 3.1 Dữ liệu
Bảng mới, migration **chỉ thêm** (qua cổng "Block destructive database changes" bình thường):

```prisma
model CalendarFeed {
  id            String    @id @default(uuid())
  userId        String    @unique
  token         String    @unique
  language      String    @default("vi")
  createdAt     DateTime  @default(now())
  lastFetchedAt DateTime?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("calendar_feeds")
}
```
Thêm quan hệ ngược `calendarFeed CalendarFeed?` vào `User`. **Mã**: 32 byte ngẫu nhiên (`crypto.randomBytes`), base64url, 43 ký tự. **Tạo link mới** thì ghi đè `token`, nên link cũ chết ngay. **Tắt đồng bộ** thì xoá dòng.

### 3.2 Đường dẫn
Module mới `src/lich-dong-bo/`, theo cách tổ chức của `src/bao-cao-dong-gop/`.

**Cần đăng nhập:**
- `GET /calendar-feed` trả `{ duocDung, coLink, url?, taoLuc?, layLanCuoi? }`. `duocDung` tính theo mục 2.2, để web và app biết hiện nút hay lời mời nâng cấp mà không phải tự đoán gói.
- `POST /calendar-feed`, thân `{ lang: 'vi' | 'en' }`: chưa có thì tạo, đã có thì đổi mã. Không được dùng thì trả **403** với mã `CALENDAR_FEED_NOT_IN_PLAN`. Trả cùng hình như `GET`.
- `DELETE /calendar-feed`: trả 204, gọi lại cũng không lỗi.

**Công khai (lịch của người dùng gọi):**
- `GET /calendar-feed/:tep`, với `:tep` khớp `^[A-Za-z0-9_-]{43}\.ics$`.
  - Mã sai, đã thu hồi, hoặc chủ tài khoản bị khoá (`suspendedAt`): trả **404** dạng chữ ngắn.
  - Thành công trả 200 với các header:
    - `Content-Type: text/calendar; charset=utf-8`
    - `Content-Disposition: inline; filename="wedo.ics"`
    - `Cache-Control: private, max-age=900`
    - `ETag` (SHA-256 của nội dung)
    - `X-Robots-Tag: noindex`
  - Có `If-None-Match` trùng ETag thì trả **304**.
  - `lastFetchedAt` chỉ cập nhật khi lần ghi trước đã cách quá 10 phút.

**URL trả về cho người dùng** là `CALENDAR_FEED_BASE_URL + '/' + token + '.ics'`. `CALENDAR_FEED_BASE_URL` là biến môi trường **không bắt buộc**, mặc định `https://wedofpt.com.vn/lich`, nên production không cần khai thêm gì.

### 3.3 Dùng lại phần truy vấn lịch
Tách phần truy vấn trong `findCalendarItems` thành một hàm nhận **danh sách workspace** và khoảng thời gian, trả mảng mục như hiện nay. Màn Lịch vẫn gọi với một workspace, kết quả không đổi, có test giữ nguyên hành vi. Đường lấy lịch gọi với danh sách ở mục 2.2.

### 3.4 Giới hạn tần suất
Thêm luật vào `src/common/request-rate-limit.guard.ts`:
- `POST`/`DELETE /calendar-feed`: 10 lần/phút/người.
- `GET /calendar-feed/:tep`: **30 lần/phút cho mỗi mã**, cộng một trần rộng 600 lần/phút/IP. Google lấy lịch của mọi người từ chung một nhóm IP, nên đếm thuần theo IP sẽ chặn nhầm khi người dùng đông.

### 3.5 Chuyển tiếp trên Vercel
`vercel.json` của web thêm:
```json
{ "source": "/lich/:tep", "destination": "https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/calendar-feed/:tep" }
```
Bản staging dùng chung tệp này nên link staging cũng trỏ về API production; mã của staging không có trong production nên trả 404. Chấp nhận được.

## 4. Web

- **Màn Lịch** (`src/views/CalendarView.tsx`): nút **"Đồng bộ với lịch của bạn"** cạnh "Tạo sự kiện", mở hộp thoại `DongBoLichDialog`.
- **Các trạng thái của hộp thoại:**
  - **Đang tải.**
  - **Gói Miễn phí** (`duocDung = false`): một câu giới thiệu và nút **Nâng cấp gói** tới `#/pricing`.
  - **Được dùng, chưa có link:** một câu giới thiệu và nút **Tạo link đồng bộ**.
  - **Có link:**
    - **Thêm vào Google Calendar**: `https://calendar.google.com/calendar/render?cid=` cộng URL đã mã hoá.
    - **Mở bằng Lịch Apple / Outlook**: cùng URL nhưng đổi `https:` thành `webcal:`.
    - **Sao chép link.**
    - Hướng dẫn ngắn cho từng loại lịch.
    - Cảnh báo "Ai có link này đều xem được lịch của bạn".
    - Dòng "Lần cuối lịch của bạn lấy dữ liệu: …".
    - **Tạo link mới** (hỏi xác nhận) và **Tắt đồng bộ** (hỏi xác nhận).
- **Lỗi:** mất mạng, 403 `CALENDAR_FEED_NOT_IN_PLAN`, 429. Câu báo hai thứ tiếng, dịch theo mã lỗi ở `src/i18n/loi.ts`.
- **Mã:** hàm thuần `src/lib/dong-bo-lich.ts` (dựng link Google và `webcal:`), từ điển `src/i18n/tu-dien/dong-bo-lich.ts` (vi/en), và các hàm API trong `src/lib/api.ts`.

## 5. App Android

- **Chỗ đặt:** mục **"Đồng bộ lịch"** trong Tài khoản, cạnh "Bảng đóng góp". Màn mới đặt cùng chỗ với các màn tài khoản hiện có. Khai đường dẫn Expo Router xong phải sinh lại kiểu đường dẫn bằng dev server.
- **iPhone:** `Platform.OS === 'ios'` thì **không hiện** mục này và không mở được màn.
- **Trạng thái** như web, khác ở chỗ chia sẻ link:
  - **Chia sẻ link** dùng `Share.share` sẵn có của React Native. Không thêm thư viện, nên dấu vân tay OTA giữ `82cd990037afe065754c48a9a004f293c0d84be9`.
  - Hướng dẫn: Google Calendar trên điện thoại không thêm được lịch bằng link, nên mở calendar.google.com trên máy tính, chọn "Thêm lịch → Từ URL" rồi dán link.
- **Gói Miễn phí:** chỉ hiện câu "Tính năng của gói Pro và Team, nâng cấp trên web wedofpt.com.vn". Không có nút mua trong app, giữ đúng quy ước liên kết hiện có ở `src/lib/web-link.ts`.

## 6. Sửa lời hứa cùng đợt

- **Bảng giá web** (`src/i18n/tu-dien/bang-gia.ts`, vi và en): mục "Export lịch/task" **bỏ** `sapRaMat` và đổi tên thành **"Đồng bộ lịch (Google, Apple, Outlook)"** / **"Calendar sync (Google, Apple, Outlook)"**.
- **Chính sách thanh toán** (`public/chinh-sach-thanh-toan.html`): gỡ "Export lịch/task" khỏi đoạn "chưa có, không nằm trong quyền lợi"; AI Daily Planner và Meeting Vote **giữ nguyên**.
- **Test:** sửa `src/trang-cong-khai.test.ts` (đoạn liệt kê tính năng chưa có) và test bảng giá cho khớp.

## 7. Xử lý tình huống

| Tình huống | Cách xử lý |
|---|---|
| Rời dự án, bị xoá khỏi workspace | Mục liên quan tự biến mất ở lần lấy sau (truy vấn theo quyền hiện tại). |
| Hết gói | Lịch còn đúng một mục thông báo tạm dừng (mục 2.2); gia hạn là có lại. |
| Tài khoản bị khoá | 404. |
| Tài khoản bị xoá | Dòng `calendar_feeds` xoá theo (cascade), link 404. |
| Đổi mật khẩu | Link vẫn chạy, giống cách Google làm; muốn chặn thì "Tạo link mới". |
| Lỗi máy chủ khi lấy lịch | 500 dạng chữ ngắn, không lộ chi tiết, báo Sentry; lịch của người dùng giữ bản cũ. |
| Quá 2.000 mục | Giữ 2.000 mục sớm nhất (mục 2.1). |

## 8. Kiểm thử

**Máy chủ** (jest, Prisma giả):
- Bộ viết `.ics`:
  - thoát ký tự;
  - gập dòng theo byte với chữ có dấu (không cắt đôi ký tự, không dòng nào quá 75 byte);
  - CRLF;
  - NFC;
  - giờ UTC;
  - mã mục cố định;
  - cùng dữ liệu thì cùng byte;
  - đọc ngược tệp vừa tạo bằng một bộ đọc tối giản trong test để kiểm cấu trúc hợp lệ.
- Phạm vi gói:
  - có Pro cá nhân;
  - chỉ có Team;
  - Team đã hết hạn theo `currentPeriodEnd` nhưng `status` vẫn ACTIVE;
  - không có gói;
  - yêu cầu mang User-Agent CFNetwork vẫn tính đúng gói.
- Tạo, đổi, tắt link:
  - gói Miễn phí bị 403 đúng mã;
  - đổi mã thì mã cũ 404.
- Đường công khai:
  - đủ header;
  - ETag và 304;
  - mã sai định dạng hoặc đã thu hồi trả 404;
  - tài khoản bị khoá trả 404;
  - `lastFetchedAt` ghi tối đa 10 phút một lần.
- Hàm truy vấn tách ra: màn Lịch một workspace cho kết quả **giống hệt** trước khi tách.
- Luật giới hạn tần suất mới.
- Migration chỉ thêm (cổng `git diff origin/backend -- prisma` chỉ có tệp mới).

**Web** (node:test):
- hàm dựng link Google và `webcal:`;
- từ điển đủ hai thứ tiếng;
- `kiem-dich` sạch;
- dịch mã lỗi mới.

**Android** (jest/RNTL):
- màn theo từng trạng thái;
- iPhone không có mục;
- dấu vân tay OTA không đổi.

**Nghiệm thu tay (chủ dự án):**
- dán link vào Google Calendar trên máy tính và Lịch iPhone, chờ đồng bộ, đối chiếu với màn Lịch WeDo;
- tạo link mới thì lịch cũ ngừng cập nhật.

## 9. Thứ tự đưa lên

1. **Backend**: migration chỉ thêm, deploy Azure. Kiểm `GET /calendar-feed/<mã sai>.ics` trả 404.
2. **Web**: hộp thoại, bảng giá, chính sách, chuyển tiếp `/lich/…` trong `vercel.json`. Kiểm link `wedofpt.com.vn/lich/<mã>.ics` mở được.
3. **App Android**: phát OTA. Đo dấu vân tay ở `D:\WeDo_ChPlay` trước, và kiểm dòng Commit trong kết quả `eas update` đúng commit merge.
