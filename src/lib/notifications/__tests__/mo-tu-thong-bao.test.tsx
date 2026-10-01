import * as Notifications from 'expo-notifications';
import { renderHook, waitFor } from '@testing-library/react-native';

import { useOpenTaskFromNotification } from '../mo-tu-thong-bao';

/*
  Bản giả GIỮ TRẠNG THÁI như module native thật: lần chạm gần nhất sống suốt
  đời tiến trình cho tới khi `clearLastNotificationResponse` được gọi.
*/
let mockLanChamGanNhat: Notifications.NotificationResponse | null = null;
const mockPush = jest.fn();

jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('expo-notifications', () => ({
  getLastNotificationResponseAsync: jest.fn(async () => mockLanChamGanNhat),
  clearLastNotificationResponse: jest.fn(() => {
    mockLanChamGanNhat = null;
  }),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
}));

function lanCham(id: string, data: Record<string, unknown>): Notifications.NotificationResponse {
  return {
    notification: { request: { identifier: id, content: { data } } },
  } as unknown as Notifications.NotificationResponse;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockLanChamGanNhat = null;
});

describe('useOpenTaskFromNotification', () => {
  it('mở màn được báo đúng một lần', async () => {
    mockLanChamGanNhat = lanCham('n1', { taskId: 't1' });

    await renderHook(() => useOpenTaskFromNotification());

    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/tasks/t1'));
    expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled();
  });

  /*
    Đăng xuất gỡ layout (tabs), đăng nhập lại (kể cả tài khoản khác) dựng nó
    mới tinh. Trước đây layout mới đọc lại đúng lần chạm cũ và mở lại màn của
    người trước.
  */
  it('gỡ ra rồi dựng lại (đăng xuất → đăng nhập) không mở lại lần chạm cũ', async () => {
    mockLanChamGanNhat = lanCham('n1', { taskId: 't1' });

    const lanDau = await renderHook(() => useOpenTaskFromNotification());
    await waitFor(() => expect(mockPush).toHaveBeenCalledTimes(1));
    await lanDau.unmount();

    await renderHook(() => useOpenTaskFromNotification());
    await new Promise((xong) => setTimeout(xong, 10));

    expect(mockPush).toHaveBeenCalledTimes(1);
  });

  it('lần chạm không dẫn tới màn nào cũng được quên đi', async () => {
    mockLanChamGanNhat = lanCham('n2', { loai: 'khong-ro' });

    await renderHook(() => useOpenTaskFromNotification());

    await waitFor(() => expect(Notifications.clearLastNotificationResponse).toHaveBeenCalled());
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockLanChamGanNhat).toBeNull();
  });
});
