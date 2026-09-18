# Nhắc cập nhật — bàn giao

Ngày 18/09/2026. Kế hoạch: `docs/superpowers/plans/2026-09-18-thong-bao-cap-nhat.md`.
Thiết kế: `docs/superpowers/specs/2026-09-18-thong-bao-cap-nhat-design.md`.

## Trạng thái

Task 1–6 **đã xong và commit**. Task 7 (nghiệm thu trên máy thật) **chưa làm** —
cần đổi biến môi trường trên Azure rồi mở lại app, trợ lý không đụng vào cấu
hình máy chủ thật.

`npx tsc --noEmit` sạch. **535/535 test qua, 65/65 bộ.** Backend: 184/184 test
qua, 33/33 bộ.

| Commit | Nội dung |
|---|---|
| `5d848a3` | Endpoint `/app-version` *(trong `BE_WEDO`)* |
| `be76145` | Hàm thuần so sánh phiên bản |
| `fad1400` | Tầng API, mở CH Play, nhớ việc đã tắt |
| `d31fdfc` | Dải băng gợi ý |
| `ff9fa2a` | Màn chặn bắt buộc |
| `08495a8` | Gắn vào app |

## Một phát hiện về bộ test của repo, đáng nhớ

**`jest.restoreAllMocks()` một mình KHÔNG xoá lịch sử gọi của `Linking.openURL`.**

Hàm đó vốn đã là hàm giả do preset React Native dựng sẵn. `jest.spyOn` chỉ bọc
lên nó, nên `restore` trả về đúng cái hàm giả cũ — kèm nguyên lịch sử gọi của
test trước. Hệ quả: `toHaveBeenNthCalledWith(2, ...)` đếm cả những lượt gọi
không thuộc test hiện tại và báo sai một cách rất khó hiểu.

Phải thêm `beforeEach(() => jest.clearAllMocks())`. Áp dụng cho mọi test spy lên
một mô-đun native của React Native, không riêng `Linking`.

## Còn phải làm

### 1. Khai ba biến môi trường trên Azure

Chưa khai thì endpoint trả cả ba chuỗi rỗng và app im lặng — không hỏng, nhưng
tính năng cũng không chạy.

```
MOBILE_LATEST_VERSION   = 1.0.10
MOBILE_MINIMUM_VERSION  = 1.0.0
MOBILE_UPDATE_NOTES     = Thêm nhắn tin riêng và sửa lỗi bàn phím.
```

### 2. Kiểm endpoint sau khi deploy

```bash
curl -s https://api-wedo-backend-dai-g7fbbabzgce0aefc.eastasia-01.azurewebsites.net/app-version
```

Phải thấy đủ ba khoá có giá trị. Cả ba rỗng nghĩa là chưa khai biến.

### 3. Nghiệm thu trên máy thật

Đổi biến trên Azure rồi **tắt hẳn app và mở lại** — `staleTime` là 30 phút nên
không tắt app thì không thấy đổi.

- [ ] `latest` bằng phiên bản đang chạy → không hiện gì
- [ ] `latest` cao hơn → dải băng hiện ở màn Trò chuyện, đúng ghi chú
- [ ] Bấm "Cập nhật" → mở đúng trang WeDo trên CH Play
- [ ] Bấm "Để sau" → biến mất, tắt app mở lại vẫn không hiện
- [ ] Nâng `latest` thêm một bậc → hiện lại (tắt bản cũ không làm im bản mới)
- [ ] `minimum` cao hơn → màn chặn hiện ngay, **kể cả khi chưa đăng nhập**, không có đường thoát
- [ ] Hạ `minimum` xuống → app dùng lại bình thường

### 4. Thử nhánh hỏng thì im lặng — quan trọng nhất

- [ ] Bật chế độ máy bay rồi mở app → không hiện gì, app chạy bình thường
- [ ] Xoá cả ba biến trên Azure → không hiện gì, app chạy bình thường

Một cơ chế kiểm phiên bản mà khoá người dùng ra khỏi app đang chạy tốt thì tệ
hơn hẳn việc không có nó.

### 5. Bản build kế tiếp

Tính năng này chỉ có tác dụng **từ bản kế tiếp trở đi**. Người đang ở `1.0.10`
sẽ không bao giờ được nhắc — họ không có mã này trong máy.

Bản kế tiếp nhớ tăng cả hai: `app.json` lên `1.0.11 / versionCode 13`, và
`MOBILE_LATEST_VERSION` trên Azure lên `1.0.11`.

## Đáng làm sau mốc 30/09

`expo-updates`. Nó đưa thẳng bản sửa tới máy trong vài phút thay vì cả vòng
build — duyệt — phát hành. Hôm nay hai lỗi giao diện mất trọn một buổi mới tới
được tay người kiểm thử; với `expo-updates` thì mất năm phút.
