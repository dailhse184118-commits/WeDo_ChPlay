# Soát quyền trên AAB production

Ngày 05/08/2026. Build `8f1a1d2e-2127-4b36-a59f-23f843946f95`, hồ sơ `production`, `versionCode 1`.

## Cách kiểm chứng

Tải chính file `.aab` sẽ nộp về, đổi đuôi thành `.zip`, giải nén rồi đọc `base/manifest/AndroidManifest.xml` (định dạng protobuf). Đếm các nút `uses-permission`.

Phải làm trên AAB thật chứ không suy từ mã nguồn. Lần này chính chỗ đó bắt được sai sót — xem mục "Điều tôi đã kết luận sai" bên dưới.

## Kết quả: 29 quyền

**Cần cho tính năng:**

| Quyền | Từ đâu | Vì sao cần |
|---|---|---|
| `INTERNET` | React Native | Gọi API |
| `ACCESS_NETWORK_STATE` | React Native | Biết mất mạng |
| `POST_NOTIFICATIONS` | expo-notifications | Android 13+ bắt buộc để hiện thông báo |
| `RECEIVE_BOOT_COMPLETED` | expo-notifications | Đặt lại lịch nhắc sau khi khởi động máy |
| `WAKE_LOCK` | expo-notifications | Đánh thức máy đúng mốc nhắc |
| `VIBRATE` | expo-haptics, expo-notifications | Phản hồi rung khi nhấn giữ tin nhắn |
| `USE_BIOMETRIC`, `USE_FINGERPRINT` | expo-secure-store | Khoá kho lưu token |
| `com.google.android.c2dm.permission.RECEIVE` | expo-notifications | Kênh FCM, để dành cho Giai đoạn 2 |

**Vô hại nhưng thừa:** `READ_APP_BADGE` cùng 15 quyền badge của launcher (Samsung, Huawei, Oppo, Sony, HTC…) đi kèm expo-notifications, và `BIND_GET_INSTALL_REFERRER_SERVICE` của Play. Không quyền nào trong nhóm này hiện trên trang cửa hàng.

**`READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE`:** có `maxSdkVersion="32"`, nên trên Android 13 trở lên hệ thống bỏ qua hoàn toàn. Không hiện trên trang cửa hàng với máy đời mới.

## Hai kết luận quan trọng

**1. Không có `USE_EXACT_ALARM` lẫn `SCHEDULE_EXACT_ALARM`.** Đây là rủi ro bị Play từ chối phát hành lớn nhất của phần nhắc hạn: Google chỉ cấp hai quyền này cho app đồng hồ báo thức, hẹn giờ và lịch. Việc dùng báo thức không chính xác trong `src/lib/notifications/local.ts` đã giữ đúng cam kết.

**2. `SYSTEM_ALERT_WINDOW` CÓ trong AAB.** Đây là quyền "Hiển thị trên ứng dụng khác", **có hiện trên trang cửa hàng**. Một app quản lý công việc xin quyền vẽ đè lên app khác trông rất khó hiểu với người duyệt và với người cài.

## Điều tôi đã kết luận sai

Trước đó tôi phân tích tĩnh mã nguồn và kết luận `SYSTEM_ALERT_WINDOW` chỉ được khai báo trong `node_modules/react-native/ReactAndroid/src/debug/AndroidManifest.xml`, tức nhánh debug, nên không thể lọt vào bản phát hành. **Kết luận đó sai.** AAB thật có quyền này ở dạng `<uses-permission>` đầy đủ.

Đã kiểm tra thêm: không gói nào trong `node_modules` (kể cả 18 file `.aar` đi kèm) khai báo quyền này ngoài nhánh debug của React Native, và AAB **không** chứa dấu vết `expo-dev-launcher` hay `expo-dev-menu`. Nguồn nằm ở một artifact tải từ Maven lúc build trên máy chủ EAS, nhiều khả năng là bản release của `com.facebook.react:react-android`.

Bài học: phân tích tĩnh `node_modules` không thay được việc mở file sẽ nộp ra xem.

## Cách xử lý đề xuất

Expo có sẵn `android.blockedPermissions`, dùng `tools:node="remove"` khi hợp nhất manifest:

```json
"android": {
  "blockedPermissions": ["android.permission.SYSTEM_ALERT_WINDOW"]
}
```

Cần build lại AAB rồi soát lại đúng quy trình trên để xác nhận quyền đã biến mất. **Chưa làm — chờ chủ dự án duyệt**, vì tốn một lượt build.

Không chặn `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` cùng lúc: chúng đã bị `maxSdkVersion="32"` vô hiệu trên máy đời mới, mà chặn thì có rủi ro làm hỏng phần lưu ảnh của `expo-image` trên Android 12 trở xuống.

## Ghi chú cho biểu mẫu Data safety

Danh sách quyền trên **không** đụng tới nhóm dữ liệu nhạy cảm nào: không vị trí, không danh bạ, không máy ảnh, không micro, không SMS, không nhật ký cuộc gọi.
