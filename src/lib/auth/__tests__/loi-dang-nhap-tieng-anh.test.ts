import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import { datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { dichThongBaoLoi } from '../../../i18n/loi';
import { layThongTinApple } from '../apple-signin';
import { chuVietConSot } from '../../../i18n/chu-viet-con-sot';

describe('lỗi đăng nhập Apple và Google theo ngôn ngữ', () => {
  afterEach(() => jest.restoreAllMocks());

  it('tiếng Việt giữ nguyên câu cũ', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    await expect(layThongTinApple()).rejects.toThrow('Đăng nhập bằng Apple chỉ có trên iPhone.');
  });

  it('tiếng Anh: câu thông báo bằng tiếng Anh và qua được dichThongBaoLoi nguyên vẹn', async () => {
    datNgonNguChoKiemThu('en');
    jest.replaceProperty(Platform, 'OS', 'android');
    const loi = await layThongTinApple().catch((e: unknown) => e);

    expect((loi as Error).message).toBe('Sign in with Apple is only available on iPhone.');
    expect(dichThongBaoLoi(loi, 'fallback', 'en')).toBe('Sign in with Apple is only available on iPhone.');
    expect(chuVietConSot((loi as Error).message)).toEqual([]);
  });

  it('tiếng Anh: mã lỗi native của Apple kèm trong câu', async () => {
    datNgonNguChoKiemThu('en');
    jest.replaceProperty(Platform, 'OS', 'ios');
    jest.spyOn(AppleAuthentication, 'signInAsync').mockRejectedValue({ code: 'ERR_REQUEST_FAILED' });

    await expect(layThongTinApple()).rejects.toThrow(
      'Sign in with Apple didn’t work (ERR_REQUEST_FAILED). Please try again, or sign in with your email and password.',
    );
  });
});
