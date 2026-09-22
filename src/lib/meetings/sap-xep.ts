import type { CuocHop, TrangThaiHop } from '../api/meetings';

/**
 * Xếp cuộc họp thành hai nhóm và đặt tên trạng thái.
 *
 * Tách khỏi màn hình vì đây là chỗ dễ sai lặng lẽ nhất: "sắp tới" hay "đã qua"
 * phụ thuộc vào GIỜ HIỆN TẠI, mà giờ hiện tại thì không kiểm được nếu nằm lẫn
 * trong JSX.
 */

export interface HaiNhom {
  sapToi: CuocHop[];
  daQua: CuocHop[];
}

/** Sau giờ bắt đầu bao lâu thì vẫn coi là "đang diễn ra" khi không có giờ kết thúc. */
const COI_LA_DANG_HOP_PHUT = 90;

/**
 * Mốc để quyết định một cuộc họp đã qua hay chưa.
 *
 * Dùng giờ KẾT THÚC nếu có. Không có thì cộng thêm một quãng: một cuộc họp bắt
 * đầu lúc 20:00 mà 20:05 đã rơi xuống mục "đã qua" thì đúng lúc người ta cần
 * bấm vào để vào phòng lại là lúc nó biến mất khỏi đầu danh sách.
 */
function mocKetThuc(hop: CuocHop): number {
  if (hop.endTime) return new Date(hop.endTime).getTime();
  return new Date(hop.startTime).getTime() + COI_LA_DANG_HOP_PHUT * 60_000;
}

/**
 * Chia danh sách thành sắp tới và đã qua.
 *
 * Huỷ thì luôn nằm ở "đã qua" dù giờ họp còn ở tương lai — nó không còn là thứ
 * người dùng phải chuẩn bị. Nhưng KHÔNG giấu hẳn: người ta cần thấy cuộc họp
 * mình đang chờ đã bị huỷ, chứ không phải thấy nó biến mất không lời giải thích.
 *
 * "Sắp tới" giữ thứ tự tăng dần (gần nhất trước); "đã qua" đảo lại thành giảm
 * dần, vì cuộc họp vừa xong mới là cuộc họp người ta đi tìm biên bản.
 */
export function chiaHaiNhom(danhSach: CuocHop[], bayGio: Date): HaiNhom {
  const moc = bayGio.getTime();
  const sapToi: CuocHop[] = [];
  const daQua: CuocHop[] = [];

  for (const hop of danhSach) {
    const daXong =
      hop.status === 'CANCELLED' || hop.status === 'COMPLETED' || mocKetThuc(hop) < moc;
    (daXong ? daQua : sapToi).push(hop);
  }

  sapToi.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  daQua.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  return { sapToi, daQua };
}

/** Có nên hiện nút "Vào phòng họp" không. */
export function choVaoPhong(hop: CuocHop): boolean {
  return hop.status !== 'COMPLETED' && hop.status !== 'CANCELLED';
}

const TEN_TRANG_THAI: Record<TrangThaiHop, string> = {
  SCHEDULED: 'Đã lên lịch',
  IN_PROGRESS: 'Đang họp',
  COMPLETED: 'Đã xong',
  CANCELLED: 'Đã huỷ',
};

export function tenTrangThai(status: TrangThaiHop): string {
  return TEN_TRANG_THAI[status] ?? 'Đã lên lịch';
}

/**
 * Khoảng giờ để hiện trên thẻ: `20:00 – 21:30`, hoặc chỉ `20:00` khi chưa có
 * giờ kết thúc.
 *
 * Dùng `toLocaleTimeString` với `hour12: false` chứ không tự cắt chuỗi ISO:
 * chuỗi ISO máy chủ trả về là giờ UTC, cắt tay ra sẽ lệch bảy tiếng ở Việt Nam.
 */
export function khoangGio(hop: CuocHop): string {
  const dinhDang = (iso: string) =>
    new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

  const batDau = dinhDang(hop.startTime);
  return hop.endTime ? `${batDau} – ${dinhDang(hop.endTime)}` : batDau;
}
