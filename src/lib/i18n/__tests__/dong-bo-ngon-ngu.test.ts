import AsyncStorage from '@react-native-async-storage/async-storage';
import { datLuaChon, datNgonNguChoKiemThu } from '../../../i18n/ngon-ngu';
import { capNhatNgonNgu } from '../../api/account';
import { KHOA_DA_GUI, batDongBoNgonNgu, quenNgonNguDaGui } from '../dong-bo-ngon-ngu';

jest.mock('../../api/account', () => ({ capNhatNgonNgu: jest.fn() }));
const gui = capNhatNgonNgu as jest.MockedFunction<typeof capNhatNgonNgu>;

const doi = () => new Promise<void>((r) => setTimeout(r, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
  gui.mockReset();
  gui.mockImplementation(async (language) => ({ language }));
});

it('đã đăng nhập, en, chưa gửi: gửi en một lần; giá trị không đổi thì không gửi lại', async () => {
  datNgonNguChoKiemThu('en');
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  expect(gui).toHaveBeenCalledTimes(1);
  expect(gui).toHaveBeenCalledWith('en');
  expect(await AsyncStorage.getItem(KHOA_DA_GUI)).toBe('en');
  huy();
  const huy2 = batDongBoNgonNgu(() => true);
  await doi();
  expect(gui).toHaveBeenCalledTimes(1);
  huy2();
});

it('vi thì gửi vi', async () => {
  datNgonNguChoKiemThu('vi');
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  expect(gui).toHaveBeenCalledWith('vi');
  huy();
});

it('chưa đăng nhập thì không gửi', async () => {
  datNgonNguChoKiemThu('en');
  const huy = batDongBoNgonNgu(() => false);
  await doi();
  expect(gui).not.toHaveBeenCalled();
  huy();
});

it('lỗi mạng thì không ghi đã gửi, lần đổi sau thử lại', async () => {
  datNgonNguChoKiemThu('en');
  gui.mockRejectedValueOnce(new Error('mạng'));
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  expect(await AsyncStorage.getItem(KHOA_DA_GUI)).toBeNull();
  await datLuaChon('vi');
  await doi();
  expect(gui).toHaveBeenLastCalledWith('vi');
  expect(await AsyncStorage.getItem(KHOA_DA_GUI)).toBe('vi');
  huy();
});

it('gửi lại mỗi lần đổi ngôn ngữ, và dừng sau khi huỷ', async () => {
  datNgonNguChoKiemThu('vi');
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  await datLuaChon('en');
  await doi();
  expect(gui).toHaveBeenLastCalledWith('en');
  huy();
  await datLuaChon('vi');
  await doi();
  expect(gui).toHaveBeenCalledTimes(2);
});

it('quên giá trị đã gửi thì lần sau gửi lại', async () => {
  datNgonNguChoKiemThu('en');
  batDongBoNgonNgu(() => true)();
  await doi();
  await quenNgonNguDaGui();
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  expect(gui).toHaveBeenCalledTimes(2);
  huy();
});

it('quên giá trị đã gửi thì khoá biến mất khỏi kho', async () => {
  await AsyncStorage.setItem(KHOA_DA_GUI, 'en');
  await quenNgonNguDaGui();
  expect(await AsyncStorage.getItem(KHOA_DA_GUI)).toBeNull();
});

it('ngôn ngữ đổi trong lúc đọc kho (marker trùng ngôn ngữ cũ) thì vẫn gửi ngôn ngữ mới', async () => {
  datNgonNguChoKiemThu('en');
  await AsyncStorage.setItem(KHOA_DA_GUI, 'en');
  const that = AsyncStorage.getItem.bind(AsyncStorage);
  const spy = jest.spyOn(AsyncStorage, 'getItem').mockImplementationOnce(async (k) => {
    const v = await that(k);
    await new Promise<void>((r) => setTimeout(r, 20));
    return v;
  });
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  await datLuaChon('vi');
  await new Promise<void>((r) => setTimeout(r, 60));
  expect(gui).toHaveBeenLastCalledWith('vi');
  spy.mockRestore();
  huy();
});

it('huỷ giữa lúc đang gửi thì không ghi lại marker đã bị quên', async () => {
  datNgonNguChoKiemThu('en');
  let xong!: () => void;
  gui.mockImplementationOnce(
    (language) => new Promise((r) => { xong = () => r({ language }); }),
  );
  const huy = batDongBoNgonNgu(() => true);
  await doi();
  huy();
  await quenNgonNguDaGui();
  xong();
  await doi();
  await doi();
  expect(await AsyncStorage.getItem(KHOA_DA_GUI)).toBeFalsy();
});
