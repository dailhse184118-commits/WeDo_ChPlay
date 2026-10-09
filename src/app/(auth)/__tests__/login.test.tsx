import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, waitFor } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { renderScreen } from '../../../test-utils/render';
import LoginScreen from '../login';
import { ApiError, docLyDoHetPhien } from '../../../lib/api/client';
import { useAuth } from '../../../lib/auth/auth-context';

jest.mock('../../../lib/auth/auth-context');
/*
  Giả lập đúng hằng số `GOOGLE_IOS_CLIENT_ID`, còn quyết định hiện nút vẫn là
  hàm thật — để kiểm thử nói được "khai client iOS thì iPhone có nút Google".
*/
let mockIosClientId = '';
jest.mock('../../../lib/auth/google-signin', () => {
  const thuc = jest.requireActual('../../../lib/auth/google-signin');
  return {
    ...thuc,
    get GOOGLE_IOS_CLIENT_ID() {
      return mockIosClientId;
    },
    coDangNhapGoogle: () => thuc.coDangNhapGoogle(mockIosClientId),
  };
});
jest.mock('../../../lib/api/client', () => ({
  ...jest.requireActual('../../../lib/api/client'),
  docLyDoHetPhien: jest.fn(() => null),
}));
jest.mock('expo-router', () => {
  const { Text: RNText } = jest.requireActual('react-native');
  return {
    Link: ({ children }: { children: React.ReactNode }) => <RNText>{children}</RNText>,
    router: { replace: jest.fn(), push: jest.fn() },
  };
});

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedLyDo = docLyDoHetPhien as jest.MockedFunction<typeof docLyDoHetPhien>;
const mockedCoApple = AppleAuthentication.isAvailableAsync as jest.MockedFunction<
  typeof AppleAuthentication.isAvailableAsync
>;

const CAU_BI_KHOA =
  'Tài khoản của bạn đã bị khoá vì vi phạm Điều khoản sử dụng. Liên hệ wedosupport6886@gmail.com nếu bạn cho rằng đây là nhầm lẫn.';

/*
  Preset `jest-expo` chạy như iOS, mà nút Apple và Google trên iPhone tuỳ vào
  máy và cấu hình. Đặt hẳn hệ điều hành, đừng để mặc định quyết.
*/
let heDieuHanh: { restore: () => void } | null = null;
afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = null;
  mockIosClientId = '';
});

describe('màn hình đăng nhập', () => {
  const signIn = jest.fn();
  const signInWithGoogle = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    mockedLyDo.mockReturnValue(null);
    mockedUseAuth.mockReturnValue({
      status: 'signedOut',
      user: null,
      signIn,
      signInWithGoogle,
      signInWithApple: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      capNhatHoSo: jest.fn(),
    });
  });

  it('Android không có nút Apple, dù thư viện có nói gì', async () => {
    mockedCoApple.mockResolvedValue(true);
    const { queryByTestId, getByTestId } = await renderScreen(<LoginScreen />);

    expect(getByTestId('google')).toBeTruthy();
    expect(queryByTestId('apple')).toBeNull();
    expect(mockedCoApple).not.toHaveBeenCalled();
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

  it('tài khoản bị khoá: hiện nguyên câu máy chủ giải thích', async () => {
    signIn.mockRejectedValue(new ApiError(CAU_BI_KHOA, 403, 'ACCOUNT_SUSPENDED'));
    const { getByTestId, getByText } = await renderScreen(<LoginScreen />);

    await fireEvent.changeText(getByTestId('email'), 'a@b.c');
    await fireEvent.changeText(getByTestId('password'), 'matkhau');
    await fireEvent.press(getByTestId('submit'));

    await waitFor(() => expect(getByText(CAU_BI_KHOA)).toBeTruthy());
  });

  it('vừa bị đưa ra vì tài khoản bị khoá: nói ngay lý do khi màn hiện lên', async () => {
    mockedLyDo.mockReturnValue(CAU_BI_KHOA);
    const { getByText } = await renderScreen(<LoginScreen />);

    expect(getByText(CAU_BI_KHOA)).toBeTruthy();
  });

  it('không có lý do nào thì không hiện băng lỗi', async () => {
    const { queryByText } = await renderScreen(<LoginScreen />);

    expect(queryByText(CAU_BI_KHOA)).toBeNull();
  });

  it('gợi ý tự điền để iPhone đề nghị lưu và điền mật khẩu', async () => {
    const { getByTestId } = await renderScreen(<LoginScreen />);

    expect(getByTestId('email').props.textContentType).toBe('username');
    expect(getByTestId('email').props.autoComplete).toBe('email');
    expect(getByTestId('password').props.textContentType).toBe('password');
    expect(getByTestId('password').props.autoComplete).toBe('current-password');
  });
});

