import { colors, fontSize, lineHeight, sizes, spacing } from '../tokens';

/*
  Các quy tắc co giãn được kiểm ở `build-tokens.test.ts`, nơi gọi thẳng hàm
  thuần với đủ mọi kích cỡ. Ở đây chỉ kiểm phần `tokens.ts` tự làm: hằng số
  thương hiệu, và việc nó thật sự nối được số đo máy vào bộ dựng.
*/
describe('design tokens', () => {
  it('dùng đúng màu thương hiệu WeDo', () => {
    expect(colors.primary).toBe('#0055c7');
  });

  it('có màu riêng cho chữ nằm trên nền thương hiệu', () => {
    expect(colors.onPrimary).toBe('#ffffff');
  });

  it('xuất đủ bốn nhóm token phụ thuộc kích cỡ máy', () => {
    for (const nhom of [spacing, fontSize, lineHeight, sizes]) {
      expect(Object.keys(nhom).length).toBeGreaterThan(0);
      for (const giaTri of Object.values(nhom)) {
        expect(giaTri).toBeGreaterThan(0);
      }
    }
  });
});
