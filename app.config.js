/**
 * Lớp mỏng đặt trên `app.json`, sinh ra chỉ để giải một bài toán: đưa
 * `google-services.json` tới máy chủ build của EAS.
 *
 * Tệp đó chứa khoá API Firebase nên nằm trong `.gitignore`, mà EAS Build chỉ
 * tải lên những tệp git đang theo dõi. Kết quả: build trên EAS chết ngay ở bước
 * cấu hình với câu `"google-services.json" is missing`.
 *
 * Cách của Expo là khai tệp thành **biến môi trường dạng file** trên EAS. Lúc
 * build, EAS ghi nội dung ra một tệp tạm rồi đặt đường dẫn tệp ấy vào
 * `process.env.GOOGLE_SERVICES_JSON`. Nhưng `app.json` là JSON tĩnh, không đọc
 * được biến môi trường — nên phải có tệp này.
 *
 * Mọi thứ khác giữ nguyên trong `app.json`. Đây KHÔNG phải chỗ để cấu hình
 * thêm; thêm gì thì thêm vào `app.json` như cũ.
 *
 * Khi chạy ở máy (`expo start`, build Gradle cục bộ) thì biến kia vắng mặt và
 * hàm rơi về đúng giá trị `app.json` vẫn ghi, nên không đổi gì với lối làm cũ.
 */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? config.android?.googleServicesFile,
  },
});
