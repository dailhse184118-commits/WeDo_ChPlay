# Bàn giao: kết bạn, avatar, gửi ảnh và thông báo đẩy (1.0.11 → 1.0.12)

Ngày 18/09/2026.

## Đã làm

### Kết bạn (mobile)

- `src/lib/api/friends.ts` — bốn lượt gọi: danh sách, tìm người, gửi lời mời,
  duyệt/từ chối. Từ khoá dưới 2 ký tự trả mảng rỗng mà không gọi máy chủ.
- `src/lib/friends/quan-he.ts` — `trangThaiKetBan` quyết định hiện nút gì.
  `REJECTED` cố ý coi như chưa có gì: máy chủ dùng `upsert` nên gửi lại được.
- `src/lib/friends/danh-sach.ts` — đổi `GET /friends` thành ba nhóm dòng.
  Dòng nào không xác định được người kia thì bỏ, không làm sập cả màn.
- `src/components/friends/FriendRow.tsx` — một component cho cả bốn trạng thái.
- `src/app/(tabs)/chat/friends.tsx` — màn Bạn bè.
- `src/lib/use-debounced-value.ts` — ô tìm kiếm chờ người dùng ngừng gõ 300ms.

Lối vào: nút hình người trên header màn Trò chuyện, kèm chấm đỏ khi có lời mời
đang chờ duyệt. Không có chấm thì lời mời nằm im và không ai vào xem.

### Sửa lỗi realtime tin nhắn riêng (backend)

`BE_WEDO` commit `c0f7c69`, đã đẩy lên nhánh `backend`.

Socket chỉ được cho vào phòng `direct:<id>` đúng một lần, lúc kết nối. Hội
thoại sinh ra sau đó thì **cả hai bên đều đứng ngoài phòng**, nên tin nhắn đầu
tiên của mọi cuộc trò chuyện mới không tới được ai — người nhận phải kéo làm
mới bằng tay mới thấy. Đúng ngay luồng "kết bạn rồi nhắn tin cho nhau".

Vá bằng cách bắn kèm vào phòng `user:<id>`: phòng này tham gia ngay lúc kết nối
và không bao giờ hết hạn.

### Sửa bẫy trong bộ test

RNTL 14 trên React 19 mở một `act()` bất đồng bộ mỗi lần bắn sự kiện. Hai lần
`fireEvent` không `await` trong cùng một test làm chồng `act()`, và lần render
của test kế tiếp mount ra **cây rỗng** — test đó đậu giả nếu nó chỉ kiểm tra
"không có gì". Đã thêm `await` cho mọi lời gọi `fireEvent` trong repo.

## Còn thiếu, có chủ ý

- **Lời mời kết bạn không có thông báo đẩy.** Người nhận chỉ thấy chấm đỏ khi
  mở tab Trò chuyện. Đủ cho đợt thử nghiệm kín; thêm push là việc của đợt sau.
- **Không có nút huỷ lời mời đã gửi.** Máy chủ chưa có đường xoá.
- **Không có nút xoá bạn.** Cùng lý do.


## Bản 1.0.12 (14) — avatar và gửi ảnh trong chat

### Avatar

- `src/components/ui/Avatar.tsx` — ảnh tròn, tự lùi về vòng tròn chữ cái đầu.
  Phần lớn tài khoản WeDo đăng ký bằng email nên KHÔNG có ảnh; đường lùi này là
  trạng thái thường gặp, không phải ngoại lệ.
- `src/lib/chat/nhom-tin.ts` — `idsHienAvatar` (tin CUỐI chuỗi) và `idsHienTen`
  (tin ĐẦU chuỗi). Gắn avatar cho mọi tin thì bốn tin liên tiếp thành bốn khuôn
  mặt xếp dọc. Bỏ hẳn avatar giữa chuỗi mà không chừa chỗ thì các bong bóng
  lệch nhau theo bậc thang — nên vẫn dựng một ô trống đúng bề rộng.
- Áp cho cả chat dự án và tin nhắn riêng.

### Gửi ảnh

- `src/lib/images/pick-images.ts` — `chupAnh` (xin quyền máy ảnh trước) và
  `chonAnh` (KHÔNG xin quyền kho ảnh).
- `src/lib/api/chat-files.ts` — gói `FormData` dùng chung; `sendProjectFiles`
  và `sendDirectFiles` chỉ khác đường dẫn.
- Ô soạn có hai nút máy ảnh/thư viện, dải ảnh xem trước kèm dấu X. Chú thích đi
  CÙNG tin ảnh chứ không tách thành tin riêng.
- Máy chủ đã có sẵn `POST /projects/:id/chat/files` và
  `POST /chat/direct/conversations/:id/files` — không phải deploy gì thêm.

### Xem ảnh

- `src/lib/chat/use-header-tep.ts` — đường `/chat/attachments/:id` nằm sau
  `JwtAuthGuard`, nên `<Image>` trỏ thẳng vào đó sẽ nhận 401 và hiện ô trống.
  Hook này lấy token để gắn vào `source.headers` của `expo-image`.
