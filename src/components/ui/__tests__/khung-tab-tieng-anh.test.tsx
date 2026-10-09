import React from 'react';
import { act, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TabsLayout from '../../../app/(tabs)/_layout';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { getUnreadCount } from '../../../lib/api/notifications';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { TEST_SAFE_AREA } from '../../../test-utils/render';

jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../../../lib/api/notifications', () => ({ getUnreadCount: jest.fn(), listNotifications: jest.fn() }));
jest.mock('../../../lib/notifications/mo-tu-thong-bao', () => ({ useOpenTaskFromNotification: jest.fn() }));
jest.mock('../../../lib/realtime/use-realtime-sync', () => ({ useRealtimeSync: jest.fn() }));
jest.mock('../../../lib/socket/socket-context', () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../../lib/workspace/workspace-context', () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => children,
  useWorkspace: jest.fn(),
}));
// Tabs giả: mỗi màn có tiêu đề (`title`) hiện thành một dòng chữ, để kiểm nhãn tab.
jest.mock('expo-router', () => {
  const { Text: Chu } = jest.requireActual('react-native');
  const Tabs = ({ children }: { children: React.ReactNode }) => children;
  Tabs.Screen = ({ options }: { options?: { title?: string } }) =>
    options?.title ? <Chu>{options.title}</Chu> : null;
  return { Redirect: () => null, Tabs };
});

async function dung() {
  (useAuth as jest.Mock).mockReturnValue({ status: 'signedIn' });
  (useWorkspace as jest.Mock).mockReturnValue({ status: 'ready' });
  (getUnreadCount as jest.Mock).mockResolvedValue({ count: 0 });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const man = await render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <TabsLayout />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );
  return { man, queryClient };
}

afterEach(() => datNgonNguChoKiemThu('vi'));

describe('nhãn thanh tab', () => {
  it('tiếng Việt: giữ nguyên như cũ', async () => {
    const { man, queryClient } = await dung();
    for (const nhan of ['Trò chuyện', 'Công việc', 'Cuộc họp', 'Thông báo', 'Tài khoản']) {
      expect(man.getByText(nhan)).toBeTruthy();
    }
    queryClient.clear();
  });

  it('tiếng Anh: Chat, Tasks, Meetings, Notifications, Account; đổi ngôn ngữ thì nhãn đổi theo', async () => {
    const { man, queryClient } = await dung();
    await act(async () => datNgonNguChoKiemThu('en'));

    for (const nhan of ['Chat', 'Tasks', 'Meetings', 'Notifications', 'Account']) {
      expect(man.getByText(nhan)).toBeTruthy();
    }
    expect(chuVietConSot(JSON.stringify(man.toJSON()))).toEqual([]);

    await act(async () => datNgonNguChoKiemThu('vi'));
    expect(man.getByText('Tài khoản')).toBeTruthy();
    queryClient.clear();
  });
});
