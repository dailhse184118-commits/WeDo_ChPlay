import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { renderScreen } from '../../../test-utils/render';

import { MessageComposer } from '../MessageComposer';

describe('MessageComposer', () => {
  it('báo thay đổi văn bản', async () => {
    const onChangeText = jest.fn();
    const { getByTestId } = await renderScreen(
      <MessageComposer value="" onChangeText={onChangeText} onSend={() => {}} />,
    );

    await fireEvent.changeText(getByTestId('composer-input'), 'Xin chào');
    expect(onChangeText).toHaveBeenCalledWith('Xin chào');
  });

  it('gọi onSend khi bấm gửi', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await renderScreen(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).toHaveBeenCalledTimes(1);
  });

  it('không gửi khi ô trống', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await renderScreen(
      <MessageComposer value="   " onChangeText={() => {}} onSend={onSend} />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('không gửi khi đang gửi dở', async () => {
    const onSend = jest.fn();
    const { getByTestId } = await renderScreen(
      <MessageComposer value="Xin chào" onChangeText={() => {}} onSend={onSend} sending />,
    );

    await fireEvent.press(getByTestId('composer-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  describe('ảnh', () => {
    const ANH = { uri: 'file:///tmp/a.jpg', name: 'a.jpg', mimeType: 'image/jpeg' };

    it('không có hai nút ảnh khi màn hình chưa nhận ảnh', async () => {
      const { queryByTestId } = await renderScreen(
        <MessageComposer value="" onChangeText={() => {}} onSend={() => {}} />,
      );

      expect(queryByTestId('composer-chup')).toBeNull();
      expect(queryByTestId('composer-chon-anh')).toBeNull();
    });

    it('báo ra ngoài khi bấm chụp và khi bấm chọn ảnh', async () => {
      const onChup = jest.fn();
      const onChonAnh = jest.fn();
      const { getByTestId } = await renderScreen(
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
      const { getByTestId } = await renderScreen(
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
      const { getByTestId } = await renderScreen(
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
      const { getByTestId } = await renderScreen(
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

/*
  Tren Android, `edgeToEdgeEnabled` cho app ve TRAN xuong duoi thanh dieu huong.
  May vuot cu chi chi chua ~16dp nen gan nhu khong thay gi, nhung may dung ba
  nut chua toi ~48dp — o nhap nam lot duoi thanh nut va bam khong trung.
  Nguoi dung bao ngay 19/09/2026: khong the cham vao de go chu.
*/
describe('chừa chỗ cho thanh điều hướng', () => {
  function dungMan(bottom: number, con: React.ReactElement) {
    return render(
      <SafeAreaProvider
        initialMetrics={{
          frame: { x: 0, y: 0, width: 390, height: 844 },
          insets: { top: 24, left: 0, right: 0, bottom },
        }}
      >
        {con}
      </SafeAreaProvider>,
    );
  }

  it('đẩy ô nhập lên khỏi thanh ba nút', async () => {
    const { getByTestId } = await dungMan(
      48,
      <MessageComposer value="" onChangeText={() => {}} onSend={() => {}} />,
    );

    expect(getByTestId('composer-root')).toHaveStyle({ paddingBottom: 48 });
  });

  it('không chừa gì trên máy vuốt cử chỉ không có thanh nút', async () => {
    const { getByTestId } = await dungMan(
      0,
      <MessageComposer value="" onChangeText={() => {}} onSend={() => {}} />,
    );

    expect(getByTestId('composer-root')).toHaveStyle({ paddingBottom: 0 });
  });
});
