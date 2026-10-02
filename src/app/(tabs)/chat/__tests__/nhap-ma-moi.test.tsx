import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManDanhSachChat from '../index';
import { listProjects } from '../../../../lib/api/projects';
import { listFriends } from '../../../../lib/api/friends';
import { thamGiaLoiMoi, xemTruocLoiMoi } from '../../../../lib/api/loi-moi';
import { saveActiveWorkspaceId } from '../../../../lib/auth/token-storage';
import { useAuth } from '../../../../lib/auth/auth-context';
import { useSocket } from '../../../../lib/socket/socket-context';
import { useWorkspace } from '../../../../lib/workspace/workspace-context';
import { TEST_SAFE_AREA } from '../../../../test-utils/render';

jest.mock('../../../../lib/api/chat');
jest.mock('../../../../lib/api/projects');
jest.mock('../../../../lib/api/friends');
jest.mock('../../../../lib/api/direct-chat');
jest.mock('../../../../lib/api/workspaces');
jest.mock('../../../../lib/api/loi-moi');
jest.mock('../../../../lib/auth/token-storage', () => ({
  ...jest.requireActual('../../../../lib/auth/token-storage'),
  saveActiveWorkspaceId: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../../lib/auth/auth-context');
jest.mock('../../../../lib/socket/socket-context');
jest.mock('../../../../lib/workspace/workspace-context');
jest.mock('../../../../lib/version/use-phien-ban', () => ({
  usePhienBan: () => ({ muc: 'moi-nhat', latest: '', notes: '' }),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

let queryClient: QueryClient;
const refresh = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', fullName: 'Lê Hữu Đại' } });
  (useSocket as jest.Mock).mockReturnValue({ onlineUserIds: new Set() });
  (useWorkspace as jest.Mock).mockReturnValue({
    active: { id: 'w1', name: 'Lớp' },
    workspaces: [],
    switchTo: jest.fn(),
    refresh,
  });
  (listProjects as jest.Mock).mockResolvedValue([]);
  (listFriends as jest.Mock).mockResolvedValue({ friends: [], incoming: [], outgoing: [] });
  (xemTruocLoiMoi as jest.Mock).mockResolvedValue({
    projectName: 'Đồ án EXE',
    workspaceName: 'Nhóm 3',
    leaderName: 'Lan',
    memberCount: 4,
    expiresAt: '2026-10-09T03:30:00.000Z',
  });
  (thamGiaLoiMoi as jest.Mock).mockResolvedValue({ projectId: 'p-moi', workspaceId: 'w2', alreadyMember: false });
});

afterEach(() => queryClient.clear());

it('nhập mã, tham gia xong: chọn đúng không gian, tải lại, mở chat dự án vừa vào', async () => {
  const man = await render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManDanhSachChat />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

  await waitFor(() => man.getByTestId('nut-nhap-ma-moi'));
  await fireEvent.press(man.getByTestId('nut-nhap-ma-moi'));
  await fireEvent.changeText(man.getByTestId('o-ma-moi'), '7k3m9qxa');
  await fireEvent.press(man.getByTestId('nut-xem-loi-moi'));
  await waitFor(() => man.getByText('Đồ án EXE'));
  await fireEvent.press(man.getByTestId('nut-tham-gia'));

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/chat/p-moi'));
  expect(saveActiveWorkspaceId).toHaveBeenCalledWith('w2');
  expect(refresh).toHaveBeenCalled();
  // Lưu không gian TRƯỚC khi tải lại, để `refresh` chọn đúng không gian mới.
  expect((saveActiveWorkspaceId as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan(
    refresh.mock.invocationCallOrder[0],
  );
});
