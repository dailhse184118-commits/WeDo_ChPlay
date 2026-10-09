import { dinhDangGio, dinhDangNgay, dinhDangNgayGio, dinhDangSo, dinhDangThoiGian, dinhDangTien } from '../dinh-dang';

// 30/09/2026 17:30 UTC = 01/10/2026 00:30 giờ Việt Nam: sai múi giờ là sai cả ngày.
const NUA_DEM_VIET_NAM = '2026-09-30T17:30:00.000Z';
const CHIEU = '2026-09-30T07:05:00.000Z'; // 14:05 giờ Việt Nam

/** Intl có thể chèn khoảng trắng hẹp (U+202F) trước AM/PM; so sánh theo khoảng trắng thường. */
const gon = (chuoi: string) => chuoi.replace(/[  ]/g, ' ');

describe('ngày', () => {
  it('tiếng Việt giữ kiểu 30/09/2026', () => {
    expect(dinhDangNgay(CHIEU, 'vi')).toBe('30/09/2026');
  });
  it('tiếng Anh viết tên tháng để không lẫn ngày/tháng', () => {
    expect(dinhDangNgay(CHIEU, 'en')).toBe('Sep 30, 2026');
  });
  it('luôn theo giờ Việt Nam, không theo múi giờ của máy', () => {
    expect(dinhDangNgay(NUA_DEM_VIET_NAM, 'vi')).toBe('01/10/2026');
    expect(dinhDangNgay(NUA_DEM_VIET_NAM, 'en')).toBe('Oct 1, 2026');
  });
  it('kiểu gọn giữ đúng mặc định của vi-VN như trước', () => {
    expect(dinhDangThoiGian(CHIEU, 'vi', 'ngayGon')).toBe('30/9/2026');
  });
  it('giá trị không đọc được thì trả chuỗi rỗng, không phải "Invalid Date"', () => {
    expect(dinhDangNgay('khong-phai-ngay', 'en')).toBe('');
  });
});

describe('giờ', () => {
  it('tiếng Việt 24 giờ, tiếng Anh 12 giờ có AM/PM', () => {
    expect(dinhDangGio(CHIEU, 'vi')).toBe('14:05');
    expect(gon(dinhDangGio(CHIEU, 'en'))).toBe('2:05 PM');
  });
  it('ngày giờ đầy đủ', () => {
    expect(dinhDangNgayGio(CHIEU, 'vi')).toBe('14:05 30/09/2026');
    expect(gon(dinhDangNgayGio(CHIEU, 'en'))).toBe('Sep 30, 2026, 2:05 PM');
  });
});

describe('múi giờ không có tên (Hermes thiếu ICU)', () => {
  it('dời sang UTC+7 khi Intl không nhận Asia/Ho_Chi_Minh', () => {
    const Goc = Intl.DateTimeFormat;
    const spy = jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(((ma: string, tuyChon?: Intl.DateTimeFormatOptions) => {
      if (tuyChon?.timeZone === 'Asia/Ho_Chi_Minh') throw new RangeError('Invalid time zone');
      return new Goc(ma, tuyChon);
    }) as unknown as typeof Intl.DateTimeFormat);
    try {
      expect(dinhDangNgay(NUA_DEM_VIET_NAM, 'vi')).toBe('01/10/2026');
      expect(dinhDangGio(CHIEU, 'vi')).toBe('14:05');
    } finally {
      spy.mockRestore();
    }
  });
});

describe('số và tiền', () => {
  it('dấu ngăn nghìn theo ngôn ngữ', () => {
    expect(dinhDangSo(1290000, 'vi')).toBe('1.290.000');
    expect(dinhDangSo(1290000, 'en')).toBe('1,290,000');
  });
  it('tiền luôn là VND; tiếng Việt giữ đơn vị của từng màn', () => {
    expect(dinhDangTien(39000, 'vi')).toBe('39.000 đ');
    expect(dinhDangTien(39000, 'vi', 'VNĐ')).toBe('39.000 VNĐ');
    expect(dinhDangTien(39000, 'en')).toBe('39,000 VND');
    expect(dinhDangTien(39000, 'en', 'VNĐ')).toBe('39,000 VND');
  });
});
