import { createHash } from 'node:crypto';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

import {
  coDangNhapApple,
  ghepHoTenApple,
  layThongTinApple,
  taoNonceGoc,
} from '../apple-signin';

// Lớp native là ranh giới duy nhất được giả lập, qua `__mocks__` ở gốc dự án.
const mockedCoSan = AppleAuthentication.isAvailableAsync as jest.MockedFunction<
  typeof AppleAuthentication.isAvailableAsync
>;
const mockedSignIn = AppleAuthentication.signInAsync as jest.MockedFunction<
  typeof AppleAuthentication.signInAsync
>;

function sha256(chuoi: string): string {
  return createHash('sha256').update(chuoi, 'utf8').digest('hex');
}

function tenApple(
  phan: Partial<AppleAuthentication.AppleAuthenticationFullName>,
): AppleAuthentication.AppleAuthenticationFullName {
  return {
    namePrefix: null,
    givenName: null,
    middleName: null,
    familyName: null,
    nameSuffix: null,
    nickname: null,
    ...phan,
  };
}

function credential(
  them: Partial<AppleAuthentication.AppleAuthenticationCredential> = {},
): AppleAuthentication.AppleAuthenticationCredential {
  return {
    user: '001234.abcdef.1234',
    state: null,
    fullName: tenApple({ givenName: 'Hữu Đại', familyName: 'Lê' }),
    email: 'abc@privaterelay.appleid.com',
    realUserStatus: AppleAuthentication.AppleAuthenticationUserDetectionStatus.LIKELY_REAL,
    identityToken: 'jwt-cua-apple',
    authorizationCode: 'ma-mot-lan',
    ...them,
  };
}

function loiNative(code: string) {
  return Object.assign(new Error('native error'), { code });
}

let heDieuHanh: { restore: () => void } | null = null;
afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = null;
});

beforeEach(() => {
  jest.clearAllMocks();
  heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
});

describe('máy này có đăng nhập Apple không', () => {
  it('iPhone mà hệ điều hành nói có: có', async () => {
    mockedCoSan.mockResolvedValue(true);

    await expect(coDangNhapApple()).resolves.toBe(true);
  });

  it('iPhone mà hệ điều hành nói không: không', async () => {
    mockedCoSan.mockResolvedValue(false);

    await expect(coDangNhapApple()).resolves.toBe(false);
  });

  it('hỏi hệ điều hành mà lỗi: coi như không, thiếu nút còn hơn nút hỏng', async () => {
    mockedCoSan.mockRejectedValue(new Error('native hỏng'));

    await expect(coDangNhapApple()).resolves.toBe(false);
  });

  it('Android: không, và không hỏi tới thư viện Apple', async () => {
    heDieuHanh?.restore();
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');

    await expect(coDangNhapApple()).resolves.toBe(false);
    expect(mockedCoSan).not.toHaveBeenCalled();
  });
});

describe('nonce gốc', () => {
  it('là 64 ký tự hex và mỗi lần một khác', () => {
    const a = taoNonceGoc();
    const b = taoNonceGoc();

    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(b).toMatch(/^[0-9a-f]{64}$/);
    expect(a).not.toBe(b);
  });

  it('lấy từ crypto.getRandomValues khi có', () => {
    const getRandomValues = jest.spyOn(globalThis.crypto, 'getRandomValues');

    taoNonceGoc();

    expect(getRandomValues).toHaveBeenCalledTimes(1);
    getRandomValues.mockRestore();
  });

  describe('khi không có crypto (Hermes)', () => {
    const cryptoGoc = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
    const expoGoc = (globalThis as { expo?: unknown }).expo;

    beforeEach(() => {
      Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    });

    afterEach(() => {
      if (cryptoGoc) Object.defineProperty(globalThis, 'crypto', cryptoGoc);
      (globalThis as { expo?: unknown }).expo = expoGoc;
    });

    it('dùng UUID v4 native của Expo, bỏ dấu gạch', () => {
      const uuidv4 = jest
        .fn()
        .mockReturnValueOnce('0f8fad5b-d9cb-469f-a165-70867728950e')
        .mockReturnValueOnce('7c9e6679-7425-40de-944b-e07fc1f90ae7');
      (globalThis as { expo?: unknown }).expo = { ...(expoGoc as object), uuidv4 };

      expect(taoNonceGoc()).toBe(
        '0f8fad5bd9cb469fa16570867728950e7c9e6679742540de944be07fc1f90ae7',
      );
    });

    it('không có nguồn an toàn nào thì báo lỗi, KHÔNG lùi về Math.random', () => {
      (globalThis as { expo?: unknown }).expo = undefined;
      /*
        Đo đúng quanh lời gọi: bản thân Jest dùng Math.random ở chỗ khác, nên
        đếm qua `expect(...).toThrow` là đếm nhầm cả phần của Jest.
      */
      const ngauNhienYeu = jest.spyOn(Math, 'random');
      let loi: unknown = null;
      try {
        taoNonceGoc();
      } catch (e) {
        loi = e;
      }
      const soLanGoi = ngauNhienYeu.mock.calls.length;
      ngauNhienYeu.mockRestore();

      expect((loi as Error).message).toContain('mã bảo mật');
      expect(soLanGoi).toBe(0);
    });
  });
});

