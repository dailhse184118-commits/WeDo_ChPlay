import React from 'react';
import { Linking, Platform } from 'react-native';
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
const APP_STORE = 'https://apps.apple.com/app/id6700000000';

let heDieuHanh: jest.ReplaceProperty<typeof Platform.OS> | undefined;

describe('UpdateBanner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDaBoQua.mockResolvedValue(false);
    mockGhiNho.mockResolvedValue(undefined);
    mockMoChPlay.mockResolvedValue(undefined);
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'android');
  });

  afterEach(() => {
    heDieuHanh?.restore();
    heDieuHanh = undefined;
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

  it('Android: chạm nút cập nhật thì mở CH Play', async () => {
    const { findByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." />,
    );

    const nut = await findByTestId('update-banner-cap-nhat');
    expect(nut.props.accessibilityLabel).toBe('Mở CH Play để cập nhật');
    await fireEvent.press(nut);

    expect(mockMoChPlay).toHaveBeenCalled();
  });

  it('iPhone: chạm nút cập nhật thì mở App Store, không nhắc CH Play', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const moNgoai = jest.spyOn(Linking, 'openURL').mockResolvedValue(true as never);
    const { findByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." storeUrl={APP_STORE} />,
    );

    const nut = await findByTestId('update-banner-cap-nhat');
    expect(nut.props.accessibilityLabel).toBe('Mở App Store để cập nhật');
    await fireEvent.press(nut);

    expect(moNgoai).toHaveBeenCalledWith(APP_STORE);
    expect(mockMoChPlay).not.toHaveBeenCalled();
    moNgoai.mockRestore();
  });

  it('iPhone thiếu trang App Store: không có nút cập nhật', async () => {
    heDieuHanh = jest.replaceProperty(Platform, 'OS', 'ios');
    const { findByTestId, queryByTestId } = await render(
      <UpdateBanner phienBanMoi="1.0.11" notes="Bản mới." storeUrl={null} />,
    );

    await findByTestId('update-banner');
    expect(queryByTestId('update-banner-cap-nhat')).toBeNull();
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
