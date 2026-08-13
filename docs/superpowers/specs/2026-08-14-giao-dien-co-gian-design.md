# Giao diện co giãn theo kích thước máy — thiết kế

Ngày 14/08/2026. Nối tiếp yêu cầu chủ dự án nêu ngày 13/08, chép lại trong
`docs/superpowers/notes/2026-08-11-dang-nhap-google-ban-giao.md`.

## Vấn đề

Bố cục đang neo vào số pixel cố định: `sizes.control = 48`, `profileAvatar = 80`,
`TAB_BAR_HEIGHT = 60`, `CARD_OVERLAP = 12`, và toàn bộ bậc `fontSize`. Hai trục
làm vỡ bố cục:

- **Máy nhỏ.** Ở 360dp, khoảng cách và cỡ chữ dựng cho máy 411dp thành chật.
- **Cỡ chữ hệ thống lớn.** Android cho phóng tới 200%. React Native tự phóng
  `fontSize`, nhưng hộp chứa có chiều cao **cứng** thì không lớn theo, nên chữ
  bị cắt hoặc tràn.

Chủ dự án chốt làm cả hai trục một lượt. Tablet chỉ cần **không vỡ**, không dựng
bố cục riêng.

## Hướng đã chọn

Token tự tính một lần lúc nạp app, cộng `useWindowDimensions()` riêng ở đúng
một chỗ cần biết bề rộng lúc chạy.

Hai hướng đã cân nhắc rồi loại:

- **Hook `useResponsiveTokens()`** như ghi chú bàn giao gợi ý. Phản ứng tức thì
  mọi thay đổi, nhưng buộc bỏ `StyleSheet.create` tĩnh ở khoảng 20 file và
  chuyển style vào thân hàm render — diff khổng lồ, mất tối ưu của `StyleSheet`,
  và dễ sinh lỗi mới ở những màn đang chạy tốt. Đổi lại thứ mà app khoá
  `portrait` gần như không dùng đến.
- **Chỉ token tự tính**, không hook. Đơn giản hơn nhưng tablet chỉ được giãn đều
  chứ không kẹp được bề rộng thẻ.

Token tính lúc nạp module có một giới hạn phải nói rõ: nó **không** phản ứng khi
kích thước cửa sổ hay cỡ chữ đổi giữa lúc app đang chạy. Chấp nhận được vì
`app.json` khoá `orientation: portrait`, còn đổi cỡ chữ hệ thống trên Android
làm khởi động lại activity nên module được nạp lại.

## Kiến trúc

### `src/theme/responsive.ts` — file mới, toàn hàm thuần

```
widthStep(width)        → 'compact' (≤360) | 'regular' (≤430) | 'wide' (>430)
scaleForWidth(step)     → 0.92 | 1 | 1.06
cappedFontScale(scale)  → min(scale, GIOI_HAN_CO_CHU)
GIOI_HAN_CO_CHU = 1.3
CHIEU_RONG_NOI_DUNG_TOI_DA = 520
```

Không import React, không đọc `Dimensions`. Nhận số, trả số. Nhờ vậy kiểm được
mọi bề rộng và mọi mức cỡ chữ mà không cần máy thật.

### `src/theme/tokens.ts` — tự tính lúc nạp

Đọc `Dimensions.get('window').width` và `PixelRatio.getFontScale()` một lần khi
module nạp, rồi xuất `spacing` / `fontSize` / `sizes` **giữ nguyên tên và hình
dạng hiện tại**. Khoảng 20 file đang `import { spacing } from '../../theme/tokens'`
không phải sửa dòng nào.

`spacing` và `fontSize` chỉ nhân theo bậc bề rộng. `fontSize` **không** nhân
thêm cỡ chữ hệ thống: React Native đã tự làm việc đó lúc dựng chữ, nhân hai lần
là phóng bình phương.

Phân biệt bắt buộc giữa hai nhóm kích cỡ:

