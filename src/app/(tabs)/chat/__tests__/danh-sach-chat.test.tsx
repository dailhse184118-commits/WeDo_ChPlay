import React from 'react';
import { fireEvent, render, waitFor, within } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManDanhSachChat from '../index';
import { getProjectUnreadCount } from '../../../../lib/api/chat';
import { listProjects } from '../../../../lib/api/projects';
import { listFriends } from '../../../../lib/api/friends';
import { useAuth } from '../../../../lib/auth/auth-context';
import { useSocket } from '../../../../lib/socket/socket-context';
import { useWorkspace } from '../../../../lib/workspace/workspace-context';
import { TEST_SAFE_AREA } from '../../../../test-utils/render';

jest.mock('../../../../lib/api/chat');
jest.mock('../../../../lib/api/projects');
jest.mock('../../../../lib/api/friends');
jest.mock('../../../../lib/api/direct-chat');
jest.mock('../../../../lib/api/workspaces');
jest.mock('../../../../lib/auth/auth-context');
jest.mock('../../../../lib/socket/socket-context');
jest.mock('../../../../lib/workspace/workspace-context');
jest.mock('../../../../lib/version/use-phien-ban', () => ({
  usePhienBan: () => ({ muc: 'moi-nhat', latest: '', notes: '' }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const mockedChuaDoc = getProjectUnreadCount as jest.MockedFunction<typeof getProjectUnreadCount>;

const DU_AN = Array.from({ length: 9 }, (_, i) => ({
  id: `p${i + 1}`,
  name: `Dự án ${i + 1}`,
  workspaceId: 'w1',
  status: 'ACTIVE',
  createdAt: '',
  updatedAt: '',
}));

let queryClient: QueryClient;

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1', fullName: 'Lê Hữu Đại' } });
  (useSocket as jest.Mock).mockReturnValue({ onlineUserIds: new Set() });
  (useWorkspace as jest.Mock).mockReturnValue({
    active: { id: 'w1', name: 'Lớp' },
    workspaces: [],
    switchTo: jest.fn(),
  });
  (listProjects as jest.Mock).mockResolvedValue(DU_AN);
  (listFriends as jest.Mock).mockResolvedValue({ friends: [], incoming: [], outgoing: [] });
  mockedChuaDoc.mockImplementation(async (id: string) => ({ count: id === 'p9' ? 4 : 0 }));
});

afterEach(() => queryClient.clear());

/*
  Trước đây chỉ 6 dự án đầu được hỏi số chưa đọc. Dự án thứ 9 có tin mới thì
  không bao giờ hiện huy hiệu, dù người dùng đã cuộn tới tận nơi.
*/
it('dự án nằm sâu trong danh sách vẫn có huy hiệu khi cuộn tới', async () => {
  const man = await render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <ManDanhSachChat />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  await waitFor(() => man.getByTestId('project-row-p9'));
  expect(mockedChuaDoc).not.toHaveBeenCalledWith('p9');

  await fireEvent(man.getByTestId('ds-du-an'), 'viewableItemsChanged', {
    viewableItems: DU_AN.slice(6).map((item, index) => ({ item, index: index + 6, isViewable: true })),
    changed: [],
  });

  await waitFor(() => expect(mockedChuaDoc).toHaveBeenCalledWith('p9'));
  await waitFor(() =>
    expect(within(man.getByTestId('project-row-p9')).queryByTestId('unread-badge')).toBeTruthy(),
  );
});
