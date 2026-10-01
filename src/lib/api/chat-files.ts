import { taiMotTepLen } from './tai-tep';
import type { TepChon } from './tasks';

/**
 * Lô tệp gửi được một phần rồi hỏng giữa chừng.
 *
 * Mỗi tệp là một tin nhắn (hay một bài nộp) THẬT trên máy chủ ngay khi lên xong.
 * Chỉ ném lỗi gốc thì chỗ gọi không biết những tệp đầu đã tới, giữ nguyên cả lô
 * trong ô soạn — bấm Gửi lại là người nhận thấy ảnh đầu hai lần. Lỗi này mang
 * theo những gì đã gửi để chỗ gọi bỏ chúng ra và chỉ gửi lại phần còn lại.
 */
export class LoiGuiDoDang<T> extends Error {
  /** Kết quả máy chủ trả cho từng tệp đã lên, theo đúng thứ tự gửi. */
  readonly daGui: T[];
  /** Số tệp của cả lô. `daGui.length` tệp đầu đã tới, phần còn lại thì chưa. */
  readonly tongSo: number;
  /** Lỗi thật của tệp hỏng, để báo Sentry và hiện câu gốc. */
  readonly loiGoc: unknown;

  constructor(daGui: T[], tongSo: number, loiGoc: unknown) {
    const cau = loiGoc instanceof Error ? loiGoc.message : 'Không gửi được tệp.';
    super(`Đã gửi ${daGui.length}/${tongSo} tệp. ${cau}`);
    this.name = 'LoiGuiDoDang';
    this.daGui = daGui;
    this.tongSo = tongSo;
    this.loiGoc = loiGoc;
  }
}

/**
 * Câu báo cho người dùng, gọi đúng tên thứ đang gửi ("ảnh", "tệp"), và nhắc rằng
 * bấm Gửi lần nữa chỉ gửi phần còn lại.
 */
export function cauGuiDoDang(loi: LoiGuiDoDang<unknown>, loai: string): string {
  const cau = loi.loiGoc instanceof Error ? loi.loiGoc.message : 'Không gửi được.';
  const conLai = loi.tongSo - loi.daGui.length;
  return `Đã gửi ${loi.daGui.length}/${loi.tongSo} ${loai}. ${cau} Bấm Gửi để gửi tiếp ${conLai} ${loai} còn lại.`;
}

/**
 * Tải cả lô tệp lên, mỗi tệp một lượt gọi.
 *
 * Trước đây gói tất cả vào một `FormData` rồi gửi một lượt, nên máy chủ dựng
 * đúng MỘT tin nhắn mang nhiều ảnh. Cách đó không dùng được nữa: `FormData` của
 * React Native hỏng trên Expo SDK 57 — xem khối ghi chú trong `tai-tep.ts`.
 *
 * Đổi lại, mỗi tệp thành một tin nhắn riêng. Chấp nhận được: phần lớn người
 * dùng gửi một ảnh, và một ảnh gửi được vẫn hơn hẳn nhiều ảnh gửi không được.
 *
 * Gửi TUẦN TỰ chứ không song song: mạng di động nghẽn thì bắn năm lượt cùng
 * lúc làm tất cả cùng chậm, và thứ tự tin nhắn hiện ra sẽ lộn xộn.
 *
 * Chú thích chỉ gắn vào tệp ĐẦU TIÊN — lặp lại ở mọi ảnh thì người nhận đọc
 * thấy cùng một câu năm lần.
 *
 * Hỏng giữa lô thì DỪNG và ném `LoiGuiDoDang` kèm những tệp đã lên; hỏng ngay
 * tệp đầu thì ném nguyên lỗi gốc, vì chưa có gì để giữ lại.
 */
export async function taiNhieuTepLen<T>(
  duongDan: string,
  files: TepChon[],
  content: string,
): Promise<T[]> {
  if (files.length === 0) {
    throw new Error('Hãy chọn ít nhất một ảnh để gửi.');
  }

  const ketQua: T[] = [];
  for (const [viTri, tep] of files.entries()) {
    try {
      ketQua.push(await taiMotTepLen<T>(duongDan, tep, viTri === 0 ? content : ''));
    } catch (loi) {
      if (ketQua.length === 0) throw loi;
      throw new LoiGuiDoDang<T>(ketQua, files.length, loi);
    }
  }

  return ketQua;
}
