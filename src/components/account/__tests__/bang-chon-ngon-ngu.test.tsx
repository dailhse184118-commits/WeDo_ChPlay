import React from 'react';
import { fireEvent, render, screen, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BangChonNgonNgu } from '../BangChonNgonNgu';
import { layLuaChon, layNgonNgu, datLuaChon } from '../../../i18n/ngon-ngu';

beforeEach(async () => {
  await AsyncStorage.clear();
  await datLuaChon('vi');
});

it('hiện ba lựa chọn và đánh dấu lựa chọn hiện tại', async () => {
  await render(<BangChonNgonNgu visible onDismiss={() => {}} />);
  expect(screen.getByText('Theo máy')).toBeTruthy();
  expect(screen.getByText('Tiếng Việt')).toBeTruthy();
  expect(screen.getByText('English')).toBeTruthy();
  expect(screen.getByTestId('ngon-ngu-vi').props.accessibilityState.selected).toBe(true);
  expect(screen.getByTestId('ngon-ngu-en').props.accessibilityState.selected).toBe(false);
  expect(screen.getByTestId('ngon-ngu-he-thong').props.accessibilityState.selected).toBe(false);
});

it('bấm English: đặt en, đóng bảng và giao diện chuyển tiếng Anh', async () => {
  const onDismiss = jest.fn();
  await render(<BangChonNgonNgu visible onDismiss={onDismiss} />);
  await fireEvent.press(screen.getByTestId('ngon-ngu-en'));
  await act(async () => {});
  expect(layLuaChon()).toBe('en');
  expect(layNgonNgu()).toBe('en');
  expect(onDismiss).toHaveBeenCalled();
  expect(screen.getByText('Use device language')).toBeTruthy();
  expect(screen.getByText('Choose language')).toBeTruthy();
  expect(screen.getByTestId('ngon-ngu-en').props.accessibilityState.selected).toBe(true);
});
