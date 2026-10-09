/*
  Bộ quét chữ tiếng Việt nằm ngoài từ điển (scripts/kiem-chuoi-chua-dich.ts),
  và toàn bộ src/ phải sạch (trừ scripts/chuoi-duoc-phep.ts, mỗi mục có lý do).
  Thêm chữ tiếng Việt viết thẳng vào mã giao diện là đỏ.
*/
import { join } from 'node:path';
import { danhSachTep, quetTatCa, timChuoiChuaDich } from '../../../scripts/kiem-chuoi-chua-dich';
import { chuVietConSot } from '../chu-viet-con-sot';

const GOC = join(__dirname, '..', '..', '..');

describe('bộ quét chữ chưa dịch', () => {
  it('bắt chữ trong JSX, thuộc tính, chuỗi thường và chuỗi mẫu', () => {
    const ma = [
      'export function A({ n }: { n: number }) {',
      '  const nhan = "Đăng nhập";',
      '  return (',
      '    <View accessibilityLabel="Thông báo" title={`Còn ${n} lượt`}>',
      '      <Text>Xin chào</Text>',
      '    </View>',
      '  );',
      '}',
    ].join('\n');
    expect(timChuoiChuaDich(ma)).toEqual(['Đăng nhập', 'Thông báo', 'Còn ${n} lượt', 'Xin chào']);
  });

  it('bỏ qua chú thích, import, kiểu literal, khoá đối tượng và console', () => {
    const ma = [
      "import anh from './ảnh.webp';",
      '// Chú thích tiếng Việt',
      '/* Một chú thích khác */',
      "type ChuKy = 'tháng' | 'năm';",
      "const bang = { 'Đã hủy': 1 };",
      "console.error('[WeDo] Giao diện gặp lỗi:', 1);",
      'export const A = () => <Text>{/* chú thích */}OK</Text>;',
    ].join('\n');
    expect(timChuoiChuaDich(ma)).toEqual([]);
  });

  it('chữ không dấu không bị bắt nhầm', () => {
    expect(timChuoiChuaDich('export const A = () => <Text>Plan less, Do more</Text>;')).toEqual([]);
  });

  it('chữ lưu dạng tách dấu (NFD) vẫn bị bắt', () => {
    expect(timChuoiChuaDich(`export const A = () => <Text>${'Thông báo'.normalize('NFD')}</Text>;`)).toHaveLength(1);
  });

  it('danh sách cho phép chỉ áp cho đúng tệp được ghi', () => {
    const ma = "export const T = 'Tiếng Việt';";
    expect(timChuoiChuaDich(ma, 'src/i18n/ngon-ngu.ts')).toEqual([]);
    expect(timChuoiChuaDich(ma, 'src/app/khac.ts')).toEqual(['Tiếng Việt']);
  });

  it('không quét từ điển, tệp kiểm thử và thư mục kiểm thử', () => {
    const tep = danhSachTep(GOC);
    expect(tep).toContain('src/i18n/ngon-ngu.ts');
    expect(tep.some((t) => t.startsWith('src/i18n/tu-dien/'))).toBe(false);
    expect(tep.some((t) => t.includes('__tests__') || /\.test\.tsx?$/.test(t))).toBe(false);
  });
});

describe('chữ viết còn sót trong cây hiển thị', () => {
  it('chỉ trả chữ có dấu tiếng Việt, trừ phần được bỏ qua', () => {
    const cay = JSON.stringify([{ type: 'Text', props: { testID: 'x' }, children: ['Hello', 'Đăng nhập', 'Lê Hữu Đại'] }]);
    expect(chuVietConSot(cay)).toEqual(['Đăng nhập', 'Lê Hữu Đại']);
    expect(chuVietConSot(cay, ['Lê Hữu Đại'])).toEqual(['Đăng nhập']);
    expect(chuVietConSot('plain english')).toEqual([]);
  });
});

describe('toàn bộ src đã dịch xong', () => {
  it('quét toàn bộ src/ ra rỗng (trừ chuoi-duoc-phep.ts)', () => {
    expect(quetTatCa(GOC, danhSachTep(GOC))).toEqual({});
  });
});
