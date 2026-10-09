import React from 'react';
import { Platform } from 'react-native';
import { waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { NotificationRow } from '../NotificationRow';
import ManThongBao from '../../../app/(tabs)/notifications/index';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';
import { getUnreadCount, listNotifications } from '../../../lib/api/notifications';
import { useAuth } from '../../../lib/auth/auth-context';
import { checkNotificationPermission } from '../../../lib/notifications/permission';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import type { NotificationItem } from '../../../lib/types';
import { renderScreen } from '../../../test-utils/render';

// Tab Thông báo ở tiếng Anh: chữ của app đổi, nội dung máy chủ gửi (đã đúng ngôn ngữ người nhận) giữ nguyên.

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), navigate: jest.fn() }),
  useFocusEffect: jest.fn(),
}));
jest.mock('../../../lib/api/notifications', () => ({
  getUnreadCount: jest.fn(),
  listNotifications: jest.fn(),
  markAllNotificationsRead: jest.fn(),
  markNotificationRead: jest.fn(),
}));
jest.mock('../../../lib/api/tasks', () => ({ listTasks: jest.fn(async () => []) }));
jest.mock('../../../lib/auth/auth-context', () => ({ useAuth: jest.fn() }));
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/notifications/local', () => ({ syncScheduledReminders: jest.fn() }));
jest.mock('../../../lib/notifications/permission', () => ({
  checkNotificationPermission: jest.fn(),
  ensureNotificationPermission: jest.fn(),
}));
jest.mock('../../../lib/notifications/push-token', () => ({ dongBoPushToken: jest.fn() }));

const mockedList = listNotifications as jest.MockedFunction<typeof listNotifications>;
const mockedDem = getUnreadCount as jest.MockedFunction<typeof getUnreadCount>;
const mockedQuyen = checkNotificationPermission as jest.MockedFunction<typeof checkNotificationPermission>;

type Nut = { props?: Record<string, unknown>; children?: unknown[] | null };

/** Gom chữ hiển thị: nội dung chữ và các thuộc tính chữ (nhãn truy cập, gợi ý ô nhập). */
function gomChu(nut: unknown, ra: string[] = []): string[] {
  if (typeof nut === 'string') ra.push(nut);
  else if (nut && typeof nut === 'object') {
    const { props, children } = nut as Nut;
    for (const khoa of ['accessibilityLabel', 'placeholder', 'label', 'title']) {
      const v = props?.[khoa];
      if (typeof v === 'string') ra.push(v);
    }
    (children ?? []).forEach((con) => gomChu(con, ra));
  }
  return ra;
}

const cay = (man: { toJSON: () => unknown }) => {
  const goc = man.toJSON();
  return JSON.stringify((Array.isArray(goc) ? goc : [goc]).flatMap((n) => gomChu(n)));
};

let queryClient: QueryClient;
let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS>;

async function moMan() {
  return await renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManThongBao />
    </QueryClientProvider>,
  );
}

function thongBao(phan: Partial<NotificationItem>): NotificationItem {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'You have a new task',
    message: 'Write the weekly report',
    userId: 'u1',
    createdAt: new Date(Date.now() - 5 * 60_000).toISOString(),
    readAt: null,
    ...phan,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  (useAuth as jest.Mock).mockReturnValue({ user: { id: 'u1' } });
  (useWorkspace as jest.Mock).mockReturnValue({ active: { id: 'w1', name: 'Team' } });
});

afterEach(() => {
  heDieuHanh.restore();
  datNgonNguChoKiemThu('vi');
  queryClient.clear();
});

describe('tab Thông báo ở tiếng Anh', () => {
  it('danh sách trống kèm thẻ xin quyền: không còn chữ tiếng Việt', async () => {
    mockedList.mockResolvedValue([]);
    mockedDem.mockResolvedValue({ count: 0 });
    mockedQuyen.mockResolvedValue('undetermined');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('Get a reminder before tasks are due')).toBeTruthy());
    expect(man.getByText('Notifications')).toBeTruthy();
    expect(man.getByText('You’re all caught up')).toBeTruthy();
    expect(man.getByText('Later')).toBeTruthy();
    expect(man.getByText('Turn on notifications')).toBeTruthy();
    expect(man.getByText('No notifications yet')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('có thông báo chưa đọc: số nhiều, nút đọc hết, giờ tương đối; nội dung máy chủ giữ nguyên', async () => {
    mockedList.mockResolvedValue([
      thongBao({}),
      thongBao({ id: 'n2', createdAt: new Date(Date.now() - 3 * 3_600_000).toISOString() }),
    ]);
    mockedDem.mockResolvedValue({ count: 2 });
    mockedQuyen.mockResolvedValue('blocked');
    const man = await moMan();

    await waitFor(() => expect(man.getAllByText('You have a new task').length).toBe(2));
    expect(man.getByText('2 unread notifications')).toBeTruthy();
    expect(man.getByText('Mark all read')).toBeTruthy();
    expect(man.getByText('5 min ago')).toBeTruthy();
    expect(man.getByText('3 hr ago')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('ngày của thông báo cũ tính theo giờ Việt Nam, không theo múi giờ máy', async () => {
    // 18:30 UTC ngày 9/9 = 01:30 ngày 10/9 ở Việt Nam (UTC+7).
    const iso = '2026-09-09T18:30:00.000Z';
    const en = await renderScreen(<NotificationRow item={thongBao({ createdAt: iso })} onPress={() => undefined} />);
    expect(en.getByText('Sep 10')).toBeTruthy();

    datNgonNguChoKiemThu('vi');
    const vi = await renderScreen(<NotificationRow item={thongBao({ createdAt: iso })} onPress={() => undefined} />);
    expect(vi.queryByText('Sep 10')).toBeNull();
  });

  it('một thông báo chưa đọc dùng số ít', async () => {
    mockedList.mockResolvedValue([]);
    mockedDem.mockResolvedValue({ count: 1 });
    mockedQuyen.mockResolvedValue('blocked');
    const man = await moMan();

    await waitFor(() => expect(man.getByText('1 unread notification')).toBeTruthy());
  });
});
