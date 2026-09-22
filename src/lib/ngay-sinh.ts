/**
 * Chuyển đổi ngày sinh giữa thứ người dùng gõ và thứ máy chủ nhận.
 *
 * VÌ SAO GÕ TAY CHỨ KHÔNG DÙNG BỘ CHỌN NGÀY:
 *
 * Bộ chọn ngày của hệ điều hành (`@react-native-community/datetimepicker`) là
 * một thư viện gốc. Thêm thư viện gốc là phải **dựng lại bản cài đặt và nộp
 * lại Play** — còn màn hình viết bằng JavaScript thì đẩy thẳng qua bản cập
 * nhật, người đang thử nghiệm nhận được ngay khi mở app. Lúc sát hạn ra mắt
 * thì khác biệt đó lớn hơn hẳn cái tiện của bộ chọn ngày.
 *
 * Máy chủ nhận `dob` là chuỗi ISO (`@IsDateString`) rồi `new Date(dto.dob)`.
 * Người Việt viết ngày là `dd/mm/yyyy`. Hai đầu này phải được dịch qua lại ở
 * một chỗ duy nhất, chứ không rải trong màn hình.
 */

/** Ngày xưa nhất chấp nhận được — chặn lỗi gõ thành năm 1800. */
const NAM_SOM_NHAT = 1900;

export const DINH_DANG_NGAY = 'dd/mm/yyyy';

/**
 * Đổi giá trị máy chủ trả về thành `dd/mm/yyyy` để điền vào ô.
 *
 * Máy chủ trả chuỗi ISO đầy đủ (`1999-08-14T00:00:00.000Z`). Cắt lấy phần ngày
 * bằng chuỗi chứ KHÔNG dựng `Date` rồi đọc `getDate()`: `new Date()` diễn giải
 * theo múi giờ máy, nên ở Việt Nam (UTC+7) một ngày sinh lưu lúc nửa đêm UTC
 * vẫn ra đúng, nhưng máy đặt múi giờ âm sẽ lùi mất một ngày. Người dùng mở màn
 * hình ra thấy ngày sinh của mình lệch một hôm.
 */
export function hienThiNgaySinh(giaTriMayChu: string | null | undefined): string {
  if (!giaTriMayChu) return '';

  const phanNgay = giaTriMayChu.slice(0, 10);
  const khop = /^(\d{4})-(\d{2})-(\d{2})$/.exec(phanNgay);
  if (!khop) return '';

  const [, nam, thang, ngay] = khop;
  return `${ngay}/${thang}/${nam}`;
}

/** Chèn dấu `/` trong lúc gõ, và không cho gõ quá tám chữ số. */
export function tuThemDauGach(dangGo: string): string {
  const so = dangGo.replace(/\D/g, '').slice(0, 8);
  if (so.length <= 2) return so;
  if (so.length <= 4) return `${so.slice(0, 2)}/${so.slice(2)}`;
  return `${so.slice(0, 2)}/${so.slice(2, 4)}/${so.slice(4)}`;
}

export interface KetQuaDoiNgay {
  /** Chuỗi `yyyy-mm-dd` gửi cho máy chủ, hoặc `null` khi ô để trống. */
  giaTri: string | null;
  /** Câu báo lỗi tiếng Việt, hoặc `null` khi hợp lệ. */
  loi: string | null;
}

/**
 * Đổi `dd/mm/yyyy` người dùng gõ thành `yyyy-mm-dd` cho máy chủ.
 *
 * Trả về `yyyy-mm-dd` chứ không phải ISO đầy đủ, vì `new Date('1999-08-14')`
 * được đọc là nửa đêm **UTC** — cố định, không phụ thuộc máy chủ đặt múi giờ
 * nào. Ghép thêm giờ địa phương vào là mở đường cho đúng cái lệch một ngày mà
 * `hienThiNgaySinh` đang tránh.
 *
 * Ô để trống là hợp lệ: ngày sinh không bắt buộc, và để trống chính là cách
 * người dùng gỡ ngày đã lưu.
 */
export function doiNgaySinhSangMayChu(dangGo: string): KetQuaDoiNgay {
  const sach = dangGo.trim();
  if (!sach) return { giaTri: null, loi: null };

  const khop = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(sach);
  if (!khop) {
    return { giaTri: null, loi: `Ngày sinh cần viết theo dạng ${DINH_DANG_NGAY}.` };
  }

  const ngay = Number(khop[1]);
  const thang = Number(khop[2]);
  const nam = Number(khop[3]);

  /*
    Tự dựng `Date` rồi so lại từng phần, chứ không tin vào việc `Date` chịu
    nhận giá trị: `new Date(2025, 1, 31)` KHÔNG báo lỗi, nó lặng lẽ trôi sang
    ngày 3 tháng 3. Không so lại thì "31/02/2025" được lưu thành một ngày khác
    hẳn ngày người dùng gõ.
  */
  const thu = new Date(Date.UTC(nam, thang - 1, ngay));
  const dungLich =
    thu.getUTCFullYear() === nam &&
    thu.getUTCMonth() === thang - 1 &&
    thu.getUTCDate() === ngay;

  if (!dungLich) {
    return { giaTri: null, loi: 'Ngày sinh này không có trên lịch.' };
  }

  if (nam < NAM_SOM_NHAT) {
    return { giaTri: null, loi: `Năm sinh phải từ ${NAM_SOM_NHAT} trở đi.` };
  }

  /*
    So với hôm nay theo mốc UTC cho khớp với cách dựng ở trên. Ngày sinh ở
    tương lai gần như luôn là gõ nhầm năm — và nếu để lọt thì mọi chỗ tính tuổi
    sau này đều ra số âm.
  */
  const homNay = new Date();
  const homNayUTC = Date.UTC(
    homNay.getUTCFullYear(),
    homNay.getUTCMonth(),
    homNay.getUTCDate(),
  );
  if (thu.getTime() > homNayUTC) {
    return { giaTri: null, loi: 'Ngày sinh không thể ở tương lai.' };
  }

  const hai = (n: number) => String(n).padStart(2, '0');
  return { giaTri: `${nam}-${hai(thang)}-${hai(ngay)}`, loi: null };
}
