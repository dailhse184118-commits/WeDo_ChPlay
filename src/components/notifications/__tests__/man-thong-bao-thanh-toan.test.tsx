import React from 'react';
import { Platform } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManThongBao from '../../../app/(tabs)/notifications/index';
import { listNotifications } from '../../../lib/api/notifications';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { NotificationItem } from '../../../lib/types';
import { renderScreen } from '../../../test-utils/render';

/*
  Tab Thông báo trên iPhone không được có dòng "Gói sắp hết hạn" hay "Thanh toán
  thành công": app iPhone là bản đồng hành miễn phí (Guideline 3.1.3(f)).
  Android giữ nguyên.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều thành
  một tab, kể cả tệp kiểm thử.
*/

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../../../lib/api/notifications', () => ({
  listNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}));
jest.mock('../../../lib/api/tasks', () => ({ listTasks: jest.fn(async () => []) }));
jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/notifications/local', () => ({ syncScheduledReminders: jest.fn() }));
jest.mock('../../../lib/notifications/permission', () => ({
  checkNotificationPermission: jest.fn(async () => 'blocked'),
  ensureNotificationPermission: jest.fn(),
}));

const mockedList = listNotifications as jest.MockedFunction<typeof listNotifications>;
const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

function tb(phan: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'Bạn được giao việc',
    message: 'Viết báo cáo tuần',
    userId: 'u1',
    createdAt: '2026-09-26T10:00:00.000Z',
    readAt: null,
    ...phan,
  };
}

const DANH_SACH = [
  tb({ id: 'n1', taskId: 't1' }),
  tb({
    id: 'n2',
    type: 'SUBSCRIPTION_RENEWAL_DUE',
    title: 'Gói sắp hết hạn',
    message: 'Gói Pro sẽ hết hạn sau 3 ngày.',
    actionUrl: '#/upgrade',
  }),
  tb({ id: 'n3', type: 'PAYMENT_CONFIRMED', title: 'Thanh toán thành công', message: 'Đã nhận.' }),
];

let queryClient: QueryClient;
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

async function moMan() {
  return await renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManThongBao />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  mockedList.mockResolvedValue(DANH_SACH);
  mockedAuth.mockReturnValue({ user: { id: 'u1' } } as never);
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
});

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
  queryClient.clear();
});

describe('tab Thông báo — thông báo gói/thanh toán', () => {
  it('iPhone: không hiện, và không đếm vào số chưa đọc', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Bạn được giao việc')).toBeTruthy());
    expect(man.queryByText('Gói sắp hết hạn')).toBeNull();
    expect(man.queryByText('Thanh toán thành công')).toBeNull();
    expect(man.getByText('1 thông báo chưa đọc')).toBeTruthy();
  });

  it('Android: hiện đủ như trước', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Gói sắp hết hạn')).toBeTruthy());
    expect(man.getByText('Thanh toán thành công')).toBeTruthy();
    expect(man.getByText('3 thông báo chưa đọc')).toBeTruthy();
  });
});