describe('ghép họ tên Apple', () => {
  it('theo thứ tự tiếng Việt: họ, tên đệm, tên', () => {
    expect(ghepHoTenApple(tenApple({ givenName: 'Đại', middleName: 'Hữu', familyName: 'Lê' }))).toBe(
      'Lê Hữu Đại',
    );
    expect(ghepHoTenApple(tenApple({ givenName: 'Hữu Đại', familyName: 'Lê' }))).toBe('Lê Hữu Đại');
  });

  it('chỉ có một phần thì lấy phần đó, bỏ khoảng trắng thừa', () => {
    expect(ghepHoTenApple(tenApple({ givenName: '  Đại ' }))).toBe('Đại');
  });

  it('người dùng không chia sẻ tên: undefined, để máy chủ tự đặt', () => {
    expect(ghepHoTenApple(null)).toBeUndefined();
    expect(ghepHoTenApple(tenApple({}))).toBeUndefined();
    expect(ghepHoTenApple(tenApple({ givenName: '   ' }))).toBeUndefined();
  });

  it('cắt ở 100 ký tự như máy chủ cho phép', () => {
    const ten = ghepHoTenApple(tenApple({ givenName: 'a'.repeat(80), familyName: 'b'.repeat(80) }));

    expect(ten).toHaveLength(100);
  });
});

describe('lấy thông tin đăng nhập Apple', () => {
  it('xin họ tên và email, gửi Apple SHA-256 của nonce, trả nonce GỐC cho máy chủ', async () => {
    mockedSignIn.mockResolvedValue(credential());

    const thongTin = await layThongTinApple();

    expect(mockedSignIn).toHaveBeenCalledTimes(1);
    const tuyChon = mockedSignIn.mock.calls[0][0]!;
    expect(tuyChon.requestedScopes).toEqual([
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ]);
    expect(thongTin?.nonce).toMatch(/^[0-9a-f]{64}$/);
    // Máy chủ băm nonce gốc bằng node:crypto rồi so với `nonce` trong token.
    expect(tuyChon.nonce).toBe(sha256(thongTin!.nonce));
    expect(tuyChon.nonce).not.toBe(thongTin!.nonce);
  });

  it('gom đủ thứ cho POST /auth/apple lần đầu cấp quyền', async () => {
    mockedSignIn.mockResolvedValue(credential());

    const thongTin = await layThongTinApple();

    expect(thongTin).toEqual({
      identityToken: 'jwt-cua-apple',
      authorizationCode: 'ma-mot-lan',
      nonce: expect.stringMatching(/^[0-9a-f]{64}$/),
      fullName: 'Lê Hữu Đại',
      email: 'abc@privaterelay.appleid.com',
    });
  });

  it('lần sau Apple không đưa tên và email: không có khoá đó, không hỏi lại', async () => {
    mockedSignIn.mockResolvedValue(credential({ fullName: null, email: null }));

    const thongTin = await layThongTinApple();

    expect(thongTin).toEqual({
      identityToken: 'jwt-cua-apple',
      authorizationCode: 'ma-mot-lan',
      nonce: expect.any(String),
    });
  });

  it('người dùng đóng bảng Apple: null, không báo lỗi', async () => {
    mockedSignIn.mockRejectedValue(loiNative('ERR_REQUEST_CANCELED'));

    await expect(layThongTinApple()).resolves.toBeNull();
  });

  it('lỗi khác: câu tiếng Việt, vẫn kèm mã để còn lần ra nguyên nhân', async () => {
    mockedSignIn.mockRejectedValue(loiNative('ERR_REQUEST_FAILED'));

    const loi = await layThongTinApple().catch((e: Error) => e);

    expect((loi as Error).message).toContain('ERR_REQUEST_FAILED');
    expect((loi as Error).message).toContain('Đăng nhập Apple không thành công');
  });

  it('lỗi không mang mã: giữ nguyên', async () => {
    mockedSignIn.mockRejectedValue(new Error('hỏng lạ'));

    await expect(layThongTinApple()).rejects.toThrow('hỏng lạ');
  });

  it('Apple không trả identity token: báo lỗi chứ không gửi rỗng lên máy chủ', async () => {
    mockedSignIn.mockResolvedValue(credential({ identityToken: null }));

    await expect(layThongTinApple()).rejects.toThrow('Apple không trả về mã xác minh');
  });

  it('Android: báo lỗi, không chạm tới thư viện Apple', async () => {
    heDieuHanh?.restore();
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');

    await expect(layThongTinApple()).rejects.toThrow('chỉ có trên iPhone');
    expect(mockedSignIn).not.toHaveBeenCalled();
  });
});
