# Xuất báo cáo đóng góp (PDF và Excel)

Ngày: 02/10/2026. Chủ dự án đã duyệt các quyết định ở mục 1.

Đây là hướng 2 của lộ trình. Hướng 1 (mời vào nhóm và mẫu dự án) đã lên production; hướng 3 là Export lịch/công việc và AI Daily Planner.

## 1. Mục tiêu và quyết định đã chốt

**Mục tiêu.** Cuối kỳ, nhóm sinh viên có một tài liệu đáng tin để nộp giảng viên hoặc làm căn cứ chấm điểm chéo: ai được giao gì, làm xong chưa, đúng hạn hay trễ. Số liệu lấy thẳng từ dữ liệu công việc trên WeDo.

**Quyết định của chủ dự án:**
1. **Ai xuất được:**
   - Leader dự án và chủ workspace xuất **báo cáo nhóm** (mọi thành viên).
   - Thành viên thường xuất **báo cáo cá nhân** (chỉ phần của mình).
2. **Nội dung:** bảng tổng hợp, kèm danh sách việc của từng người. Không có lịch sử từng việc.
3. **Định dạng:** cả **PDF** (để nộp, có chỗ ký) và **Excel** (để giảng viên lọc và tính điểm).
4. **Miễn phí cho mọi người**, trên mọi nền tảng, kể cả iPhone. Không áp gói.

**Ngoài phạm vi:**
- lịch sử thay đổi trạng thái, đếm số lần bị trả lại;
- chế độ giảng viên;
- logo trường, mẫu báo cáo tuỳ chỉnh;
- xuất nhiều dự án trong một file;
- gửi báo cáo qua email.

## 2. Số liệu

### 2.1 Phạm vi
- Báo cáo tính **theo một dự án**.
- **Khoảng thời gian** tính theo **ngày tạo việc** (`Task.createdAt`), đổi sang ngày theo giờ Việt Nam.
  - `from` và `to` là ngày `YYYY-MM-DD`, đều tính cả hai đầu.
  - Mặc định: từ ngày tạo dự án tới hôm nay.
- Chỉ tính việc **đã giao cho người** và **không bị người đó từ chối nhận**, đúng như bảng đóng góp hiện tại (`src/tasks/contributions.ts`).

### 2.2 Bảng tổng hợp, mỗi thành viên một dòng
Dùng lại đúng hàm của bảng đóng góp, để số trong báo cáo khớp với số trên màn hình:
- **Được giao** (`duocGiao`), **Hoàn thành** (`hoanThanh`), **Đúng hạn** (`dungHan`), **Trễ hạn** (`treHan`);
- **Chưa xong** (`chuaXong`), trong đó **quá hạn** (`quaHanChuaXong`);
- **Tệp đã nộp** (`daNop`);
- **Tỷ lệ đúng hạn** (`tyLeDungHanPhanTram`), hiện "—" khi chưa có việc nào có hạn đã xong.

**Bỏ cột "Bị trả lại".** Số này hiện chỉ đếm việc *đang* bị trả lại, vì lý do bị xoá khi nộp lại hay được duyệt. Đưa vào báo cáo là sai sự thật.

Báo cáo nhóm liệt kê **mọi thành viên của dự án**, kể cả người chưa được giao việc nào (hiện toàn số 0). Sắp xếp theo số việc hoàn thành, giảm dần, rồi theo tên.

### 2.3 Danh sách việc của từng người
Mỗi việc một dòng:
- **Tên việc**;
- **Hạn chót**;
- **Ngày nộp** (`submittedAt`, hoặc lần nộp tệp gần nhất với việc xong trước mốc `MOC_CO_LUC_NOP`, đúng quy tắc của `contributions.ts`);
- **Ngày hoàn thành** (`completedAt`);
- **Kết quả**, một trong:
  - **Đúng hạn**;
  - **Trễ N ngày**: N là số ngày theo lịch Việt Nam giữa hạn chót và mốc hoàn thành, nhỏ nhất là 1;
  - **Đã xong, không có hạn**;
  - **Chưa xong**;
  - **Quá hạn N ngày** (chưa xong, đã qua hạn, không ở trạng thái chờ duyệt);
  - **Đang chờ duyệt**;
- **Số tệp đã nộp.**

Mọi ngày giờ hiện theo **giờ Việt Nam** (`Asia/Ho_Chi_Minh`), dạng `dd/MM/yyyy HH:mm` khi tiếng Việt và `MMM d, yyyy HH:mm` khi tiếng Anh.

### 2.4 Phần đầu báo cáo
- tiêu đề "Báo cáo đóng góp" (nhóm) hoặc "Báo cáo đóng góp cá nhân";
- tên dự án, tên workspace, tên Leader (nhiều Leader thì nối bằng dấu phẩy), số thành viên;
- khoảng thời gian;
- thời điểm xuất và tên người xuất;
- ghi chú: "Số liệu do WeDo tự tính từ dữ liệu công việc. Đúng hạn: nộp hoặc hoàn thành trước hạn chót."

