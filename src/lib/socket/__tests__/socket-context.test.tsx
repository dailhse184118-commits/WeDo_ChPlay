import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';

import { SocketProvider, useSocket } from '../socket-context';
import { createChatSocket } from '../../socket';
import { useAuth } from '../../auth/auth-context';
import { loadToken } from '../../auth/token-storage';

jest.mock('../../socket');
jest.mock('../../auth/auth-context');
jest.mock('../../auth/token-storage');

const mockedCreate = createChatSocket as jest.MockedFunction<typeof createChatSocket>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLoadToken = loadToken as jest.MockedFunction<typeof loadToken>;

function makeFakeSocket() {
  const handlers: Record<string, (...args: never[]) => void> = {};
  return {
    handlers,
    on: jest.fn((event: string, fn: (...args: never[]) => void) => {
      handlers[event] = fn;
    }),
    off: jest.fn(),
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

    await waitFor(() => expect(mockedCreate).toHaveBeenCalledWith('tok-1'));
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
});
