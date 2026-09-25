/*
  Ghim múi giờ cho mọi lượt chạy test.

  Một số test — ví dụ `src/lib/ai/__tests__/han-muc.test.ts` — kiểm cách app đọc
  mốc thời gian theo GIỜ MÁY NGƯỜI DÙNG, mà người dùng WeDo ở Việt Nam. Không
  ghim thì kết quả phụ thuộc máy chạy test: pass trên laptop ở Việt Nam, hỏng
  trên máy CI hay máy build chạy UTC.

  Đặt ở `globalSetup` vì nó chạy trước khi Jest dựng các worker, nên worker nào
  cũng thừa hưởng biến này. Đặt trong `jest.setup.js` thì quá muộn với worker.
*/
module.exports = () => {
  process.env.TZ = 'Asia/Ho_Chi_Minh';
};
