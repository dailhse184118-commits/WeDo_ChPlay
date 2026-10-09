import { MA_VUNG, layNgonNgu, type NgonNgu } from './ngon-ngu';

/*
  CÁCH DỊCH MỘT MÀN (song ngữ Việt - Anh)

  1. Từ điển: src/i18n/tu-dien/<khu-vuc>.ts, khai báo bằng `khaiBaoTuDien(vi, en)`.
     Chữ tiếng Việt chép NGUYÊN VĂN từ màn cũ (giao diện tiếng Việt không được
     đổi một chữ). Câu có chỗ trống hay số nhiều thì viết thành hàm:
       conLai: (so: number) => `Còn ${so} lượt`                         (vi)
       conLai: (so: number) => soNhieu('en', so, { mot: '{so} credit left', nhieu: '{so} credits left' })  (en)
  2. Trong component: `const t = useTuDien(tuDienKhuVuc)`; cần ngôn ngữ (định
     dạng ngày, gọi hàm thuần) thì `const { ngonNgu } = useNgonNgu()`.
     Ngoài React (hàm trong lib, ranh giới lỗi): `theoNgonNgu(tuDienKhuVuc)`.
  3. Ngày giờ, số, tiền: i18n/dinh-dang.ts (luôn theo giờ Việt Nam).
  4. Lỗi: `const dichLoi = useDichLoi()` rồi `dichLoi(err, t.cauDuPhong)`.
     Mã lỗi mới của máy chủ thì thêm vào i18n/loi.ts. Lỗi giữ trong state thì
     giữ NGUỒN (đối tượng lỗi), không giữ câu đã dựng: dịch lúc vẽ để đổi
     ngôn ngữ là câu báo lỗi đổi theo.
  5. Kiểm: `npx tsc --noEmit` và `npx jest` (không chạy `expo lint`, nó sửa
     package.json). Bản tiếng Anh phải có ĐỦ khoá của bản tiếng Việt.
*/

/**
 * Từ điển của một khu vực (trang chủ, bảng giá, đăng nhập…): cùng một hình
 * dạng cho cả hai ngôn ngữ.
 *
 * Giá trị là chuỗi, hàm (khi câu có chỗ trống hay số nhiều), mảng hoặc đối
 * tượng lồng nhau. TypeScript buộc bản tiếng Anh có ĐỦ và ĐÚNG các khoá của bản
 * tiếng Việt (thiếu khoá, thừa khoá hay sai tham số đều báo lỗi khi build), còn
 * `tu-dien.test.ts` kiểm lại lúc chạy.
 *
 * Mỗi màn nhập thẳng từ điển của khu vực mình, nên màn tải theo nhu cầu kéo
 * theo đúng phần chữ của nó, không dồn hết vào gói đầu tiên.
 */
export interface TuDien<T> {
  vi: T;
  en: T;
}

/**
 * `NoInfer`: kiểu lấy từ bản tiếng Việt; bản tiếng Anh chỉ được kiểm theo, không được nới kiểu ra.
 *
 * Hàm trả về một trong vài chuỗi cố định (`(nam) => nam ? 'năm' : 'tháng'`)
 * phải ghi rõ `: string`, nếu không TypeScript suy ra kiểu là đúng hai chuỗi
 * tiếng Việt đó và bản tiếng Anh báo lỗi.
 */
export function khaiBaoTuDien<T>(vi: T, en: NoInfer<T>): TuDien<T> {
  return { vi, en };
}

/** Bản đúng ngôn ngữ của một từ điển. Ngoài React thì mặc định lấy ngôn ngữ đang dùng. */
export function theoNgonNgu<T>(tuDien: TuDien<T>, ngonNgu: NgonNgu = layNgonNgu()): T {
  return tuDien[ngonNgu];
}

/**
 * Điền chỗ trống `{ten}` trong một câu mẫu. Chỗ trống không có giá trị thì để
 * nguyên, để lỗi thiếu tham số lộ ra ngay trên màn hình thay vì im lặng mất chữ.
 */
export function noiSuy(mau: string, thamSo: Record<string, string | number>): string {
  return mau.replace(/\{(\w+)\}/g, (nguyen, ten: string) =>
    Object.prototype.hasOwnProperty.call(thamSo, ten) ? String(thamSo[ten]) : nguyen,
  );
}

/**
 * Chọn dạng số ít hay số nhiều. Tiếng Việt không có số nhiều nên luôn ra
 * `nhieu`; tiếng Anh ra `mot` khi đúng 1. `{so}` trong câu được thay bằng số
 * đã định dạng theo ngôn ngữ.
 *
 * Tự tính, KHÔNG dùng `Intl.PluralRules`: Hermes trên máy thật không có lớp này
 * (`new Intl.PluralRules` ném "undefined cannot be used as a constructor" và làm
 * sập màn hình), dù Node khi chạy test thì có.
 */
export function soNhieu(ngonNgu: NgonNgu, so: number, dang: { mot: string; nhieu: string }): string {
  const mau = ngonNgu === 'en' && so === 1 ? dang.mot : dang.nhieu;
  return noiSuy(mau, { so: new Intl.NumberFormat(MA_VUNG[ngonNgu]).format(so) });
}
