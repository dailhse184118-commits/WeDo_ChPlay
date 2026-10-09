import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { renderScreen } from '../../../test-utils/render';
import ManThongBao from '../../../app/(tabs)/notifications/index';
import {
  getUnreadCount,
  listNotifications,
  markAllNotificationsRead,
} from '../../../lib/api/notifications';
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
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: (hieuUng: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual('react');
    useEffect(hieuUng, [hieuUng]);
  },
}));

const DA_DOC: NotificationItem = {
  id: 'n1',
  type: 'TASK_ASSIGNED',
  title: 'Bạn được giao task mới',
  message: 'Viết báo cáo',
  readAt: '2026-09-30T10:00:00.000Z',
  createdAt: '2026-09-30T09:00:00.000Z',
} as NotificationItem;

beforeEach(() => {
  jest.clearAllMocks();
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
  (useWorkspace as jest.Mock).mockReturnValue({ active: { id: 'w1' } });
  (listNotifications as jest.Mock).mockResolvedValue([DA_DOC]);
  (markAllNotificationsRead as jest.Mock).mockResolvedValue({});
});

async function moMan() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const man = await renderScreen(
    <QueryClientProvider client={client}>
      <ManThongBao />
    </QueryClientProvider>,
  );
  await waitFor(() => man.getByText('Bạn được giao task mới'));
  return man;
}

/*
  Tách khỏi `man-thong-bao.test.tsx` lúc gộp nhánh ios vào main (10/2026): hai
  nhánh cùng tạo tệp đó với hai bộ kiểm thử khác nhau.

  Danh sách chỉ có 50 thông báo mới nhất, còn số trên huy hiệu đếm MỌI thông báo
  chưa đọc. Trước đây nút "Đọc hết" dựa vào danh sách: chưa đọc nằm ngoài 50 mục
  thì nút biến mất, màn ghi "Bạn đã đọc hết" mà huy hiệu vẫn đỏ, không cách nào tắt.
*/
describe('Đọc hết theo số chưa đọc của máy chủ', () => {
  it('danh sách đã đọc hết nhưng máy chủ còn 5 chưa đọc: vẫn có nút Đọc hết', async () => {
    (getUnreadCount as jest.Mock).mockResolvedValue({ count: 5 });
    const man = await moMan();

    await waitFor(() => expect(man.getByTestId('mark-all-read')).toBeTruthy());
    expect(man.getByText('5 thông báo chưa đọc')).toBeTruthy();

    await fireEvent.press(man.getByTestId('mark-all-read'));
    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalledTimes(1));
  });

  it('máy chủ báo 0 thì không có nút', async () => {
    (getUnreadCount as jest.Mock).mockResolvedValue({ count: 0 });
    const man = await moMan();

    await waitFor(() => expect(getUnreadCount).toHaveBeenCalled());
    expect(man.queryByTestId('mark-all-read')).toBeNull();
    expect(man.getByText('Bạn đã đọc hết')).toBeTruthy();
  });
});
