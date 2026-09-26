import React from 'react';
import { Text } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';

import { useRealtimeSync } from '../use-realtime-sync';
import { KHOA_NAP_LAI_KHI_NOI_LAI } from '../sync-rules';
import { useSocket } from '../../socket/socket-context';
import { useWorkspace } from '../../workspace/workspace-context';
import { listProjects } from '../../api/projects';

jest.mock('../../socket/socket-context', () => ({ useSocket: jest.fn() }));
jest.mock('../../workspace/workspace-context', () => ({ useWorkspace: jest.fn() }));
jest.mock('../../api/projects', () => ({ listProjects: jest.fn() }));

const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedUseWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;
const mockedListProjects = listProjects as jest.MockedFunction<typeof listProjects>;

function Probe() {
  useRealtimeSync();
  return <Text>ok</Text>;
}

function taoSocketGia() {
  return { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
}

describe('useRealtimeSync khi socket nối lại', () => {
  let queryClient: QueryClient;
  let invalidate: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    // gcTime vô hạn: không để bộ đếm dọn cache giữ Jest không thoát khi chạy riêng tệp này.
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    invalidate = jest.spyOn(queryClient, 'invalidateQueries');
    mockedUseWorkspace.mockReturnValue({ active: { id: 'w1' } } as never);
    mockedListProjects.mockResolvedValue([] as never);
  });

  afterEach(() => {
    queryClient.clear();
  });

  function ketNoi(socket: unknown, connected: boolean) {
    mockedUseSocket.mockReturnValue({ socket, connected, onlineUserIds: new Set() } as never);
  }

  const giaoDien = () => (
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>
  );

  it('lần nối đầu không nạp lại gì: dữ liệu vừa tải xong', async () => {
    ketNoi(taoSocketGia(), true);
    await render(giaoDien());

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('đứt rồi nối lại thì nạp lại mọi thứ vốn nhờ sự kiện socket để tươi', async () => {
    const socket = taoSocketGia();
    ketNoi(socket, true);
    const { rerender } = await render(giaoDien());

    ketNoi(socket, false);
    await rerender(giaoDien());
    expect(invalidate).not.toHaveBeenCalled();

    ketNoi(socket, true);
    await rerender(giaoDien());

    for (const queryKey of KHOA_NAP_LAI_KHI_NOI_LAI) {
      expect(invalidate).toHaveBeenCalledWith({ queryKey });
    }
  });

  it('socket mới sau khi đăng nhập lại thì lần nối đầu của nó cũng không nạp lại', async () => {
    const cu = taoSocketGia();
    ketNoi(cu, true);
    const { rerender } = await render(giaoDien());

    ketNoi(null, false);
    await rerender(giaoDien());
    ketNoi(taoSocketGia(), false);
    await rerender(giaoDien());
    ketNoi(mockedUseSocket.mock.results.at(-1)?.value.socket, true);
    await rerender(giaoDien());

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('nối lại thì xin vào lại phòng dự án, vì máy chủ quên phòng của socket cũ', async () => {
    mockedListProjects.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }] as never);
    const socket = taoSocketGia();
    ketNoi(socket, true);
    const { rerender } = await render(giaoDien());
    await rerender(giaoDien());
    const lanDau = socket.emit.mock.calls.length;
    expect(lanDau).toBe(2);

    ketNoi(socket, false);
    await rerender(giaoDien());
    ketNoi(socket, true);
    await rerender(giaoDien());

    expect(socket.emit).toHaveBeenCalledTimes(4);
    expect(socket.emit).toHaveBeenLastCalledWith('join:project', { projectId: 'p2' });
  });
});
