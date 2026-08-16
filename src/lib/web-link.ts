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

export class DuongDanBiCamError extends Error {
  constructor(duongDan: string) {
    super(
      `Đường dẫn "${duongDan}" dính tới thanh toán. App Android không được dẫn ` +
        'người dùng ra ngoài để mua hàng hoá số — xem chính sách Google Play.',
    );
    this.name = 'DuongDanBiCamError';
  }
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
 * Dựng địa chỉ đầy đủ tới một trang trên web WeDo.
 *
 * Ném lỗi khi đường dẫn dính tới thanh toán, và khi chưa cấu hình
 * `EXPO_PUBLIC_WEB_URL` — im lặng trả chuỗi rỗng thì nút bấm không làm gì cả và
 * không ai biết vì sao.
 */
export function duongDanWeb(duongDan: string): string {
  if (laDuongDanThanhToan(duongDan)) {
    throw new DuongDanBiCamError(duongDan);
  }
  const goc = gocWeb();
  if (!goc) {
    throw new Error('Thiếu EXPO_PUBLIC_WEB_URL. Kiểm tra file .env.');
  }

  const sach = duongDan.replace(/^\/+/, '');
  // Web dùng điều hướng theo hash, nên đường dẫn nằm sau dấu #.
  return sach ? `${goc}/#/${sach}` : goc;
}

/** Đã cấu hình web chưa. Giao diện dùng để ẩn nút thay vì hiện nút chết. */
export function coWeb(): boolean {
  return Boolean(gocWeb());
}