describe('màn hình đăng nhập trên iPhone', () => {
  const signIn = jest.fn();
  const signInWithGoogle = jest.fn();
  const signInWithApple = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    mockedLyDo.mockReturnValue(null);
    mockedCoApple.mockResolvedValue(true);
    mockedUseAuth.mockReturnValue({
      status: 'signedOut',
      user: null,
      signIn,
      signInWithGoogle,
      signInWithApple,
      signUp: jest.fn(),
      signOut: jest.fn(),
      capNhatHoSo: jest.fn(),
    });
  });

  it('máy không hỗ trợ Apple và chưa khai client iOS: không nút nào, không dòng "hoặc" treo lơ lửng', async () => {
    mockedCoApple.mockResolvedValue(false);
    const { queryByTestId, queryByText, getByTestId } = await renderScreen(<LoginScreen />);

    await waitFor(() => expect(mockedCoApple).toHaveBeenCalled());
    expect(queryByTestId('apple')).toBeNull();
    expect(queryByTestId('google')).toBeNull();
    expect(queryByText('Tiếp tục với Google')).toBeNull();
    expect(queryByText('hoặc')).toBeNull();
    // Đường email vẫn nguyên.
    expect(getByTestId('submit')).toBeTruthy();
  });

  it('có nút Apple của chính Apple: "Tiếp tục", nền đen, bo tròn như nút app', async () => {
    const { findByTestId, getByText } = await renderScreen(<LoginScreen />);

    const nut = await findByTestId('apple');
    expect(nut.props.buttonType).toBe(AppleAuthentication.AppleAuthenticationButtonType.CONTINUE);
    expect(nut.props.buttonStyle).toBe(AppleAuthentication.AppleAuthenticationButtonStyle.BLACK);
    expect(nut.props.cornerRadius).toBeGreaterThan(0);
    expect(getByText('hoặc')).toBeTruthy();
  });

  it('chưa khai client iOS: chỉ Apple, không có nút Google', async () => {
    const { findByTestId, queryByTestId } = await renderScreen(<LoginScreen />);

    await findByTestId('apple');
    expect(queryByTestId('google')).toBeNull();
  });

  it('đã khai client iOS: có cả hai, Apple đứng trước Google', async () => {
    mockIosClientId = '108450458549-iosclient.apps.googleusercontent.com';
    const { findByTestId, getAllByRole } = await renderScreen(<LoginScreen />);

    await findByTestId('apple');
    const thuTu = getAllByRole('button')
      .map((nut) => nut.props.testID)
      .filter((id) => id === 'apple' || id === 'google');
    expect(thuTu).toEqual(['apple', 'google']);
  });

  it('đã khai client iOS mà máy không hỗ trợ Apple: vẫn có Google', async () => {
    mockIosClientId = '108450458549-iosclient.apps.googleusercontent.com';
    mockedCoApple.mockResolvedValue(false);
    const { getByTestId, queryByTestId } = await renderScreen(<LoginScreen />);

    await waitFor(() => expect(mockedCoApple).toHaveBeenCalled());
    expect(getByTestId('google')).toBeTruthy();
    expect(queryByTestId('apple')).toBeNull();
  });

  it('bấm Apple: gọi signInWithApple, không cần điền form', async () => {
    signInWithApple.mockResolvedValue(undefined);
    const { findByTestId } = await renderScreen(<LoginScreen />);

    await fireEvent.press(await findByTestId('apple'));

    await waitFor(() => expect(signInWithApple).toHaveBeenCalledTimes(1));
    expect(signIn).not.toHaveBeenCalled();
  });

  it('người dùng đóng bảng Apple: không băng lỗi nào', async () => {
    // `signInWithApple` kết thúc êm khi người dùng huỷ — xem auth-context.
    signInWithApple.mockResolvedValue(undefined);
    const { findByTestId, queryByText, getByTestId } = await renderScreen(<LoginScreen />);

    await fireEvent.press(await findByTestId('apple'));

    await waitFor(() => expect(signInWithApple).toHaveBeenCalled());
    expect(queryByText(/thất bại|không thành công/)).toBeNull();
    expect(getByTestId('submit').props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: false }),
    );
  });

  it('máy chủ từ chối: hiện nguyên văn câu máy chủ trả', async () => {
    signInWithApple.mockRejectedValue(
      new ApiError('Không xác minh được đăng nhập Apple. Vui lòng thử lại.', 401, 'APPLE_TOKEN_INVALID'),
    );
    const { findByTestId, getByText } = await renderScreen(<LoginScreen />);

    await fireEvent.press(await findByTestId('apple'));

    await waitFor(() =>
      expect(getByText('Không xác minh được đăng nhập Apple. Vui lòng thử lại.')).toBeTruthy(),
    );
  });
});
