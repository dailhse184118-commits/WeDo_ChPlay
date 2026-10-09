# Thiết kế: App mobile WeDo song ngữ vi/en

Ngày: 09/10/2026. Trạng thái: chủ dự án đã duyệt.

## Mục tiêu

Người dùng không đọc tiếng Việt (kể cả người duyệt Apple) dùng trọn vẹn WeDo bằng tiếng Anh: giao diện app, câu báo lỗi và thông báo đẩy. Người dùng Việt Nam không phải làm gì, app vẫn tiếng Việt.

## Quyết định đã chốt

- Ngôn ngữ mặc định theo máy: mã ngôn ngữ máy bắt đầu bằng `vi` thì tiếng Việt, mọi ngôn ngữ khác tiếng Anh.
- Có lựa chọn trong tab Tài khoản: Theo máy (mặc định) / Tiếng Việt / English.
- Phạm vi: giao diện app + câu lỗi + thông báo đẩy. Email và web không đổi đợt này. Ngôn ngữ trên web vẫn lưu riêng như hiện nay.
- Cách làm: từ điển riêng theo kiểu web (cách 1), không dùng i18next.
- Làm sau khi gộp nhánh `ios` vào `main` (nhánh `hop-ios-vao-main`), trên nhánh mới tách từ đó.

## Phần 1. Hệ thống dịch trong app

- `src/i18n/dich.ts`, `dinh-dang.ts`, `loi.ts`: chép lõi từ web `FE_WEDO/src/i18n` (khai báo từ điển có kiểm kiểu, `soNhieu`, định dạng ngày/giờ/số/tiền theo ngôn ngữ, dịch lỗi theo mã), bỏ phần phụ thuộc trình duyệt (`document`, `localStorage`, sự kiện `storage`).
- `src/i18n/ngon-ngu.ts`: lựa chọn `'he-thong' | 'vi' | 'en'`, mặc định `'he-thong'`, lưu `AsyncStorage`. Khi `'he-thong'`, đọc `expo-localization` (`getLocales()[0].languageCode`); `vi` thì `vi`, còn lại `en`. Đọc lại khi app trở về foreground (người dùng đổi ngôn ngữ máy).
- `NgonNguProvider` bọc ngoài cùng (`src/app/_layout.tsx`); hook `useDich(tuDien)` trả object chữ theo ngôn ngữ; đổi ngôn ngữ vẽ lại ngay, không khởi động lại.
- Ngoài React (hàm thuần, ví dụ `src/lib/calendar/nhom-theo-ngay.ts`, `loiNhanMua`): nhận ngôn ngữ làm tham số hoặc đọc `layNgonNgu()`.
- Từ điển theo khu vực `src/i18n/tu-dien/`: `chung`, `dang-nhap`, `tai-khoan`, `nang-cap`, `chat`, `cong-viec`, `cuoc-hop`, `lich`, `thong-bao`, `kiem-duyet`, `dong-gop` (+ khu vực phát sinh khi gộp: `bao-cao`, `dong-bo-lich`). Mỗi mục khai báo đủ `vi` và `en`; thiếu là lỗi TypeScript.
- Tab Tài khoản: hàng "Ngôn ngữ / Language" (nhãn luôn song ngữ để ai cũng tìm được), mở bảng chọn ba lựa chọn.
- `app.json`: `locales` thêm `en` (`./locales/en.json` cho chuỗi quyền hệ điều hành), `CFBundleLocalizations: ["vi","en"]`, `CFBundleDevelopmentRegion` giữ `vi`. Đổi vân tay → phải build mới, không OTA.

## Phần 2. Máy chủ (BE_WEDO, nhánh `backend`)

- Prisma: `User.language String @default("vi")` (chỉ thêm cột; giá trị hợp lệ `vi`, `en`). Migration có `SET LOCAL lock_timeout`.
- `PATCH /users/me/language` body `{ language: 'vi' | 'en' }` (DTO kiểm giá trị). App gọi sau đăng nhập/khởi động khi đã đăng nhập và mỗi lần ngôn ngữ hiệu lực đổi (bỏ qua nếu trùng giá trị đã gửi).
- Thông báo đẩy: gom mọi chỗ soạn tiêu đề/nội dung push (giao việc, duyệt/trả bài, nhắc hạn, cuộc họp, tin nhắn dự án/riêng, kết bạn, báo cáo vi phạm nếu có) về một module từ điển `vi`/`en`, chọn theo `language` của từng người nhận. Gửi cho nhiều người thì nhóm theo ngôn ngữ.
- Câu lỗi: giữ `code` hiện có; bổ sung `code` cho lỗi người dùng thấy mà chưa có mã. App dịch theo `code`; không có mã thì hiện câu chung đã dịch.
- AI gợi ý việc từ tin nhắn: truyền ngôn ngữ người gọi vào prompt để tên/mô tả việc ra đúng ngôn ngữ.

## Phần 3. Chuyển đổi, kiểm thử, ra mắt

- Chuyển từng khu vực một (mỗi khu vực một việc trong kế hoạch): thay chữ viết thẳng bằng `t.xxx`, cập nhật test.
- Bài kiểm chống sót: quét `src/app`, `src/components`, `src/lib` (trừ test và từ điển) tìm chuỗi có dấu tiếng Việt viết thẳng; danh sách ngoại lệ có lý do. Test hiển thị mỗi màn chính ở cả `vi` và `en`.
- Văn phong tiếng Anh tự nhiên, nhất quán với `docs/app-store-ios/14-app-store-tieng-anh.md`.
- Ra mắt: deploy máy chủ trước (endpoint + push theo ngôn ngữ; người dùng cũ mặc định `vi`, không đổi gì), rồi build iOS 1.0.16 và Android bản kế tiếp từ cùng nhánh. Sau khi duyệt: bỏ câu "giao diện hiện là tiếng Việt" trong mô tả App Store tiếng Anh, cập nhật Notes cho người duyệt.

## Ngoài phạm vi

Email hệ thống, web, ngôn ngữ thứ ba, tải bản dịch từ xa, đồng bộ lựa chọn ngôn ngữ giữa web và app.
