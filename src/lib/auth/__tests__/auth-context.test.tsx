import React from 'react';
import { Text, Pressable } from 'react-native';
import { render, waitFor, fireEvent } from '@testing-library/react-native';

import { AuthProvider, useAuth } from '../auth-context';
import { ApiError, apiRequest, giaHanMotLuot } from '../../api/client';
import * as pushToken from '../../notifications/push-token';
import * as authApi from '../../api/auth';
import * as googleSignIn from '../google-signin';
import * as query from '../../query';
import * as tokenStorage from '../token-storage';

jest.mock('../../api/auth');
jest.mock('../token-storage');
jest.mock('../google-signin');
jest.mock('../../query', () => ({ xoaCacheBenBi: jest.fn() }));
jest.mock('../../notifications/push-token', () => ({
  huyDangKyPushToken: jest.fn(async () => undefined),
  dongBoPushToken: jest.fn(async () => undefined),
}));

const mockedAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockedStorage = tokenStorage as jest.Mocked<typeof tokenStorage>;
const mockedGoogle = googleSignIn as jest.Mocked<typeof googleSignIn>;
const mockedQuery = query as jest.Mocked<typeof query>;
const mockedPush = pushToken as jest.Mocked<typeof pushToken>;

const profile = { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' };

function Probe() {
  const { status, user, signIn, signInWithGoogle, signOut } = useAuth();
  return (
    <>
      <Text testID="status">{status}</Text>
      <Text testID="user">{user?.fullName ?? 'trong'}</Text>
      <Pressable testID="signin" onPress={() => signIn('a@b.c', 'matkhau')}>
        <Text>vao</Text>
      </Pressable>
      <Pressable testID="signin-google" onPress={() => signInWithGoogle()}>
        <Text>vao bang google</Text>
      </Pressable>
      <Pressable testID="signout" onPress={() => signOut()}>
        <Text>ra</Text>
      </Pressable>
    </>
  );
}

/**
 * Trong @testing-library/react-native 14, `render` và `fireEvent` đều trả Promise.
 * Bắt buộc await, nếu không query sẽ chạy trước khi cây được gắn.
 */
function renderProbe() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedStorage.loadToken.mockResolvedValue(null);
    mockedStorage.saveToken.mockResolvedValue(undefined);
    mockedStorage.clearToken.mockResolvedValue(undefined);
  });

  it('kết thúc ở signedOut khi chưa có token', async () => {
    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedAuthApi.getMe).not.toHaveBeenCalled();
  });

  it('khôi phục phiên khi token còn hiệu lực', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(getByTestId('user').props.children).toBe('Lê Hữu Đại');
  });

  it('xoá token khi token đã hết hạn', async () => {
    mockedStorage.loadToken.mockResolvedValue('het-han');
    // Đúng thứ tầng API ném khi cả refresh token cũng hết hạn: ApiError 401.
    mockedAuthApi.getMe.mockRejectedValue(new ApiError('Unauthorized', 401));

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).toHaveBeenCalled();
  });

  it('KHÔNG đăng xuất khi chỉ là mất mạng, mà dùng hồ sơ đã lưu', async () => {
    /*
      Trước đây đường khôi phục phiên bắt mọi lỗi rồi xoá token. Mở app lúc không
      có sóng — thang máy, tàu điện, hết dung lượng — là bị đăng xuất và mất luôn
      token, phải nhập mật khẩu lại. Cache dữ liệu ghi xuống máy cũng thành vô
      dụng vì người dùng bị chặn ngay ở cổng.
    */
    mockedStorage.loadToken.mockResolvedValue('con-tot');
    mockedStorage.loadUserProfile.mockResolvedValue(profile as never);
    mockedAuthApi.getMe.mockRejectedValue(
      new ApiError('Không thể kết nối máy chủ. Kiểm tra mạng và thử lại.', 0),
    );

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedStorage.clearToken).not.toHaveBeenCalled();
  });

  it('về màn đăng nhập khi mất mạng mà chưa từng lưu hồ sơ, nhưng GIỮ token', async () => {
    // Tài khoản đăng nhập từ bản cũ hơn bản có tính năng này: không có gì để
    // dựng màn hình, nhưng xoá token thì lần sau có mạng vẫn phải nhập lại.
    mockedStorage.loadToken.mockResolvedValue('con-tot');
    mockedStorage.loadUserProfile.mockResolvedValue(null);
    mockedAuthApi.getMe.mockRejectedValue(new ApiError('mất mạng', 0));

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).not.toHaveBeenCalled();
  });

  it('lưu hồ sơ để lần mở app ngoại tuyến sau còn dùng', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    await renderProbe();

    await waitFor(() => expect(mockedStorage.saveUserProfile).toHaveBeenCalledWith(profile));
  });

  it('lưu token rồi mới chuyển sang signedIn khi đăng nhập', async () => {
    mockedAuthApi.login.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-moi',
      user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    } as never);
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await fireEvent.press(getByTestId('signin'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedStorage.saveToken).toHaveBeenCalledWith('tok-moi');
  });

  it('đổi ID token của Google lấy phiên của WeDo', async () => {
    mockedGoogle.getGoogleIdToken.mockResolvedValue('id-token-cua-google');
    mockedAuthApi.loginWithGoogle.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-google',
      user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    } as never);
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await fireEvent.press(getByTestId('signin-google'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedAuthApi.loginWithGoogle).toHaveBeenCalledWith('id-token-cua-google');
    expect(mockedStorage.saveToken).toHaveBeenCalledWith('tok-google');
  });

  it('không gọi máy chủ khi người dùng đóng hộp thoại Google', async () => {
    mockedGoogle.getGoogleIdToken.mockResolvedValue(null);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await fireEvent.press(getByTestId('signin-google'));

    expect(mockedAuthApi.loginWithGoogle).not.toHaveBeenCalled();
    expect(getByTestId('status').props.children).toBe('signedOut');
  });

  it('bảo Google quên phiên khi đăng xuất, để còn đổi được tài khoản', async () => {
    /*
      Chỉ xoá token của WeDo thì Google vẫn nhớ tài khoản: bấm lại nút Google là
      vào thẳng tài khoản cũ, không hiện hộp chọn.
    */
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(mockedGoogle.signOutFromGoogle).toHaveBeenCalled());
  });

  it('vẫn đăng xuất khỏi WeDo được khi phía Google trục trặc', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);
    mockedGoogle.signOutFromGoogle.mockRejectedValue(new Error('Google hỏng'));

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).toHaveBeenCalled();
  });

  it('thu hồi phiên phía máy chủ khi đăng xuất', async () => {
    /*
      Chỉ xoá token trong máy thì bản sao refresh token bị đánh cắp vẫn sống
      thêm 60 ngày. Phải bảo máy chủ cắt phiên đó đi.
    */
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedStorage.loadRefreshToken.mockResolvedValue('rt-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(mockedAuthApi.logout).toHaveBeenCalledWith('rt-1'));
  });

  it('vẫn đăng xuất được khi máy chủ không phản hồi', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedStorage.loadRefreshToken.mockResolvedValue('rt-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);
    mockedAuthApi.logout.mockRejectedValue(new Error('mat mang'));

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
  });

  it('lưu refresh token nhận được lúc đăng nhập', async () => {
    mockedAuthApi.login.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-moi',
      refreshToken: 'rt-moi',
      user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    } as never);
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await fireEvent.press(getByTestId('signin'));

    await waitFor(() => expect(mockedStorage.saveRefreshToken).toHaveBeenCalledWith('rt-moi'));
  });

  it('chịu được máy chủ cũ chưa trả refresh token', async () => {
    // Ban backend cu chua co truong nay. Khong duoc vi the ma dang nhap that bai.
    mockedAuthApi.login.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-moi',
      user: { id: 'u1', email: 'a@b.c', fullName: 'Lê Hữu Đại' },
    } as never);
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await fireEvent.press(getByTestId('signin'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedStorage.saveRefreshToken).not.toHaveBeenCalled();
  });

  it('xoá token khi đăng xuất', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedStorage.clearToken).toHaveBeenCalled();
  });

  it('xoá cache đã ghi xuống đĩa khi đăng xuất', async () => {
    /*
      Cache bền bỉ chứa công việc, tin nhắn và tên dự án của người vừa dùng.
      Không xoá thì người đăng nhập tiếp theo trên cùng máy thấy dữ liệu của
      người trước ngay khi mở app, trước cả khi lượt gọi mạng đầu tiên trả về.
    */
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));

    await waitFor(() => expect(mockedQuery.xoaCacheBenBi).toHaveBeenCalled());
  });

  /*
    Đăng xuất phải chặn gia hạn phiên NGAY từ đầu: một lượt gia hạn chạy song song
    với /auth/logout cầm cùng refresh token thì hoặc máy chủ coi là đánh cắp và
    đăng xuất mọi thiết bị, hoặc phiên mới bị ghi lại xuống máy sau khi đã xoá.
  */
  it('đăng xuất chặn mọi lượt gia hạn mới; đăng nhập lại thì mở ra', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedStorage.loadRefreshToken.mockResolvedValue('rt-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);
    mockedAuthApi.login.mockResolvedValue({
      message: 'ok',
      accessToken: 'tok-2',
      refreshToken: 'rt-2',
      user: profile,
    } as never);
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    const fetchGia = jest.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ accessToken: 'tok-3', refreshToken: 'rt-3' }),
    }));
    globalThis.fetch = fetchGia as unknown as typeof fetch;

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await fireEvent.press(getByTestId('signout'));
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await expect(giaHanMotLuot()).resolves.toBeNull();
    expect(fetchGia).not.toHaveBeenCalled();

    await fireEvent.press(getByTestId('signin'));
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    await expect(giaHanMotLuot()).resolves.toBe('tok-3');
  });

  /** Một lượt gọi API bị 401 — đúng thứ kích hoạt bộ xử lý "hết phiên" của tầng API. */
  async function bi401() {
    process.env.EXPO_PUBLIC_API_BASE_URL = 'https://api.test';
    globalThis.fetch = jest.fn(async () => ({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Unauthorized' }),
    })) as unknown as typeof fetch;
    await apiRequest('/bat-ky', { skipAuth: true }).catch(() => undefined);
  }

  /*
    Gõ sai mật khẩu ở màn đăng nhập cũng là một lỗi 401. Trước đây nó kích hoạt
    đăng xuất; bước đầu của đăng xuất (gỡ thiết bị nhận thông báo) lại bị 401 vì
    chưa đăng nhập, lại kích hoạt đăng xuất tiếp — một chuỗi không dứt. Đăng nhập
    đúng ngay sau đó thì lượt đăng xuất đang chạy dở huỷ luôn phiên vừa có.
  */
  it('gõ sai mật khẩu (401) lúc chưa đăng nhập không kích hoạt đăng xuất', async () => {
    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));

    await bi401();
    await new Promise((xong) => setTimeout(xong, 20));

    expect(mockedPush.huyDangKyPushToken).not.toHaveBeenCalled();
    expect(mockedAuthApi.logout).not.toHaveBeenCalled();
  });

  it('nhiều lỗi 401 dồn lúc đang đăng xuất chỉ chạy MỘT lượt đăng xuất', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedStorage.loadRefreshToken.mockResolvedValue('rt-1');
    mockedAuthApi.getMe.mockResolvedValue(profile as never);
    let goXong: () => void = () => undefined;
    mockedPush.huyDangKyPushToken.mockReturnValueOnce(new Promise<void>((xong) => (goXong = xong)));

    const { getByTestId } = await renderProbe();
    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));

    // 401 đầu tiên mở lượt đăng xuất; lượt đó kẹt ở bước gỡ thiết bị.
    await bi401();
    // Trong lúc đó các lượt gọi khác lần lượt bị 401.
    await bi401();
    await bi401();
    goXong();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedOut'));
    expect(mockedPush.huyDangKyPushToken).toHaveBeenCalledTimes(1);
    expect(mockedAuthApi.logout).toHaveBeenCalledTimes(1);
  });

  /*
    Mở app đúng lúc máy chủ đang khởi động lại (5xx) KHÔNG phải hết phiên. Xoá
    token là bắt người dùng nhập mật khẩu lại chỉ vì máy chủ trục trặc vài giây.
  */
  it('máy chủ trục trặc (5xx) lúc mở app thì giữ phiên, dùng hồ sơ đã lưu', async () => {
    mockedStorage.loadToken.mockResolvedValue('tok-1');
    mockedStorage.loadUserProfile.mockResolvedValue(profile as never);
    mockedAuthApi.getMe.mockRejectedValue(new ApiError('Service Unavailable', 503));

    const { getByTestId } = await renderProbe();

    await waitFor(() => expect(getByTestId('status').props.children).toBe('signedIn'));
    expect(mockedStorage.clearToken).not.toHaveBeenCalled();
  });
});
