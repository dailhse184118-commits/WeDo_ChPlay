import React from 'react';
import { Alert, Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';

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
jest.mock('expo-web-browser', () => ({
  openBrowserAsync: jest.fn(async () => ({ type: 'opened' })),
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedMoTrang = WebBrowser.openBrowserAsync as jest.MockedFunction<
  typeof WebBrowser.openBrowserAsync
>;

/*
  Preset `jest-expo` chạy như iOS, mà iPhone không có nút Google. Đặt hẳn hệ
  điều hành cho từng nhóm ca, đừng để mặc định quyết.
*/
let heDieuHanh: { restore: () => void } | null = null;
let hopThoai: jest.SpyInstance;

const signUp = jest.fn();
const signInWithGoogle = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  hopThoai = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  mockedUseAuth.mockReturnValue({
    status: 'signedOut',
    user: null,
    signIn: jest.fn(),
    signInWithGoogle,
    signUp,
    signOut: jest.fn(),
    capNhatHoSo: jest.fn(),
  });
});

afterEach(() => {
  hopThoai.mockRestore();
  heDieuHanh?.restore();
  heDieuHanh = null;
});

async function dienForm(man: Awaited<ReturnType<typeof renderScreen>>) {
  await fireEvent.changeText(man.getByTestId('fullName'), '  Lê Hữu Đại ');
  await fireEvent.changeText(man.getByTestId('email'), ' a@b.c ');
  await fireEvent.changeText(man.getByTestId('password'), 'matkhau');
}

describe('màn hình đăng ký', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
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

describe('ô đủ 18 tuổi và đồng ý điều khoản', () => {
  it('không đánh dấu sẵn, và nút Đăng ký tắt cho tới khi đánh dấu', async () => {
    const man = await renderScreen(<RegisterScreen />);

    expect(man.getByTestId('dong-y-dieu-khoan').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
    expect(man.getByTestId('submit').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));

    expect(man.getByTestId('dong-y-dieu-khoan').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: true }),
    );
    expect(man.getByTestId('submit').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
  });

  it('chưa đánh dấu thì điền đủ rồi bấm cũng không gửi gì lên máy chủ', async () => {
    const man = await renderScreen(<RegisterScreen />);
    await dienForm(man);

    await fireEvent.press(man.getByTestId('submit'));

    expect(signUp).not.toHaveBeenCalled();
  });

  it('đánh dấu rồi đăng ký: gửi kèm acceptTerms và confirmAdult', async () => {
    signUp.mockResolvedValue(undefined);
    const man = await renderScreen(<RegisterScreen />);
    await dienForm(man);

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));
    await fireEvent.press(man.getByTestId('submit'));

    await waitFor(() =>
      expect(signUp).toHaveBeenCalledWith({
        email: 'a@b.c',
        password: 'matkhau',
        fullName: 'Lê Hữu Đại',
        acceptTerms: true,
        confirmAdult: true,
      }),
    );
  });

  it('bỏ dấu đi thì nút tắt lại', async () => {
    const man = await renderScreen(<RegisterScreen />);

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));
    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));

    expect(man.getByTestId('submit').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('hai tên văn bản bấm được, mở đúng trang', async () => {
    const man = await renderScreen(<RegisterScreen />);

    await fireEvent.press(man.getByTestId('lien-ket-dieu-khoan'));
    await fireEvent.press(man.getByTestId('lien-ket-quyen-rieng-tu'));

    expect(mockedMoTrang).toHaveBeenNthCalledWith(1, 'https://wedofpt.com.vn/dieu-khoan.html');
    expect(mockedMoTrang.mock.calls[1][0]).toMatch(/privacy\.html$/);
    // Mở trang đọc thì không được đánh dấu hộ người dùng.
    expect(man.getByTestId('dong-y-dieu-khoan').props.accessibilityState).toEqual(
      expect.objectContaining({ checked: false }),
    );
  });

  it('gợi ý tự điền: iPhone đề nghị mật khẩu mạnh cho tài khoản mới', async () => {
    const man = await renderScreen(<RegisterScreen />);

    expect(man.getByTestId('fullName').props.textContentType).toBe('name');
    expect(man.getByTestId('email').props.textContentType).toBe('username');
    expect(man.getByTestId('password').props.textContentType).toBe('newPassword');
    expect(man.getByTestId('password').props.autoComplete).toBe('new-password');
  });
});

describe('màn hình đăng ký trên iPhone', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('không có nút Google, cũng không có dòng "hoặc"', async () => {
    const { queryByTestId, queryByText, getByTestId } = await renderScreen(<RegisterScreen />);

    expect(queryByTestId('google')).toBeNull();
    expect(queryByText('Tiếp tục với Google')).toBeNull();
    expect(queryByText('hoặc')).toBeNull();
    expect(getByTestId('submit')).toBeTruthy();
  });
});
