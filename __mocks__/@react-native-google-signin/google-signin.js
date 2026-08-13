/*
  Giả lập gói đăng nhập Google cho toàn bộ Jest.

  Gói thật gọi `TurboModuleRegistry.getEnforcing('RNGoogleSignin')` ngay lúc
  nạp module, nên chỉ cần *import* nó trong môi trường test là ném
  "could not be found ... registered in the native binary". Vì vậy phải chặn ở
  mức gói chứ không thể `jest.mock` cục bộ trong từng file test — automock vẫn
  nạp module thật để dò hình dạng.

  Đặt ở `__mocks__` cạnh `node_modules` nên Jest tự dùng, không cần gọi
  `jest.mock` ở mỗi file.

  Hình dạng bám đúng bản 16.1.4: `signIn()` trả `{ type: 'success', data: { idToken } }`
  hoặc `{ type: 'cancelled' }`, và ném lỗi có thuộc tính `code` cho phần còn lại.
*/
module.exports = {
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
  },
  statusCodes: Object.freeze({
    SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED',
    IN_PROGRESS: 'IN_PROGRESS',
    PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE',
    SIGN_IN_REQUIRED: 'SIGN_IN_REQUIRED',
    NULL_PRESENTER: 'NULL_PRESENTER',
  }),
};
