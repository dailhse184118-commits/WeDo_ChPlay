import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import { UpdateBanner } from '../UpdateBanner';
import { daBoQua, ghiNhoBoQua } from '../../../lib/version/bo-qua';
import { moChPlay } from '../../../lib/version/mo-ch-play';

jest.mock('../../../lib/version/bo-qua', () => ({
  daBoQua: jest.fn(),
  ghiNhoBoQua: jest.fn(),
}));
jest.mock('../../../lib/version/mo-ch-play', () => ({ moChPlay: jest.fn() }));

const mockDaBoQua = daBoQua as jest.MockedFunction<typeof daBoQua>;
const mockGhiNho = ghiNhoBoQua as jest.MockedFunction<typeof ghiNhoBoQua>;
const mockMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;

describe('UpdateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDaBoQua.mockResolvedValue(false);
    mockGhiNho.mockResolvedValue(undefined);
    mockMoChPlay.mockResolvedValue(undefined);
  });

  it('hiện ghi chú của bản mới', async () => {
    const { findByText } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Thêm nhắn tin riêng." />,
    );

    expect(await findByText('Thêm nhắn tin riêng.')).toBeTruthy();
  });

  it('dùng câu mặc định khi máy chủ không gửi ghi chú', async () => {
    const { findByText } = await render(<UpdateBanner phienBanMoi="1.0.11" notes="" />);

    expect(await findByText('Đã có phiên bản mới của WeDo.')).toBeTruthy();
  });

  it('chạm nút cập nhật thì mở CH Play', async () => {
    const { findByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    await fireEvent.press(await findByTestId('update-banner-cap-nhat'));

    expect(mockMoChPlay).toHaveBeenCalled();
  });

  it('chạm nút tắt thì ghi nhớ và biến mất', async () => {
    const { findByTestId, queryByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    await fireEvent.press(await findByTestId('update-banner-tat'));

    expect(mockGhiNho).toHaveBeenCalledWith('1.0.11');
    await waitFor(() => expect(queryByTestId('update-banner')).toBeNull());
  });

  it('không dựng gì khi người dùng đã tắt bản này từ trước', async () => {
    mockDaBoQua.mockResolvedValue(true);

    const { queryByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    await waitFor(() => expect(queryByTestId('update-banner')).toBeNull());
  });
});