| Nhóm | Nhân theo | Vì sao |
|---|---|---|
| `iconTile`, `projectAvatar`, `profileAvatar`, `icon` | chỉ bậc bề rộng | Là hình vuông/tròn. Nhân theo cỡ chữ sẽ làm avatar phình méo so với chỗ nó nằm. |
| `control` (chiều cao ô nhập, nút) | bậc bề rộng **và** cỡ chữ đã chặn | Chữ bên trong mới là thứ phóng to; hộp phải lớn theo, nếu không chữ bị cắt. |

Thêm `cardOverlap` vào `sizes`, thay hằng số `CARD_OVERLAP = 12` đang nằm rời
trong `src/app/(tabs)/account/index.tsx`.

### Chiều cao cứng → chiều cao tối thiểu

`Button`, `GoogleButton`, `TextField` đã dùng `minHeight`. Phải đổi:

- `src/components/chat/MessageComposer.tsx` — `height: 44`
- `src/components/tasks/TaskRow.tsx` — `height: 40` (hai chỗ)
- `src/components/tasks/RejectTaskSheet.tsx` — `height: 36`, `height: 48`
- `src/components/chat/TaskSuggestionSheet.tsx` — `height: 36`
- `src/app/(tabs)/_layout.tsx` — `TAB_BAR_HEIGHT = 60` tính từ token

Nút tròn và chấm tròn (`width`/`height` bằng nhau: 24, 40, 44, 64, 72, 10) giữ
nguyên dạng vuông, chỉ nhân theo bậc bề rộng.

### Chặn cỡ chữ ở phần khung

`maxFontSizeMultiplier={1.3}` cho những chỗ **không cuộn được**:

- tiêu đề và phụ đề `GradientHeader`
- badge số thông báo chưa đọc trên thanh tab
- nhãn thanh tab

Nội dung người dùng đọc — tin nhắn, tên việc, mô tả, tên dự án — **không chặn**.

Nhãn tab đi qua `tabBarLabelStyle` của expo-router, có thể không nhận thẳng
`maxFontSizeMultiplier`. Nếu không nhận thì tính chiều cao thanh tab theo cỡ chữ
đã chặn để nhãn vẫn đủ chỗ, và ghi lại cách nào thực sự chạy.

### Tablet — `ScreenContainer` kẹp bề rộng

Thêm `useWindowDimensions()` vào `src/components/ui/ScreenContainer.tsx`: bề
rộng vượt `CHIEU_RONG_NOI_DUNG_TOI_DA` thì kẹp nội dung ở mức đó và căn giữa.
Đây là chỗ duy nhất trong toàn bộ thay đổi dùng hook.

### Rà `numberOfLines`

Mười một chỗ đang cắt dòng. Nâng lên hoặc bỏ hẳn ở nơi hộp chứa co giãn được:

- `src/components/chat/ProjectRow.tsx` — tên dự án đang cắt ở 1 dòng
- `src/components/notifications/NotificationRow.tsx`
- `src/components/tasks/TaskRow.tsx`
- `src/components/ui/GradientHeader.tsx`

Giữ mức cắt ở nơi bố cục thật sự cần cố định.

## Kiểm chứng

Tự động:

- `responsive.ts` — test ở 360 / 411 / 430 / 800dp × cỡ chữ 1.0 / 1.3 / 2.0
- `tokens.ts` — khẳng định avatar giữ hình vuông, `control` lớn theo cỡ chữ,
  và mọi giá trị vẫn là số nguyên dương
- 261 test hiện có phải xanh nguyên

Thủ công, **chủ dự án tự làm** — Jest không dựng được bố cục thật:

- máy nhỏ 360dp, máy thường 411dp, tablet
- bật cỡ chữ hệ thống lớn nhất trong Cài đặt Android

## Nằm ngoài phạm vi

Không đổi bảng màu. Không đổi bố cục màn nào. Không đụng điều hướng. Không dựng
bố cục hai cột cho tablet.