- `src/components/chat/ImageViewer.tsx` — chạm ảnh mở toàn màn hình, nút back
  cứng của Android cũng đóng được.

### Quyền Android

`expo-image-picker` chỉ thêm `CAMERA`. Hai quyền storage nó khai đều chặn ở
`maxSdkVersion=32` nên trơ trên Android 13+. Đã tắt `RECORD_AUDIO` bằng
`microphonePermission: false`.

KHÔNG có `READ_MEDIA_IMAGES`, nên **không phải khai báo "Photo and Video
Permissions"** với Google Play.


## Bản 1.0.12 (15) — máy ảnh tuỳ chọn và thông báo đẩy

### Vá lỗi mất 417 thiết bị

Bản 14 **không được phát hành**. Play cảnh báo mất 417 thiết bị: Ô tô 100%,
Chromebook 86%, máy tính bảng 4%, và 67 điện thoại.

Nguyên nhân: khai quyền `CAMERA` là Google Play **tự suy ra** app bắt buộc phải
có máy ảnh, kể cả `android.hardware.camera.autofocus`. Hành vi có ghi trong tài
liệu Android.

Vá bằng `plugins/with-may-anh-tuy-chon.js`, khai ba `uses-feature` với
`required="false"`. Đã kiểm bằng `expo prebuild`.

> Lúc tải bản mới lên Play, soi bảng "Những thay đổi đối với thiết bị được hỗ
> trợ": cột "Số thiết bị không còn được hỗ trợ" **phải là 0 ở mọi dòng**.

### Thông báo đẩy cho tin nhắn và kết bạn

Hạ tầng push đã chạy đủ từ trước — app xin quyền và đăng ký token lúc đăng
nhập, backend có `ExpoPushService`. Nhưng `NotificationType` chỉ có công việc,
cuộc họp, thanh toán. Nhắn tin riêng, chat dự án và kết bạn đều **không chạm
được tới người dùng khi app đang đóng**.

`src/chat/chat-push.service.ts` (BE_WEDO) nối vào chỗ trống đó.

**CỐ Ý không tạo bản ghi `Notification`.** Tin nhắn đọc trong khung chat, lời
mời đọc ở màn Bạn bè; đổ vào trung tâm thông báo chỉ làm danh sách ngập rồi
người dùng bỏ qua luôn cả nhắc hạn công việc.

Hệ quả phụ đáng giá: **không cần migration**. Quy trình deploy hiện tại KHÔNG
chạy `prisma migrate deploy` — `start:azure` chỉ có `prisma generate`. Một thay
đổi schema sẽ lên production trước khi cột tồn tại.

**Chat dự án chặn ở một thông báo mỗi người mỗi dự án trong 10 phút.** Nhóm bàn
bạc nửa tiếng mà đẩy hết là bốn chục lần rung máy — người ta gỡ app.

**Không đẩy khi từ chối lời mời kết bạn.** Báo cho người bị từ chối là làm họ
ngại và tổn thương vô ích.

Phía app: `duongDanTuThongBao` đưa cú chạm tới thẳng đúng hội thoại / phòng chat
/ màn Bạn bè. Và `man-dang-mo.ts` chặn banner cho tin nhắn của chính khung chat
đang mở — đang đọc mà banner nhảy đè lên thứ vừa hiện là trông cẩu thả.

### Món nợ để lại, có chủ ý

- **Chưa có công tắc tắt riêng thông báo chat.** Cần thêm cột `notifyChat`, tức
  cần migration. Hiện người dùng tắt được toàn bộ thông báo WeDo trong Cài đặt
  Android.
- **Chưa ai xác nhận push của WeDo từng tới máy thật.** Hạ tầng đúng và đủ,
  nhưng nếu FCM cấu hình sai thì mọi thứ nằm im. Đây là thứ phải thử ĐẦU TIÊN.

### Nghiệm thu thông báo đẩy

1. **Tắt hẳn app** (vuốt khỏi danh sách gần đây). Nhờ người khác nhắn tin riêng
   → máy phải rung và hiện tên người gửi kèm nội dung.
2. Chạm vào thông báo đó → mở **thẳng** đúng cuộc trò chuyện, không phải màn
   hình chính.
3. Đang mở đúng cuộc trò chuyện đó, người kia nhắn tiếp → tin hiện trong khung
   chat, **không** có banner nhảy ra.
4. Đang ở màn khác trong app, người kia nhắn → **có** banner.
5. Nhờ người khác gửi lời mời kết bạn → máy rung, chạm vào mở màn Bạn bè.
6. Trong chat dự án, nhắn 5 tin liên tiếp → người kia chỉ nhận **một** thông báo.

## Việc phải làm theo đúng thứ tự

1. ~~Đăng `1.0.11 (13)`~~ — đã xuất bản 18/09 lúc 19:12.
2. Đăng `1.0.12 (15)`. **Bỏ hẳn bản 14**, nó mất 417 thiết bị.
3. **Sau khi Play đã phát hành xong bản cuối**, mới đổi biến môi trường trên
   Azure:
   - `MOBILE_LATEST_VERSION` → `1.0.12`
   - `MOBILE_UPDATE_NOTES` → `Thêm kết bạn, avatar trong chat và gửi ảnh.`

   Đổi trước khi Play phát hành thì người dùng bản cũ thấy banner "có bản mới"
   rồi bấm sang CH Play mà chẳng thấy bản nào.