### 2.5 Quyền riêng tư
- Chỉ có **tên**, không có email hay số điện thoại.
- Báo cáo cá nhân không lộ bất kỳ số liệu nào của người khác, kể cả số thành viên trong bảng.

## 3. Định dạng file

### 3.1 PDF (`pdfkit`)
- Khổ A4 dọc, lề 40pt, phông **Be Vietnam Pro** (Regular, SemiBold) nhúng vào file. Tệp `.ttf` theo giấy phép SIL OFL, đặt ở `assets/fonts/` của backend, kèm `OFL.txt`.
- **Trang 1:** phần đầu và bảng tổng hợp.
- **Các trang sau:** mỗi người một mục, gồm tên, các số tóm tắt và bảng việc. Bảng dài thì sang trang và lặp lại dòng tiêu đề cột.
- **Cuối báo cáo nhóm:** khung **xác nhận** gồm Leader và từng thành viên, mỗi người một dòng: họ tên, chữ ký, ngày.
- Chân trang có số trang ("Trang 2/5" hoặc "Page 2 of 5") và dòng "Xuất từ WeDo — wedofpt.com.vn".

### 3.2 Excel (`exceljs`)
- **Sheet "Tổng hợp"** ("Summary"):
  - vài dòng đầu là thông tin ở mục 2.4;
  - tiếp theo là bảng tổng hợp có tiêu đề cột in đậm, bộ lọc tự động, cố định dòng tiêu đề;
  - tỷ lệ đúng hạn là **số** định dạng `0.0"%"`, ô trống khi không có.
- **Sheet "Chi tiết việc"** ("Tasks"): mỗi việc một dòng, có cột **Thành viên**.
  - Ngày lưu dạng **ngày giờ Excel** theo giờ Việt Nam, để giảng viên lọc và sắp xếp được.
  - "Trễ N ngày" tách thành hai cột: **Kết quả** (chữ) và **Số ngày trễ** (số).
- Báo cáo cá nhân: cùng cấu trúc, chỉ có một người.

### 3.3 Tên file
`Bao-cao-dong-gop_<ten-du-an-khong-dau>_<YYYY-MM-DD>.pdf|xlsx`. Báo cáo cá nhân thêm `_ca-nhan`. Tên dự án được bỏ dấu, thay khoảng trắng bằng gạch, cắt còn 60 ký tự. Header `Content-Disposition` gửi kèm `filename*` dạng UTF-8 (RFC 5987), như các API tải file hiện có.

## 4. Máy chủ

| API | Ai gọi | Kết quả |
|---|---|---|
| `GET /projects/:id/contribution-report?format=pdf\|xlsx&from&to&lang=vi\|en` | người đã đăng nhập | Trả file ngay (web dùng) |
| `POST /projects/:id/contribution-report/link` với `{ format, from?, to?, lang? }` | người đã đăng nhập | `{ url, expiresAt }`: link tải có chữ ký, hết hạn sau 5 phút (app dùng) |
| `GET /contribution-report/download?token=...` | không cần đăng nhập, chỉ cần token hợp lệ | Trả file |

- **Quyền.** Dùng chung một hàm quyết định loại báo cáo:
  - chủ workspace hoặc Leader dự án → `NHOM`;
  - thành viên dự án → `CA_NHAN`;
  - người không thấy được dự án → **404**, giống các API dự án khác.
  - **Admin workspace không phải Leader** nhận báo cáo nhóm, vì bảng đóng góp hiện đã cho họ xem mọi việc trong workspace.
- **Token tải:**
  - là JWT ký bằng khoá riêng (dẫn xuất từ `JWT_SECRET` với nhãn riêng để không dùng lẫn với token đăng nhập), sống 5 phút;
  - chứa `userId`, `projectId`, `format`, `from`, `to`, `lang`, `purpose='contribution-report'`;
  - khi tải, **kiểm lại quyền** với dữ liệu hiện tại: người bị mời ra trong 5 phút đó sẽ bị từ chối;
  - không lưu vào cơ sở dữ liệu. Dùng lại trong 5 phút được, chấp nhận vì chỉ chính người xin mới có link.
- **Kiểm tra đầu vào:**
  - `format` chỉ nhận `pdf` hoặc `xlsx`;
  - ngày đúng dạng `YYYY-MM-DD` và `from ≤ to`; sai thì trả 400 kèm mã `REPORT_BAD_RANGE`;
  - `lang` mặc định `vi`;
  - DTO và tham số truy vấn không làm thay đổi cách API cũ nhận yêu cầu.
- **Giới hạn tần suất:** 10 lần mỗi phút mỗi người cho cả ba API. Riêng API tải bằng token tính theo IP, 30 lần mỗi phút.
- **Giới hạn kích thước:** tối đa 3.000 việc mỗi báo cáo. Vượt thì trả 413 kèm mã `REPORT_TOO_LARGE` và gợi ý thu hẹp khoảng thời gian.
- **Cấu trúc code** (`src/bao-cao-dong-gop/`):
  - một hàm thuần dựng dữ liệu báo cáo;
  - hai hàm thuần vẽ PDF và Excel từ dữ liệu đó;
  - một service lo quyền và đọc cơ sở dữ liệu;
  - hai controller.
