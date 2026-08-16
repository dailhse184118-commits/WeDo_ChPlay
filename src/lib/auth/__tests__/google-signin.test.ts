import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';

import { GOOGLE_WEB_CLIENT_ID, getGoogleIdToken, signOutFromGoogle } from '../google-signin';

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

  it('chỉ thẳng ra lỗi cấu hình khi Google từ chối chính ứng dụng', async () => {
    /*
      DEVELOPER_ERROR gần như luôn là sai SHA-1 hoặc chưa Publish app. Người
      kiểm thử đọc "DEVELOPER_ERROR" thì không biết làm gì, còn chủ dự án đọc
      câu này là biết mở Google Cloud Console.
    */
    /*
      Mớm ĐÚNG mã Android trả về là '10', không phải tên tiếng Anh.

      Thư viện không xuất hằng số cho mã này nên không có gì để tham chiếu. Test
      cũ mớm 'DEVELOPER_ERROR' — chuỗi Android không bao giờ trả về — nên nó xanh
      trong khi máy thật thì hỏng.
    */
    mockedSignIn.mockRejectedValue(nativeError('10'));

    await expect(getGoogleIdToken()).rejects.toThrow(
      /SHA-1.*Publish|Publish.*SHA-1/,
    );
  });

  it('dịch mã lỗi lạ sang tiếng Việt nhưng vẫn kèm mã để còn lần ra nguyên nhân', async () => {
    // Máy ảo chưa có tài khoản Google trả đúng mã này. Trước đây băng đỏ hiện
    // nguyên chữ "INTERNAL_ERROR" cho người dùng.
    mockedSignIn.mockRejectedValue(nativeError('INTERNAL_ERROR'));

    const loi = await getGoogleIdToken().catch((e: Error) => e);

    expect((loi as Error).message).toContain('INTERNAL_ERROR');
    expect((loi as Error).message).toMatch(/[àâăêôơưđáảãạ]/i);
  });

  it('giữ nguyên lỗi không mang mã, vì không có gì để dịch', async () => {
    mockedSignIn.mockRejectedValue(new Error('Không thể kết nối máy chủ.'));

    await expect(getGoogleIdToken()).rejects.toThrow('Không thể kết nối máy chủ.');
  });
});

describe('đăng xuất khỏi Google', () => {
  const mockedGoogleSignOut = GoogleSignin.signOut as jest.MockedFunction<
    typeof GoogleSignin.signOut
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('bảo Google quên phiên, để lần sau còn chọn được tài khoản khác', async () => {
    mockedGoogleSignOut.mockResolvedValue(null);

    await signOutFromGoogle();

    expect(mockedGoogleSignOut).toHaveBeenCalledTimes(1);
  });

  it('nuốt lỗi khi người dùng chưa từng đăng nhập bằng Google', async () => {
    /*
      Người đăng nhập bằng email chưa hề chạm tới Google. `signOut` của thư viện
      có thể ném lỗi trong trường hợp đó, và không được để nó chặn việc đăng xuất
      khỏi WeDo.
    */
    mockedGoogleSignOut.mockRejectedValue(new Error('SIGN_IN_REQUIRED'));

    await expect(signOutFromGoogle()).resolves.toBeUndefined();
  });
});
