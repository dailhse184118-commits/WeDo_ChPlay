import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { TextField } from '../TextField';

describe('TextField', () => {
  it('hiện nhãn và giá trị', async () => {
    const { getByText, getByTestId } = await render(
      <TextField label="Email" value="a@b.c" onChangeText={() => {}} testID="field" />,
    );

    expect(getByText('Email')).toBeTruthy();
    expect(getByTestId('field').props.value).toBe('a@b.c');
  });

  it('báo thay đổi văn bản', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <TextField label="Email" value="" onChangeText={onChangeText} testID="field" />,
    );

    await fireEvent.changeText(getByTestId('field'), 'moi');
    expect(onChangeText).toHaveBeenCalledWith('moi');
  });

  it('hiện thông báo lỗi khi có', async () => {
    const { getByText } = await render(
      <TextField label="Email" value="" onChangeText={() => {}} error="Email không hợp lệ" />,
    );

    expect(getByText('Email không hợp lệ')).toBeTruthy();
  });
});

describe('xem lại mật khẩu vừa gõ', () => {
  it('không hiện nút con mắt ở ô thường', async () => {
    const { queryByTestId } = await render(
      <TextField label="Email" value="" onChangeText={() => {}} testID="field" />,
    );

    expect(queryByTestId('field-toggle')).toBeNull();
  });

  it('che mật khẩu khi mới mở màn hình', async () => {
    const { getByTestId } = await render(
      <TextField label="Mật khẩu" value="matkhau" onChangeText={() => {}} secureTextEntry testID="field" />,
    );

    expect(getByTestId('field').props.secureTextEntry).toBe(true);
  });

  it('bỏ che khi chạm vào con mắt, để người dùng soát lại chữ vừa gõ', async () => {
    const { getByTestId } = await render(
      <TextField label="Mật khẩu" value="matkhau" onChangeText={() => {}} secureTextEntry testID="field" />,
    );

    await fireEvent.press(getByTestId('field-toggle'));

    expect(getByTestId('field').props.secureTextEntry).toBe(false);
  });

  it('che lại khi chạm lần nữa', async () => {
    const { getByTestId } = await render(
      <TextField label="Mật khẩu" value="matkhau" onChangeText={() => {}} secureTextEntry testID="field" />,
    );

    await fireEvent.press(getByTestId('field-toggle'));
    await fireEvent.press(getByTestId('field-toggle'));

    expect(getByTestId('field').props.secureTextEntry).toBe(true);
  });

  it('đổi nhãn trợ năng theo trạng thái, cho người dùng trình đọc màn hình', async () => {
    const { getByTestId } = await render(
      <TextField label="Mật khẩu" value="matkhau" onChangeText={() => {}} secureTextEntry testID="field" />,
    );

    expect(getByTestId('field-toggle').props.accessibilityLabel).toBe('Hiện mật khẩu');

    await fireEvent.press(getByTestId('field-toggle'));

    expect(getByTestId('field-toggle').props.accessibilityLabel).toBe('Ẩn mật khẩu');
  });
});
