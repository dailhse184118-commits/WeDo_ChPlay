/**
 * Bỏ các trường SỐ PHIÊN BẢN khỏi dấu vân tay OTA.
 *
 * `@expo/fingerprint` băm toàn bộ app.json cho mọi nền tảng. Không có tệp này
 * thì mỗi lần tăng `ios.buildNumber` (build lại để nộp Apple) là đổi vân tay
 * Android, và tăng `android.versionCode` là đổi vân tay iOS — bản đang cài của
 * nền tảng kia thôi nhận OTA dù mã native không đổi gì.
 *
 * Chỉ bỏ số phiên bản. Mọi thay đổi khác trong app.json (plugin, quyền, khối
 * ios/android) vẫn đổi vân tay như cũ, và phải như thế.
 */
const { SourceSkips } = require('expo/fingerprint');

/** @type {import('expo/fingerprint').Config} */
module.exports = {
  // PHẢI giữ lại bước bỏ qua mặc định (PackageJsonAndroidAndIosScriptsIfNotContainRun):
  // Prebuild trên EAS đổi script `android`/`ios` trong package.json thành `expo run:*`,
  // thiếu nó là vân tay máy và vân tay EAS lệch nhau, build dừng ở Configure expo-updates.
  sourceSkips:
    SourceSkips.ExpoConfigVersions | SourceSkips.PackageJsonAndroidAndIosScriptsIfNotContainRun,
};
