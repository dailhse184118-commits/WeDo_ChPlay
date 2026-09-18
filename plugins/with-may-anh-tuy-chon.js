const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Khai quyền `CAMERA` là Google Play TỰ SUY RA app bắt buộc phải có máy ảnh.
 *
 * Đây là hành vi có ghi trong tài liệu Android, không phải lỗi: `<uses-permission
 * android:name="android.permission.CAMERA" />` kéo theo `android.hardware.camera`
 * và `android.hardware.camera.autofocus` ở mức **bắt buộc**, trừ khi khai ngược
 * lại bằng `<uses-feature ... android:required="false" />`.
 *
 * Hậu quả đo được khi thêm `expo-image-picker` (bản 1.0.12/14): Play báo mất 417
 * thiết bị so với bản trước — Ô tô mất sạch 100%, Chromebook 86%, máy tính bảng
 * 4%. Tệ hơn, ai đã cài trên những máy đó thì **không nhận được bản cập nhật
 * nào nữa**.
 *
 * WeDo không cần máy ảnh để chạy. Máy không có camera vẫn xem và gửi tin nhắn
 * bình thường; chỉ riêng nút chụp là không mở được — và `chupAnh()` đã ném lỗi
 * có chữ tiếng Việt cho trường hợp đó.
 *
 * `camera.any` khai kèm để máy chỉ có camera trước cũng được tính là hợp lệ.
 */
const TINH_NANG_MAY_ANH = [
  'android.hardware.camera',
  'android.hardware.camera.any',
  'android.hardware.camera.autofocus',
];

module.exports = function withMayAnhTuyChon(config) {
  return withAndroidManifest(config, (cauHinh) => {
    const manifest = cauHinh.modResults.manifest;
    const danhSach = manifest['uses-feature'] ?? [];

    for (const ten of TINH_NANG_MAY_ANH) {
      const daCo = danhSach.find((muc) => muc.$?.['android:name'] === ten);

      // Ghi đè nếu thư viện nào đó đã khai là bắt buộc, thêm mới nếu chưa có.
      if (daCo) daCo.$['android:required'] = 'false';
      else danhSach.push({ $: { 'android:name': ten, 'android:required': 'false' } });
    }

    manifest['uses-feature'] = danhSach;
    return cauHinh;
  });
};
