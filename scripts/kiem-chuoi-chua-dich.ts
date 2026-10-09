/**
 * Tìm chữ tiếng Việt còn viết thẳng trong mã giao diện, chưa đưa vào từ điển
 * (src/i18n/tu-dien). Chữ nào còn sót thì ở chế độ tiếng Anh vẫn hiện tiếng Việt.
 *
 *   npm run kiem-dich                 liệt kê từng chỗ
 *   npm run kiem-dich -- --tom-tat    chỉ đếm theo tệp
 *   npm run kiem-dich -- --nghiem     còn sót thì thoát mã 1 (cho CI)
 *
 * Chạy từ gốc dự án (Node 22.18+ tự bỏ kiểu TypeScript, không cần tsx).
 * Đọc bằng bộ phân tích của TypeScript chứ không dùng biểu thức chính quy, nên
 * chú thích không bị tính, còn chữ trong JSX, thuộc tính và chuỗi mẫu thì có.
 * Bỏ qua: src/i18n/tu-dien (chính là từ điển), tệp kiểm thử, đường dẫn import,
 * kiểu literal (`'tháng' | 'năm'`), khoá của đối tượng, đối số của console.*, và
 * những gì ghi trong chuoi-duoc-phep.ts.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import ts from 'typescript';
import { CHUOI_DUOC_PHEP, TEP_BO_QUA } from './chuoi-duoc-phep.ts';

/** Chữ cái có dấu tiếng Việt (dạng dựng sẵn NFC) — chữ không dấu không phân biệt được với tiếng Anh. */
export const CO_DAU_TIENG_VIET = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function coTiengViet(chuoi: string) {
  // Chuẩn hoá NFC trước: chữ lưu dạng tách dấu (NFD) trông y hệt nhưng không khớp lớp ký tự trên.
  return CO_DAU_TIENG_VIET.test(chuoi.normalize('NFC'));
}

function laDoiSoConsole(node: ts.Node): boolean {
  for (let cha = node.parent; cha; cha = cha.parent) {
    if (ts.isCallExpression(cha)) {
      const ham = cha.expression;
      if (ts.isPropertyAccessExpression(ham) && ts.isIdentifier(ham.expression) && ham.expression.text === 'console') return true;
    }
    if (ts.isFunctionLike(cha) || ts.isSourceFile(cha)) return false;
  }
  return false;
}

function boQuaChuoi(node: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral): boolean {
  const cha = node.parent;
  if (!cha) return false;
  if (ts.isImportDeclaration(cha) || ts.isExportDeclaration(cha) || ts.isExternalModuleReference(cha)) return true;
  if (ts.isLiteralTypeNode(cha)) return true;
  // Khoá đối tượng: { 'Đã hủy': … } — dữ liệu, không phải chữ hiển thị.
  if ((ts.isPropertyAssignment(cha) || ts.isPropertySignature(cha) || ts.isMethodDeclaration(cha)) && cha.name === node) return true;
  return laDoiSoConsole(node);
}

/**
 * Những chữ tiếng Việt viết thẳng trong một tệp mã nguồn.
 * `tep` (đường dẫn từ gốc dự án, dấu `/`) dùng để áp danh sách cho phép và chọn .ts/.tsx.
 */
export function timChuoiChuaDich(maNguon: string, tep = 'mau.tsx'): string[] {
  const nguon = ts.createSourceFile(tep, maNguon, ts.ScriptTarget.Latest, true, tep.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.TSX);
  const ketQua: string[] = [];
  const ghi = (chuoi: string) => {
    const gon = chuoi.replace(/\s+/g, ' ').trim();
    if (gon && coTiengViet(gon)) ketQua.push(gon);
  };

  const duyet = (node: ts.Node) => {
    if (ts.isJsxText(node)) {
      ghi(node.text);
    } else if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      if (!boQuaChuoi(node)) ghi(node.text);
    } else if (ts.isTemplateExpression(node)) {
      if (!laDoiSoConsole(node)) {
        const phan = [node.head.text, ...node.templateSpans.map((doan) => doan.literal.text)];
        if (phan.some(coTiengViet)) ghi(node.getText(nguon).slice(1, -1));
      }
      // Biểu thức bên trong `${…}` có thể chứa chuỗi riêng.
      node.templateSpans.forEach((doan) => duyet(doan.expression));
      return;
    }
    ts.forEachChild(node, duyet);
  };
  duyet(nguon);

  const duocPhep = new Set(
    CHUOI_DUOC_PHEP.filter((muc) => muc.tep === tep).map((muc) => muc.chuoi.normalize('NFC').trim()),
  );
  return ketQua.filter((chuoi) => !duocPhep.has(chuoi.normalize('NFC')));
}

function tuongDoi(goc: string, duongDan: string) {
  return relative(goc, duongDan).split(sep).join('/');
}

const THU_MUC_BO_QUA = new Set(['__tests__', '__mocks__', 'test-utils', 'locales']);

/** Các tệp .ts/.tsx cần quét dưới `src/` của `goc`, đường dẫn tương đối dấu `/`. */
export function danhSachTep(goc: string, thuMuc = join(goc, 'src')): string[] {
  const boQua = new Set(TEP_BO_QUA.map((muc) => muc.tep));
  return readdirSync(thuMuc).flatMap((ten) => {
    const duongDan = join(thuMuc, ten);
    const tep = tuongDoi(goc, duongDan);
    if (statSync(duongDan).isDirectory()) {
      return THU_MUC_BO_QUA.has(ten) || tep === 'src/i18n/tu-dien' ? [] : danhSachTep(goc, duongDan);
    }
    if (boQua.has(tep) || /\.(test|spec)\.tsx?$/.test(ten) || ten.endsWith('.d.ts')) return [];
    return /\.tsx?$/.test(ten) ? [tep] : [];
  });
}

/** Quét các tệp `tep` (tương đối với `goc`); chỉ trả những tệp còn chữ sót. */
export function quetTatCa(goc: string, tep: string[]): Record<string, string[]> {
  const ketQua: Record<string, string[]> = {};
  for (const t of tep) {
    const conSot = timChuoiChuaDich(readFileSync(join(goc, t), 'utf8'), t);
    if (conSot.length > 0) ketQua[t] = conSot;
  }
  return ketQua;
}

function chay() {
  const thamSo = new Set(process.argv.slice(2));
  const goc = process.cwd();
  const theoTep = quetTatCa(goc, danhSachTep(goc));
  const cacTep = Object.entries(theoTep);
  const tong = cacTep.reduce((n, [, ds]) => n + ds.length, 0);

  if (tong === 0) {
    console.log('Không còn chữ tiếng Việt nào nằm ngoài từ điển.');
    return;
  }

  console.log(`Chữ tiếng Việt chưa đưa vào từ điển: ${tong} chỗ trong ${cacTep.length} tệp.\n`);
  cacTep.sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
  for (const [tep, ds] of cacTep) {
    console.log(`${tep} (${ds.length})`);
    if (thamSo.has('--tom-tat')) continue;
    for (const chuoi of ds) console.log(`  ${chuoi.length > 110 ? `${chuoi.slice(0, 107)}...` : chuoi}`);
  }
  if (thamSo.has('--nghiem')) process.exitCode = 1;
}

if (/kiem-chuoi-chua-dich.ts$/.test(process.argv[1] ?? '')) chay();
