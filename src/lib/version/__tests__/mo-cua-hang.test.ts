import { Linking, Platform } from 'react-native';

import { moChPlay } from '../mo-ch-play';
import { chuNutCapNhat, coNutCapNhat, laDuongAppStore, moCuaHang } from '../mo-cua-hang';

jest.mock('../mo-ch-play', () => ({ moChPlay: jest.fn(async () => undefined) }));

const mockedMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;
const APP_STORE = 'https://apps.apple.com/app/id6700000000';

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;
let moNgoai: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  moNgoai = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
});

afterEach(() => {
  moNgoai.mockRestore();
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

describe('laDuongAppStore', () => {
  it('nhận trang https của Apple và lược đồ itms-apps', () => {
    expect(laDuongAppStore(APP_STORE)).toBe(true);
    expect(laDuongAppStore('itms-apps://apps.apple.com/app/id6700000000')).toBe(true);
  });

  /*
    Biến môi trường gõ nhầm (dán link CH Play vào ô của iOS) không được biến
    thành một nút mở Google Play trên iPhone.
  */
  it('từ chối mọi thứ khác, kể cả trang CH Play', () => {
    expect(laDuongAppStore(null)).toBe(false);
    expect(laDuongAppStore('')).toBe(false);
    expect(laDuongAppStore('https://play.google.com/store/apps/details?id=vn.wedo.app')).toBe(false);
    expect(laDuongAppStore('market://details?id=vn.wedo.app')).toBe(false);
    expect(laDuongAppStore('https://apps.apple.com.evil.vn/app')).toBe(false);
  });
});

describe('trên iPhone', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
  });

  it('nút ghi App Store, không nhắc CH Play', () => {
    expect(chuNutCapNhat()).toBe('Mở App Store để cập nhật');
    expect(chuNutCapNhat()).not.toMatch(/CH Play|Google/);
  });

  it('chỉ có nút khi máy chủ gửi đúng trang App Store', () => {
    expect(coNutCapNhat(APP_STORE)).toBe(true);
    expect(coNutCapNhat(null)).toBe(false);
    expect(coNutCapNhat(undefined)).toBe(false);
  });

  it('mở đúng trang máy chủ gửi, không đụng tới CH Play', async () => {
    await moCuaHang(APP_STORE);

    expect(moNgoai).toHaveBeenCalledWith(APP_STORE);
    expect(mockedMoChPlay).not.toHaveBeenCalled();
  });

  it('không có trang App Store thì không mở gì cả', async () => {
    await moCuaHang(null);
    await moCuaHang('https://play.google.com/store/apps/details?id=vn.wedo.app');

    expect(moNgoai).not.toHaveBeenCalled();
    expect(mockedMoChPlay).not.toHaveBeenCalled();
  });

  it('nuốt lỗi khi không mở được App Store', async () => {
    moNgoai.mockRejectedValue(new Error('no handler'));

    await expect(moCuaHang(APP_STORE)).resolves.toBeUndefined();
  });
});

describe('trên Android — giữ nguyên như cũ', () => {
  beforeEach(() => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  });

  it('nút ghi CH Play và luôn có, kể cả khi máy chủ không gửi storeUrl', () => {
    expect(chuNutCapNhat()).toBe('Mở CH Play để cập nhật');
    expect(coNutCapNhat(null)).toBe(true);
  });

  it('đi đường CH Play cũ, bỏ qua storeUrl', async () => {
    await moCuaHang('https://example.com/khac');

    expect(mockedMoChPlay).toHaveBeenCalledTimes(1);
    expect(moNgoai).not.toHaveBeenCalled();
  });
});
