import { khaiBaoTuDien, noiSuy, soNhieu, theoNgonNgu } from '../dich';
import { datNgonNguChoKiemThu } from '../ngon-ngu';

describe('điền chỗ trống', () => {
  it('thay đúng tên, giữ phần còn lại', () => {
    expect(noiSuy('Đơn {ma} đã thanh toán', { ma: 'WD123' })).toBe('Đơn WD123 đã thanh toán');
    expect(noiSuy('{a}/{b} credits', { a: 3, b: 300 })).toBe('3/300 credits');
  });
  it('thiếu giá trị thì để nguyên chỗ trống để lộ lỗi, không nuốt chữ', () => {
    expect(noiSuy('Hello {ten}', {})).toBe('Hello {ten}');
  });
});

describe('số ít, số nhiều', () => {
  const dang = { mot: '{so} credit left', nhieu: '{so} credits left' };
  it('tiếng Anh: đúng 1 là số ít, còn lại số nhiều', () => {
    expect(soNhieu('en', 1, dang)).toBe('1 credit left');
    expect(soNhieu('en', 0, dang)).toBe('0 credits left');
    expect(soNhieu('en', 2, dang)).toBe('2 credits left');
  });
  it('tiếng Việt không chia số nhiều: luôn một dạng', () => {
    expect(soNhieu('vi', 1, { mot: 'Còn {so} lượt', nhieu: 'Còn {so} lượt' })).toBe('Còn 1 lượt');
    expect(soNhieu('vi', 5, { mot: 'sai', nhieu: 'Còn {so} lượt' })).toBe('Còn 5 lượt');
  });
  it('số được viết theo ngôn ngữ', () => {
    expect(soNhieu('en', 1000, dang)).toBe('1,000 credits left');
    expect(soNhieu('vi', 1000, { mot: '{so}', nhieu: '{so}' })).toBe('1.000');
  });
});

describe('chọn bản theo ngôn ngữ', () => {
  const tuDien = khaiBaoTuDien(
    { chao: 'Xin chào', so: (n: number) => `${n} việc` },
    { chao: 'Hello', so: (n: number) => `${n} tasks` },
  );
  it('trả đúng bản của ngôn ngữ được hỏi', () => {
    expect(theoNgonNgu(tuDien, 'vi').chao).toBe('Xin chào');
    expect(theoNgonNgu(tuDien, 'en').so(3)).toBe('3 tasks');
  });
  it('không truyền ngôn ngữ thì lấy ngôn ngữ đang dùng', () => {
    datNgonNguChoKiemThu('en');
    expect(theoNgonNgu(tuDien).chao).toBe('Hello');
    datNgonNguChoKiemThu('vi');
    expect(theoNgonNgu(tuDien).chao).toBe('Xin chào');
    datNgonNguChoKiemThu(null);
  });
});
