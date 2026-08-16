/*
  Thiết lập chung cho mọi bộ test.

  `AsyncStorage` là mô-đun native nên không tồn tại trong môi trường Jest. Thư
  viện có sẵn mock chính thức; dùng nó thay vì tự viết để không phải đuổi theo
  mỗi lần thư viện đổi API — và để tránh đúng cái bẫy đã che lỗi mã DEVELOPER_ERROR:
  mock tự chế dễ mô phỏng một thế giới không tồn tại.

  Cần từ khi cache của react-query được ghi xuống đĩa để mất mạng vẫn xem được
  dữ liệu lần trước.
*/
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
