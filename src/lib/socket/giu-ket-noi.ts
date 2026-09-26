import type { Socket } from 'socket.io-client';

import { ApiError } from '../api/client';

/**
 * Nhịp chờ trước lần thử nối lại thứ `lanThu` (đếm từ 0): 1, 2, 4, 8… giây,
 * trần 60 giây.
 */
export function nhipCho(lanThu: number): number {
  return Math.min(60_000, 1000 * 2 ** lanThu);
}

/**
 * Kết nối sống được chừng này rồi mới bị ngắt thì coi như ổn định, lần thử kế
 * tiếp quay về nhịp ngắn nhất. Ngắn hơn thì nhịp chờ tiếp tục giãn ra.
 */
export const ON_DINH_MS = 30_000;

export interface GiuKetNoiOptions {
  /**
   * Làm tươi phiên trước khi nối lại, qua đúng tầng API nên token hết hạn sẽ
   * được gia hạn như mọi yêu cầu khác.
   *
   * Ném `ApiError` mã 0 hoặc 5xx: mạng hay máy chủ trục trặc, thử lại sau.
   * Ném lỗi khác: phiên đã hết hẳn, tầng API tự đăng xuất người dùng, thôi thử.
   */
  lamMoiPhien: () => Promise<void>;
  /** Chỉ để test. */
  bayGio?: () => number;
  /** Chỉ để test. Trả số trong [0, 1). */
  ngauNhien?: () => number;
}

type SocketToiThieu = Pick<Socket, 'on' | 'off' | 'connect'>;

/**
 * Nối lại khi MÁY CHỦ chủ động ngắt socket. Trả hàm để gỡ.
 *
 * socket.io tự nối lại khi rớt mạng hay máy chủ khởi động lại. Riêng lý do
 * `io server disconnect` thì nó coi là ý muốn của máy chủ và đứng im vĩnh viễn.
 * Gateway ngắt đúng kiểu đó mỗi khi từ chối một lần nối, mà lý do từ chối hay
 * gặp nhất là access token đã hết hạn. Kết quả trước đây: sau một lần deploy
 * backend, máy nào cầm token cũ là mất tin nhắn thời gian thực cho tới khi tắt
 * hẳn app.
 *
 * Mỗi lần bị ngắt: chờ một nhịp, làm tươi phiên, rồi mới nối lại. Nhịp chờ giãn
 * dần nếu vừa nối đã bị ngắt, để một lỗi kéo dài phía máy chủ không biến thành
 * trận mưa yêu cầu. Cộng thêm tới một giây ngẫu nhiên: sau mỗi lần deploy mọi
 * máy bị ngắt cùng lúc, đừng để chúng quay lại cùng một nhịp.
 */
export function giuKetNoi(socket: SocketToiThieu, options: GiuKetNoiOptions): () => void {
  const bayGio = options.bayGio ?? Date.now;
  const ngauNhien = options.ngauNhien ?? Math.random;

  let lanThu = 0;
  let noiLuc = 0;
  let hen: ReturnType<typeof setTimeout> | null = null;
  let daGo = false;

  const thuNoiLai = async () => {
    if (daGo) return;
    try {
      await options.lamMoiPhien();
    } catch (loi) {
      const tamThoi = loi instanceof ApiError && (loi.status === 0 || loi.status >= 500);
      if (tamThoi) henNoiLai();
      return;
    }
    if (!daGo) socket.connect();
  };

  function henNoiLai() {
    if (daGo || hen) return;
    const cho = nhipCho(lanThu) + Math.floor(ngauNhien() * 1000);
    lanThu += 1;
    hen = setTimeout(() => {
      hen = null;
      void thuNoiLai();
    }, cho);
  }

  const khiNoi = () => {
    noiLuc = bayGio();
  };

  const khiNgat = (lyDo: string) => {
    if (lyDo !== 'io server disconnect') return;
    if (noiLuc && bayGio() - noiLuc >= ON_DINH_MS) lanThu = 0;
    henNoiLai();
  };

  socket.on('connect', khiNoi);
  socket.on('disconnect', khiNgat);

  return () => {
    daGo = true;
    if (hen) clearTimeout(hen);
    hen = null;
    socket.off('connect', khiNoi);
    socket.off('disconnect', khiNgat);
  };
}
