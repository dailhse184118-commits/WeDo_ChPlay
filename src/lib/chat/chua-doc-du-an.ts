/** Luôn đếm bấy nhiêu dự án đầu danh sách, trước khi biết dòng nào đang hiện. */
export const SO_DU_AN_DEM_SAN = 6;

/** Trần số lượt đếm cùng lúc — mỗi dự án một lượt gọi, trên mạng di động. */
export const SO_DU_AN_DEM_TOI_DA = 20;

/**
 * Những dự án cần hỏi số tin chưa đọc.
 *
 * Máy chủ chưa có lượt gọi trả số chưa đọc của mọi dự án một lần, nên mỗi dự án
 * là một lượt gọi. Trước đây chỉ đếm 6 dự án đầu: danh sách xếp theo ngày sửa
 * dự án và tin nhắn không đổi thứ tự đó, nên nhóm chat sôi nổi nằm ở dòng 7 trở
 * đi không bao giờ có huy hiệu. Giờ đếm vài dòng đầu (hiện ngay khi mở màn) cộng
 * với đúng những dòng đang hiện trên màn hình — cuộn tới đâu đếm tới đó.
 */
export function duAnCanDemChuaDoc(
  danhSach: ReadonlyArray<{ id: string }>,
  dangHien: ReadonlySet<string>,
  demSan: number = SO_DU_AN_DEM_SAN,
  toiDa: number = SO_DU_AN_DEM_TOI_DA,
): string[] {
  const ket = new Set<string>();
  for (const duAn of danhSach.slice(0, demSan)) ket.add(duAn.id);
  for (const duAn of danhSach) {
    if (ket.size >= toiDa) break;
    if (dangHien.has(duAn.id)) ket.add(duAn.id);
  }
  return Array.from(ket).slice(0, toiDa);
}
