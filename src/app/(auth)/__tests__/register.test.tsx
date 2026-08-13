import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderScreen } from '../../../test-utils/render';
import RegisterScreen from '../register';
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

describe('màn hình đăng ký', () => {
  const signUp = jest.fn();
  const signInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      status: 'signedOut',
      user: null,
      signIn: jest.fn(),
      signInWithGoogle,
      signUp,
      signOut: jest.fn(),
    });
  });

  it('gọi signInWithGoogle khi bấm nút Google, không cần điền form', async () => {
    signInWithGoogle.mockResolvedValue(undefined);
    const { getByTestId } = await renderScreen(<RegisterScreen />);

    await fireEvent.press(getByTestId('google'));

    await waitFor(() => expect(signInWithGoogle).toHaveBeenCalledTimes(1));
    expect(signUp).not.toHaveBeenCalled();
  });

  it('hiện lỗi khi đăng ký bằng Google thất bại', async () => {
    signInWithGoogle.mockRejectedValue(new Error('Google token không thuộc ứng dụng WEDO'));
    const { getByTestId, getByText } = await renderScreen(<RegisterScreen />);

    await fireEvent.press(getByTestId('google'));

    await waitFor(() => expect(getByText('Google token không thuộc ứng dụng WEDO')).toBeTruthy());
  });
});
