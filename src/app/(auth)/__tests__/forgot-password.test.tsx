import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderScreen } from '../../../test-utils/render';
import ForgotPasswordScreen from '../forgot-password';
import { forgotPassword, resetPassword } from '../../../lib/api/auth';

jest.mock('../../../lib/api/auth');

const mockedRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => {
  const { Text: RNText } = jest.requireActual('react-native');
  return {
    Link: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
    router: mockedRouter,
    useRouter: () => mockedRouter,
  };
});

const mockedForgot = forgotPassword as jest.MockedFunction<typeof forgotPassword>;
const mockedReset = resetPassword as jest.MockedFunction<typeof resetPassword>;

async function guiMaCho(email: string) {
  const screen = await renderScreen(<ForgotPasswordScreen />);
  await fireEvent.changeText(screen.getByTestId('email'), email);
  await fireEvent.press(screen.getByTestId('send-code'));
  return screen;
}

describe('màn hình quên mật khẩu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedForgot.mockResolvedValue({ message: 'Nếu email này có tài khoản, WeDo đã gửi mã.' });
    mockedReset.mockResolvedValue({ message: 'Đặt lại mật khẩu thành công.' });
  });

  it('chặn gửi khi chưa nhập email', async () => {
    const { getByTestId, getByText } = await renderScreen(<ForgotPasswordScreen />);

    await fireEvent.press(getByTestId('send-code'));

    await waitFor(() => expect(getByText('Vui lòng nhập email')).toBeTruthy());
    expect(mockedForgot).not.toHaveBeenCalled();
  });

  it('xin mã cho email đã nhập, sau khi cắt khoảng trắng thừa', async () => {
    await guiMaCho('  sinhvien@fpt.edu.vn  ');

    await waitFor(() => expect(mockedForgot).toHaveBeenCalledWith('sinhvien@fpt.edu.vn'));
  });

  it('chuyển sang bước nhập mã sau khi gửi xong', async () => {
    const { getByTestId } = await guiMaCho('sinhvien@fpt.edu.vn');

    await waitFor(() => expect(getByTestId('code')).toBeTruthy());
    expect(getByTestId('new-password')).toBeTruthy();
  });

  it('bắt mã đủ 6 chữ số trước khi gọi máy chủ', async () => {
    const { getByTestId, getByText } = await guiMaCho('sinhvien@fpt.edu.vn');
    await waitFor(() => getByTestId('code'));

    await fireEvent.changeText(getByTestId('code'), '4829');
    await fireEvent.changeText(getByTestId('new-password'), 'matkhaumoi');
    await fireEvent.press(getByTestId('reset'));

    await waitFor(() => expect(getByText('Mã gồm 6 chữ số')).toBeTruthy());
    expect(mockedReset).not.toHaveBeenCalled();
  });

  it('bắt mật khẩu mới ít nhất 6 ký tự, khớp ràng buộc phía máy chủ', async () => {
    const { getByTestId, getByText } = await guiMaCho('sinhvien@fpt.edu.vn');
    await waitFor(() => getByTestId('code'));

    await fireEvent.changeText(getByTestId('code'), '482913');
    await fireEvent.changeText(getByTestId('new-password'), '123');
    await fireEvent.press(getByTestId('reset'));

    await waitFor(() => expect(getByText('Mật khẩu phải có ít nhất 6 ký tự')).toBeTruthy());
    expect(mockedReset).not.toHaveBeenCalled();
  });

  it('đổi mật khẩu rồi đưa người dùng về màn đăng nhập', async () => {
    const { getByTestId } = await guiMaCho('sinhvien@fpt.edu.vn');
    await waitFor(() => getByTestId('code'));

    await fireEvent.changeText(getByTestId('code'), '482913');
    await fireEvent.changeText(getByTestId('new-password'), 'matkhaumoi');
    await fireEvent.press(getByTestId('reset'));

    await waitFor(() =>
      expect(mockedReset).toHaveBeenCalledWith('sinhvien@fpt.edu.vn', '482913', 'matkhaumoi'),
    );
    await waitFor(() => expect(mockedRouter.replace).toHaveBeenCalledWith('/login'));
  });

  it('hiện nguyên văn lỗi từ máy chủ khi mã sai', async () => {
    mockedReset.mockRejectedValue(new Error('Mã không đúng hoặc đã hết hạn'));
    const { getByTestId, getByText } = await guiMaCho('sinhvien@fpt.edu.vn');
    await waitFor(() => getByTestId('code'));

    await fireEvent.changeText(getByTestId('code'), '000000');
    await fireEvent.changeText(getByTestId('new-password'), 'matkhaumoi');
    await fireEvent.press(getByTestId('reset'));

    await waitFor(() => expect(getByText('Mã không đúng hoặc đã hết hạn')).toBeTruthy());
    expect(mockedRouter.replace).not.toHaveBeenCalled();
  });

  it('cho quay lại bước nhập email để đổi địa chỉ gõ nhầm', async () => {
    const { getByTestId } = await guiMaCho('sinhvien@fpt.edu.vn');
    await waitFor(() => getByTestId('code'));

    await fireEvent.press(getByTestId('change-email'));

    await waitFor(() => expect(getByTestId('email')).toBeTruthy());
  });
});
