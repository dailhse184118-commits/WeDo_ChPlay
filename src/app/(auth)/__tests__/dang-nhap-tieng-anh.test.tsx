import React from 'react';
import { Platform, Text } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';

import { renderScreen } from '../../../test-utils/render';
import LoginScreen from '../login';
import RegisterScreen from '../register';
import ForgotPasswordScreen from '../forgot-password';
import { CongDieuKhoan } from '../../../components/auth/CongDieuKhoan';
import { CreateWorkspaceForm } from '../../../components/workspace/CreateWorkspaceForm';
import { ApiError, MA_TAI_KHOAN_BI_KHOA, docLyDoHetPhien } from '../../../lib/api/client';
import { forgotPassword } from '../../../lib/api/auth';
import { useAuth } from '../../../lib/auth/auth-context';
import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';

jest.mock('../../../lib/auth/auth-context');
jest.mock('../../../lib/api/auth', () => ({
  ...jest.requireActual('../../../lib/api/auth'),
  forgotPassword: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock('../../../lib/api/client', () => ({
  ...jest.requireActual('../../../lib/api/client'),
  docLyDoHetPhien: jest.fn(() => null),
}));
jest.mock('../../../lib/workspace/workspace-context', () => ({
  useWorkspace: () => ({ create: jest.fn(), refresh: jest.fn() }),
}));
jest.mock('expo-router', () => {
  const { Text: RNText } = jest.requireActual('react-native');
  return {
    Link: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
    router: { replace: jest.fn(), push: jest.fn() },
    useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
  };
});
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn(async () => ({ type: 'opened' })) }));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLyDo = docLyDoHetPhien as jest.MockedFunction<typeof docLyDoHetPhien>;
const mockedForgot = forgotPassword as jest.MockedFunction<typeof forgotPassword>;

const signIn = jest.fn();
const signOut = jest.fn(async () => undefined);

function dangXuat(status: 'signedOut' | 'signedIn' = 'signedOut', user: unknown = null) {
  mockedUseAuth.mockReturnValue({
    status,
    user,
    signIn,
    signInWithGoogle: jest.fn(),
    signInWithApple: jest.fn(),
    signUp: jest.fn(),
    signOut,
    capNhatHoSo: jest.fn(),
  } as unknown as ReturnType<typeof useAuth>);
}

let heDieuHanh: { restore: () => void } | null = null;
beforeEach(() => {
  jest.clearAllMocks();
  datNgonNguChoKiemThu('en');
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  mockedLyDo.mockReturnValue(null);
  dangXuat();
});
afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = null;
});

const cay = (man: { toJSON: () => unknown }) => JSON.stringify(man.toJSON());

describe('đăng nhập, đăng ký, khởi đầu ở tiếng Anh', () => {
  it('màn đăng nhập không còn chữ Việt, có nút Google', async () => {
    const man = await renderScreen(<LoginScreen />);

    expect(man.getByText('Think less, do more')).toBeTruthy();
    expect(man.getByText('Continue with Google')).toBeTruthy();
    expect(man.getByText('Forgot password?')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('đăng nhập: lỗi kiểm tra và lỗi máy chủ đều bằng tiếng Anh', async () => {
    const man = await renderScreen(<LoginScreen />);

    await fireEvent.press(man.getByTestId('submit'));
    expect(man.getByText('Please enter your email')).toBeTruthy();

    signIn.mockRejectedValue(new ApiError('Email hoặc mật khẩu không đúng', 401));
    await fireEvent.changeText(man.getByTestId('email'), 'a@b.c');
    await fireEvent.changeText(man.getByTestId('password'), 'matkhau');
    await fireEvent.press(man.getByTestId('submit'));

    await waitFor(() => expect(man.getByText('Incorrect email or password')).toBeTruthy());
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('đăng nhập: lý do tài khoản bị khoá hiện bằng tiếng Anh', async () => {
    mockedLyDo.mockReturnValue('Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng.');
    const man = await renderScreen(<LoginScreen />);

    expect(man.getByText(/has been suspended for violating the Terms of Use/)).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
    expect(MA_TAI_KHOAN_BI_KHOA).toBe('ACCOUNT_SUSPENDED');
  });

  it('màn đăng ký không còn chữ Việt, kể cả ô đồng ý điều khoản và lỗi thiếu tên', async () => {
    const man = await renderScreen(<RegisterScreen />);

    expect(man.getByText('Create account')).toBeTruthy();
    expect(man.getByLabelText('I am 18 or older and I agree to the Terms of Use and Privacy Policy')).toBeTruthy();
    expect(man.getByText('Already have an account? Sign in')).toBeTruthy();

    await fireEvent.press(man.getByTestId('dong-y-dieu-khoan'));
    await fireEvent.press(man.getByTestId('submit'));
    expect(man.getByText('Full name is required')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('quên mật khẩu: cả hai bước đều bằng tiếng Anh, câu của máy chủ được dịch', async () => {
    mockedForgot.mockResolvedValue({
      message: 'Nếu email này có tài khoản, WeDo đã gửi mã đặt lại mật khẩu tới hộp thư của bạn.',
    });
    const man = await renderScreen(<ForgotPasswordScreen />);

    expect(man.getByText('Enter the email you signed up with. WeDo will send you a 6-digit code.')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);

    await fireEvent.changeText(man.getByTestId('email'), 'a@b.c');
    await fireEvent.press(man.getByTestId('send-code'));

    await waitFor(() => expect(man.getByText('Wrong email? Enter it again')).toBeTruthy());
    expect(man.getByText('If this email has an account, WeDo has sent a password reset code to your inbox.')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('cổng điều khoản không còn chữ Việt', async () => {
    dangXuat('signedIn', {
      id: 'u1',
      email: 'a@b.c',
      fullName: 'Jane',
      termsAcceptedAt: null,
      adultConfirmedAt: null,
      aiConsentAt: null,
    });
    const man = await renderScreen(
      <CongDieuKhoan>
        <Text>inside</Text>
      </CongDieuKhoan>,
    );

    expect(man.getByText('Agree and continue')).toBeTruthy();
    expect(man.getByText('Sign out')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });

  it('tạo không gian làm việc đầu tiên không còn chữ Việt', async () => {
    const man = await renderScreen(<CreateWorkspaceForm choNhapMaMoi />);

    expect(man.getByText('Create a workspace')).toBeTruthy();
    await fireEvent.press(man.getByTestId('submit'));
    expect(man.getByText('Please enter a workspace name')).toBeTruthy();
    expect(chuVietConSot(cay(man))).toEqual([]);
  });
});
