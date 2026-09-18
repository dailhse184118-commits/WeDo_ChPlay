export type MucCapNhat = 'khong-can' | 'nen-cap-nhat' | 'bat-buoc';

/**
 * Tách "1.0.10" thành [1, 0, 10].
 *
 * Trả `null` khi không đọc nổi. Chỗ gọi dùng `null` làm tín hiệu "không biết",
 * và không biết thì không được phép kết luận gì.
 */
function tachBac(phienBan: string | undefined): number[] | null {
  if (!phienBan) return null;

  const bac = phienBan
    .trim()
    .split('.')
    // parseInt bỏ phần đuôi không phải số, nên "10-beta" ra 10.
    .map((phan) => Number.parseInt(phan, 10));

  if (bac.length === 0 || bac.some((so) => Number.isNaN(so))) return null;
  return bac;
}

/**
 * So hai chuỗi phiên bản. Trả 1 nếu `a` mới hơn, -1 nếu cũ hơn, 0 nếu bằng.
 *
 * KHÔNG so bằng phép so chuỗi. `'1.0.10' < '1.0.9'` theo thứ tự chữ cái vì ký
 * tự `1` nhỏ hơn `9` — mà 1.0.10 mới là bản mới hơn. Đúng cặp phiên bản dự án
 * này đang có, nên lỗi đó sẽ xảy ra ngay lần đầu chứ không phải chuyện lý
 * thuyết.
 *
 * Chuỗi không đọc được thì coi là bằng nhau: không biết thì đừng kết luận.
 */
export function soSanhPhienBan(a: string, b: string): -1 | 0 | 1 {
  const x = tachBac(a);
  const y = tachBac(b);
  if (!x || !y) return 0;

  const soBac = Math.max(x.length, y.length);
  for (let i = 0; i < soBac; i += 1) {
    // Thiếu bậc thì coi là 0, để "1.1" bằng "1.1.0".
    const p = x[i] ?? 0;
    const q = y[i] ?? 0;
    if (p > q) return 1;
    if (p < q) return -1;
  }
  return 0;
}

/**
 * App đang ở mức nào so với máy chủ.
 *
 * Mọi thứ không chắc chắn đều rơi về `'khong-can'`. Đây là nguyên tắc bao trùm
 * của tính năng này: thà bỏ sót một lần nhắc còn hơn khoá người dùng ra khỏi
 * một app đang chạy tốt vì máy chủ trả về dữ liệu lạ.
 */
export function mucCapNhat(input: {
  hienTai?: string;
  latest?: string;
  minimum?: string;
}): MucCapNhat {
  const { hienTai, latest, minimum } = input;

  // Không biết mình là bản nào thì không so được với ai.
  if (!tachBac(hienTai)) return 'khong-can';
  const dangChay = hienTai as string;

  if (tachBac(minimum) && soSanhPhienBan(dangChay, minimum as string) < 0) {
    return 'bat-buoc';
  }

  if (tachBac(latest) && soSanhPhienBan(dangChay, latest as string) < 0) {
    return 'nen-cap-nhat';
  }

  return 'khong-can';
}
