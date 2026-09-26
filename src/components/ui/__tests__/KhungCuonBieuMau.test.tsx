import React from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { KhungCuonBieuMau, khungCuonTuLoBanPhim } from '../KhungCuonBieuMau';

jest.mock('react-native-keyboard-controller', () => {
  const { View } = jest.requireActual('react-native');
  return {
    KeyboardAwareScrollView: (props: object) => <View testID="tu-lo-ban-phim" {...props} />,
  };
});

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

afterEach(() => {
  heDieuHanh?.restore();
  heDieuHanh = undefined;
});

/*
  iOS không có chế độ co cửa sổ khi bàn phím mở như Android, nên màn biểu mẫu
  phải tự cuộn ô đang gõ lên. Android giữ nguyên ScrollView thường.
*/
describe('KhungCuonBieuMau', () => {
  it('iPhone: dùng khung tự cuộn theo bàn phím', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const man = await render(
      <KhungCuonBieuMau>
        <Text>Ô nhập</Text>
      </KhungCuonBieuMau>,
    );

    expect(man.getByTestId('tu-lo-ban-phim')).toBeTruthy();
    expect(man.getByText('Ô nhập')).toBeTruthy();
    expect(khungCuonTuLoBanPhim()).toBe(true);
  });

  it('Android: vẫn là ScrollView thường như trước', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
    const man = await render(
      <KhungCuonBieuMau>
        <Text>Ô nhập</Text>
      </KhungCuonBieuMau>,
    );

    expect(man.queryByTestId('tu-lo-ban-phim')).toBeNull();
    expect(man.getByText('Ô nhập')).toBeTruthy();
    expect(khungCuonTuLoBanPhim()).toBe(false);
  });
});
