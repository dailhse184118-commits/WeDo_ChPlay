import { ghepNgayGio, tuThemDauGachGio } from '../thoi-diem';

describe('tuThemDauGachGio', () => {
  it('chèn dấu hai chấm trong lúc gõ', () => {
    expect(tuThemDauGachGio('2')).toBe('2');
    expect(tuThemDauGachGio('20')).toBe('20');
    expect(tuThemDauGachGio('200')).toBe('20:0');
    expect(tuThemDauGachGio('2000')).toBe('20:00');
  });

  it('bỏ ký tự thừa và không cho quá bốn chữ số', () => {
    expect(tuThemDauGachGio('20:00')).toBe('20:00');
    expect(tuThemDauGachGio('200000')).toBe('20:00');
  });
});

describe('ghepNgayGio', () => {
  /*
    Đây là điều quan trọng nhất của tệp này. Người dùng gõ "20:00" nghĩa là tám
    giờ tối THEO GIỜ CỦA HỌ. Nếu dựng theo UTC như ngày sinh thì mọi cuộc họp ở
    Việt Nam lệch bảy tiếng — và không có gì báo lỗi cả.
  */
  it('hiểu giờ người dùng gõ là giờ địa phương, không phải UTC', () => {
    const { giaTri } = ghepNgayGio('25/09/2026', '20:00');
    const doc = new Date(giaTri!);

    expect(doc.getFullYear()).toBe(2026);
    expect(doc.getMonth()).toBe(8); // tháng 9
    expect(doc.getDate()).toBe(25);
    expect(doc.getHours()).toBe(20);
    expect(doc.getMinutes()).toBe(0);
  });

  it('trả về chuỗi ISO', () => {
    const { giaTri, loi } = ghepNgayGio('25/09/2026', '08:30');
    expect(loi).toBeNull();
    expect(giaTri).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  /*
    Lịch họp KHÁC ngày sinh: ngày ở tương lai mới là chuyện thường. Hàm dùng
    chung `doiNgaySinhSangMayChu` để kiểm tra đúng lịch, nên phải chắc rằng câu
    từ chối "ở tương lai" của nó không lọt sang đây.
  */
  it('nhận ngày ở tương lai — đó mới là lịch họp bình thường', () => {
    const sangNam = new Date();
    sangNam.setFullYear(sangNam.getFullYear() + 1);
    const hai = (n: number) => String(n).padStart(2, '0');
    const chuoi = `${hai(sangNam.getDate())}/${hai(sangNam.getMonth() + 1)}/${sangNam.getFullYear()}`;

    expect(ghepNgayGio(chuoi, '09:00').loi).toBeNull();
  });

  it('vẫn từ chối ngày không có trên lịch', () => {
    expect(ghepNgayGio('31/02/2026', '20:00').giaTri).toBeNull();
    expect(ghepNgayGio('31/04/2026', '20:00').giaTri).toBeNull();
  });

  it('nhận 29/02 của năm nhuận', () => {
    expect(ghepNgayGio('29/02/2028', '20:00').loi).toBeNull();
  });

  it('từ chối giờ chưa gõ xong', () => {
    expect(ghepNgayGio('25/09/2026', '20').loi).toMatch(/hh:mm/);
    expect(ghepNgayGio('25/09/2026', '').loi).toMatch(/hh:mm/);
  });

  it('từ chối giờ ngoài khoảng đồng hồ', () => {
    expect(ghepNgayGio('25/09/2026', '25:00').loi).toMatch(/00:00 đến 23:59/);
    expect(ghepNgayGio('25/09/2026', '20:60').loi).toMatch(/00:00 đến 23:59/);
  });

  it('nhận hai biên của đồng hồ', () => {
    expect(ghepNgayGio('25/09/2026', '00:00').loi).toBeNull();
    expect(ghepNgayGio('25/09/2026', '23:59').loi).toBeNull();
  });

  it('báo lỗi ngày khi ngày chưa gõ xong', () => {
    expect(ghepNgayGio('25/09', '20:00').giaTri).toBeNull();
    expect(ghepNgayGio('', '20:00').giaTri).toBeNull();
  });
});
