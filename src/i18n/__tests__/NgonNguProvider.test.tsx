import React from 'react';
import { Text } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';
import { khaiBaoTuDien } from '../dich';
import { NgonNguProvider, useDichLoi, useNgonNgu, useTuDien } from '../NgonNguProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { datLuaChon, datNgonNguChoKiemThu } from '../ngon-ngu';

jest.mock('expo-localization', () => ({ getLocales: jest.fn(() => [{ languageCode: 'vi' }]) }));

const tuDien = khaiBaoTuDien({ a: 'Xin chào', du: 'Lỗi' }, { a: 'Hello', du: 'Error' });

function Man() {
  const t = useTuDien(tuDien);
  const { ngonNgu } = useNgonNgu();
  const dichLoi = useDichLoi();
  return (
    <>
      <Text testID="chu">{t.a}</Text>
      <Text testID="ma">{ngonNgu}</Text>
      <Text testID="loi">{dichLoi(new Error('Câu lạ'), t.du)}</Text>
    </>
  );
}

afterEach(async () => {
  await AsyncStorage.clear();
  datNgonNguChoKiemThu(null);
});

it('hiện bản đúng ngôn ngữ và đổi theo khi ngôn ngữ đổi', async () => {
  await datLuaChon('en'); // Provider nạp lại lựa chọn đã lưu lúc mount
  await render(
    <NgonNguProvider>
      <Man />
    </NgonNguProvider>,
  );
  expect(screen.getByTestId('chu').props.children).toBe('Hello');
  expect(screen.getByTestId('loi').props.children).toBe('Error');
  await act(async () => datLuaChon('vi'));
  expect(screen.getByTestId('chu').props.children).toBe('Xin chào');
  expect(screen.getByTestId('loi').props.children).toBe('Câu lạ');
});

it('dùng được cả khi không có Provider', async () => {
  datNgonNguChoKiemThu('en');
  await render(<Man />);
  expect(screen.getByTestId('ma').props.children).toBe('en');
});
