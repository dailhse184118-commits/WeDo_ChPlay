import React from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { TEST_SAFE_AREA } from '../../../../test-utils/render';
import ChatThreadScreen from '../[projectId]';
import { getProjectMessages } from '../../../../lib/api/chat';
import { listProjects } from '../../../../lib/api/projects';
import { getEntitlements } from '../../../../lib/api/entitlements';
import { useAuth } from '../../../../lib/auth/auth-context';
import { useSocket } from '../../../../lib/socket/socket-context';
import { useWorkspace } from '../../../../lib/workspace/workspace-context';
import type { ChatMessage } from '../../../../lib/types';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ projectId: 'p1' }),
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), push: jest.fn(), canGoBack: () => true }),
}));
jest.mock('../../../../lib/api/chat');
jest.mock('../../../../lib/api/projects', () => ({ listProjects: jest.fn() }));
jest.mock('../../../../lib/api/entitlements', () => ({
  MA_HET_LUOT_AI: 'AI_DETECTION_LIMIT_REACHED',
  getEntitlements: jest.fn(),
}));
jest.mock('../../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../../../../lib/auth/token-storage', () => ({
  loadToken: jest.fn(async () => 'tok'),
  loadRefreshToken: jest.fn(async () => null),
  saveToken: jest.fn(),
  saveRefreshToken: jest.fn(),
}));
jest.mock('../../../../lib/socket/socket-context', () => ({ useSocket: jest.fn() }));
jest.mock('../../../../lib/workspace/workspace-context', () => ({ useWorkspace: jest.fn() }));
jest.mock('../../../../lib/observability/sentry', () => ({ baoLoi: jest.fn(), moTaTep: jest.fn() }));
jest.mock('../../../../lib/images/pick-images', () => ({ chonAnh: jest.fn(), chupAnh: jest.fn() }));

const mockedGetMessages = getProjectMessages as jest.MockedFunction<typeof getProjectMessages>;
const mockedListProjects = listProjects as jest.MockedFunction<typeof listProjects>;
const mockedEntitlements = getEntitlements as jest.MockedFunction<typeof getEntitlements>;
const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseSocket = useSocket as jest.MockedFunction<typeof useSocket>;
const mockedUseWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

function tin(id: string, phut: number, content: string): ChatMessage {
  const luc = `2026-09-26T08:${String(phut).padStart(2, '0')}:00.000Z`;
  return {
    id,
    content,
    workspaceId: 'w1',
    projectId: 'p1',
    authorId: 'u2',
    createdAt: luc,
    updatedAt: luc,
    author: { id: 'u2', fullName: 'Bảo', email: 'bao@wedo.local' } as never,
  };
}

const TIN_1 = tin('m1', 1, 'Chào cả nhóm');
const TIN_LO = tin('m2', 2, 'Tin gửi lúc bạn mất kết nối');

function taoSocketGia() {
  return { on: jest.fn(), off: jest.fn(), emit: jest.fn() };
}

describe('màn chat dự án tải bù tin bị lỡ', () => {
  let queryClient: QueryClient;
  let socket: ReturnType<typeof taoSocketGia>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    // gcTime vô hạn: không để bộ đếm dọn cache giữ Jest không thoát khi chạy riêng tệp này.
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    socket = taoSocketGia();

    mockedUseAuth.mockReturnValue({ user: { id: 'u1', fullName: 'Dương' } } as never);
    mockedUseWorkspace.mockReturnValue({ active: { id: 'w1' } } as never);
    mockedListProjects.mockResolvedValue([{ id: 'p1', name: 'Đồ án', members: [] }] as never);
    mockedEntitlements.mockResolvedValue({
      usage: {
        aiDetections: { used: 0, limit: 20, remaining: 20, periodEnd: '2026-10-01T00:00:00.000Z', pending: 0 },
      },
    });
    mockedGetMessages.mockResolvedValue([TIN_1]);
  });

  afterEach(() => {
    queryClient.clear();
    jest.restoreAllMocks();
  });

  function ketNoi(connected: boolean) {
    mockedUseSocket.mockReturnValue({ socket, connected, onlineUserIds: new Set() } as never);
  }

  // Bọc SafeAreaProvider ngay trong cây: `rerender` thay cả cây, kể cả lớp bọc của renderScreen.
  const giaoDien = () => (
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ChatThreadScreen />
      </QueryClientProvider>
    </SafeAreaProvider>
  );

  it('socket nối lại thì xin vào lại phòng và hiện tin gửi trong lúc đứt', async () => {
    ketNoi(true);
    const man = await render(giaoDien());
    await waitFor(() => expect(man.getByText('Chào cả nhóm')).toBeTruthy());

    ketNoi(false);
    await man.rerender(giaoDien());

    mockedGetMessages.mockResolvedValue([TIN_1, TIN_LO]);
    socket.emit.mockClear();
    ketNoi(true);
    await man.rerender(giaoDien());

    await waitFor(() => expect(man.getByText('Tin gửi lúc bạn mất kết nối')).toBeTruthy());
    expect(man.getByText('Chào cả nhóm')).toBeTruthy();
    expect(socket.emit).toHaveBeenCalledWith('join:project', { projectId: 'p1' });
  });

  it('quay lại app thì tải bù ngay, không chờ socket tự nhận ra đã đứt', async () => {
    const nghe: Array<(trangThai: AppStateStatus) => void> = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_loai, fn) => {
      nghe.push(fn as (trangThai: AppStateStatus) => void);
      return { remove: jest.fn() } as never;
    });

    ketNoi(true);
    const man = await render(giaoDien());
    await waitFor(() => expect(man.getByText('Chào cả nhóm')).toBeTruthy());

    mockedGetMessages.mockResolvedValue([TIN_1, TIN_LO]);
    await act(async () => {
      for (const fn of nghe) fn('background');
      for (const fn of nghe) fn('active');
    });

    await waitFor(() => expect(man.getByText('Tin gửi lúc bạn mất kết nối')).toBeTruthy());
  });

  it('mở màn lúc socket đã nối sẵn thì chỉ tải một lần, không tải trùng', async () => {
    ketNoi(true);
    const man = await render(giaoDien());
    await waitFor(() => expect(man.getByText('Chào cả nhóm')).toBeTruthy());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockedGetMessages).toHaveBeenCalledTimes(1);
  });

  it('tải bù hỏng vì mất mạng thì giữ nguyên tin đang hiện, không báo lỗi', async () => {
    ketNoi(true);
    const man = await render(giaoDien());
    await waitFor(() => expect(man.getByText('Chào cả nhóm')).toBeTruthy());

    ketNoi(false);
    await man.rerender(giaoDien());
    mockedGetMessages.mockRejectedValue(new Error('Network request failed'));
    ketNoi(true);
    await man.rerender(giaoDien());
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(mockedGetMessages).toHaveBeenCalledTimes(2);
    expect(man.getByText('Chào cả nhóm')).toBeTruthy();
    expect(man.queryByText('Network request failed')).toBeNull();
  });
});
