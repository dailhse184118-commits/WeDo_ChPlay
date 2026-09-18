# Thông báo có bản cập nhật mới — thiết kế

Ngày 18/09/2026. Chủ dự án yêu cầu: khi có bản mới trên CH Play, app phải cho
người dùng biết.

## Vấn đề

Người dùng không có cách nào biết mình đang chạy bản cũ. Hôm nay chuyện đó vừa
gây hậu quả thật: hai lỗi giao diện được sửa và phát hành trong bản `1.0.10`,
nhưng người kiểm thử đang ở `1.0.8` vẫn gặp lỗi và vẫn báo lỗi — trong khi bản
sửa đã nằm sẵn trên CH Play chờ họ bấm cập nhật.

Nguy hiểm hơn là chiều ngược lại: `startDirectConversation` ở backend vừa được
nới điều kiện. Lần sau nếu backend đổi kiểu phá vỡ, app cũ sẽ hỏng ở giữa chừng
mà người dùng không hiểu vì sao — họ sẽ báo "app lỗi" chứ không phải "app cũ".

## Ràng buộc đã biết trước

`expo-updates` **chưa được cài**, nên mọi thay đổi ở mobile đều phải build lại
và chờ Google duyệt. Nghĩa là chính tính năng này cũng cần một bản build mới, và
**người đang ở `1.0.8` sẽ không bao giờ nhận được nó** — nó chỉ có tác dụng từ
bản kế tiếp trở đi.

Chủ dự án đã cân nhắc và chọn hướng "chỉ báo cho biết", không cài `expo-updates`
để đẩy bản sửa thẳng tới máy. Ghi lại đây vì đó là một đánh đổi có ý thức, không
phải thiếu sót.

## Hướng đã chọn

App hỏi máy chủ phiên bản mới nhất, tự so với phiên bản của chính mình, rồi hiện
một trong hai thứ: dải băng gợi ý tắt được, hoặc màn chặn không tắt được.

Hai hướng đã cân nhắc rồi loại:

- **`expo-updates` (cập nhật qua mạng).** Đưa thẳng bản sửa tới máy trong vài
  phút, không qua CH Play. Đúng thứ sẽ cứu được buổi chiều hôm nay. Loại vì chủ
  dự án muốn giữ phạm vi nhỏ lúc này; để dành cho sau mốc 30/09.
- **Play In-App Updates API của Google.** Giao diện chuẩn Android, Google lo cả
  phần tải. Loại vì cần thêm một mô-đun native, và kiểm thử nó trên kênh khép
  kín rất khó — hai thứ không nên đụng vào khi còn 12 ngày.

## Kiến trúc

### Backend — thêm một endpoint vào `AppController`

`AppController` khai `@Controller()` không tiền tố, đang chứa `/health` và
`/health/ready`. Thêm vào đó, không dựng module mới:

```
GET /app-version

{
  "latest":  "1.0.10",
  "minimum": "1.0.0",
  "notes":   "Thêm nhắn tin riêng và sửa lỗi bàn phím."
}
```

**Công khai, không qua `JwtAuthGuard`.** App quá cũ phải biết điều đó *trước cả
màn đăng nhập* — nếu API đã đổi kiểu phá vỡ thì chính lượt đăng nhập cũng hỏng,
và bắt xác thực trước khi được biết "app của bạn quá cũ" là một vòng luẩn quẩn.

Ba giá trị đọc từ biến môi trường:

| Biến | Ví dụ | Vắng thì |
|---|---|---|
| `MOBILE_LATEST_VERSION` | `1.0.10` | trả chuỗi rỗng |
| `MOBILE_MINIMUM_VERSION` | `1.0.0` | trả chuỗi rỗng |
| `MOBILE_UPDATE_NOTES` | *(một câu)* | trả chuỗi rỗng |

Không dựng bảng cơ sở dữ liệu kèm màn quản trị. Backend tự deploy mỗi lần push
nhánh `backend`, đổi một biến môi trường mất khoảng năm phút — dựng cả bộ máy
cho việc đó là thừa.

**Đánh đổi phải nói rõ:** mỗi lần tăng `app.json` phải nhớ đổi cả biến trên
Azure. Hai chỗ, dễ quên. Giảm thiểu bằng cách ghi vào `.env.example` và vào danh
sách kiểm trước khi build trong ghi chú bàn giao.

### `src/lib/version/so-sanh.ts` — hàm thuần, phần dễ sai nhất

```
soSanhPhienBan(a: string, b: string): -1 | 0 | 1
mucCapNhat(input): 'khong-can' | 'nen-cap-nhat' | 'bat-buoc'
```

`mucCapNhat` nhận `{ hienTai, latest, minimum }` và trả về:

- `'bat-buoc'` khi `hienTai < minimum`
- `'nen-cap-nhat'` khi `hienTai < latest`
- `'khong-can'` với mọi trường hợp còn lại

