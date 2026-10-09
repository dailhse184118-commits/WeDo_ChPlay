/**
 * Mở web WeDo từ trong app.
 *
 * Dùng cho những thứ màn hình nhỏ đọc rất mệt: bảng nhiều cột, quản lý thành
 * viên, cấu hình workspace. Mobile giữ bản rút gọn, ai cần đầy đủ thì sang web.
 *
 * ===========================================================================
 * RÀNG BUỘC KHÔNG ĐƯỢC PHÁ: không bao giờ dẫn tới trang thanh toán.
 *
 * Chính sách Google Play buộc hàng hoá số bán trong app phải đi qua Google Play
 * Billing, và điều khoản chống lái người dùng cấm cả việc dẫn ra phương thức
 * thanh toán khác. Vi phạm thì nhẹ là bị từ chối bản cập nhật, nặng là gỡ app
 * khỏi Store.
 *
 * Vì thế `duongDanWeb` CHẶN các đường dẫn thanh toán ngay tại đây, thay vì chỉ
 * ghi một dòng chú thích rồi tin rằng người sau sẽ đọc. Có test riêng cho chốt
 * này — xoá nó đi là test đỏ.
 *
 * Lọc theo CHỮ trong đường dẫn là chưa đủ: mọi màn của ứng dụng web đều nằm
 * trong khung có thanh bên "Nâng cấp gói", và #/contributions mở vào màn Cài
 * đặt sát tab "Quản lý gói và thanh toán" mà không chứa chữ nào bị cấm. Nên giờ
 * chỉ mở được các TRANG TĨNH trong `TRANG_DUOC_MO` — không có khung ứng dụng,
 * không có liên kết sang bảng giá. Thêm trang nào vào đó thì mở trang đó ra
 * xem trước: không được có lối nào dẫn tiếp sang trang mua.
 * App iPhone đã bán gói qua In-App Purchase (10/2026), nhưng Guideline 3.1.1(a)
 * vẫn cấm dẫn người dùng ra cách mua ngoài, nên nút mở web vẫn ẩn trên iOS và
 * bộ lọc dưới đây giữ nguyên.
 * ===========================================================================
 */

/**
 * Đọc LƯỜI chứ không chốt ở tầng module.
 *
 * Chốt lúc import thì giá trị bị đóng băng ngay khi file được nạp, và test
 * không còn cách nào đặt biến vào trước đó.
 */
function gocWeb(): string {
  return process.env.EXPO_PUBLIC_WEB_URL ?? '';
}

/**
 * Từ đơn dính tới mua bán, so với TỪNG MẢNH của đường dẫn.
 *
 * Cố tình rộng tay: thà chặn nhầm một trang vô hại còn hơn lọt một trang thanh
 * toán và mất cả app trên Store.
 */
const TU_CAM = [
  'checkout',
  'payment',
  'pay',
  'billing',
  'upgrade',
  'subscribe',
  'subscription',
  'pricing',
  'plan',
  'mua',
];

/**
 * Cụm tiếng Việt có gạch nối, so với cả chuỗi.
 *
 * Phải tách riêng khỏi danh sách trên: tách đường dẫn theo ký tự không phải chữ
 * cái sẽ băm "nang-cap" thành "nang" và "cap", không mảnh nào khớp. Mà đưa
 * "nang" hay "cap" vào danh sách từ đơn thì chặn oan quá nhiều.
 */
const CUM_CAM = ['nang-cap', 'thanh-toan', 'mua-goi'];

/**
 * Trang tĩnh trong `public/` của web: tự đứng một mình, không có khung ứng dụng
 * (thanh bên, Cài đặt, bảng giá) và không liên kết sang trang mua.
 *
 * Cố tình KHÔNG có `chinh-sach-thanh-toan.html`: cả trang nói về mua gói.
 */
export const TRANG_DUOC_MO = [
  'dieu-khoan.html',
  'privacy.html',
  'ho-tro.html',
  'xoa-tai-khoan.html',
] as const;

