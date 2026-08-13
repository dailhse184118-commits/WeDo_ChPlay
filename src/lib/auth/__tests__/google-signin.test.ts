import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID, getGoogleIdToken } from '../google-signin';

// Lớp native là ranh giới duy nhất được giả lập, qua `__mocks__` ở gốc dự án.
const mockedSignIn = GoogleSignin.signIn as jest.MockedFunction<typeof GoogleSignin.signIn>;
const mockedPlayServices = GoogleSignin.hasPlayServices as jest.MockedFunction<
  typeof GoogleSignin.hasPlayServices
>;
const mockedConfigure = GoogleSignin.configure as jest.MockedFunction<typeof GoogleSignin.configure>;

function successResponse(idToken: string | null) {
  return {
    type: 'success' as const,
    data: {
      idToken,
      serverAuthCode: null,
      scopes: [],
      user: {
        id: 'google-id',
        name: 'Lê Hữu Đại',
        email: 'a@b.c',
        photo: null,
        familyName: null,
        givenName: null,
      },
    },
  };
}

function nativeError(code: string, message = 'native error') {
  return Object.assign(new Error(message), { code });
}

describe('lấy ID token của Google', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPlayServices.mockResolvedValue(true);
  });

  it('trả về ID token khi người dùng đăng nhập thành công', async () => {
    mockedSignIn.mockResolvedValue(successResponse('id-token-that'));

    await expect(getGoogleIdToken()).resolves.toBe('id-token-that');
  });

  it('khai báo Web client ID trước khi mở hộp thoại Google', async () => {
    mockedSignIn.mockResolvedValue(successResponse('id-token-that'));

    await getGoogleIdToken();

    expect(mockedConfigure).toHaveBeenCalledWith({ webClientId: GOOGLE_WEB_CLIENT_ID });
    expect(GOOGLE_WEB_CLIENT_ID).toMatch(/\.apps\.googleusercontent\.com$/);
  });

  it('trả về null khi người dùng đóng hộp thoại', async () => {
    mockedSignIn.mockResolvedValue({ type: 'cancelled', data: null });

    await expect(getGoogleIdToken()).resolves.toBeNull();
  });

  it('trả về null khi lớp native báo mã huỷ thay vì trả kết quả huỷ', async () => {
    mockedSignIn.mockRejectedValue(nativeError(statusCodes.SIGN_IN_CANCELLED));

    await expect(getGoogleIdToken()).resolves.toBeNull();
  });

  it('báo lỗi khi máy không có Google Play Services', async () => {
    mockedPlayServices.mockRejectedValue(nativeError(statusCodes.PLAY_SERVICES_NOT_AVAILABLE));

    await expect(getGoogleIdToken()).rejects.toThrow(
      'Máy chưa có Google Play Services nên không dùng được đăng nhập Google.',
    );
    expect(mockedSignIn).not.toHaveBeenCalled();
  });

  it('báo lỗi khi Google trả về thành công nhưng thiếu ID token', async () => {
    mockedSignIn.mockResolvedValue(successResponse(null));

    await expect(getGoogleIdToken()).rejects.toThrow(
      'Google không trả về ID token. Kiểm tra lại Web client ID của ứng dụng.',
    );
  });

  it('giữ nguyên lỗi lạ từ lớp native để còn lần ra nguyên nhân', async () => {
    mockedSignIn.mockRejectedValue(nativeError('DEVELOPER_ERROR', 'DEVELOPER_ERROR'));

    await expect(getGoogleIdToken()).rejects.toThrow('DEVELOPER_ERROR');
  });
});
