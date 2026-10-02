import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManThongBao from '../../../app/(tabs)/notifications/index';
import { getUnreadCount, listNotifications, markNotificationRead } from '../../../lib/api/notifications';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { NotificationItem } from '../../../lib/types';

jest.mock('../../../lib/api/notifications');
jest.mock('../../../lib/api/tasks');
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/notifications/local', () => ({ syncScheduledReminders: jest.fn() }));
jest.mock('../../../lib/notifications/permission', () => ({
  checkNotificationPermission: jest.fn(async () => 'blocked'),
  ensureNotificationPermission: jest.fn(),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const THANH_VIEN_MOI: NotificationItem = {
  id: 'n2',
  type: 'PROJECT_MEMBER_JOINED',
  title: 'Thành viên mới tham gia dự án',
  message: 'Lan đã tham gia dự án "Đồ án EXE" qua link mời.',
  userId: 'u1',
  projectId: 'p-1',
  workspaceId: 'w-1',
  readAt: null,
  createdAt: '2026-10-02T09:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
  (useWorkspace as jest.Mock).mockReturnValue({ active: { id: 'w1' } });
  (listNotifications as jest.Mock).mockResolvedValue([THANH_VIEN_MOI]);
  (getUnreadCount as jest.Mock).mockResolvedValue({ count: 1 });
  (markNotificationRead as jest.Mock).mockResolvedValue({});
});

it('chạm thông báo có người vào nhóm: mở chat của dự án đó', async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const man = await renderScreen(
    <QueryClientProvider client={client}>
      <ManThongBao />
    </QueryClientProvider>,
  );

  await waitFor(() => man.getByText('Thành viên mới tham gia dự án'));
  await fireEvent.press(man.getByTestId('notification-n2'));

  await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/chat/p-1'));
  expect(markNotificationRead).toHaveBeenCalledWith('n2');
  client.clear();
});
