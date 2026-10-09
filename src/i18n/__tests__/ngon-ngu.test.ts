import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  KHOA_LUA_CHON,
  dangKyNgonNgu,
  datLuaChon,
  datNgonNguChoKiemThu,
  docLaiNgonNguMay,
  layLuaChon,
  layNgonNgu,
  napLuaChonDaLuu,
  ngonNguTheoMay,
} from '../ngon-ngu';

jest.mock('expo-localization', () => ({ getLocales: jest.fn(() => [{ languageCode: 'vi' }]) }));
const mockLocales = Localization.getLocales as jest.Mock;

beforeEach(async () => {
  await AsyncStorage.clear();
  datNgonNguChoKiemThu(null);
  mockLocales.mockReset();
  mockLocales.mockReturnValue([{ languageCode: 'vi' }]);
});

it('máy tiếng Việt → vi; ngôn ngữ khác → en; rỗng → en', () => {
  expect(ngonNguTheoMay('vi')).toBe('vi');
  expect(ngonNguTheoMay('vi-VN')).toBe('vi');
  expect(ngonNguTheoMay('fr')).toBe('en');
  expect(ngonNguTheoMay(undefined)).toBe('en');
});
it('mặc định theo máy', async () => {
  mockLocales.mockReturnValue([{ languageCode: 'ja' }]);
  await napLuaChonDaLuu();
  expect(layLuaChon()).toBe('he-thong');
  expect(layNgonNgu()).toBe('en');
});
it('chọn tay được lưu và thắng ngôn ngữ máy', async () => {
  await datLuaChon('vi');
  mockLocales.mockReturnValue([{ languageCode: 'en' }]);
  docLaiNgonNguMay();
  expect(layNgonNgu()).toBe('vi');
  expect(await AsyncStorage.getItem(KHOA_LUA_CHON)).toBe('vi');
});
it('theo máy thì đổi ngôn ngữ máy là đổi theo', async () => {
  await datLuaChon('he-thong');
  mockLocales.mockReturnValue([{ languageCode: 'en' }]);
  docLaiNgonNguMay();
  expect(layNgonNgu()).toBe('en');
});
it('nạp lựa chọn đã lưu lúc mở app; giá trị lạ thì theo máy', async () => {
  await AsyncStorage.setItem(KHOA_LUA_CHON, 'en');
  await napLuaChonDaLuu();
  expect(layLuaChon()).toBe('en');
  await AsyncStorage.setItem(KHOA_LUA_CHON, 'xx');
  await napLuaChonDaLuu();
  expect(layLuaChon()).toBe('he-thong');
});
it('không đọc được ngôn ngữ máy thì en', () => {
  mockLocales.mockImplementation(() => {
    throw new Error('native');
  });
  expect(layNgonNgu()).toBe('en');
});
it('báo người nghe khi đổi, và huỷ đăng ký được', async () => {
  const nghe = jest.fn();
  const huy = dangKyNgonNgu(nghe);
  await datLuaChon('en');
  expect(nghe).toHaveBeenCalledTimes(1);
  await datLuaChon('en');
  expect(nghe).toHaveBeenCalledTimes(1);
  huy();
  await datLuaChon('vi');
  expect(nghe).toHaveBeenCalledTimes(1);
});
it('kho hỏng thì vẫn đổi cho phiên này', async () => {
  const spy = jest.spyOn(AsyncStorage, 'setItem').mockRejectedValueOnce(new Error('đầy'));
  await datLuaChon('en');
  expect(layNgonNgu()).toBe('en');
  spy.mockRestore();
});
it('datLuaChon trong lúc đang nạp kho thì lựa chọn mới thắng', async () => {
  await AsyncStorage.setItem(KHOA_LUA_CHON, 'vi');
  const nap = napLuaChonDaLuu();
  await datLuaChon('en');
  await nap;
  expect(layLuaChon()).toBe('en');
  expect(layNgonNgu()).toBe('en');
});