export class DuongDanBiCamError extends Error {
  constructor(duongDan: string, lyDo: 'thanh-toan' | 'ngoai-danh-sach' = 'thanh-toan') {
    super(
      lyDo === 'thanh-toan'
        ? `Đường dẫn "${duongDan}" dính tới thanh toán. App Android không được dẫn ` +
            'người dùng ra ngoài để mua hàng hoá số — xem chính sách Google Play.'
        : `Đường dẫn "${duongDan}" không nằm trong danh sách trang được mở từ app. ` +
            'Màn ứng dụng web nào cũng có lối sang trang mua — xem `TRANG_DUOC_MO`.',
    );
    this.name = 'DuongDanBiCamError';
  }
}

/** Tách "trang#mốc" thành trang (không có dấu gạch đầu) và mốc (kể cả dấu #, có thể rỗng). */
function tachTrang(duongDan: string): { trang: string; moc: string } {
  const sach = duongDan.replace(/^\/+/, '');
  const viTri = sach.indexOf('#');
  return viTri < 0
    ? { trang: sach, moc: '' }
    : { trang: sach.slice(0, viTri), moc: sach.slice(viTri) };
}

/** Đường dẫn có nằm trong danh sách trang tĩnh được mở không. */
export function laTrangDuocMo(duongDan: string): boolean {
  const { trang, moc } = tachTrang(duongDan);
  // Mốc chỉ là tên mục trong trang (#muc-10); "#/..." là một màn của ứng dụng web.
  if (moc && !/^#[a-z0-9-]*$/i.test(moc)) return false;
  return (TRANG_DUOC_MO as readonly string[]).includes(trang.toLowerCase());
}

/** Đường dẫn có chạm tới mua bán không. So theo từng mảnh, không so chuỗi con. */
export function laDuongDanThanhToan(duongDan: string): boolean {
  const thuong = duongDan.toLowerCase();

  if (CUM_CAM.some((cum) => thuong.includes(cum))) return true;

  /*
    Tách theo mọi thứ không phải chữ cái rồi so từng mảnh, thay vì `includes`.
    So chuỗi con sẽ chặn nhầm "display" (chứa "pay") hay "template" (chứa "plan"),
    còn so cả chuỗi thì lọt "/workspace/upgrade".
  */
  const manh = thuong.split(/[^a-z]+/).filter(Boolean);
  return manh.some((m) => TU_CAM.includes(m));
}

/**
 * Dựng địa chỉ đầy đủ tới một trang tĩnh trên web WeDo, ví dụ
 * `duongDanWeb('privacy.html#muc-10')`.
 *
 * Ném lỗi khi đường dẫn dính tới thanh toán, khi trang không nằm trong
 * `TRANG_DUOC_MO` (mọi màn của ứng dụng web, kể cả trang chủ), và khi chưa cấu
 * hình `EXPO_PUBLIC_WEB_URL` — im lặng trả chuỗi rỗng thì nút bấm không làm gì
 * cả và không ai biết vì sao.
 */
export function duongDanWeb(duongDan: string): string {
  if (laDuongDanThanhToan(duongDan)) {
    throw new DuongDanBiCamError(duongDan);
  }
  if (!laTrangDuocMo(duongDan)) {
    throw new DuongDanBiCamError(duongDan, 'ngoai-danh-sach');
  }
  const goc = gocWeb();
  if (!goc) {
    throw new Error('Thiếu EXPO_PUBLIC_WEB_URL. Kiểm tra file .env.');
  }

  const { trang, moc } = tachTrang(duongDan);
  return `${goc.replace(/\/+$/, '')}/${trang}${moc}`;
}

/** Đã cấu hình web chưa. Giao diện dùng để ẩn nút thay vì hiện nút chết. */
export function coWeb(): boolean {
  return Boolean(gocWeb());
}
