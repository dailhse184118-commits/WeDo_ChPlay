import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import TabsLayout from '../_layout';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { TEST_SAFE_AREA } from '../../../test-utils/render';

jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../../../lib/api/notifications', () => ({ getUnreadCount: jest.fn() }));
jest.mock('../../../lib/api/loi-moi');
jest.mock('../../../lib/notifications/mo-tu-thong-bao', () => ({
  useOpenTaskFromNotification: jest.fn(),
}));
jest.mock('../../../lib/realtime/use-realtime-sync', () => ({ useRealtimeSync: jest.fn() }));
jest.mock('../../../lib/socket/socket-context', () => ({
  SocketProvider: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock('../../../lib/workspace/workspace-context', () => ({
  WorkspaceProvider: ({ children }: { children: React.ReactNode }) => children,
  useWorkspace: jest.fn(),
}));
jest.mock('expo-router', () => ({ Redirect: () => null, Tabs: () => null }));

it('tài khoản chưa có không gian nào vẫn thấy nút nhập mã mời', async () => {
  (useAuth as jest.Mock).mockReturnValue({ status: 'signedIn' });
  (useWorkspace as jest.Mock).mockReturnValue({
    status: 'empty',
    create: jest.fn(),
    refresh: jest.fn(),
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  const man = await render(
    <SafeAreaProvider initialMetrics={TEST_SAFE_AREA}>
      <QueryClientProvider client={queryClient}>
        <TabsLayout />
      </QueryClientProvider>
    </SafeAreaProvider>,
  );

  expect(man.getByTestId('nut-co-ma-moi')).toBeTruthy();
  queryClient.clear();
});
