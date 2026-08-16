import type { MucLich } from '../api/calendar';

export interface NhomNgay {
  /** `2026-08-16`, dùng làm khoá danh sách. */
  khoa: string;
  /** Chữ hiện cho người đọc: `Hôm nay`, `Ngày mai`, `Thứ năm, 21/8`. */
  nhan: string;
  muc: MucLich[];
}

const THU = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

/** `2026-08-16` theo GIỜ MÁY người dùng, không phải UTC. */
function khoaNgay(d: Date): string {
  const thang = `${d.getMonth() + 1}`.padStart(2, '0');
  const ngay = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${thang}-${ngay}`;
}

/**
 * Đặt tên cho một ngày.
 *
 * "Hôm nay" và "Ngày mai" dễ đọc hơn hẳn ngày tháng trần — đó là hai nhóm người
 * dùng nhìn nhiều nhất. Xa hơn thì kèm thứ, vì sinh viên xếp lịch theo thứ chứ
 * ít khi theo ngày dương.
 */
export function nhanNgay(ngay: Date, homNay: Date): string {
  const cachNhau =
    (new Date(khoaNgay(ngay)).getTime() - new Date(khoaNgay(homNay)).getTime()) /
    86_400_000;

  if (cachNhau === 0) return 'Hôm nay';
  if (cachNhau === 1) return 'Ngày mai';
  if (cachNhau === -1) return 'Hôm qua';

  return `${THU[ngay.getDay()]}, ${ngay.getDate()}/${ngay.getMonth() + 1}`;
}

/**
 * Gom các mục thành từng ngày, giữ nguyên thứ tự máy chủ đã sắp.
 *
 * KHÔNG tạo nhóm rỗng cho ngày không có gì: danh sách dạng lịch trình chỉ nên
 * hiện ngày có việc, khác với lưới tháng phải vẽ đủ ô. Ngày trống mà vẫn hiện
 * thì người dùng phải cuộn qua một đống tiêu đề vô nghĩa.
 */
export function nhomTheoNgay(muc: MucLich[], homNay: Date): NhomNgay[] {
  const bang = new Map<string, MucLich[]>();

  for (const m of muc) {
    const d = new Date(m.startTime);
    if (Number.isNaN(d.getTime())) continue;

    const khoa = khoaNgay(d);
    const hienCo = bang.get(khoa);
    if (hienCo) hienCo.push(m);
    else bang.set(khoa, [m]);
  }

  return [...bang.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([khoa, ds]) => ({
      khoa,
      // Dựng lại Date từ khoá để nhãn không bị lệch bởi giờ trong ngày.
      nhan: nhanNgay(new Date(`${khoa}T00:00:00`), homNay),
      muc: ds,
    }));
}

/** Nhãn ngắn cho từng loại, hiện thành huy hiệu trước tiêu đề. */
export function nhanLoai(kind: MucLich['kind']): string {
  if (kind === 'MEETING') return 'Họp';
  if (kind === 'TASK_DEADLINE') return 'Hạn chót';
  return 'Sự kiện';
}

/** `14:30`. Hạn chót công việc thường đặt cuối ngày nên vẫn cần hiện giờ. */
export function gioTrongNgay(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getHours()}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}
