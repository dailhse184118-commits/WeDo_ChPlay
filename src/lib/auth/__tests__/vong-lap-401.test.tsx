import React from 'react';
import { Pressable, Text } from 'react-native';
import { act, fireEvent, render } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '../auth-context';

/*
  Bộ test này cố ý KHÔNG mock tầng API: lỗi nó bắt nằm ở chỗ nối giữa
  `apiRequest`, `onUnauthorized` và `huyDangKyPushToken` — mock `api/auth` như
  auth-context.test.tsx thì chỗ nối ấy biến mất. Chỉ giả lập những gì ra khỏi
  máy: `fetch`, kho khoá và mô-đun thông báo native.
*/

const mockKho = new Map<string, string>();
jest.mock('../token-storage', () => ({
  loadToken: jest.fn(async () => mockKho.get('access') ?? null),
  loadRefreshToken: jest.fn(async () => mockKho.get('refresh') ?? null),
  saveToken: jest.fn(async (t: string) => void mockKho.set('access', t)),
  saveRefreshToken: jest.fn(async (t: string) => void mockKho.set('refresh', t)),
  clearToken: jest.fn(async () => {
    mockKho.delete('access');
    mockKho.delete('refresh');
  }),
  loadUserProfile: jest.fn(async () => null),
  saveUserProfile: jest.fn(async () => undefined),
}));
jest.mock('../google-signin', () => ({
  getGoogleIdToken: jest.fn(async () => null),
  signOutFromGoogle: jest.fn(async () => undefined),
}));
jest.mock('../../query', () => ({ xoaCacheBenBi: jest.fn(async () => undefined) }));
jest.mock('expo-notifications', () => ({
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[may-thu]' })),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted', granted: true })),
  setNotificationChannelAsync: jest.fn(async () => undefined),
  AndroidImportance: { DEFAULT: 3 },
}));

/**
 * Máy chủ trả 401 cho MỌI yêu cầu: sai mật khẩu, và mọi đường cần đăng nhập.
 * Đặt `ngatVongLap` để máy chủ thôi trả 401 — cách duy nhất cắt một vòng lặp
 * đang chạy khi đo xong, không thì Jest treo mãi.
 */
const cacLuotGoi: string[] = [];
let ngatVongLap = false;
const mockFetch = jest.fn(async (url: string, init?: { method?: string }) => {
  cacLuotGoi.push(`${init?.method ?? 'GET'} ${url.replace('https://api.test', '')}`);
  // Độ trễ mạng giả. Thiếu nó, một vòng lặp chỉ toàn microtask sẽ chiếm trọn
  // event loop và Jest treo thay vì báo test hỏng.
  await new Promise((r) => setTimeout(r, 5));
  return {
    ok: ngatVongLap,
    status: ngatVongLap ? 200 : 401,
    text: async () => JSON.stringify({ message: 'Email hoặc mật khẩu không đúng', statusCode: 401 }),
  };
});

function DangNhapSai() {
  const { signIn } = useAuth();
  return (
    <Pressable testID="dang-nhap" onPress={() => signIn('a@b.c', 'sai-mat-khau').catch(() => undefined)}>
      <Text>vao</Text>
    </Pressable>
  );
}

describe('401 không được sinh ra vòng lặp đăng xuất', () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    (globalThis as unknown as { fetch: typeof mockFetch }).fetch = mockFetch;
    cacLuotGoi.length = 0;
    ngatVongLap = false;
    mockKho.clear();
  });

  afterEach(async () => {
    ngatVongLap = true;
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
  });

  it('nhập sai mật khẩu chỉ gây một lượt gọi đăng nhập, không kéo theo chuỗi gỡ push token', async () => {
    const { getByTestId } = await render(
      <AuthProvider>
        <DangNhapSai />
      </AuthProvider>,
    );

    await fireEvent.press(getByTestId('dang-nhap'));
    // Cho các lời hứa nối đuôi nhau có thời gian chạy — vòng lặp thật tự nuôi nó.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });

    const goPushToken = cacLuotGoi.filter((l) => l === 'DELETE /notifications/push-token').length;
    expect(cacLuotGoi.filter((l) => l === 'POST /auth/login')).toHaveLength(1);
    expect(goPushToken).toBe(0);
  });

  it('phiên hết hạn thì chỉ đăng xuất đúng một lần', async () => {
    mockKho.set('access', 'token-het-han');
    mockKho.set('refresh', 'refresh-da-bi-thu-hoi');

    await render(
      <AuthProvider>
        <Text>app</Text>
      </AuthProvider>,
    );
    await act(async () => {
      await new Promise((r) => setTimeout(r, 300));
    });

    const goPushToken = cacLuotGoi.filter((l) => l === 'DELETE /notifications/push-token').length;
    expect(goPushToken).toBeLessThanOrEqual(1);
  });
});