- **Thư viện mới:** `exceljs`, `pdfkit` (cộng `@types/pdfkit`). Không cần migration, không cần biến môi trường mới.
- **Lint:** đủ kiểu, không `any`, `npm run lint -- --max-warnings 0` phải về 0.

## 5. Web

- **Nút "Xuất báo cáo đóng góp"** ở hai chỗ:
  - đầu trang bảng dự án (ProjectBoardView);
  - tab **Bảng đóng góp** trong Cài đặt, kèm ô **chọn dự án**.
- **Hộp thoại:**
  - chọn **PDF** hoặc **Excel**;
  - **Từ ngày** và **Đến ngày**, mặc định là ngày tạo dự án và hôm nay;
  - một dòng cho biết loại báo cáo: "Báo cáo cả nhóm", hoặc "Báo cáo của bạn" với thành viên thường;
  - nút **Tải xuống**: hiện "Đang tạo báo cáo…" khi đang chạy, lỗi thì báo bằng câu dịch theo mã lỗi.
- **Tải file:** `fetch` có đăng nhập, nhận blob, tải qua `<a download>`, rồi giải phóng URL.
- **Song ngữ:** chữ có trong cả hai từ điển vi và en; `npm run kiem-dich` phải về 0. Báo cáo dùng `lang` theo ngôn ngữ đang chọn.

## 6. App (OTA, không đổi dấu vân tay Android)

- **Tài khoản → Bảng đóng góp:**
  - thêm khối **Xuất báo cáo**: chọn dự án, chọn PDF hay Excel, rồi bấm **Xuất báo cáo**;
  - khoảng thời gian dùng mặc định, không có ô chọn trên app.
- **Luồng:**
  1. gọi `POST …/contribution-report/link`;
  2. mở `url` bằng `WebBrowser.openBrowserAsync` (đã có sẵn trong app);
  3. trình duyệt hiện PDF hoặc tải Excel, và người dùng chia sẻ hay lưu qua menu của trình duyệt.
- Lỗi mạng hoặc lỗi từ máy chủ hiện câu tiếng Việt theo mã lỗi.
- **Không thêm thư viện, không sửa `app.json` hay `package.json`.** Kiểm dấu vân tay Android = `82cd990037afe065754c48a9a004f293c0d84be9` ở checkout thật của `main`.
- **iPhone:** có tính năng này ở bản build iOS kế tiếp. Nó không đụng tới thanh toán hay gói.

## 7. Lỗi và trường hợp biên
- Dự án không có việc nào trong khoảng thời gian: báo cáo vẫn xuất, ghi "Chưa có công việc trong khoảng thời gian này".
- Thành viên chưa được giao việc nào: báo cáo nhóm vẫn có dòng toàn số 0; báo cáo cá nhân ghi "Bạn chưa được giao việc nào trong dự án này".
- Tên việc rất dài: PDF tự xuống dòng; Excel để nguyên.
- Tên có ký tự đặc biệt hay emoji: PDF thay ký tự không có trong phông bằng "?" chứ không làm hỏng file.
- Link tải hết hạn hoặc bị sửa: trang trả 401 với một trang HTML ngắn hai thứ tiếng, "Link đã hết hạn, hãy xuất lại trong app".

## 8. Kiểm thử (test viết trước)
- **Backend:**
  - hàm dựng dữ liệu: khớp với `contributions.ts` trên cùng bộ việc; lọc theo khoảng ngày giờ Việt Nam; "Trễ N ngày" đúng khi máy chủ chạy giờ UTC; thành viên không có việc; báo cáo cá nhân không lộ người khác;
  - Excel: tạo file rồi đọc lại bằng `exceljs`, kiểm từng ô, kiểu số và ngày;
  - PDF: tạo file, kiểm đầu `%PDF`, số trang, và chuỗi tên thành viên;
  - quyền: Leader → nhóm, chủ workspace → nhóm, admin workspace → nhóm, thành viên → cá nhân, người ngoài → 404;
  - token: đúng, hết hạn, bị sửa, sai mục đích, sai dự án, người bị mời ra sau khi xin link;
  - kiểm tra đầu vào và giới hạn tần suất; dự án quá 3.000 việc;
  - `tsc`, toàn bộ `jest`, lint 0.
- **Web:** tên file, ngày mặc định, kiểm khoảng ngày, dịch mã lỗi, từ điển đủ hai ngôn ngữ; `lint`, `build`, `kiem-dich`.
- **App:** luồng xin link rồi mở trình duyệt, xử lý lỗi; `tsc`, toàn bộ `jest`, dấu vân tay.

## 9. Thứ tự đưa lên
1. **Backend.** Không có migration, nên lần chạy tự động sau khi push đi qua được. Kiểm bằng cách gọi API báo cáo khi chưa đăng nhập, phải nhận 401.
2. **Web.**
3. **App:** gộp vào `main` → đo dấu vân tay → chủ dự án chạy `npx eas-cli@latest update --branch production --platform android --environment production`.
