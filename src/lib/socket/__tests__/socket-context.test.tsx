import React from 'react';
import { AppState, Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

import { SocketProvider, useSocket } from '../socket-context';
import { createChatSocket } from '../../socket';
import { useAuth } from '../../auth/auth-context';
import { loadToken } from '../../auth/token-storage';
import { giaHanMotLuot } from '../../api/client';

jest.mock('../../socket');
jest.mock('../../auth/auth-context');
jest.mock('../../auth/token-storage');
jest.mock('../../api/client', () => ({ giaHanMotLuot: jest.fn() }));

const mockedCreate = createChatSocket as jest.MockedFunction<typeof createChatSocket>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;
const mockedGiaHan = giaHanMotLuot as jest.MockedFunction<typeof giaHanMotLuot>;

function makeFakeSocket() {
  const handlers: Record<string, (...args: never[]) => void> = {};
  return {
    handlers,
    connected: false,
    active: false,
    on: jest.fn((event: string, fn: (...args: never[]) => void) => {
      handlers[event] = fn;
    }),
    off: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  };
}

let doiTrangThai: (trangThai: string) => void = () => undefined;
let spyAppState: jest.SpyInstance;

function Probe() {
  const { connected, onlineUserIds } = useSocket();
  return (
    <>
      <Text testID="connected">{connected ? 'co' : 'khong'}</Text>
      <Text testID="online">{String(onlineUserIds.size)}</Text>
    </>
  );
}

describe('SocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadToken.mockResolvedValue('tok-1');
    mockedGiaHan.mockResolvedValue('tok-moi');
    spyAppState = jest.spyOn(AppState, 'addEventListener').mockImplementation((_, fn) => {
      doiTrangThai = fn as (trangThai: string) => void;
      return { remove: jest.fn() } as never;
    });
  });

  afterEach(() => {
    spyAppState.mockRestore();
    jest.useRealTimers();
  });

  it('không kết nối khi chưa đăng nhập', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedOut' } as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).not.toHaveBeenCalled());
  });

  it('kết nối khi đã đăng nhập', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    mockedCreate.mockReturnValue(makeFakeSocket() as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledTimes(1));

    // Truyền HÀM đọc token, để mỗi lần nối lại lấy đúng token đang lưu.
    const layToken = mockedCreate.mock.calls[0][0];
    await expect(layToken()).resolves.toBe('tok-1');

    // Token trên máy đổi (phần gọi API vừa gia hạn) thì lần bắt tay sau phải thấy token mới.
    mockedLoadToken.mockResolvedValueOnce('tok-2');
    await expect(layToken()).resolves.toBe('tok-2');
  });

  it('cập nhật cờ connected khi socket báo connect', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { getByTestId } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(fake.handlers.connect).toBeDefined());
    fake.handlers.connect();

    await waitFor(() => expect(getByTestId('connected').props.children).toBe('co'));
  });

  it('ghi nhận danh sách người đang online từ presence:snapshot', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { getByTestId } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(fake.handlers['presence:snapshot']).toBeDefined());
    fake.handlers['presence:snapshot'](['u1', 'u2'] as never);

    await waitFor(() => expect(getByTestId('online').props.children).toBe('2'));
  });

  it('ngắt kết nối khi unmount', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    const { unmount } = await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());
    await unmount();

    expect(fake.disconnect).toHaveBeenCalled();
  });

  /*
    Máy chủ ngắt socket (token hết hạn, hay lỗi tạm thời lúc bắt tay) thì
    socket.io-client KHÔNG tự nối lại — realtime chết im lặng tới khi tắt app,
    trong khi gọi API vẫn chạy nên không ai nhận ra.
  */
  it('bị máy chủ ngắt thì gia hạn phiên rồi tự nối lại', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    expect(fake.connect).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(mockedGiaHan).toHaveBeenCalledTimes(1);
    expect(fake.connect).toHaveBeenCalledTimes(1);
  });

  /*
    Rớt mạng thường thì socket.io tự nối lại. Chen thêm một lượt nối tay là hai
    kết nối đua nhau, và gia hạn phiên vô cớ.
  */
  it('rớt mạng thường thì để thư viện tự nối, không can thiệp', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    await act(async () => fake.handlers.disconnect('transport close' as never));
    await act(async () => {
      jest.advanceTimersByTime(120_000);
    });

    expect(mockedGiaHan).not.toHaveBeenCalled();
    expect(fake.connect).not.toHaveBeenCalled();
  });

  /* Phiên đã hết hẳn: nối lại chỉ bị ngắt tiếp, lặp vô tận. */
  it('không gia hạn được phiên thì thôi, không nối lại', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    mockedGiaHan.mockResolvedValue(null);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });

    expect(mockedGiaHan).toHaveBeenCalledTimes(1);
    expect(fake.connect).not.toHaveBeenCalled();
  });

  /*
    Mở app lên mà socket đang nằm chết (không kết nối, cũng không đang tự thử
    lại) thì nối ngay, không đợi hẹn giờ lùi dần.
  */
  it('app trở lại tiền cảnh mà socket đang chết thì nối ngay', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(mockedCreate).toHaveBeenCalled());

    await act(async () => doiTrangThai('active'));
    expect(fake.connect).toHaveBeenCalledTimes(1);

    fake.connect.mockClear();
    fake.active = true;
    await act(async () => doiTrangThai('active'));
    expect(fake.connect).not.toHaveBeenCalled();
  });

  /*
    Máy chủ từ chối trong lúc bắt tay SAU khi đã gửi gói CONNECT, nên mỗi lần bị
    từ chối, máy khách thấy 'connect' rồi mới tới 'io server disconnect'. Đặt lại
    bộ đếm lùi ở 'connect' là giữ thời gian chờ mãi ở 2 giây — máy chủ đang quá
    tải lại bị dội đều đặn. Chỉ đặt lại khi máy chủ thật sự nhận phiên.
  */
  it('bị từ chối liên tiếp thì chờ lâu dần: 2s, 4s, 8s', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    // Mỗi lần nối: máy chủ nhận CONNECT rồi từ chối ngay.
    fake.connect.mockImplementation(() => {
      fake.handlers.connect();
      fake.handlers.disconnect('io server disconnect' as never);
      return fake as never;
    });
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    await act(async () => {
      fake.handlers.connect();
      fake.handlers.disconnect('io server disconnect' as never);
    });

    async function troiQua(ms: number) {
      await act(async () => {
        jest.advanceTimersByTime(ms);
      });
    }

    await troiQua(2_000);
    expect(fake.connect).toHaveBeenCalledTimes(1);
    await troiQua(3_999);
    expect(fake.connect).toHaveBeenCalledTimes(1);
    await troiQua(1);
    expect(fake.connect).toHaveBeenCalledTimes(2);
    await troiQua(7_999);
    expect(fake.connect).toHaveBeenCalledTimes(2);
    await troiQua(1);
    expect(fake.connect).toHaveBeenCalledTimes(3);
  });

  it('máy chủ nhận phiên (presence:snapshot) thì lần bị ngắt sau chờ lại từ 2s', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    // Bị ngắt hai lần liền → lần chờ kế tiếp là 4s.
    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    await act(async () => {
      jest.advanceTimersByTime(4_000);
    });
    expect(fake.connect).toHaveBeenCalledTimes(2);

    // Lần này máy chủ nhận phiên thật.
    await act(async () => {
      fake.handlers.connect();
      fake.handlers['presence:snapshot'](['u1'] as never);
    });
    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(fake.connect).toHaveBeenCalledTimes(3);
  });

  /*
    Tới hạn nối lại mà socket đã được nối từ chỗ khác (mở app lên thì nhánh
    AppState nối ngay) thì thôi: gọi connect() lần nữa là gửi CONNECT thứ hai
    trên cùng kết nối, máy chủ coi là sai trạng thái và cắt cả kết nối.
  */
  it('tới hạn mà socket đã đang nối từ chỗ khác thì không nối thêm lần nữa', async () => {
    jest.useFakeTimers();
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    let giaHanXong: (token: string) => void = () => undefined;
    mockedGiaHan.mockReturnValueOnce(new Promise((xong) => (giaHanXong = xong)));
    const fake = makeFakeSocket();
    mockedCreate.mockReturnValue(fake as never);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );
    await waitFor(() => expect(fake.handlers.disconnect).toBeDefined());

    await act(async () => fake.handlers.disconnect('io server disconnect' as never));
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    // Đang chờ gia hạn thì app được mở lên: nhánh AppState nối ngay.
    await act(async () => doiTrangThai('active'));
    expect(fake.connect).toHaveBeenCalledTimes(1);
    fake.active = true;

    await act(async () => giaHanXong('tok-moi'));
    expect(fake.connect).toHaveBeenCalledTimes(1);
  });
});
