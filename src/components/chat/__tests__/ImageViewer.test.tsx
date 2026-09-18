import React from 'react';
import { fireEvent } from '@testing-library/react-native';

import { ImageViewer } from '../ImageViewer';
import { renderScreen } from '../../../test-utils/render';

describe('ImageViewer', () => {
  it('không dựng gì khi chưa có ảnh nào được chọn', async () => {
    const { queryByTestId } = await renderScreen(<ImageViewer url={null} onDong={() => {}} />);

    expect(queryByTestId('xem-anh')).toBeNull();
  });

  it('dựng ảnh đang xem', async () => {
    const { getByTestId } = await renderScreen(
      <ImageViewer url="https://api.wedo.vn/chat/attachments/a1" onDong={() => {}} />,
    );

    expect(getByTestId('xem-anh')).toBeTruthy();
  });

  it('bấm nút đóng thì báo ra ngoài', async () => {
    const onDong = jest.fn();
    const { getByTestId } = await renderScreen(
      <ImageViewer url="https://api.wedo.vn/chat/attachments/a1" onDong={onDong} />,
    );

    await fireEvent.press(getByTestId('xem-anh-dong'));

    expect(onDong).toHaveBeenCalledTimes(1);
  });

  /*
    Nút back cứng của Android phải đóng được trình xem. Không nối thì bấm back
    là thoát luôn màn chat, mất chỗ đang đọc.
  */
  it('nút back của Android cũng đóng', async () => {
    const onDong = jest.fn();
    const { getByTestId } = await renderScreen(
      <ImageViewer url="https://api.wedo.vn/chat/attachments/a1" onDong={onDong} />,
    );

    await fireEvent(getByTestId('xem-anh'), 'requestClose');

    expect(onDong).toHaveBeenCalledTimes(1);
  });
});
