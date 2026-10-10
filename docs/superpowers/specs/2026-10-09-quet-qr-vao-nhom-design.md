# Thiết kế: quét và hiện QR mời vào nhóm trên app mobile

Ngày 09/10/2026. Chủ dự án chọn: quét + hiện QR trong app. Đi chung bản 1.0.16 (iOS build 7, Android 21).

## Bối cảnh

- Lời mời dự án đã có: mã 8 ký tự (bảng chữ `23456789ABCDEFGHJKLMNPQRSTUVWXYZ`), link `https://wedofpt.com.vn/#/moi/<MÃ>` (gốc lấy từ `FRONTEND_URL`, có thể khác). API: `GET /invites/:code` (xem trước), `POST /invites/:code/join`.
- Web đã vẽ QR của `loiMoi.url` trong hộp Mời vào nhóm (`FE_WEDO/src/components/du-an/MoiVaoNhomDialog.tsx`).
- App: `NhapMaMoiSheet` (nhập mã → xem trước → tham gia), `MoiVaoNhomSheet` (Leader lấy link, sao chép, chia sẻ, tắt link; ghi chú "hiện và quét QR chờ bản build mới").

## Phần 1. Đọc mã từ QR — `src/lib/loi-moi.ts`

`docMaTuQr(noiDung: string): string | null`
- Link có đoạn `/moi/<mã>` (sau `#` hoặc trong đường dẫn, bất kể tên miền) → lấy `<mã>`.
- Hoặc chuỗi chỉ là mã (có/không gạch ngang, chữ thường/hoa).
- Chuẩn hoá: viết hoa, bỏ gạch; hợp lệ khi đúng 8 ký tự chữ/số. Sai → `null`.
- Không mở link lạ, không gọi mạng.

## Phần 2. Quét QR — `src/components/chat/QuetMaQr.tsx`

- Thư viện `expo-camera` (`CameraView`, `useCameraPermissions`), chỉ nhận `barcodeTypes: ['qr']`.
- Màn toàn màn hình (Modal): khung ngắm, dòng hướng dẫn, nút Đóng.
- Quyền: chưa hỏi → hỏi; bị từ chối → câu giải thích + nút mở Cài đặt (`Linking.openSettings`).
- Quét được: khoá để chỉ xử lý một lần; `docMaTuQr` ra mã → đóng màn quét, đưa mã vào `NhapMaMoiSheet` và tự gọi xem trước (người dùng vẫn phải bấm Tham gia). QR không phải lời mời → báo "Mã QR này không phải lời mời WeDo" và cho quét tiếp.
- `NhapMaMoiSheet` thêm nút "Quét mã QR" cạnh ô nhập.

## Phần 3. Hiện QR — `MoiVaoNhomSheet`

- Khi đã có link mời còn hạn: vẽ QR của `loiMoi.url` (thư viện `react-native-qrcode-svg` + `react-native-svg`), khoảng 200 pt, nền trắng, lề đủ cho máy quét. Dưới QR: "Bạn bè mở WeDo → Nhập mã mời → Quét mã QR". Không có link → không vẽ.
- Bỏ ghi chú "chờ bản build mới".

## Phần 4. Quyền và cấu hình

- Plugin `expo-camera` trong `app.json`: `cameraPermission` dùng câu mới; `microphonePermission: false`, `recordAudioAndroid: false` (không quay video, không xin micro).
- Câu xin quyền máy ảnh (vi/en, `app.json` image-picker + `locales/*.json`): nói rõ dùng để chụp ảnh gửi trong chat **và quét mã QR mời vào nhóm**.
- Đổi native → vân tay đổi, build mới (đã định build 7/21).

## Phần 5. Song ngữ, kiểm thử

- Chữ mới vào `tu-dien/chat.ts` (vi + en); `npm run kiem-dich` vẫn 0.
- Test: `docMaTuQr` (link hash, link path, tên miền khác, mã thường/gạch, rác, mã 7/9 ký tự); `QuetMaQr` (mock expo-camera: quét lời mời → gọi `onMa`; QR lạ → báo lỗi, không gọi; bị từ chối quyền → hiện nút Cài đặt; quét hai lần liên tiếp chỉ xử lý một); `NhapMaMoiSheet` nhận mã từ quét → gọi xem trước; `MoiVaoNhomSheet` có QR khi có link (mock qrcode-svg) — cả vi và en.

## Ngoài phạm vi

Universal/app link (mở app khi quét bằng camera hệ thống), tải ảnh QR về máy.
