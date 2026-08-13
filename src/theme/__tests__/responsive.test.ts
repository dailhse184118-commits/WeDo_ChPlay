import {
  CHIEU_RONG_NOI_DUNG_TOI_DA,
  GIOI_HAN_CO_CHU,
  cappedFontScale,
  lineHeightFor,
  scaleForWidth,
  widthStep,
} from '../responsive';

describe('bậc thang theo bề rộng màn hình', () => {
  it('xếp máy 5 inch vào bậc chật', () => {
    expect(widthStep(320)).toBe('compact');
    expect(widthStep(360)).toBe('compact');
  });

  it('xếp máy phổ thông vào bậc thường', () => {
    expect(widthStep(361)).toBe('regular');
    expect(widthStep(411)).toBe('regular');
    expect(widthStep(430)).toBe('regular');
  });

  it('xếp máy to và tablet vào bậc rộng', () => {
    expect(widthStep(431)).toBe('wide');
    expect(widthStep(800)).toBe('wide');
  });

  it('thu nhỏ ở bậc chật và nới ra ở bậc rộng', () => {
    expect(scaleForWidth('compact')).toBeLessThan(1);
    expect(scaleForWidth('regular')).toBe(1);
    expect(scaleForWidth('wide')).toBeGreaterThan(1);
  });

  it('giữ hệ số trong khoảng đủ hẹp để bố cục không biến dạng', () => {
    // Lệch quá 10% là bố cục trông như của một app khác, không còn là "co giãn".
    expect(scaleForWidth('compact')).toBeGreaterThanOrEqual(0.9);
    expect(scaleForWidth('wide')).toBeLessThanOrEqual(1.1);
  });
});

describe('chặn cỡ chữ hệ thống', () => {
  it('giữ nguyên khi người dùng chưa phóng chữ', () => {
    expect(cappedFontScale(1)).toBe(1);
  });

  it('giữ nguyên các mức dưới ngưỡng', () => {
    expect(cappedFontScale(1.15)).toBe(1.15);
  });

  it('chặn mức 200% của Android lại ở ngưỡng', () => {
    expect(cappedFontScale(2)).toBe(GIOI_HAN_CO_CHU);
  });

  it('không thu nhỏ khi hệ thống báo cỡ chữ dưới 1', () => {
    // Android cho hạ xuống 0,85. Thu theo là chữ nhỏ hơn cả mức người dùng chọn.
    expect(cappedFontScale(0.85)).toBe(1);
  });
});

describe('chiều cao dòng', () => {
  it('cao hơn cỡ chữ để chữ không dính vào nhau', () => {
    expect(lineHeightFor(16, 1)).toBeGreaterThan(16);
  });

  it('lớn theo cỡ chữ hệ thống, vì React Native không tự phóng lineHeight', () => {
    // Đây là mấu chốt: `fontSize` được phóng lúc dựng chữ còn `lineHeight` thì
    // không. Giữ nguyên là ở cỡ chữ lớn chữ chồng lên nhau.
    expect(lineHeightFor(16, 2)).toBeGreaterThan(lineHeightFor(16, 1));
  });

  it('vượt qua ngưỡng chặn 130%, không dừng lại ở đó', () => {
    // Chữ vẫn cao thêm tới 200%, nên khoảng dòng phải theo hết chứ không bị chặn.
    expect(lineHeightFor(16, 2)).toBeGreaterThan(lineHeightFor(16, GIOI_HAN_CO_CHU));
  });

  it('không thu lại khi hệ thống báo cỡ chữ dưới 1', () => {
    expect(lineHeightFor(16, 0.85)).toBe(lineHeightFor(16, 1));
  });

  it('trả về số nguyên', () => {
    expect(Number.isInteger(lineHeightFor(13, 1.15))).toBe(true);
  });
});

describe('bề rộng nội dung tối đa', () => {
  it('rộng hơn máy điện thoại to nhất để không kẹp nhầm điện thoại', () => {
    expect(CHIEU_RONG_NOI_DUNG_TOI_DA).toBeGreaterThan(430);
  });
});
