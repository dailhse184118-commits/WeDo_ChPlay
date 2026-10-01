import React from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { useRealtimeSync } from '../use-realtime-sync';
import { listProjects } from '../../api/projects';
import { useAuth } from '../../auth/auth-context';
import { useSocket } from '../../socket/socket-context';
import { useWorkspace } from '../../workspace/workspace-context';

jest.mock('../../api/projects');
jest.mock('../../auth/auth-context');
jest.mock('../../socket/socket-context');
jest.mock('../../workspace/workspace-context');

type XuLy = (...args: never[]) => void;

function socketGia() {
  const xuLy: Record<string, XuLy> = {};
  return {
    xuLy,
    on: jest.fn((ten: string, fn: XuLy) => {
      xuLy[ten] = fn;
    }),
    off: jest.fn((ten: string, fn: XuLy) => {
      if (xuLy[ten] === fn) delete xuLy[ten];
    }),
    emit: jest.fn(),
  };
}

let queryClient: QueryClient;

beforeEach(() => {
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (listProjects as jest.Mock).mockResolvedValue([]);
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
  (useWorkspace as jest.Mock).mockReturnValue({ active: { id: 'w1' } });
});

afterEach(() => queryClient.clear());

/*
  Người gửi thu hồi tin nhắn riêng trên web (hoặc quản trị gỡ sau báo cáo):
  trước đây điện thoại không nghe sự kiện này nên vẫn hiện nguyên nội dung cũ.
*/
it('nghe message:direct:recalled và làm hỏng luồng tin lẫn danh sách hội thoại', async () => {
  const socket = socketGia();
  (useSocket as jest.Mock).mockReturnValue({ socket, connected: true });
  const baoHong = jest.spyOn(queryClient, 'invalidateQueries');

  const { unmount } = await renderHook(() => useRealtimeSync(), {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });

  expect(socket.xuLy['message:direct:recalled']).toBeDefined();
  await act(async () => socket.xuLy['message:direct:recalled']());

  expect(baoHong).toHaveBeenCalledWith({ queryKey: ['direct-messages'] });
  expect(baoHong).toHaveBeenCalledWith({ queryKey: ['direct-conversations'] });

  await unmount();
  expect(socket.xuLy['message:direct:recalled']).toBeUndefined();
});
