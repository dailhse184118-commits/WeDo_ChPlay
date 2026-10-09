/*
  Mọi từ điển trong src/i18n/tu-dien phải có đủ khoá ở CẢ HAI ngôn ngữ, cùng
  hình dạng. TypeScript đã chặn lúc build; phép kiểm này chặn thêm lúc chạy
  (giá trị rỗng, hàm trả về rỗng, câu tiếng Anh còn sót tiếng Việt…), và tự
  quét mọi tệp trong thư mục nên từ điển mới thêm cũng được kiểm.
*/
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const THU_MUC = join(__dirname, '..', 'tu-dien');

/** Tên riêng được phép giữ dấu trong câu tiếng Anh. */
const TEN_RIENG = ['Trang Nguyễn', 'Lê Hữu Đại', 'Đại'];
const CO_DAU = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

type CapTuDien = { tep: string; ten: string; vi: unknown; en: unknown };

function napTatCa(): CapTuDien[] {
  const tep = readdirSync(THU_MUC).filter((ten) => ten.endsWith('.ts') && !ten.endsWith('.test.ts'));
  const ketQua: CapTuDien[] = [];
  for (const ten of tep) {
    const moDun = require(join(THU_MUC, ten)) as Record<string, unknown>;
    for (const [tenXuat, giaTri] of Object.entries(moDun)) {
      if (giaTri && typeof giaTri === 'object' && 'vi' in giaTri && 'en' in giaTri) {
        const { vi, en } = giaTri as { vi: unknown; en: unknown };
        ketQua.push({ tep: ten, ten: tenXuat, vi, en });
      }
    }
  }
  return ketQua;
}

function loai(giaTri: unknown) {
  if (Array.isArray(giaTri)) return 'mang';
  if (giaTri === null) return 'null';
  return typeof giaTri;
}

/** So hai cây; ghi danh sách chỗ lệch dạng "đường.dẫn: lý do" vào `loiGap`. */
function soSanh(vi: unknown, en: unknown, duong: string, loiGap: string[]) {
  const loaiVi = loai(vi);
  const loaiEn = loai(en);
  if (loaiVi !== loaiEn) {
    loiGap.push(`${duong}: tiếng Việt là ${loaiVi}, tiếng Anh là ${loaiEn}`);
    return;
  }
  if (loaiVi === 'string') {
    if (!(vi as string).trim()) loiGap.push(`${duong}: bản tiếng Việt rỗng`);
    if (!(en as string).trim()) loiGap.push(`${duong}: bản tiếng Anh rỗng`);
    let conLai = en as string;
    for (const ten of TEN_RIENG) conLai = conLai.split(ten).join('');
    if (CO_DAU.test(conLai.normalize('NFC'))) loiGap.push(`${duong}: câu tiếng Anh còn chữ tiếng Việt: "${en}"`);
    return;
  }
  if (loaiVi === 'function') {
    const hamVi = vi as (...thamSo: unknown[]) => unknown;
    const hamEn = en as (...thamSo: unknown[]) => unknown;
    if (hamVi.length !== hamEn.length) loiGap.push(`${duong}: số tham số khác nhau (${hamVi.length} và ${hamEn.length})`);
    const thamSo = Array.from({ length: hamVi.length }, (_, viTri) => viTri + 2);
    soSanh(hamVi(...thamSo), hamEn(...thamSo), `${duong}()`, loiGap);
    return;
  }
  if (loaiVi === 'mang') {
    const mangVi = vi as unknown[];
    const mangEn = en as unknown[];
    if (mangVi.length !== mangEn.length) {
      loiGap.push(`${duong}: mảng dài ${mangVi.length} và ${mangEn.length}`);
      return;
    }
    mangVi.forEach((phanTu, viTri) => soSanh(phanTu, mangEn[viTri], `${duong}[${viTri}]`, loiGap));
    return;
  }
  if (loaiVi === 'object') {
    const doiTuongVi = vi as Record<string, unknown>;
    const doiTuongEn = en as Record<string, unknown>;
    for (const khoa of Object.keys(doiTuongVi)) {
      if (!(khoa in doiTuongEn)) loiGap.push(`${duong}.${khoa}: thiếu bản tiếng Anh`);
    }
    for (const khoa of Object.keys(doiTuongEn)) {
      if (!(khoa in doiTuongVi)) loiGap.push(`${duong}.${khoa}: thiếu bản tiếng Việt`);
    }
    for (const khoa of Object.keys(doiTuongVi)) {
      if (khoa in doiTuongEn) soSanh(doiTuongVi[khoa], doiTuongEn[khoa], `${duong}.${khoa}`, loiGap);
    }
  }
}

describe('từ điển song ngữ', () => {
  it('tìm thấy các từ điển trong src/i18n/tu-dien', () => {
    expect(napTatCa().length).toBeGreaterThan(0);
  });

  it('mỗi khoá có đủ cả tiếng Việt và tiếng Anh, cùng dạng, không rỗng; câu tiếng Anh không còn tiếng Việt', () => {
    const loiGap: string[] = [];
    for (const { tep, ten, vi, en } of napTatCa()) soSanh(vi, en, `${tep}:${ten}`, loiGap);
    expect(loiGap).toEqual([]);
  });

  it('phép so sánh bắt được khoá thiếu ở mỗi bên (tự kiểm phép kiểm)', () => {
    const loiGap: string[] = [];
    soSanh({ a: 'Một', b: 'Hai' }, { a: 'One' }, 'mau', loiGap);
    soSanh({ a: 'Một' }, { a: 'One', c: 'Three' }, 'mau', loiGap);
    soSanh({ f: (n: number) => `${n} việc` }, { f: () => '' }, 'mau', loiGap);
    soSanh({ x: 'Xin chào' }, { x: 'Xin chào' }, 'mau', loiGap);
    expect(loiGap).toEqual([
      'mau.b: thiếu bản tiếng Anh',
      'mau.c: thiếu bản tiếng Việt',
      'mau.f: số tham số khác nhau (1 và 0)',
      'mau.f(): bản tiếng Anh rỗng',
      'mau.x: câu tiếng Anh còn chữ tiếng Việt: "Xin chào"',
    ]);
  });
});