Cái bẫy nằm ở đúng tình huống hiện tại: so chuỗi thì `'1.0.10' < '1.0.9'`, vì ký
tự `1` nhỏ hơn `9`. Phải tách theo dấu chấm rồi so từng bậc bằng số. Có test
riêng cho cặp này.

Không import gì từ React hay React Native, nên kiểm được mọi tổ hợp phiên bản mà
không cần dựng màn hình.

### `src/lib/api/app-version.ts`

```
getAppVersionInfo(): Promise<{ latest: string; minimum: string; notes: string }>
```

Gọi `apiRequest('/app-version', { skipAuth: true })`.

### Nơi đặt hai mức — cố ý khác nhau

**Mức bắt buộc** đặt ở `src/app/_layout.tsx`, phía trên `<Stack>`. Chặn ở gốc vì
nó phải chặn được cả màn đăng nhập, không chỉ phần đã đăng nhập.

**Mức gợi ý** đặt trong thân màn Trò chuyện, đúng chỗ `ErrorBanner` vẫn hiện.
Không đặt ở gốc: header gradient vẽ tràn lên tận thanh trạng thái theo chế độ
edge-to-edge, chèn một dải phía trên sẽ phá bố cục đó ở mọi màn.

Sau khi đăng nhập, `(auth)/_layout.tsx` chuyển thẳng về `/chat`, nên đó là màn
người dùng chắc chắn nhìn thấy.

### Một lượt gọi, hai nơi đọc

Màn chặn nằm ở layout gốc còn dải băng nằm trong màn Trò chuyện, nhưng **chỉ có
một lượt gọi mạng**: cả hai dùng chung `useQuery` với khoá `['app-version']`, và
react-query gộp hai chỗ đọc cùng khoá thành một lượt.

`staleTime` đặt 30 phút. Phiên bản mới không xuất hiện theo từng phút, mà hỏi
lại mỗi lần đổi màn thì vừa tốn pin vừa dội tải máy chủ không vì lý do gì.

### Hai component mới

- `src/components/update/UpdateBanner.tsx` — dải băng gợi ý. Hiện `notes` do
  máy chủ trả về làm phần mô tả, kèm nút "Cập nhật" và nút tắt. `notes` rỗng thì
  dùng câu mặc định "Đã có phiên bản mới của WeDo.".
- `src/components/update/UpdateGate.tsx` — màn chặn toàn phần, chỉ có nút mở CH
  Play, không có đường thoát.

### Nhớ việc đã tắt

Lưu vào AsyncStorage theo khoá `da-bo-qua-cap-nhat:<phiên-bản>`. Tắt thông báo
của `1.0.11` không được làm im luôn `1.0.12` — mỗi bản mới là một lần đáng nhắc
lại.

Chỉ áp dụng cho mức gợi ý. Mức bắt buộc không có nút tắt nên không có gì để nhớ.

### Mở CH Play

`Linking.openURL('market://details?id=vn.wedo.app')`, hỏng thì rơi về
`https://play.google.com/store/apps/details?id=vn.wedo.app`.

Lược đồ `market://` mở thẳng ứng dụng CH Play; đường `https` chỉ dùng khi máy
không có CH Play, và khi đó nó mở trình duyệt.

## Nguyên tắc bao trùm: hỏng thì im lặng

Không hiện gì cả khi: endpoint trả lỗi, quá hạn, trả về rác, `latest` hoặc
`minimum` rỗng, hoặc không đọc được phiên bản của chính app
(`Constants.expoConfig?.version` trả `undefined`).

Một cơ chế kiểm phiên bản mà khoá người dùng ra khỏi một app đang chạy tốt thì
tệ hơn hẳn việc không có nó. Mọi nhánh không chắc chắn đều rơi về `'khong-can'`.

## Phạm vi

**Có:** endpoint backend, hàm so sánh, tầng API, dải băng gợi ý, màn chặn bắt
buộc, nhớ việc đã tắt, mở CH Play.

**Không có:** `expo-updates`, Play In-App Updates API, màn quản trị để đổi số
phiên bản, thông báo đẩy khi có bản mới, ép cập nhật theo nhóm người dùng.

## Kiểm thử

Theo quy ước repo: hàm thuần và component có test, màn hình trong `(tabs)` thì
không.

- `src/lib/version/__tests__/so-sanh.test.ts` — gồm cặp `1.0.10` vs `1.0.9`, và
  mọi nhánh rơi về `'khong-can'` khi dữ liệu hỏng
- `src/lib/api/__tests__/app-version.test.ts`
- `src/components/update/__tests__/UpdateBanner.test.tsx`
- `src/components/update/__tests__/UpdateGate.test.tsx`
- `BE_WEDO` — `.spec.ts` cho endpoint, phủ cả trường hợp thiếu biến môi trường

Cổng nghiệm thu: `npx tsc --noEmit` sạch và toàn bộ test qua ở cả hai repo.
