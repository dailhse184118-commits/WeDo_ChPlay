import {
  doiNgaySinhSangMayChu,
  hienThiNgaySinh,
  tuThemDauGach,
} from '../ngay-sinh';

describe('hienThiNgaySinh', () => {
  it('đổi chuỗi ISO máy chủ trả về thành dd/mm/yyyy', () => {
    expect(hienThiNgaySinh('1999-08-14T00:00:00.000Z')).toBe('14/08/1999');
  });

  it('nhận cả chuỗi chỉ có phần ngày', () => {
    expect(hienThiNgaySinh('1999-08-14')).toBe('14/08/1999');
  });

  it('trả chuỗi rỗng khi chưa có ngày sinh', () => {
    expect(hienThiNgaySinh(null)).toBe('');
    expect(hienThiNgaySinh(undefined)).toBe('');
    expect(hienThiNgaySinh('')).toBe('');
  });

  /*
    Đây là lý do hàm này cắt chuỗi thay vì dựng `Date`. Máy đặt múi giờ âm mà
    đọc `new Date('1999-08-14T00:00:00.000Z').getDate()` sẽ ra 13 — người dùng
    mở màn hình thấy ngày sinh của mình lùi một hôm.
  */
  it('không lệch ngày dù máy đặt múi giờ nào', () => {
    const goc = process.env.TZ;
    try {
      process.env.TZ = 'Pacific/Honolulu'; // UTC-10
      expect(hienThiNgaySinh('1999-08-14T00:00:00.000Z')).toBe('14/08/1999');
    } finally {
      process.env.TZ = goc;
    }
  });
});

describe('tuThemDauGach', () => {
  it('chèn dấu gạch trong lúc gõ', () => {
    expect(tuThemDauGach('1')).toBe('1');
    expect(tuThemDauGach('14')).toBe('14');
    expect(tuThemDauGach('148')).toBe('14/8');
    expect(tuThemDauGach('1408')).toBe('14/08');
    expect(tuThemDauGach('140819')).toBe('14/08/19');
    expect(tuThemDauGach('14081999')).toBe('14/08/1999');
  });

  it('bỏ mọi ký tự không phải chữ số', () => {
    expect(tuThemDauGach('14/08/1999')).toBe('14/08/1999');
    expect(tuThemDauGach('14-08-1999')).toBe('14/08/1999');
  });

  it('không cho gõ quá tám chữ số', () => {
    expect(tuThemDauGach('140819999999')).toBe('14/08/1999');
  });
});

describe('doiNgaySinhSangMayChu', () => {
  it('đổi dd/mm/yyyy thành yyyy-mm-dd', () => {
    expect(doiNgaySinhSangMayChu('14/08/1999')).toEqual({
      giaTri: '1999-08-14',
      loi: null,
    });
  });

  it('coi ô trống là hợp lệ — đó là cách gỡ ngày đã lưu', () => {
    expect(doiNgaySinhSangMayChu('')).toEqual({ giaTri: null, loi: null });
    expect(doiNgaySinhSangMayChu('   ')).toEqual({ giaTri: null, loi: null });
  });

  it('từ chối chuỗi chưa gõ xong', () => {
    expect(doiNgaySinhSangMayChu('14/08').loi).toMatch(/dd\/mm\/yyyy/);
    expect(doiNgaySinhSangMayChu('14/08/199').loi).toMatch(/dd\/mm\/yyyy/);
  });

  /*
    Chốt chặn quan trọng nhất của hàm này. `new Date(2025, 1, 31)` KHÔNG báo
    lỗi — nó lặng lẽ trôi sang mùng 3 tháng 3. Thiếu bước so lại thì ngày người
    dùng gõ và ngày được lưu là hai ngày khác nhau.
  */
  it('từ chối ngày không có trên lịch thay vì để nó trôi sang tháng sau', () => {
    expect(doiNgaySinhSangMayChu('31/02/2025').giaTri).toBeNull();
    expect(doiNgaySinhSangMayChu('31/02/2025').loi).toMatch(/không có trên lịch/);
    expect(doiNgaySinhSangMayChu('31/04/2020').giaTri).toBeNull();
    expect(doiNgaySinhSangMayChu('00/01/2000').giaTri).toBeNull();
    expect(doiNgaySinhSangMayChu('01/13/2000').giaTri).toBeNull();
  });

  it('nhận 29/02 của năm nhuận và từ chối của năm thường', () => {
    expect(doiNgaySinhSangMayChu('29/02/2024').giaTri).toBe('2024-02-29');
    expect(doiNgaySinhSangMayChu('29/02/2023').giaTri).toBeNull();
  });

  it('từ chối năm quá xa và ngày ở tương lai', () => {
    expect(doiNgaySinhSangMayChu('14/08/1899').loi).toMatch(/1900/);

    const maiSau = new Date();
    maiSau.setUTCFullYear(maiSau.getUTCFullYear() + 1);
    const hai = (n: number) => String(n).padStart(2, '0');
    const chuoi = `${hai(maiSau.getUTCDate())}/${hai(maiSau.getUTCMonth() + 1)}/${maiSau.getUTCFullYear()}`;
    expect(doiNgaySinhSangMayChu(chuoi).loi).toMatch(/tương lai/);
  });

  it('nhận đúng ngày hôm nay — biên không được tính là tương lai', () => {
    const h = new Date();
    const hai = (n: number) => String(n).padStart(2, '0');
    const chuoi = `${hai(h.getUTCDate())}/${hai(h.getUTCMonth() + 1)}/${h.getUTCFullYear()}`;
    expect(doiNgaySinhSangMayChu(chuoi).loi).toBeNull();
  });

  /* Vòng tròn khép kín: gõ ra rồi đọc lại phải bằng chính nó. */
  it('đi một vòng với hienThiNgaySinh mà không đổi giá trị', () => {
    const { giaTri } = doiNgaySinhSangMayChu('14/08/1999');
    expect(hienThiNgaySinh(giaTri)).toBe('14/08/1999');
  });
});
