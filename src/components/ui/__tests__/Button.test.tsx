import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { Button } from '../Button';

describe('Button', () => {
  it('hiện nhãn', async () => {
    const { getByText } = await render(<Button label="Đăng nhập" onPress={() => {}} />);
    expect(getByText('Đăng nhập')).toBeTruthy();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button label="Đăng nhập" onPress={onPress} testID="btn" />,
    );

    await fireEvent.press(getByTestId('btn'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('không gọi onPress khi đang tải', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button label="Đăng nhập" onPress={onPress} loading testID="btn" />,
    );

    await fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('không gọi onPress khi bị vô hiệu hoá', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <Button label="Đăng nhập" onPress={onPress} disabled testID="btn" />,
    );

    await fireEvent.press(getByTestId('btn'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
