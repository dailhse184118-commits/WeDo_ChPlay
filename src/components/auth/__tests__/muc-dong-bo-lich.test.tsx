import React from 'react';
import { Platform } from 'react-native';
import { fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ManTaiKhoan from '../../../app/(tabs)/account/index';
import { useAuth } from '../../../lib/auth/auth-context';
import { useWorkspace } from '../../../lib/workspace/workspace-context';
import { renderScreen } from '../../../test-utils/render';

/*
  Hàng "Đồng bộ lịch" trên tab Tài khoản: có trên Android, ẩn hẳn trên iPhone.

  Đặt ở đây chứ không cạnh màn hình: mọi tệp dưới `src/app/(tabs)/` đều thành
  một tab, kể cả tệp kiểm thử.
*/

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), back: jest.fn() }),
}));
// Màn có hàng Nâng cấp gói (chỉ iPhone), hàng đó đọc gói hiện tại.
jest.mock('../../../lib/api/entitlements', () => ({
  getEntitlements: jest.fn(async () => ({ subscription: null })),
}));
jest.mock('../../../lib/api/account', () => ({
  capNhatAnhDaiDien: jest.fn(),
  datDongYAI: jest.fn(),
}));
jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/workspace/workspace-context');
jest.mock('../../../lib/images/anh-dai-dien', () => ({ chonAnhDaiDien: jest.fn() }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedWorkspace = useWorkspace as jest.MockedFunction<typeof useWorkspace>;

let thayHeDieuHanh: { restore: () => void } | null = null;

beforeEach(() => {
  jest.clearAllMocks();
  mockedWorkspace.mockReturnValue({ active: { id: 'w1', name: 'Nhóm EXE' } } as never);
  mockedAuth.mockReturnValue({
    status: 'signedIn',
    user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại', aiConsentAt: null },
    signIn: jest.fn(),
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    capNhatHoSo: jest.fn(),
  });
});

afterEach(() => {
  thayHeDieuHanh?.restore();
  thayHeDieuHanh = null;
});

function moMan() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderScreen(
    <QueryClientProvider client={queryClient}>
      <ManTaiKhoan />
    </QueryClientProvider>,
  );
}

describe('hàng Đồng bộ lịch ở Tài khoản', () => {
  it('Android: có hàng, chạm vào mở màn Đồng bộ lịch', async () => {
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await moMan();

    expect(man.getByText('Đồng bộ lịch')).toBeTruthy();
    await fireEvent.press(man.getByTestId('account-calendar-sync'));

    expect(mockPush).toHaveBeenCalledWith('/account/calendar-sync');
  });

  it('iPhone: không có hàng, các hàng khác vẫn đủ', async () => {
    thayHeDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await moMan();

    expect(man.queryByTestId('account-calendar-sync')).toBeNull();
    expect(man.queryByText('Đồng bộ lịch')).toBeNull();
    expect(man.getByTestId('account-contributions')).toBeTruthy();
  });
});
