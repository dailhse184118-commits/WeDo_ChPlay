/*
  Giả lập gói Sign in with Apple cho toàn bộ Jest.

  Gói thật chỉ chạy được trên iPhone thật: trong Jest không có module native nên
  `isAvailableAsync` luôn `false` và nút không vẽ ra gì. Đặt ở `__mocks__` cạnh
  `node_modules` nên Jest tự dùng, không cần gọi `jest.mock` ở mỗi file — giống
  gói đăng nhập Google.

  Các enum lấy NGUYÊN từ gói thật, không chép lại: chép tay là dựng lại một thế
  giới có thể lệch với thư viện — đúng cái bẫy đã che lỗi mã "10" của Google.

  Hình dạng bám đúng bản 57.0.2: `signInAsync` trả credential có `identityToken`,
  `authorizationCode`, `fullName`, `email`; người dùng huỷ thì ném lỗi mang
  `code: 'ERR_REQUEST_CANCELED'`.
*/
const React = require('react');

const kieu = jest.requireActual('expo-apple-authentication/build/AppleAuthentication.types');

/*
  Nút thật là view native của Apple (`ASAuthorizationAppleIDButton`) và gọi
  `onPress` khi bấm. Ở đây là một Pressable giữ nguyên mọi prop, để test đọc
  được `buttonType`, `buttonStyle`, `cornerRadius` đã truyền.
*/
function AppleAuthenticationButton({ onPress, ...props }) {
  const { Pressable } = jest.requireActual('react-native');
  return React.createElement(Pressable, { ...props, onPress, accessibilityRole: 'button' });
}

module.exports = {
  ...kieu,
  isAvailableAsync: jest.fn(async () => false),
  signInAsync: jest.fn(),
  refreshAsync: jest.fn(),
  signOutAsync: jest.fn(),
  getCredentialStateAsync: jest.fn(),
  formatFullName: jest.fn(),
  addRevokeListener: jest.fn(() => ({ remove: jest.fn() })),
  AppleAuthenticationButton,
};
