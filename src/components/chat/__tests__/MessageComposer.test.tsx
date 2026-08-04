import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

import { MessageComposer } from '../MessageComposer';

describe('MessageComposer', () => {
  it('báo thay đổi văn bản', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="" onChangeText={onChangeText} onSend={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('composer-input'), 'Xin chào');
    expect(onChangeText).toHaveBeenCalledWith('Xin chào');
  });

  it('gọi onSend khi bấm gửi', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('không gửi khi ô trống', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="   " onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('không gửi khi đang gửi dở', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await render(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} sending />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });
});
