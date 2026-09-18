import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { UpdateGate } from '../UpdateGate';
import { moChPlay } from '../../../lib/version/mo-ch-play';

jest.mock('../../../lib/version/mo-ch-play', () => ({ moChPlay: jest.fn() }));

const mockMoChPlay = moChPlay as jest.MockedFunction<typeof moChPlay>;

describe('UpdateGate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMoChPlay.mockResolvedValue(undefined);
  });

  it('nói rõ vì sao người dùng bị chặn', async () => {
    const { getByText } = await render(<UpdateGate notes="" />);

    expect(getByText('Cần cập nhật WeDo')).toBeTruthy();
  });

  it('hiện ghi chú khi máy chủ có gửi', async () => {
    const { getByText } = await render(<UpdateGate notes="Bản này sửa lỗi đăng nhập." />);

    expect(getByText('Bản này sửa lỗi đăng nhập.')).toBeTruthy();
  });

  it('chạm nút thì mở CH Play', async () => {
    const { getByTestId } = await render(<UpdateGate notes="" />);

    await fireEvent.press(getByTestId('update-gate-cap-nhat'));

    expect(mockMoChPlay).toHaveBeenCalled();
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
