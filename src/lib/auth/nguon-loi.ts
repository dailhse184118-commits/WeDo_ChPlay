/**
 * Lỗi của một biểu mẫu, giữ ở dạng NGUỒN chứ không giữ câu đã dựng: dịch lúc vẽ
 * để đổi ngôn ngữ giữa chừng thì băng đỏ đổi theo.
 * - `khoa`: câu cố định của app (thiếu email, mật khẩu ngắn…), tra trong từ điển.
 * - `loi`: lỗi bắt được từ lời gọi; `duPhong` là khoá câu dự phòng khi không dịch được.
 */
export type NguonLoi<K extends string> = { khoa: K } | { loi: unknown; duPhong: K };

export function chuLoi<K extends string>(
  tuDien: Record<K, unknown>,
  nguon: NguonLoi<K> | null,
  dichLoi: (loi: unknown, duPhong: string) => string,
): string {
  if (!nguon) return '';
  if ('khoa' in nguon) return tuDien[nguon.khoa] as string;
  return dichLoi(nguon.loi, tuDien[nguon.duPhong] as string);
}
