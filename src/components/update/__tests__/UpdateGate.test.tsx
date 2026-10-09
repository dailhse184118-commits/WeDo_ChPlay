import React from 'react';
import { Linking, Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { UpdateGate } from '../UpdateGate';
import { moChPlay } from '../../../lib/version/mo-ch-play';

jest.mock('../../../lib/version/mo-ch-play', () => ({ moChPlay: jest.fn() }));

const mockMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;
const APP_STORE = 'https://apps.apple.com/app/id6700000000';

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

describe('UpdateGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMoChPlay.mockResolvedValue(undefined);
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  });

  afterEach(() => {
    heDieuHanh?.restore();
    heDieuHanh = undefined;
  });

  it('nói rõ vì sao người dùng bị chặn', async () => {
    const { getByText } = await render(<UpdateGate notes="" />);

    expect(getByText('Cần cập nhật WeDo')).toBeTruthy();
  });

  it('hiện ghi chú khi máy chủ có gửi', async () => {
    const { getByText } = await render(<UpdateGate notes="Bản này sửa lỗi đăng nhập." />);

    expect(getByText('Bản này sửa lỗi đăng nhập.')).toBeTruthy();
  });

  it('Android: chạm nút thì mở CH Play', async () => {
    const { getByTestId, getByText } = await render(<UpdateGate notes="" />);

    expect(getByText('Mở CH Play để cập nhật')).toBeTruthy();
    await fireEvent.press(getByTestId('update-gate-cap-nhat'));

    expect(mockMoChPlay).toHaveBeenCalled();
  });

  /*
    Guideline 2.3.10: app iPhone không được nhắc tới nền tảng khác. Nút phải
    mở đúng trang App Store máy chủ gửi, không bao giờ market:// hay Google Play.
  */
  it('iPhone: nút mở App Store, không một chữ CH Play', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const moNgoai = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const { getByTestId, getByText, queryByText } = await render(
      <UpdateGate notes="" storeUrl={APP_STORE} />,
    );

    expect(getByText('Mở App Store để cập nhật')).toBeTruthy();
    expect(queryByText(/CH Play/)).toBeNull();
    await fireEvent.press(getByTestId('update-gate-cap-nhat'));

    expect(moNgoai).toHaveBeenCalledWith(APP_STORE);
    expect(mockMoChPlay).not.toHaveBeenCalled();
    moNgoai.mockRestore();
  });

  it('iPhone thiếu trang App Store: không có nút đi đâu cả', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const { queryByTestId, queryByText } = await render(<UpdateGate notes="" storeUrl={null} />);

    expect(queryByTestId('update-gate-cap-nhat')).toBeNull();
    expect(queryByText(/CH Play/)).toBeNull();
  });

  /*
    Chốt chặn có chủ ý: màn này KHÔNG được có đường thoát. Thêm nút "để sau" vào
    đây là xoá sạch lý do nó tồn tại — app cũ sẽ chạy tiếp rồi hỏng giữa chừng.
  */
  it('không có nút nào để bỏ qua', async () => {
    const { queryByText } = await render(<UpdateGate notes="" />);

    expect(queryByText('Để sau')).toBeNull();
    expect(queryByText('Bỏ qua')).toBeNull();
    expect(queryByText('Đóng')).toBeNull();
  });
});
