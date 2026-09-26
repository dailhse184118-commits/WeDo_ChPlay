import React from 'react';
import { Text } from 'react-native';
import { act, render, waitFor } from '@testing-library/react-native';

import { SocketProvider, useSocket } from '../socket-context';
import { createChatSocket } from '../../socket';
import { getMe } from '../../api/auth';
import { useAuth } from '../../auth/auth-context';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../socket');
jest.mock('../../api/auth');
jest.mock('../../auth/auth-context');
jest.mock('../../auth/token-storage');

const mockedCreate = createChatSocket as jest.MockedFunction<typeof createChatSocket>;
const mockedGetMe = getMe as jest.MockedFunction<typeof getMe>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;

/**
 * Socket giả giữ NHIỀU listener cho một sự kiện, như socket thật. Bản cũ chỉ giữ
 * listener đăng ký sau cùng, nên hai nơi cùng nghe `connect` là một nơi bị đè.
 */
function makeFakeSocket() {
  const listeners: Record<string, Array<(...args: never[]) => void>> = {};
  return {
    listeners,
    emitFake(event: string, ...args: unknown[]) {
      for (const fn of listeners[event] ?? []) (fn as (...a: unknown[]) => void)(...args);
    },
    on: jest.fn((event: string, fn: (...args: never[]) => void) => {
      (listeners[event] ??= []).push(fn);
    }),
    off: jest.fn((event: string, fn: (...args: never[]) => void) => {
      listeners[event] = (listeners[event] ?? []).filter((f) => f !== fn);
    }),
    connect: jest.fn(),
    disconnect: jest.fn(),
    emit: jest.fn(),
  };
}

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

    // Nhận HÀM đọc token chứ không nhận token: lần nối lại nào cũng đọc bản mới nhất.
    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith(mockedLoadToken));
  });

  it('không tạo socket khi máy không còn token', async () => {
    mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
    mockedLoadToken.mockResolvedValue(null);

    await render(
      <SocketProvider>
        <Probe />
      </SocketProvider>,
    );

    await waitFor(() => expect(mockedLoadToken).toHaveBeenCalled());
    expect(mockedCreate).not.toHaveBeenCalled();
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

    await waitFor(() => expect(fake.listeners.connect?.length).toBeGreaterThan(0));
    await act(async () => fake.emitFake('connect'));

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

    await waitFor(() => expect(fake.listeners['presence:snapshot']?.length).toBe(1));
    await act(async () => fake.emitFake('presence:snapshot', ['u1', 'u2']));

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

  describe('máy chủ chủ động ngắt socket', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(Math, 'random').mockReturnValue(0);
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('làm tươi phiên qua tầng API rồi tự nối lại, thay vì đứng im vĩnh viễn', async () => {
      mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
      mockedGetMe.mockResolvedValue({} as never);
      const fake = makeFakeSocket();
      mockedCreate.mockReturnValue(fake as never);

      await render(
        <SocketProvider>
          <Probe />
        </SocketProvider>,
      );
      await waitFor(() => expect(mockedCreate).toHaveBeenCalled());

      await act(async () => {
        fake.emitFake('connect');
        fake.emitFake('disconnect', 'io server disconnect');
      });
      expect(fake.connect).not.toHaveBeenCalled();

      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000);
      });

      expect(mockedGetMe).toHaveBeenCalledTimes(1);
      expect(fake.connect).toHaveBeenCalledTimes(1);
    });

    it('đăng xuất giữa lúc đang chờ nối lại thì không dựng lại socket đã đóng', async () => {
      mockedUseAuth.mockReturnValue({ status: 'signedIn' } as never);
      mockedGetMe.mockResolvedValue({} as never);
      const fake = makeFakeSocket();
      mockedCreate.mockReturnValue(fake as never);

      const { unmount } = await render(
        <SocketProvider>
          <Probe />
        </SocketProvider>,
      );
      await waitFor(() => expect(mockedCreate).toHaveBeenCalled());

      await act(async () => {
        fake.emitFake('connect');
        fake.emitFake('disconnect', 'io server disconnect');
      });
      await unmount();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(120_000);
      });

      expect(fake.disconnect).toHaveBeenCalled();
      expect(mockedGetMe).not.toHaveBeenCalled();
      expect(fake.connect).not.toHaveBeenCalled();
    });
  });
});
