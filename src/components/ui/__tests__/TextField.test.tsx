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
