import React from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { CongDieuKhoan } from '../CongDieuKhoan';
import * as authApi from '../../../lib/api/auth';
import * as appleSignIn from '../../../lib/auth/apple-signin';
import { AuthProvider, useAuth } from '../../../lib/auth/auth-context';
import * as googleSignIn from '../../../lib/auth/google-signin';
import * as tokenStorage from '../../../lib/auth/token-storage';
import { renderScreen } from '../../../test-utils/render';

/*
  Tài khoản mới tạo bằng Apple hay Google chưa đồng ý điều khoản: máy chủ để
  `termsAcceptedAt` là null. Ở đây chạy AuthProvider THẬT cùng cổng điều khoản
  thật, chỉ giả lập ranh giới mạng và lớp native — để chắc hai đường đăng nhập
  mới đi qua đúng cổng như đăng nhập email, không đường nào vòng qua được.
*/

jest.mock('../../../lib/api/auth');
jest.mock('../../../lib/auth/token-storage');
jest.mock('../../../lib/auth/google-signin');
jest.mock('../../../lib/auth/apple-signin');
jest.mock('../../../lib/api/account', () => ({ dongYDieuKhoan: jest.fn() }));
jest.mock('../../../lib/query', () => ({ xoaCacheBenBi: jest.fn() }));
jest.mock('../../../lib/notifications/push-token', () => ({
  huyDangKyPushToken: jest.fn(async () => undefined),
  dongBoPushToken: jest.fn(async () => undefined),
}));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockedApple = appleSignIn as jest.Mocked<typeof appleSignIn>;
const mockedGoogle = googleSignIn as jest.Mocked<typeof googleSignIn>;

const TAI_KHOAN_MOI = {
  id: 'u-moi',
  email: 'abc@privaterelay.appleid.com',
  fullName: 'Người dùng Apple',
  termsAcceptedAt: null,
  adultConfirmedAt: null,
};

const PHIEN = { message: 'ok', accessToken: 'tok', refreshToken: 'rt', user: TAI_KHOAN_MOI };

function NutVao() {
  const { signInWithApple, signInWithGoogle } = useAuth();
  return (
    <>
      <Text>màn đăng nhập</Text>
      <Pressable testID="vao-apple" onPress={() => void signInWithApple()}>
        <Text>Apple</Text>
      </Pressable>
      <Pressable testID="vao-google" onPress={() => void signInWithGoogle()}>
        <Text>Google</Text>
      </Pressable>
    </>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedStorage.loadToken.mockResolvedValue(null);
  mockedAuthApi.getMe.mockResolvedValue(TAI_KHOAN_MOI as never);
  mockedApple.layThongTinApple.mockResolvedValue({ identityToken: 'jwt', nonce: 'n' });
  mockedAuthApi.loginWithApple.mockResolvedValue(PHIEN as never);
  mockedGoogle.getGoogleIdToken.mockResolvedValue('id-token');
  mockedAuthApi.loginWithGoogle.mockResolvedValue(PHIEN as never);
});

it.each([
  ['Apple', 'vao-apple'],
  ['Google', 'vao-google'],
])('tài khoản %s mới chưa đồng ý điều khoản: cổng chặn lại ngay sau khi vào', async (_ten, nut) => {
  const man = await renderScreen(
    <AuthProvider>
      <CongDieuKhoan>
        <NutVao />
      </CongDieuKhoan>
    </AuthProvider>,
  );
  await waitFor(() => expect(man.getByText('màn đăng nhập')).toBeTruthy());

  await fireEvent.press(man.getByTestId(nut));

  await waitFor(() => expect(man.getByTestId('cong-dieu-khoan')).toBeTruthy());
  expect(man.queryByText('màn đăng nhập')).toBeNull();
});
