import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { GoogleButton } from '../GoogleButton';

describe('GoogleButton', () => {
  it('hiện nhãn theo đúng chữ Google yêu cầu', async () => {
    const { getByText } = await render(<GoogleButton onPress={() => {}} />);
    expect(getByText('Tiếp tục với Google')).toBeTruthy();
  });

  it('gọi onPress khi nhấn', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(<GoogleButton onPress={onPress} testID="google" />);

    await fireEvent.press(getByTestId('google'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('không gọi onPress khi đang tải', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <GoogleButton onPress={onPress} loading testID="google" />,
    );

    await fireEvent.press(getByTestId('google'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('không gọi onPress khi bị vô hiệu hoá', async () => {
    const onPress = jest.fn();
    const { getByTestId } = await render(
      <GoogleButton onPress={onPress} disabled testID="google" />,
    );

    await fireEvent.press(getByTestId('google'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
