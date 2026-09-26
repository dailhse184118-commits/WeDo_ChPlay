import React, { useSyncExternalStore } from 'react';
import { Text } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { fireEvent, renderRouter, screen, waitFor, act } from 'expo-router/testing-library';

import { CongDieuKhoan } from '../CongDieuKhoan';
import { dongYDieuKhoan } from '../../../lib/api/account';
import { useAuth, type AuthState } from '../../../lib/auth/auth-context';
import type { UserProfile } from '../../../lib/types';

/*
  Cổng điều khoản THAY CHỖ cả `<Stack>` ở layout gốc, nên lúc nó hiện thì bộ
  điều hướng gốc bị gỡ hẳn. Đồng ý xong `<Stack>` phải dựng lại được và đưa
  người dùng vào Trò chuyện — kiểm thử màn hình giả lập router nên không bắt
  được chuyện đó; ở đây chạy bộ điều hướng thật của Expo Router.
*/

jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/api/account', () => ({ dongYDieuKhoan: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const mockedAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedDongY = dongYDieuKhoan as jest.MockedFunction<typeof dongYDieuKhoan>;

type TrangThai = Pick<AuthState, 'status' | 'user'>;

/* Một kho nhỏ đóng vai AuthProvider: đổi trạng thái là mọi chỗ đọc dựng lại. */
let hienTai: TrangThai = { status: 'signedOut', user: null };
const nguoiNghe = new Set<() => void>();
function dat(moi: TrangThai) {
  hienTai = moi;
  nguoiNghe.forEach((nghe) => nghe());
}

const NGUOI_CU: UserProfile = {
  id: 'u1',
  email: 'a@b.c',
  fullName: 'Lê Hữu Đại',
  termsAcceptedAt: null,
  adultConfirmedAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  hienTai = { status: 'signedOut', user: null };
  mockedAuth.mockImplementation(() => {
    const trangThai = useSyncExternalStore(
      (nghe) => {
        nguoiNghe.add(nghe);
        return () => nguoiNghe.delete(nghe);
      },
      () => hienTai,
    );
    return {
      ...trangThai,
      signIn: jest.fn(),
      signInWithGoogle: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      capNhatHoSo: (hoSo: UserProfile) => dat({ status: 'signedIn', user: hoSo }),
    };
  });
});

function AuthLayout() {
  const { status } = useAuth();
  if (status === 'signedIn') return <Redirect href="/chat" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

function IndexGia() {
  const { status } = useAuth();
  return <Redirect href={status === 'signedIn' ? '/chat' : '/login'} />;
}

it('đăng nhập bằng tài khoản chưa đồng ý: qua cổng rồi vào thẳng Trò chuyện', async () => {
  mockedDongY.mockResolvedValue({
    termsAcceptedAt: '2026-09-26T10:00:00.000Z',
    adultConfirmedAt: '2026-09-26T10:00:00.000Z',
  });

  await renderRouter(
    {
      _layout: () => (
        <CongDieuKhoan>
          <Stack screenOptions={{ headerShown: false }} />
        </CongDieuKhoan>
      ),
      index: IndexGia,
      '(auth)/_layout': AuthLayout,
      '(auth)/login': () => <Text>màn đăng nhập</Text>,
      chat: () => <Text>màn trò chuyện</Text>,
    },
    { initialUrl: '/login' },
  );

  expect(screen.getByText('màn đăng nhập')).toBeTruthy();

  // Đăng nhập xong: hồ sơ máy chủ nói chưa đồng ý điều khoản.
  await act(async () => dat({ status: 'signedIn', user: NGUOI_CU }));
  expect(screen.getByTestId('cong-dieu-khoan')).toBeTruthy();
  expect(screen.queryByText('màn trò chuyện')).toBeNull();

  await fireEvent.press(screen.getByTestId('dong-y-dieu-khoan'));
  await fireEvent.press(screen.getByTestId('cong-dieu-khoan-dong-y'));

  await waitFor(() => expect(screen.getByText('màn trò chuyện')).toBeTruthy());
  expect(screen.queryByTestId('cong-dieu-khoan')).toBeNull();
});

it('mở app khi phiên đã có sẵn: qua cổng rồi vào thẳng Trò chuyện', async () => {
  mockedDongY.mockResolvedValue({
    termsAcceptedAt: '2026-09-26T10:00:00.000Z',
    adultConfirmedAt: '2026-09-26T10:00:00.000Z',
  });
  hienTai = { status: 'loading', user: null };

  await renderRouter(
    {
      _layout: () => (
        <CongDieuKhoan>
          <Stack screenOptions={{ headerShown: false }} />
        </CongDieuKhoan>
      ),
      index: () => {
        const { status } = useAuth();
        if (status === 'loading') return <Text>đang mở</Text>;
        return <IndexGia />;
      },
      '(auth)/_layout': AuthLayout,
      '(auth)/login': () => <Text>màn đăng nhập</Text>,
      chat: () => <Text>màn trò chuyện</Text>,
    },
    { initialUrl: '/' },
  );

  expect(screen.getByText('đang mở')).toBeTruthy();

  await act(async () => dat({ status: 'signedIn', user: NGUOI_CU }));
  expect(screen.getByTestId('cong-dieu-khoan')).toBeTruthy();

  await fireEvent.press(screen.getByTestId('dong-y-dieu-khoan'));
  await fireEvent.press(screen.getByTestId('cong-dieu-khoan-dong-y'));

  await waitFor(() => expect(screen.getByText('màn trò chuyện')).toBeTruthy());
});
