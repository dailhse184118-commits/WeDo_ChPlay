import AsyncStorage from '@react-native-async-storage/async-storage';

import { xoaCacheBenBi } from '../../query';
import { docDanhSachKhongGian, luuDanhSachKhongGian } from '../danh-sach-luu';

const KHONG_GIAN = {
  id: 'w1',
  name: 'Nhóm EXE',
  ownerId: 'u1',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('danh sách không gian lưu trên máy', () => {
  it('lưu rồi đọc lại được', async () => {
    await luuDanhSachKhongGian([KHONG_GIAN] as never);

    expect(await docDanhSachKhongGian()).toEqual([KHONG_GIAN]);
  });

  it('bản lưu hỏng thì coi như chưa có', async () => {
    await AsyncStorage.setItem('wedo:workspaces:v1', '{khong phai json');

    expect(await docDanhSachKhongGian()).toBeNull();
  });

  /* Danh sách là của người vừa dùng: đăng xuất hay đổi tài khoản phải mất theo. */
  it('xoá cùng cache react-query khi đăng xuất', async () => {
    await luuDanhSachKhongGian([KHONG_GIAN] as never);

    await xoaCacheBenBi();

    expect(await docDanhSachKhongGian()).toBeNull();
  });
});
