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

  describe('ảnh', () => {
    const ANH = { uri: 'file:///tmp/a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' };

    it('không có hai nút ảnh khi màn hình chưa nhận ảnh', async () => {
      const { queryByTestId } = await render(
        <MessageComposer value="" onChangeText={() => {}} onSend={() => {}} />,
      );

      expect(queryByTestId('composer-chup')).toBeNull();
      expect(queryByTestId('composer-chon-anh')).toBeNull();
    });

    it('báo ra ngoài khi bấm chụp và khi bấm chọn ảnh', async () => {
      const onChup = jest.fn();
      const onChonAnh = jest.fn();
      const { getByTestId } = await render(
        <MessageComposer
          value=""
          onChangeText={() => {}}
          onSend={() => {}}
          anhDaChon={[]}
          onChup={onChup}
          onChonAnh={onChonAnh}
          onBoAnh={() => {}}
        />,
      );

      await fireEvent.press(getByTestId('composer-chup'));
      expect(onChup).toHaveBeenCalledTimes(1);

      await fireEvent.press(getByTestId('composer-chon-anh'));
      expect(onChonAnh).toHaveBeenCalledTimes(1);
    });

    /*
      Đây là điểm khác then chốt so với ô soạn cũ: có ảnh thì gửi được dù chưa
      gõ chữ nào. Giữ điều kiện cũ thì chụp xong nút Gửi vẫn mờ.
    */
    it('gửi được khi chỉ có ảnh, chưa gõ chữ', async () => {
      const onSend = jest.fn();
      const { getByTestId } = await render(
        <MessageComposer
          value=""
          onChangeText={() => {}}
          onSend={onSend}
          anhDaChon={[ANH]}
          onChup={() => {}}
          onChonAnh={() => {}}
          onBoAnh={() => {}}
        />,
      );

      await fireEvent.press(getByTestId('composer-send'));
      expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('hiện ảnh xem trước kèm nút bỏ', async () => {
      const onBoAnh = jest.fn();
      const { getByTestId } = await render(
        <MessageComposer
          value=""
          onChangeText={() => {}}
          onSend={() => {}}
          anhDaChon={[ANH]}
          onChup={() => {}}
          onChonAnh={() => {}}
          onBoAnh={onBoAnh}
        />,
      );

      expect(getByTestId('composer-xem-truoc-0')).toBeTruthy();

      await fireEvent.press(getByTestId('composer-bo-anh-0'));
      expect(onBoAnh).toHaveBeenCalledWith(0);
    });

    it('khoá hai nút ảnh trong lúc đang gửi', async () => {
      const onChup = jest.fn();
      const { getByTestId } = await render(
        <MessageComposer
          value=""
          onChangeText={() => {}}
          onSend={() => {}}
          sending
          anhDaChon={[ANH]}
          onChup={onChup}
          onChonAnh={() => {}}
          onBoAnh={() => {}}
        />,
      );

      await fireEvent.press(getByTestId('composer-chup'));
      expect(onChup).not.toHaveBeenCalled();
    });
  });
});
