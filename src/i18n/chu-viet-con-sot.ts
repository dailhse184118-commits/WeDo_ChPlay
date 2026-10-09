import { CO_DAU_TIENG_VIET } from '../../scripts/kiem-chuoi-chua-dich';

/**
 * Dùng trong test hiển thị tiếng Anh: trả các đoạn chữ còn dấu tiếng Việt.
 *
 * `cayDaDung` là cây đã dựng của RNTL (`JSON.stringify(screen.toJSON())`) hoặc
 * bất kỳ chuỗi nào gom chữ hiển thị. Chữ được tách theo giá trị chuỗi JSON nên
 * tên khoá không bị tính; nếu không phải JSON thì xem cả chuỗi là một đoạn.
 * `boQua`: đoạn chứa một trong các chuỗi này (tên riêng, dữ liệu người dùng) bị bỏ qua.
 */
export function chuVietConSot(cayDaDung: string, boQua: string[] = []): string[] {
  let doan: string[] = [];
  try {
    JSON.parse(cayDaDung, (_khoa, giaTri) => {
      if (typeof giaTri === 'string') doan.push(giaTri);
      return giaTri;
    });
  } catch {
    doan = [cayDaDung];
  }
  const boQuaNfc = boQua.map((s) => s.normalize('NFC'));
  return doan
    .map((s) => s.normalize('NFC'))
    .filter((s) => CO_DAU_TIENG_VIET.test(s) && !boQuaNfc.some((b) => s.includes(b)));
}
