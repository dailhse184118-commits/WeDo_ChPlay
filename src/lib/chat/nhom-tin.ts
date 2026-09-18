/** Chỉ cần hai trường này để chia chuỗi; tin dự án và tin riêng đều thoả. */
export interface TinDeNhom {
  id: string;
  nguoiGuiId?: string;
}

/**
 * Id của những tin được gắn avatar.
 *
 * Nhiều tin liên tiếp của cùng một người chỉ gắn avatar ở tin CUỐI chuỗi. Gắn
 * cho mọi tin thì bốn tin liên tiếp thành bốn khuôn mặt xếp dọc, chật và rối —
 * Messenger, Zalo, Telegram đều gộp như vậy.
 *
 * Nhận danh sách theo thứ tự thời gian (cũ trước). Màn hình nào dựng ngược để
 * dùng `inverted` thì tính tập này TRƯỚC khi đảo, nên đảo hay không cũng ra một
 * kết quả.
 */
export function idsHienAvatar(danhSach: TinDeNhom[]): Set<string> {
  const ketQua = new Set<string>();

  danhSach.forEach((tin, viTri) => {
    const ke = danhSach[viTri + 1];

    // Không có tin sau, hoặc tin sau là của người khác: đây là tin cuối chuỗi.
    if (!ke || ke.nguoiGuiId !== tin.nguoiGuiId) ketQua.add(tin.id);
  });

  return ketQua;
}

/**
 * Id của những tin được gắn tên người gửi.
 *
 * Ngược với avatar: tên đứng ở tin ĐẦU chuỗi, ngay trên bong bóng đầu tiên.
 * Đặt tên ở cuối chuỗi thì người đọc gặp bốn bong bóng vô danh rồi mới biết
 * của ai — đọc xong mới biết ai nói.
 */
export function idsHienTen(danhSach: TinDeNhom[]): Set<string> {
  const ketQua = new Set<string>();

  danhSach.forEach((tin, viTri) => {
    const truoc = danhSach[viTri - 1];

    if (!truoc || truoc.nguoiGuiId !== tin.nguoiGuiId) ketQua.add(tin.id);
  });

  return ketQua;
}
