import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderScreen } from '../../../test-utils/render';
import LoginScreen from '../login';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/auth/auth-context');
jest.mock('expo-router', () => {
  const { Text: RNText } = jest.requireActual('react-native');
  return {
    Link: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
    router: { replace: jest.fn(), push: jest.fn() },
  };
});

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

describe('màn hình đăng nhập', () => {
  const signIn = jest.fn();
  const signInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      status: 'signedOut',
      user: null,
      signIn,
      signInWithGoogle,
      signUp: jest.fn(),
      signOut: jest.fn(),
    });
  });

  it('hiện khẩu hiệu WeDo', async () => {
    const { getByText } = await renderScreen(<LoginScreen />);
    expect(getByText('Nghĩ ít hơn, làm nhiều hơn')).toBeTruthy();
  });

  it('chặn gửi khi mật khẩu ngắn hơn 6 ký tự', async () => {
    const { getByTestId, getByText } = await renderScreen(<LoginScreen />);

    await fireEvent.changeText(getByTestId('email'), 'a@b.c');
    await fireEvent.changeText(getByTestId('password'), '123');
    await fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(getByText('Mật khẩu phải có ít nhất 6 ký tự')).toBeTruthy());
    expect(signIn).not.toHaveBeenCalled();
  });

  it('gọi signIn với dữ liệu hợp lệ', async () => {
    signIn.mockResolvedValue(undefined);
    const { getByTestId } = await renderScreen(<LoginScreen />);

    await fireEvent.changeText(getByTestId('email'), 'a@b.c');
    await fireEvent.changeText(getByTestId('password'), 'matkhau');
    await fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.c', 'matkhau'));
  });

  it('hiện nguyên văn thông báo lỗi từ máy chủ', async () => {
    signIn.mockRejectedValue(new Error('Email hoặc mật khẩu không đúng'));
    const { getByTestId, getByText } = await renderScreen(<LoginScreen />);

    await fireEvent.changeText(getByTestId('email'), 'a@b.c');
    await fireEvent.changeText(getByTestId('password'), 'matkhau');
    await fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(getByText('Email hoặc mật khẩu không đúng')).toBeTruthy());
  });

  it('gọi signInWithGoogle khi bấm nút Google, không cần điền form', async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const { getByTestId } = await renderScreen(<LoginScreen />);

    await fireEvent.press(getByTestId('google'));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
    expect(signIn).not.toHaveBeenCalled();
  });

  it('hiện lỗi khi đăng nhập Google thất bại', async () => {
    signInWithGoogle.mockRejectedValue(new Error('Google token không thuộc ứng dụng WEDO'));
    const { getByTestId, getByText } = await renderScreen(<LoginScreen />);

    await fireEvent.press(getByTestId('google'));

    await waitFor(() => expect(getByText('Google token không thuộc ứng dụng WEDO')).toBeTruthy());
  });

  it('có đường tới màn quên mật khẩu, nếu không người dùng mất tài khoản vĩnh viễn', async () => {
    const { getByText } = await renderScreen(<LoginScreen />);
    expect(getByText('Quên mật khẩu?')).toBeTruthy();
  });

  it('cắt khoảng trắng thừa quanh email', async () => {
    signIn.mockResolvedValue(undefined);
    const { getByTestId } = await renderScreen(<LoginScreen />);

    await fireEvent.changeText(getByTestId('email'), '  a@b.c  ');
    await fireEvent.changeText(getByTestId('password'), 'matkhau');
    await fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.c', 'matkhau'));
  });
});
