import { theoNgonNgu } from '../../i18n/dich';
import { dinhDangGio } from '../../i18n/dinh-dang';
import { layNgonNgu, type NgonNgu } from '../../i18n/ngon-ngu';
import { tuDienLich } from '../../i18n/tu-dien/lich';
import type { MucLich } from '../api/calendar';

export interface NhomNgay {
  /** `2026-08-16`, dùng làm khoá danh sách. */
  khoa: string;
  /** Chữ hiện cho người đọc: `Hôm nay`, `Ngày mai`, `Thứ năm, 21/8` (tiếng Anh `Today`, `Thursday, Aug 21`). */
  nhan: string;
  muc: MucLich[];
}

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
export function nhanNgay(ngay: Date, homNay: Date, ngonNgu: NgonNgu = layNgonNgu()): string {
  const t = theoNgonNgu(tuDienLich, ngonNgu).ngay;
  const cachNhau =
    (new Date(khoaNgay(ngay)).getTime() - new Date(khoaNgay(homNay)).getTime()) /
    86_400_000;

  if (cachNhau === 0) return t.homNay;
  if (cachNhau === 1) return t.ngayMai;
  if (cachNhau === -1) return t.homQua;

  return t.ngayXa(ngay.getFullYear(), ngay.getMonth() + 1, ngay.getDate());
}

/**
 * Gom các mục thành từng ngày, giữ nguyên thứ tự máy chủ đã sắp.
 *
 * KHÔNG tạo nhóm rỗng cho ngày không có gì: danh sách dạng lịch trình chỉ nên
 * hiện ngày có việc, khác với lưới tháng phải vẽ đủ ô. Ngày trống mà vẫn hiện
 * thì người dùng phải cuộn qua một đống tiêu đề vô nghĩa.
 */
export function nhomTheoNgay(
  muc: MucLich[],
  homNay: Date,
  ngonNgu: NgonNgu = layNgonNgu(),
): NhomNgay[] {
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
      nhan: nhanNgay(new Date(`${khoa}T00:00:00`), homNay, ngonNgu),
      muc: ds,
    }));
}

/** Nhãn ngắn cho từng loại, hiện thành huy hiệu trước tiêu đề. */
export function nhanLoai(kind: MucLich['kind'], ngonNgu: NgonNgu = layNgonNgu()): string {
  const loai = theoNgonNgu(tuDienLich, ngonNgu).loai;
  if (kind === 'MEETING') return loai.MEETING;
  if (kind === 'TASK_DEADLINE') return loai.TASK_DEADLINE;
  return loai.EVENT;
}

/** `14:30`. Hạn chót công việc thường đặt cuối ngày nên vẫn cần hiện giờ. */
export function gioTrongNgay(iso: string, ngonNgu: NgonNgu = layNgonNgu()): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  // Tiếng Anh: `2:30 PM`, đọc theo giờ Việt Nam. Tiếng Việt giữ giờ máy như cũ.
  if (ngonNgu === 'en') return dinhDangGio(d, 'en');
  return `${d.getHours()}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}
