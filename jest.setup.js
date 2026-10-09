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

/*
  `react-native-keyboard-controller` đọc bàn phím qua API native của Android
  (`WindowInsetsAnimation`), thứ không tồn tại trong Jest. Thư viện có sẵn mock
  chính thức — dùng nó, đừng tự viết.
*/
jest.mock('react-native-keyboard-controller', () =>
  require('react-native-keyboard-controller/jest'),
);


/*
  Ngôn ngữ mặc định của mọi test là tiếng Việt: jest-expo tự mock expo-localization
  với languageCode 'en', nhưng các bộ test cũ so khớp chữ tiếng Việt. Test nào cần
  tiếng Anh thì tự gọi datNgonNguChoKiemThu('en') (và nhớ trả lại).
*/
const { datNgonNguChoKiemThu } = require('./src/i18n/ngon-ngu');

beforeEach(() => {
  datNgonNguChoKiemThu('vi');
});

/*
  Giả lập Hermes trên máy thật: các lớp Intl dưới đây KHÔNG có trong Hermes
  (dùng tới là "undefined cannot be used as a constructor", sập màn hình), nhưng
  Node có nên test vẫn xanh. Xoá đi để test bắt được ngay. Bản 1.0.16 (build 6)
  từng sập vì `new Intl.PluralRules`.
*/
delete Intl.PluralRules;
delete Intl.RelativeTimeFormat;
delete Intl.ListFormat;
delete Intl.Segmenter;
delete Intl.DisplayNames;
