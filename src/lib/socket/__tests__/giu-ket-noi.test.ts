import { ApiError } from '../../api/client';
import { giuKetNoi, nhipCho, ON_DINH_MS } from '../giu-ket-noi';

// `ApiError` nằm trong client, mà client kéo theo kho khoá native.
jest.mock('../../auth/token-storage', () => ({
  loadToken: jest.fn(async () => null),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(),
  saveRefreshToken: jest.fn(),
}));

type Nghe = (...args: unknown[]) => void;

/** Socket giả giữ được nhiều listener cho một sự kiện, như socket thật. */
function taoSocketGia() {
  const nghe: Record<string, Nghe[]> = {};
  return {
    on: jest.fn((suKien: string, fn: Nghe) => {
      (nghe[suKien] ??= []).push(fn);
    }),
    off: jest.fn((suKien: string, fn: Nghe) => {
      nghe[suKien] = (nghe[suKien] ?? []).filter((f) => f !== fn);
    }),
    connect: jest.fn(),
    phat(suKien: string, ...args: unknown[]) {
      for (const fn of nghe[suKien] ?? []) fn(...args);
    },
    soListener(suKien: string) {
      return (nghe[suKien] ?? []).length;
    },
  };
}

describe('nhipCho', () => {
  it('nhân đôi từ một giây', () => {
    expect([0, 1, 2, 3].map(nhipCho)).toEqual([1000, 2000, 4000, 8000]);
  });

  it('không vượt quá 60 giây', () => {
    expect(nhipCho(6)).toBe(60_000);
    expect(nhipCho(20)).toBe(60_000);
  });
});

describe('giuKetNoi', () => {
  let dongHo = 0;

  beforeEach(() => {
    jest.useFakeTimers();
    dongHo = 0;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  function dung(lamMoiPhien: () => Promise<void>, ngauNhien = () => 0) {
    const socket = taoSocketGia();
    const go = giuKetNoi(socket as never, {
      lamMoiPhien,
      bayGio: () => dongHo,
      ngauNhien,
    });
    return { socket, go };
  }

  async function troi(ms: number) {
    dongHo += ms;
    await jest.advanceTimersByTimeAsync(ms);
  }

  it('bị máy chủ ngắt thì chờ một nhịp, làm tươi phiên, rồi mới nối lại', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    expect(lamMoiPhien).not.toHaveBeenCalled();

    await troi(999);
    expect(socket.connect).not.toHaveBeenCalled();

    await troi(1);
    expect(lamMoiPhien).toHaveBeenCalledTimes(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('rớt mạng hay máy chủ khởi động lại thì để socket.io tự lo', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'transport close');
    socket.phat('disconnect', 'ping timeout');
    socket.phat('disconnect', 'io client disconnect');
    await troi(120_000);

    expect(lamMoiPhien).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('vừa nối đã bị ngắt thì nhịp chờ giãn dần', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1000);
    expect(socket.connect).toHaveBeenCalledTimes(1);

    // Nối được rồi bị ngắt ngay: lần sau chờ 2 giây.
    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1999);
    expect(socket.connect).toHaveBeenCalledTimes(1);
    await troi(1);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    // Lại bị ngắt ngay: chờ 4 giây.
    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(3999);
    expect(socket.connect).toHaveBeenCalledTimes(2);
    await troi(1);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it('kết nối sống đủ lâu rồi mới bị ngắt thì quay về nhịp ngắn nhất', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1000);
    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(2000);
    expect(socket.connect).toHaveBeenCalledTimes(2);

    socket.phat('connect');
    await troi(ON_DINH_MS);
    socket.phat('disconnect', 'io server disconnect');
    await troi(1000);
    expect(socket.connect).toHaveBeenCalledTimes(3);
  });

  it('cộng thêm tới một giây ngẫu nhiên để các máy không quay lại cùng lúc', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket } = dung(lamMoiPhien, () => 0.999);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1998);
    expect(socket.connect).not.toHaveBeenCalled();
    await troi(1);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('mất mạng hay máy chủ lỗi lúc làm tươi phiên thì thử lại sau', async () => {
    const lamMoiPhien = jest
      .fn<Promise<void>, []>()
      .mockRejectedValueOnce(new ApiError('Mất mạng', 0))
      .mockRejectedValueOnce(new ApiError('Máy chủ lỗi', 503))
      .mockResolvedValue(undefined);
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1000);
    expect(socket.connect).not.toHaveBeenCalled();

    await troi(2000);
    expect(socket.connect).not.toHaveBeenCalled();

    await troi(4000);
    expect(lamMoiPhien).toHaveBeenCalledTimes(3);
    expect(socket.connect).toHaveBeenCalledTimes(1);
  });

  it('phiên đã hết hẳn thì thôi, không nối lại nữa', async () => {
    const lamMoiPhien = jest.fn(async () => {
      throw new ApiError('Phiên đăng nhập đã hết hạn', 401);
    });
    const { socket } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(120_000);

    expect(lamMoiPhien).toHaveBeenCalledTimes(1);
    expect(socket.connect).not.toHaveBeenCalled();
  });

  it('gỡ rồi thì lượt đang hẹn giờ không chạy, listener được tháo', async () => {
    const lamMoiPhien = jest.fn(async () => undefined);
    const { socket, go } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    go();
    await troi(120_000);

    expect(lamMoiPhien).not.toHaveBeenCalled();
    expect(socket.connect).not.toHaveBeenCalled();
    expect(socket.soListener('connect')).toBe(0);
    expect(socket.soListener('disconnect')).toBe(0);
  });

  it('gỡ giữa lúc đang làm tươi phiên thì không nối lại', async () => {
    let xong: () => void = () => undefined;
    const lamMoiPhien = jest.fn(
      () =>
        new Promise<void>((resolve) => {
          xong = resolve;
        }),
    );
    const { socket, go } = dung(lamMoiPhien);

    socket.phat('connect');
    socket.phat('disconnect', 'io server disconnect');
    await troi(1000);
    expect(lamMoiPhien).toHaveBeenCalledTimes(1);

    go();
    xong();
    await troi(0);

    expect(socket.connect).not.toHaveBeenCalled();
  });
});
