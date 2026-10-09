/*
  Bộ quét chữ tiếng Việt nằm ngoài từ điển (scripts/kiem-chuoi-chua-dich.ts),
  và danh sách tệp đã dịch xong phải sạch. Việc dịch từng khu vực thêm tệp vào
  TEP_DA_DICH; tệp đã có trong danh sách mà thêm chữ tiếng Việt viết thẳng là đỏ.
*/
import { join } from 'node:path';
import { danhSachTep, quetTatCa, timChuoiChuaDich } from '../../../scripts/kiem-chuoi-chua-dich';
import { chuVietConSot } from '../chu-viet-con-sot';

const GOC = join(__dirname, '..', '..', '..');

/** Các tệp đã đưa hết chữ vào từ điển (đường dẫn từ gốc dự án, dấu `/`). */
const TEP_DA_DICH: string[] = [
  'src/components/account/BangChonNgonNgu.tsx',
  'src/lib/i18n/dong-bo-ngon-ngu.ts',
  'src/i18n/NgonNguProvider.tsx',
  'src/i18n/dich.ts',
  'src/i18n/dinh-dang.ts',
  'src/i18n/loi.ts',
  'src/i18n/ngon-ngu.ts',
  'src/app/(auth)/login.tsx',
  'src/app/(auth)/register.tsx',
  'src/app/(auth)/forgot-password.tsx',
  'src/app/(onboarding)/create-workspace.tsx',
  'src/components/auth/CongDieuKhoan.tsx',
  'src/components/auth/ODongYDieuKhoan.tsx',
  'src/components/auth/VeDangNhapKhiDangXuat.tsx',
  'src/components/ui/GoogleButton.tsx',
  'src/components/ui/AppleButton.tsx',
  'src/components/ui/TextField.tsx',
  'src/components/workspace/CreateWorkspaceForm.tsx',
  'src/lib/auth/apple-signin.ts',
  'src/lib/auth/google-signin.ts',
  'src/lib/auth/auth-context.tsx',
  'src/lib/auth/nguon-loi.ts',
];

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

describe('các tệp đã dịch không còn chữ tiếng Việt viết thẳng', () => {
  it('TEP_DA_DICH quét ra rỗng', () => {
    expect(quetTatCa(GOC, TEP_DA_DICH)).toEqual({});
  });
});

describe('tiến độ', () => {
  it('in số chữ tiếng Việt còn lại toàn repo (không fail)', () => {
    const conLai = quetTatCa(GOC, danhSachTep(GOC));
    const soChuoi = Object.values(conLai).reduce((n, ds) => n + ds.length, 0);
    console.log(`[kiem-dich] Còn ${soChuoi} chữ tiếng Việt chưa dịch trong ${Object.keys(conLai).length} tệp.`);
    expect(soChuoi).toBeGreaterThanOrEqual(0);
  });
});