## Nghiệm thu trên máy thật (phần phải tự tay làm)

Máy ảnh và thư viện ảnh không có cách nào kiểm bằng test tự động. Sau khi cài
bản 14, làm đúng các bước sau trên hai máy khác nhau:

1. Mở một cuộc trò chuyện, bấm nút máy ảnh → Android hỏi quyền → bấm **Cho
   phép** → chụp → ảnh thu nhỏ hiện trên ô soạn → bấm **Gửi**.
2. Bấm lại nút máy ảnh, chụp, rồi bấm dấu **X** → ảnh biến mất, không gửi.
3. Bấm nút thư viện, chọn **hai** ảnh cùng lúc → gửi → cả hai nằm trong một
   bong bóng.
4. Gõ chữ rồi mới chọn ảnh → gửi → chữ và ảnh nằm CÙNG một bong bóng.
5. Chạm vào ảnh trong bong bóng → mở toàn màn hình → bấm nút back cứng của máy
   → chỉ đóng ảnh, KHÔNG thoát màn chat.
6. Máy còn lại phải thấy ảnh hiện ra ngay, không cần kéo làm mới.
7. Từ chối quyền máy ảnh một lần → bấm nút máy ảnh → phải thấy băng đỏ chỉ
   đường vào Cài đặt, không phải nút bấm im lặng.

---

# Ngày 19/09/2026 — nâng cấp hạ tầng

## Đã xác nhận trên máy thật

Chủ dự án thử bằng máy thật, hai thứ treo lâu nhất đều **xong**:

- **Thông báo đẩy tới được máy thật** — điện thoại rung. Chuỗi Firebase → Expo
  → backend → điện thoại thông suốt. Đây là ẩn số lớn nhất của cả đợt.
- **Bàn phím hết che ô soạn** — lần vá thứ tư đã ăn.

> Bài học đáng giữ: khi một lỗi đã vá ba lần không ăn, **đừng vá lần bốn theo
> kiểu đoán**. Hỏi chủ dự án một câu *phân biệt* được hai giả thuyết. Câu "chat
> dự án có bị không" chỉ thẳng ra chỗ sai trong một phút, sau nhiều giờ đọc mã
> không ra.

## Sentry — giám sát lỗi

Tổ chức `wedofpt`, hai project `wedo-backend` và `wedo-mobile`.

| Nơi | Biến |
|---|---|
| Azure | `SENTRY_DSN` |
| EAS (production) | `EXPO_PUBLIC_SENTRY_DSN` |

**Đã TẮT Logging của Sentry**, dù nó miễn phí 5GB. Log máy chủ có chứa email
người dùng (`[MailService] Đã gửi mã đặt lại mật khẩu tới ...`); bật lên là đẩy
dữ liệu cá nhân sang bên thứ ba, đi ngược hẳn `sendDefaultPii: false`. Muốn bật
sau này thì phải dọn email khỏi log trước.

**Chưa gắn plugin tải source map** — cần `SENTRY_AUTH_TOKEN`. Vết lỗi phía app
sẽ bị rút gọn cho tới khi gắn.

## CI chạy migration trước khi deploy

Cần **đủ bốn** GitHub Secret ở repo `FE_WEDO`, thiếu một cái là bỏ qua cả bước:

- `PRODUCTION_MIGRATION_URL` — dùng `DIRECT_URL` của Supabase, **cổng 5432**,
  không phải pooler 6543
- `PRODUCTION_DATABASE_HOST`, `PRODUCTION_DATABASE_USER`,
  `PRODUCTION_DATABASE_NAME` — chốt chặn để không chạy nhầm lên staging

Đặt **trước** bước deploy chứ không lúc app khởi động: migration hỏng thì deploy
dừng và production vẫn chạy bản cũ đang tốt.

## Cập nhật OTA

`expo-updates`, chính sách runtime version **`fingerprint`** (không phải
`appVersion` như `eas update:configure` tự chọn — với `appVersion`, một bản OTA
có thể rơi xuống máy thiếu mô-đun native và làm app sập ngay khi mở).

Từ bản 17 trở đi, lỗi JavaScript thuần đi đường OTA, không tốn lượt build và
không chờ Google duyệt. Đẩy bằng:

```
npx eas-cli update --channel production --environment production --message "mo ta"
```

### BẪY: vân tay lệch làm build ERRORED

Build 17 lần đầu hỏng với *"Runtime version mismatch"*. Nguyên nhân: máy còn
**rác biên dịch Gradle trong `node_modules`** (15 gói có `android/build`) từ
những lần build cục bộ trước. Máy EAS cài sạch từ lockfile nên băm ra vân tay
khác.

Sửa: `rm -rf android && npm ci`

**Trước khi build, KIỂM TRA vân tay thay vì đoán:**

```
npx expo-updates fingerprint:generate --platform android
```

So với vân tay EAS báo trong log lỗi — phải khớp từng ký tự.
