import { doiNgaySinhSangMayChu } from '../ngay-sinh';

/**
 * Ghép ngày `dd/mm/yyyy` và giờ `hh:mm` người dùng gõ thành chuỗi ISO cho máy
 * chủ.
 *
 * KHÁC HẲN ngày sinh, và đây là chỗ phải cẩn thận:
 *
 * Ngày sinh là một ngày trên tờ lịch — nó giống nhau ở mọi nơi trên thế giới,
 * nên `../ngay-sinh` cố tình cố định vào nửa đêm UTC.
 *
 * Giờ họp thì ngược lại: nó là một THỜI ĐIỂM. Người dùng gõ "20:00" nghĩa là
 * tám giờ tối **theo giờ của họ**. Nên ở đây phải dựng `Date` theo giờ ĐỊA
 * PHƯƠNG rồi mới đổi sang ISO — máy chủ nhận được đúng khoảnh khắc đó, và
 * người ở múi giờ khác mở lên vẫn thấy đúng lúc phải có mặt.
 *
 * Dùng nhầm cách của ngày sinh ở đây thì mọi cuộc họp ở Việt Nam lệch bảy
 * tiếng — và không có gì báo lỗi cả.
 */

export interface KetQuaThoiDiem {
  /** Chuỗi ISO gửi cho máy chủ, hoặc `null` khi chưa hợp lệ. */
  giaTri: string | null;
  loi: string | null;
}

/** Chèn dấu `:` trong lúc gõ giờ, và không cho quá bốn chữ số. */
export function tuThemDauGachGio(dangGo: string): string {
  const so = dangGo.replace(/\D/g, '').slice(0, 4);
  if (so.length <= 2) return so;
  return `${so.slice(0, 2)}:${so.slice(2)}`;
}

export function ghepNgayGio(ngayGo: string, gioGo: string): KetQuaThoiDiem {
  const ngay = doiNgaySinhSangMayChu(ngayGo);

  /*
    `doiNgaySinhSangMayChu` từ chối ngày ở tương lai — đúng cho ngày sinh, sai
    hoàn toàn cho lịch họp. Chỉ mượn phần kiểm tra ĐÚNG LỊCH của nó (31/02 là
    ngày không có thật), còn câu từ chối "ở tương lai" thì bỏ qua.
  */
  const ngayHopLe = ngay.giaTri ?? layNgayDuLaTuongLai(ngayGo);

  if (!ngayHopLe) {
    return { giaTri: null, loi: ngay.loi ?? 'Ngày họp chưa hợp lệ.' };
  }

  const khopGio = /^(\d{2}):(\d{2})$/.exec(gioGo.trim());
  if (!khopGio) {
    return { giaTri: null, loi: 'Giờ họp cần viết theo dạng hh:mm, ví dụ 20:00.' };
  }

  const gio = Number(khopGio[1]);
  const phut = Number(khopGio[2]);
  if (gio > 23 || phut > 59) {
    return { giaTri: null, loi: 'Giờ họp phải trong khoảng 00:00 đến 23:59.' };
  }

  const [nam, thang, ngayTrongThang] = ngayHopLe.split('-').map(Number);

  /* Giờ ĐỊA PHƯƠNG — xem đoạn giải thích ở đầu tệp. */
  const thoiDiem = new Date(nam, thang - 1, ngayTrongThang, gio, phut, 0, 0);

  return { giaTri: thoiDiem.toISOString(), loi: null };
}

/**
 * Lấy lại `yyyy-mm-dd` cho một ngày hợp lệ nhưng nằm ở tương lai.
 *
 * Viết riêng thay vì nới lỏng `doiNgaySinhSangMayChu`: hàm kia đang canh cho ô
 * ngày sinh, mà ngày sinh ở tương lai gần như luôn là gõ nhầm năm. Nới nó ra là
 * mở đường cho lỗi ở màn hình khác.
 */
function layNgayDuLaTuongLai(dangGo: string): string | null {
  const khop = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dangGo.trim());
  if (!khop) return null;

  const ngay = Number(khop[1]);
  const thang = Number(khop[2]);
  const nam = Number(khop[3]);

  const thu = new Date(Date.UTC(nam, thang - 1, ngay));
  const dungLich =
    thu.getUTCFullYear() === nam &&
    thu.getUTCMonth() === thang - 1 &&
    thu.getUTCDate() === ngay;

  if (!dungLich) return null;

  const hai = (n: number) => String(n).padStart(2, '0');
  return `${nam}-${hai(thang)}-${hai(ngay)}`;
}
